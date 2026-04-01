// src/components/hikes/HotelDetails.tsx
// Expandable hotel card showing amenities, contact info, and room packages with booking buttons.
// #region Imports
import React, { useState } from "react";
import { ChevronDown, MapPin, Phone, Mail, Globe, Star, Users, Wifi, UtensilsCrossed, BookOpen } from "lucide-react";
import { Hotel, HotelPackage } from "../../services/hikes";
import BookingModal from "./BookingModal";

// #endregion Imports

// #region Types
type HotelDetailsProps = {
  hotels: Hotel[];
  hikeId: string;
  hikeDate: string;
};
// #endregion Types

// #region Component
const HotelDetails: React.FC<HotelDetailsProps> = ({ hotels, hikeId, hikeDate }) => {
  const [expandedHotelId, setExpandedHotelId] = useState<string | null>(null);
  const [expandedPackageId, setExpandedPackageId] = useState<string | null>(null);
  const [bookingModalOpen, setBookingModalOpen] = useState(false);
  const [selectedHotel, setSelectedHotel] = useState<Hotel | null>(null);
  const [selectedPackage, setSelectedPackage] = useState<HotelPackage | null>(null);

  if (!hotels || hotels.length === 0) {
    return null;
  }

  // Handles toggleHotel logic.
  const toggleHotel = (hotelId: string) => {
    setExpandedHotelId(expandedHotelId === hotelId ? null : hotelId);
  };

  // Handles togglePackage logic.
  const togglePackage = (packageId: string) => {
    setExpandedPackageId(expandedPackageId === packageId ? null : packageId);
  };

  // Handles handleBookPackage logic.
  const handleBookPackage = (hotel: Hotel, pkg: HotelPackage) => {
    setSelectedHotel(hotel);
    setSelectedPackage(pkg);
    setBookingModalOpen(true);
  };

  // Handles renderStars logic.
  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center gap-1">
        {[...Array(5)].map((_, i) => (
          <Star
            key={i}
            className={`w-4 h-4 ${i < Math.round(rating) ? "fill-yellow-400 text-yellow-400" : "text-gray-400"}`}
          />
        ))}
        <span className="text-xs text-white ml-1">({rating.toFixed(1)})</span>
      </div>
    );
  };

  // Handles getRoomTypeBadgeColor logic.
  const getRoomTypeBadgeColor = (roomType: string) => {
    const colors: Record<string, string> = {
      single: "bg-blue-500/20 text-blue-300 border-blue-400/40",
      double: "bg-purple-500/20 text-purple-300 border-purple-400/40",
      twin: "bg-cyan-500/20 text-cyan-300 border-cyan-400/40",
      suite: "bg-amber-500/20 text-amber-300 border-amber-400/40",
      deluxe: "bg-rose-500/20 text-rose-300 border-rose-400/40",
    };
    return colors[roomType] || "bg-gray-500/20 text-gray-300 border-gray-400/40";
  };

  // Handles getCancellationBadgeColor logic.
  const getCancellationBadgeColor = (policy: string) => {
    const colors: Record<string, string> = {
      free: "text-green-300",
      partial: "text-yellow-300",
      "non-refundable": "text-red-300",
    };
    return colors[policy] || "text-gray-300";
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-white mb-4">Accommodation Along Trail</h3>

      {hotels.map((hotel) => (
        <div key={hotel._id} className="glass-card rounded-xl overflow-hidden">
          {/* Hotel Header */}
          <button
            onClick={() => toggleHotel(hotel._id)}
            className="w-full px-6 py-4 flex items-start gap-4 hover:bg-white/5 transition-colors"
          >
            {/* Hotel Image */}
            {hotel.imageUrl && (
              <img
                src={hotel.imageUrl}
                alt={hotel.name}
                className="w-20 h-20 rounded-lg object-cover flex-shrink-0"
              />
            )}

            {/* Hotel Info */}
            <div className="flex-1 text-left">
              <div className="flex items-start justify-between mb-2">
                <h4 className="text-base font-semibold text-white">{hotel.name}</h4>
                <ChevronDown
                  className={`w-5 h-5 text-gray-300 transition-transform ${
                    expandedHotelId === hotel._id ? "rotate-180" : ""
                  }`}
                />
              </div>

              {/* Rating */}
              <div className="mb-2">{renderStars(hotel.rating)}</div>

              {/* Location */}
              <div className="flex items-center gap-2 text-sm text-white mb-2">
                <MapPin className="w-4 h-4 text-emerald-400" />
                <span>{hotel.location}</span>
              </div>

              {/* Amenities Preview */}
              {hotel.amenities && hotel.amenities.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {hotel.amenities.slice(0, 2).map((amenity, idx) => (
                    <span key={idx} className="text-xs px-2 py-1 rounded-full bg-white/10 text-white">
                      {amenity}
                    </span>
                  ))}
                  {hotel.amenities.length > 2 && (
                    <span className="text-xs px-2 py-1 text-gray-100">+{hotel.amenities.length - 2} more</span>
                  )}
                </div>
              )}
            </div>
          </button>

          {/* Expanded Hotel Details */}
          {expandedHotelId === hotel._id && (
            <div className="border-t border-white/10 px-6 py-4 space-y-4">
              {/* Contact Information */}
              <div className="grid grid-cols-2 gap-3">
                {hotel.contactPhone && (
                  <button className="flex items-center gap-2 text-sm text-white hover:text-white transition-colors">
                    <Phone className="w-4 h-4 text-indigo-400" />
                    <span>{hotel.contactPhone}</span>
                  </button>
                )}
                {hotel.email && (
                  <a href={`mailto:${hotel.email}`} className="flex items-center gap-2 text-sm text-white hover:text-white transition-colors">
                    <Mail className="w-4 h-4 text-indigo-400" />
                    <span className="truncate">{hotel.email}</span>
                  </a>
                )}
                {hotel.website && (
                  <a href={hotel.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-white hover:text-white transition-colors col-span-2">
                    <Globe className="w-4 h-4 text-indigo-400" />
                    <span className="truncate">{hotel.website}</span>
                  </a>
                )}
              </div>

              {/* Description */}
              {hotel.description && (
                <div>
                  <p className="text-sm text-white leading-relaxed">{hotel.description}</p>
                </div>
              )}

              {/* Full Amenities List */}
              {hotel.amenities && hotel.amenities.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-white mb-2">Amenities</p>
                  <div className="flex flex-wrap gap-2">
                    {hotel.amenities.map((amenity, idx) => (
                      <span key={idx} className="text-xs px-3 py-1 rounded-full bg-white/10 text-white">
                        {amenity}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Packages */}
              {hotel.packages && hotel.packages.length > 0 && (
                <div className="space-y-3 pt-2">
                  <p className="text-sm font-semibold text-white">Available Packages</p>
                  {hotel.packages.map((pkg) => (
                    <div key={pkg._id} className="glass-card rounded-lg overflow-hidden">
                      {/* Package Header */}
                      <div className="px-4 py-3 flex items-center justify-between gap-3 hover:bg-white/10 transition-colors">
                        <div 
                          onClick={() => togglePackage(pkg._id)} 
                          className="flex-1 cursor-pointer flex items-center gap-3"
                        >
                          <div>
                            <p className="text-sm font-semibold text-white">{pkg.name}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <span className={`text-xs px-2 py-1 rounded border ${getRoomTypeBadgeColor(pkg.roomType)}`}>
                                {pkg.roomType.charAt(0).toUpperCase() + pkg.roomType.slice(1)}
                              </span>
                              <span className="text-xs text-white flex items-center gap-1">
                                <Users className="w-3 h-3" />
                                {pkg.capacity} guests
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <div className="text-right">
                            <p className="text-base font-bold text-emerald-400 flex items-center gap-1">
                              NPR {pkg.pricePerNight.toLocaleString()}
                            </p>
                            <p className="text-xs text-gray-200">/night</p>
                          </div>
                          <button
                            onClick={() => handleBookPackage(hotel, pkg)}
                            className="px-3 py-1.5 bg-emerald-600/60 hover:bg-emerald-600 border border-emerald-400/40 rounded-lg text-xs font-semibold text-white transition-colors flex items-center gap-1 whitespace-nowrap"
                          >
                            <BookOpen className="w-3 h-3" />
                            Book
                          </button>
                          <ChevronDown
                            onClick={() => togglePackage(pkg._id)}
                            className={`w-4 h-4 text-gray-300 transition-transform flex-shrink-0 cursor-pointer hover:text-white ${
                              expandedPackageId === pkg._id ? "rotate-180" : ""
                            }`}
                          />
                        </div>
                      </div>

                      {/* Expanded Package Details */}
                      {expandedPackageId === pkg._id && (
                        <div className="border-t border-white/10 px-4 py-3 space-y-3">
                          {pkg.description && (
                            <div>
                              <p className="text-xs text-gray-100 mb-1">Description</p>
                              <p className="text-sm text-white">{pkg.description}</p>
                            </div>
                          )}

                          {/* Room Details Grid */}
                          <div className="grid grid-cols-2 gap-3">
                            <div className="bg-white/5 rounded p-2">
                              <p className="text-xs text-gray-100 mb-1">Available Rooms</p>
                              <p className="text-base font-semibold text-white">{pkg.availableRooms}</p>
                            </div>

                            <div className="bg-white/5 rounded p-2">
                              <p className="text-xs text-gray-100 mb-1">Min Stay</p>
                              <p className="text-base font-semibold text-white">{pkg.minStayNights} night{pkg.minStayNights !== 1 ? "s" : ""}</p>
                            </div>

                            {pkg.maxStayNights && (
                              <div className="bg-white/5 rounded p-2">
                                <p className="text-xs text-gray-100 mb-1">Max Stay</p>
                                <p className="text-base font-semibold text-white">{pkg.maxStayNights} nights</p>
                              </div>
                            )}

                            <div className="bg-white/5 rounded p-2">
                              <p className="text-xs text-gray-100 mb-1">Cancellation</p>
                              <p className={`text-sm font-semibold ${getCancellationBadgeColor(pkg.cancellationPolicy)}`}>
                                {pkg.cancellationPolicy === "free" ? "Free" : pkg.cancellationPolicy === "partial" ? "Partial" : "Non-Refund"}
                              </p>
                            </div>
                          </div>

                          {/* Package Amenities */}
                          {pkg.amenities && pkg.amenities.length > 0 && (
                            <div>
                              <p className="text-xs text-white mb-2">Room Amenities</p>
                              <div className="flex flex-wrap gap-2">
                                {pkg.amenities.map((amenity, idx) => (
                                  <span key={idx} className="text-xs px-2 py-1 rounded bg-white/10 text-white flex items-center gap-1">
                                    {amenity === "WiFi" && <Wifi className="w-3 h-3" />}
                                    {amenity === "Restaurant" && <UtensilsCrossed className="w-3 h-3" />}
                                    {amenity}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Package Image */}
                          {pkg.image && (
                            <img
                              src={pkg.image}
                              alt={pkg.name}
                              className="w-full h-40 object-cover rounded-lg"
                            />
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      ))}

      {/* Booking Modal */}
      {selectedHotel && selectedPackage && (
        <BookingModal
          open={bookingModalOpen}
          hotel={selectedHotel}
          package={selectedPackage}
          hikeId={hikeId}
          hikeDate={hikeDate}
          onClose={() => {
            setBookingModalOpen(false);
            setSelectedHotel(null);
            setSelectedPackage(null);
          }}
        />
      )}
    </div>
  );
};

// #endregion Component

// #region Exports
export default HotelDetails;
// #endregion Exports
