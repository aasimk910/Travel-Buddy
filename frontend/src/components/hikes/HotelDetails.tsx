// src/components/hikes/HotelDetails.tsx
// Expandable hotel card showing amenities, contact info, and room packages with booking buttons.
// #region Imports
import React, { useState } from "react";
import { ChevronDown, ChevronUp, MapPin, Phone, Mail, Globe, Star, Users, Wifi, UtensilsCrossed, BedDouble, Shield, Clock } from "lucide-react";
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

  const renderStars = (rating: number) => (
    <div className="flex items-center gap-0.5">
      {[...Array(5)].map((_, i) => (
        <Star key={i} className={`w-3 h-3 ${i < Math.round(rating) ? "fill-[#C6A16E] text-[#C6A16E]" : "text-white/15"}`} />
      ))}
      <span className="text-xs text-[#8E8A81] ml-1">{rating.toFixed(1)}</span>
    </div>
  );

  const getRoomTypeBadge = (roomType: string) => {
    const styles: Record<string, string> = {
      single:  "bg-[#C6A16E]/10 text-[#C6A16E] border-[#C6A16E]/30",
      double:  "bg-[#8FA68E]/10 text-[#8FA68E] border-[#8FA68E]/30",
      twin:    "bg-[#C6A16E]/10 text-[#C6A16E] border-[#C6A16E]/30",
      suite:   "bg-amber-500/15 text-amber-300 border-amber-400/30",
      deluxe:  "bg-rose-500/15 text-rose-300 border-rose-400/30",
    };
    return styles[roomType.toLowerCase()] || "bg-white/8 text-[#B8B4AA] border-white/15";
  };

  const getCancellationStyle = (policy: string) => {
    if (policy === "free") return { text: "Free cancellation", cls: "text-[#8FA68E]" };
    if (policy === "partial") return { text: "Partial refund", cls: "text-amber-400" };
    return { text: "Non-refundable", cls: "text-red-400" };
  };

  return (
    <div className="space-y-3">

      {hotels.map((hotel) => {
        const isOpen = expandedHotelId === hotel._id;
        return (
          <div key={hotel._id} className="site-card rounded-xl overflow-hidden">

            {/* ── Hotel header row ── */}
            <button
              onClick={() => toggleHotel(hotel._id)}
              className="w-full px-5 py-4 flex items-center gap-4 hover:bg-white/[0.04] transition-colors text-left"
            >
              {/* Image or icon */}
              {hotel.imageUrl ? (
                <img src={hotel.imageUrl} alt={hotel.name} className="w-14 h-14 rounded-xl object-cover shrink-0 border border-white/10" />
              ) : (
                <div className="w-14 h-14 rounded-xl bg-[#C6A16E]/10 border border-[#C6A16E]/20 flex items-center justify-center shrink-0">
                  <BedDouble className="w-6 h-6 text-[#C6A16E]" />
                </div>
              )}

              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <h4 className="text-sm font-bold text-[#F5F3EE] font-heading leading-snug">{hotel.name}</h4>
                  {isOpen ? <ChevronUp className="w-4 h-4 text-[#8E8A81] shrink-0 mt-0.5" /> : <ChevronDown className="w-4 h-4 text-[#8E8A81] shrink-0 mt-0.5" />}
                </div>
                <div className="mt-1 mb-1.5">{renderStars(hotel.rating)}</div>
                <div className="flex items-center gap-1 text-xs text-[#8E8A81]">
                  <MapPin className="w-3 h-3 text-[#C6A16E] shrink-0" />
                  <span className="truncate">{hotel.location}</span>
                </div>
                {hotel.amenities && hotel.amenities.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {hotel.amenities.slice(0, 2).map((a, i) => (
                      <span key={i} className="text-[10px] px-2 py-0.5 rounded-full bg-[#111714] border border-white/8 text-[#B8B4AA]">{a}</span>
                    ))}
                    {hotel.amenities.length > 2 && (
                      <span className="text-[10px] px-2 py-0.5 text-[#8E8A81]">+{hotel.amenities.length - 2} more</span>
                    )}
                  </div>
                )}
              </div>
            </button>

            {/* ── Expanded details ── */}
            {isOpen && (
              <div className="border-t border-white/8 px-5 py-4 space-y-4">

                {/* Contact row */}
                {(hotel.contactPhone || hotel.email || hotel.website) && (
                  <div className="flex flex-wrap gap-x-4 gap-y-2">
                    {hotel.contactPhone && (
                      <a href={`tel:${hotel.contactPhone}`} className="flex items-center gap-1.5 text-xs text-[#B8B4AA] hover:text-[#C6A16E] transition-colors">
                        <Phone className="w-3.5 h-3.5 text-[#C6A16E]" />{hotel.contactPhone}
                      </a>
                    )}
                    {hotel.email && (
                      <a href={`mailto:${hotel.email}`} className="flex items-center gap-1.5 text-xs text-[#B8B4AA] hover:text-[#C6A16E] transition-colors">
                        <Mail className="w-3.5 h-3.5 text-[#C6A16E]" /><span className="truncate max-w-[160px]">{hotel.email}</span>
                      </a>
                    )}
                    {hotel.website && (
                      <a href={hotel.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-xs text-[#B8B4AA] hover:text-[#C6A16E] transition-colors">
                        <Globe className="w-3.5 h-3.5 text-[#C6A16E]" /><span className="truncate max-w-[180px]">{hotel.website}</span>
                      </a>
                    )}
                  </div>
                )}

                {/* Description */}
                {hotel.description && (
                  <p className="text-xs text-[#B8B4AA] leading-relaxed">{hotel.description}</p>
                )}

                {/* Full amenities */}
                {hotel.amenities && hotel.amenities.length > 0 && (
                  <div>
                    <p className="section-label mb-2">Amenities</p>
                    <div className="flex flex-wrap gap-1.5">
                      {hotel.amenities.map((a, i) => (
                        <span key={i} className="text-[11px] px-2.5 py-1 rounded-full bg-[#111714] border border-white/8 text-[#B8B4AA]">{a}</span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Packages */}
                {hotel.packages && hotel.packages.length > 0 && (
                  <div className="space-y-2.5">
                    <p className="section-label">Available Packages</p>

                    {hotel.packages.map((pkg) => {
                      const pkgOpen = expandedPackageId === pkg._id;
                      const cancel = getCancellationStyle(pkg.cancellationPolicy);
                      return (
                        <div key={pkg._id} className="bg-[#111714] border border-white/8 rounded-xl overflow-hidden">

                          {/* Package header */}
                          <div className="px-4 py-3 flex items-center gap-3">
                            <div className="flex-1 min-w-0 cursor-pointer" onClick={() => togglePackage(pkg._id)}>
                              <p className="text-sm font-semibold text-[#F5F3EE] leading-snug">{pkg.name}</p>
                              <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                                <span className={`text-[10px] px-2 py-0.5 rounded-full border font-semibold ${getRoomTypeBadge(pkg.roomType)}`}>
                                  {pkg.roomType.charAt(0).toUpperCase() + pkg.roomType.slice(1)}
                                </span>
                                <span className="text-[11px] text-[#8E8A81] flex items-center gap-1">
                                  <Users className="w-3 h-3" />{pkg.capacity} guests
                                </span>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                              <div className="text-right">
                                <p className="text-sm font-bold text-[#C6A16E] font-heading leading-none">NPR {pkg.pricePerNight.toLocaleString()}</p>
                                <p className="text-[10px] text-[#8E8A81] mt-0.5">/night</p>
                              </div>
                              <button
                                onClick={() => handleBookPackage(hotel, pkg)}
                                className="btn-primary flex items-center gap-1 px-3 py-1.5 rounded-lg text-[11px] font-semibold whitespace-nowrap"
                              >
                                <BedDouble className="w-3 h-3" /> Book
                              </button>
                              <button onClick={() => togglePackage(pkg._id)} className="w-6 h-6 flex items-center justify-center rounded-md hover:bg-white/8 transition-colors">
                                {pkgOpen ? <ChevronUp className="w-3.5 h-3.5 text-[#8E8A81]" /> : <ChevronDown className="w-3.5 h-3.5 text-[#8E8A81]" />}
                              </button>
                            </div>
                          </div>

                          {/* Expanded package details */}
                          {pkgOpen && (
                            <div className="border-t border-white/8 px-4 py-3 space-y-3">
                              {pkg.description && (
                                <p className="text-xs text-[#B8B4AA] leading-relaxed">{pkg.description}</p>
                              )}

                              <div className="grid grid-cols-3 gap-2">
                                <div className="bg-[#161D19] rounded-lg p-2.5 text-center">
                                  <p className="section-label mb-1">Rooms</p>
                                  <p className="text-sm font-bold text-[#F5F3EE] font-heading">{pkg.availableRooms}</p>
                                </div>
                                <div className="bg-[#161D19] rounded-lg p-2.5 text-center">
                                  <Clock className="w-3.5 h-3.5 text-[#C6A16E] mx-auto mb-1" />
                                  <p className="text-xs text-[#8E8A81]">Min {pkg.minStayNights}n{pkg.maxStayNights ? ` · Max ${pkg.maxStayNights}n` : ''}</p>
                                </div>
                                <div className="bg-[#161D19] rounded-lg p-2.5 text-center">
                                  <Shield className="w-3.5 h-3.5 mx-auto mb-1 text-[#8E8A81]" />
                                  <p className={`text-[10px] font-semibold ${cancel.cls}`}>{cancel.text}</p>
                                </div>
                              </div>

                              {pkg.amenities && pkg.amenities.length > 0 && (
                                <div className="flex flex-wrap gap-1.5">
                                  {pkg.amenities.map((a, i) => (
                                    <span key={i} className="text-[10px] px-2 py-0.5 rounded-full bg-[#161D19] border border-white/8 text-[#B8B4AA] flex items-center gap-1">
                                      {a === "WiFi" && <Wifi className="w-2.5 h-2.5" />}
                                      {a === "Restaurant" && <UtensilsCrossed className="w-2.5 h-2.5" />}
                                      {a}
                                    </span>
                                  ))}
                                </div>
                              )}

                              {pkg.image && (
                                <img src={pkg.image} alt={pkg.name} className="w-full h-36 object-cover rounded-xl" />
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}

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
