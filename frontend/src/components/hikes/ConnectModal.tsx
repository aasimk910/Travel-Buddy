// src/components/hikes/ConnectModal.tsx
// Modal for joining a hike. Shows hike details, linked hotels, and a join button.
// #region Imports
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CalendarDays, Users, Ruler, MapPin, X } from "lucide-react";
import { useToast } from "../../context/ToastContext";
import { useAuth } from "../../context/AuthContext";
import { joinHike, getHike } from "../../services/hikes";
import { getUserTrips } from "../../services/trips";
import { MapContainer, TileLayer, Marker, Polyline, Tooltip } from 'react-leaflet';
import L from 'leaflet';
import HotelDetails from "./HotelDetails";
import { getToken } from "../../services/auth";

// #endregion Imports

// #region Setup
// Fix leaflet default icons
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const startIcon = L.divIcon({
  className: '',
  html: `<div style="background:#C6A16E;width:16px;height:16px;border-radius:50%;border:3px solid #0B0F0C;box-shadow:0 0 8px rgba(198,161,110,0.7);"></div>`,
  iconSize: [16, 16], iconAnchor: [8, 8],
});
const endIcon = L.divIcon({
  className: '',
  html: `<div style="background:#ef4444;width:16px;height:16px;border-radius:50%;border:3px solid #0B0F0C;box-shadow:0 0 8px rgba(239,68,68,0.6);"></div>`,
  iconSize: [16, 16], iconAnchor: [8, 8],
});
const hotelIcon = L.divIcon({
  className: '',
  html: `<div style="background:#8FA68E;width:28px;height:28px;border-radius:8px;border:2px solid #0B0F0C;box-shadow:0 4px 12px rgba(0,0,0,0.6);display:flex;align-items:center;justify-content:center;"><svg xmlns='http://www.w3.org/2000/svg' width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='#0B0F0C' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'><path d='M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z'/><polyline points='9 22 9 12 15 12 15 22'/></svg></div>`,
  iconSize: [28, 28], iconAnchor: [14, 14],
});
// #endregion Setup

// #region Types
type Hike = {
  _id: string;
  title: string;
  location: string;
  difficulty: number;
  date: string;
  spotsLeft: number;
  imageUrl?: string;
  description?: string;
  startPoint?: { lat: number; lng: number };
  endPoint?: { lat: number; lng: number };
  hotels?: Array<{
    _id: string;
    name: string;
    location: string;
    coordinates?: { lat: number; lng: number };
    description?: string;
    contactPhone?: string;
    email?: string;
    website?: string;
    imageUrl?: string;
    rating: number;
    reviewCount: number;
    amenities: string[];
    packages: Array<{
      _id: string;
      hotelId: string;
      name: string;
      description?: string;
      roomType: string;
      pricePerNight: number;
      currency: string;
      capacity: number;
      amenities: string[];
      image?: string;
      availableRooms: number;
      maxStayNights?: number;
      minStayNights: number;
      cancellationPolicy: string;
    }>;
  }>;
};

type ConnectModalProps = {
  open: boolean;
  hike: Hike;
  onClose: () => void;
};
// #endregion Types

// #region Helpers
const difficultyLabels = ["Very Easy", "Easy", "Moderate", "Hard", "Expert"];
const extractPlace = (location: string): string => {
  if (location.toLowerCase().includes("kathmandu")) return "Kathmandu Valley";
  if (location.toLowerCase().includes("pokhara")) return "Pokhara";
  if (location.toLowerCase().includes("annapurna")) return "Annapurna Region";
  if (location.toLowerCase().includes("kavre") || location.toLowerCase().includes("dhulikhel")) return "Kavre";
  return "Nepal";
};
// #endregion Helpers

// #region Component
const ConnectModal: React.FC<ConnectModalProps> = ({ open, hike, onClose }) => {
  const navigate = useNavigate();
  const { showSuccess, showError } = useToast();
  const { user, logout } = useAuth();
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const lastFocusedElementRef = useRef<HTMLElement | null>(null);
  const [isJoining, setIsJoining] = useState(false);
  const [isAlreadyConnected, setIsAlreadyConnected] = useState(false);
  const [isCheckingConnection, setIsCheckingConnection] = useState(true);
  const [routeGeometry, setRouteGeometry] = useState<[number, number][] | null>(null);
  const [routeDistance, setRouteDistance] = useState<number | null>(null);
  const [routeLoading, setRouteLoading] = useState(false);
  const [fullHike, setFullHike] = useState<Hike>(hike);

  // Compute hotel positions along the trail for display in the mini-map
  const hotelTrailMarkers = useMemo(() => {
    const hotels = fullHike.hotels;
    if (!hotels?.length) return [];

    return hotels.map((hotel, idx) => {
      const name = (hotel as any).name || 'Hotel';
      const id = (hotel as any)._id || String(idx);

      // Always anchor hotels near the trail end point regardless of stored GPS coords
      if (routeGeometry && routeGeometry.length > 1) {
        // Spread multiple hotels in the last 15% of the trail so they don't overlap
        const endFraction = 1 - (idx * 0.08);
        const trailIdx = Math.round(Math.max(0.85, Math.min(1, endFraction)) * (routeGeometry.length - 1));
        const trailPoint = routeGeometry[trailIdx];
        // Small perpendicular offset so the icon doesn't sit exactly on the route line
        const position: [number, number] = [trailPoint[0] + 0.0012 * (idx + 1), trailPoint[1] + 0.0012 * (idx + 1)];
        return { _id: id, name, position, nearestTrailPoint: trailPoint };
      }

      return null;
    }).filter(Boolean) as { _id: string; name: string; position: [number, number]; nearestTrailPoint: [number, number] | null }[];
  }, [fullHike.hotels, routeGeometry]);

  // Handles formatDistance logic.
  const formatDistance = (m: number) =>
    m >= 1000 ? `${(m / 1000).toFixed(2)} km` : `${Math.round(m)} m`;

  // Fetch full hike details including hotels and packages
  useEffect(() => {
    if (!open || !hike._id) return;
    
    // Handles fetchFullHikeDetails logic.
    const fetchFullHikeDetails = async () => {
      try {
        const fullHikeData = await getHike(hike._id);
        setFullHike(fullHikeData);
      } catch (error) {
        console.error("Failed to fetch full hike details:", error);
        setFullHike(hike);
      }
    };

    fetchFullHikeDetails();
  }, [open, hike._id, hike]);

  // Fetch OSRM trail route between start and end points
  useEffect(() => {
    if (!hike.startPoint || !hike.endPoint) return;
    const { startPoint, endPoint } = hike;
    const controller = new AbortController();
    setRouteLoading(true);
    setRouteGeometry(null);
    setRouteDistance(null);
    const url =
      `https://router.project-osrm.org/route/v1/foot/` +
      `${startPoint.lng},${startPoint.lat};${endPoint.lng},${endPoint.lat}` +
      `?overview=full&geometries=geojson`;
    fetch(url, { signal: controller.signal })
      .then(r => r.json())
      .then(data => {
        if (data.code === 'Ok' && data.routes?.length) {
          const route = data.routes[0];
          setRouteGeometry(
            route.geometry.coordinates.map(([lon, lat]: [number, number]) => [lat, lon])
          );
          setRouteDistance(route.distance);
        }
      })
      .catch(() => {})
      .finally(() => setRouteLoading(false));
    return () => controller.abort();
  }, [hike._id]);

  // Check if user is already connected to this hike
  useEffect(() => {
    // Handles checkConnection logic.
    const checkConnection = async () => {
      if (!open || !user) {
        setIsCheckingConnection(false);
        return;
      }

      try {
        const userTrips = await getUserTrips();
        const isConnected = userTrips.some((trip: Hike) => trip._id === hike._id);
        setIsAlreadyConnected(isConnected);
      } catch (error) {
        console.error("Failed to check connection status:", error);
        setIsAlreadyConnected(false);
      } finally {
        setIsCheckingConnection(false);
      }
    };

    checkConnection();
  }, [open, hike._id, user]);

  useEffect(() => {
    if (!open) return;
    lastFocusedElementRef.current = document.activeElement as HTMLElement;
    // Handles handleKeyDown logic.
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        handleClose();
        return;
      }
      if (e.key === "Tab" && dialogRef.current) {
        const focusable = dialogRef.current.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), textarea, input, select, [tabindex="0"]'
        );
        if (!focusable.length) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        } else if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  // Handles handleClose logic.
  const handleClose = () => {
    onClose();
    setTimeout(() => {
      lastFocusedElementRef.current?.focus();
    }, 0);
  };

  // Handles handleJoin logic.
  const handleJoin = async () => {
    const token = getToken();
    if (!token) {
      showError("You must be logged in to join a hike.");
      return;
    }

    setIsJoining(true);
    try {
      const response = await joinHike(hike._id, token);
      showSuccess("Successfully joined the hike!");
      handleClose();
      navigate(`/dashboard/${response.hike._id}`);
    } catch (error) {
      console.error("Failed to join hike:", error);
      if (error instanceof Error && error.message === 'AUTH_EXPIRED') {
        logout();
        navigate('/login');
        showError('Your session has expired. Please log in again.');
      } else {
        showError(error instanceof Error ? error.message : "An unknown error occurred.");
      }
    } finally {
      setIsJoining(false);
    }
  };

  // Handles handleGoToDashboard logic.
  const handleGoToDashboard = () => {
    handleClose();
    navigate(`/dashboard/${hike._id}`);
  };

  if (!open) return null;

  const place = extractPlace(hike.location);
  const difficultyText = difficultyLabels[(hike.difficulty || 1) - 1] || difficultyLabels[0];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#0B0F0C]/80 p-4"
      role="dialog" aria-modal="true"
      aria-labelledby={`connect-dialog-title-${hike._id}`}
      id={`connect-dialog-${hike._id}`}
    >
      <div
        ref={dialogRef}
        className="w-full max-w-2xl max-h-[92vh] overflow-y-auto rounded-2xl border border-white/10"
        style={{ background: 'linear-gradient(145deg,#1B2420 0%,#161D19 55%,#121A16 100%)', boxShadow: '0 24px 64px rgba(0,0,0,0.8)' }}
      >

        {/* ── Cover image with overlay ── */}
        <div className="relative h-52 sm:h-64 overflow-hidden rounded-t-2xl">
          {hike.imageUrl ? (
            <img src={hike.imageUrl} alt={hike.title} className="w-full h-full object-cover" />
          ) : (
            <div
              className="w-full h-full bg-cover bg-center"
              style={{ backgroundImage: "url('https://images.pexels.com/photos/618833/pexels-photo-618833.jpeg?auto=compress&cs=tinysrgb&w=700')" }}
            />
          )}
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#161D19] via-[#161D19]/40 to-transparent" />
          {/* Close button */}
          <button
            type="button" onClick={handleClose}
            className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center rounded-xl bg-[#0B0F0C]/70 border border-white/15 text-[#8E8A81] hover:text-[#F5F3EE] transition-all"
          >
            <X className="w-4 h-4" />
          </button>
          {/* Badges over image */}
          <div className="absolute top-3 left-3 flex gap-2">
            <span className="surface-pill inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium">{place}</span>
            <span className="surface-pill inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium">{difficultyText}</span>
          </div>
          {/* Title on image */}
          <div className="absolute bottom-0 left-0 right-0 px-6 pb-4">
            <h2
              id={`connect-dialog-title-${hike._id}`}
              className="text-2xl sm:text-3xl font-bold text-[#F5F3EE] font-heading leading-tight"
            >
              {hike.title}
            </h2>
          </div>
        </div>

        {/* ── Body ── */}
        <div className="px-6 pt-4 pb-6 space-y-5">

          {/* Meta row */}
          <div className="flex flex-wrap gap-4 text-sm text-[#B8B4AA]">
            <span className="flex items-center gap-1.5">
              <CalendarDays className="w-4 h-4 text-[#C6A16E] shrink-0" />
              {new Date(hike.date).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
            </span>
            <span className="flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-[#C6A16E] shrink-0" />
              {hike.location}
            </span>
          </div>

          {/* Spots + CTA */}
          <div className="flex items-center justify-between gap-3 bg-[#111714] border border-white/8 rounded-xl px-5 py-3.5">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-[#C6A16E]/10 border border-[#C6A16E]/25 flex items-center justify-center">
                <Users className="w-4 h-4 text-[#C6A16E]" />
              </div>
              <div>
                <p className="text-[#F5F3EE] text-sm font-semibold">{hike.spotsLeft} spots left</p>
                <p className="text-[#8E8A81] text-xs">Join before it fills up</p>
              </div>
            </div>
            {isCheckingConnection ? (
              <button type="button" disabled className="btn-primary px-5 py-2.5 rounded-xl text-sm font-semibold opacity-60">
                Loading…
              </button>
            ) : isAlreadyConnected ? (
              <button type="button" onClick={handleGoToDashboard} className="btn-primary px-5 py-2.5 rounded-xl text-sm font-semibold">
                Go to Dashboard
              </button>
            ) : (
              <button type="button" onClick={handleJoin} disabled={isJoining || hike.spotsLeft <= 0}
                className="btn-primary px-5 py-2.5 rounded-xl text-sm font-semibold disabled:opacity-60">
                {isJoining ? "Joining…" : "Join Hike"}
              </button>
            )}
          </div>

          {/* Description */}
          {hike.description && (
            <div>
              <p className="section-label mb-2">About This Hike</p>
              <p className="text-sm text-[#B8B4AA] leading-relaxed">{hike.description}</p>
            </div>
          )}

          {/* Trail Route Map */}
          {(hike.startPoint || hike.endPoint) && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Ruler className="w-4 h-4 text-[#C6A16E]" />
                <p className="section-label">Trail Route</p>
                {routeLoading && (
                  <div className="w-3.5 h-3.5 border-2 border-[#C6A16E] border-t-transparent rounded-full animate-spin ml-1" />
                )}
                {routeDistance !== null && !routeLoading && (
                  <span className="ml-auto surface-pill rounded-full px-3 py-0.5 text-xs font-bold">
                    {formatDistance(routeDistance)}
                  </span>
                )}
              </div>

              <div className="rounded-xl overflow-hidden border border-white/10" style={{ height: '220px' }}>
                {(() => {
                  const sp = hike.startPoint;
                  const ep = hike.endPoint;
                  const center: [number, number] = sp ? [sp.lat, sp.lng] : ep ? [ep.lat, ep.lng] : [27.7172, 85.324];
                  return (
                    <MapContainer center={center} zoom={13} style={{ height: '100%', width: '100%' }} scrollWheelZoom={false}>
                      <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                      />
                      {sp && <Marker position={[sp.lat, sp.lng]} icon={startIcon} />}
                      {ep && <Marker position={[ep.lat, ep.lng]} icon={endIcon} />}
                      {routeGeometry && routeGeometry.length > 0 && (
                        <Polyline positions={routeGeometry} pathOptions={{ color: '#C6A16E', weight: 4, opacity: 0.85 }}>
                          <Tooltip sticky>
                            <span className="font-semibold">Trail: {routeDistance !== null ? formatDistance(routeDistance) : '...'}</span>
                          </Tooltip>
                        </Polyline>
                      )}
                      {hotelTrailMarkers.map((hotel) => (
                        <React.Fragment key={`hotel-trail-${hotel._id}`}>
                          {hotel.nearestTrailPoint && (
                            <Polyline
                              positions={[hotel.nearestTrailPoint, hotel.position]}
                              pathOptions={{ color: '#8FA68E', weight: 1.5, opacity: 0.7, dashArray: '4 4' }}
                            />
                          )}
                          <Marker position={hotel.position} icon={hotelIcon}>
                            <Tooltip permanent={false} direction="top" offset={[0, -14]}>
                              <span className="font-semibold text-xs">{hotel.name}</span>
                            </Tooltip>
                          </Marker>
                        </React.Fragment>
                      ))}
                    </MapContainer>
                  );
                })()}
              </div>

              <div className="flex flex-wrap gap-4 mt-2 text-[11px] text-[#8E8A81]">
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-[#C6A16E] inline-block" /> Start</span>
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-red-500 inline-block" /> End</span>
                {hotelTrailMarkers.length > 0 && (
                  <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-md bg-[#8FA68E] inline-block" /> Accommodation</span>
                )}
              </div>
            </div>
          )}

          {/* Hotels Along Trail */}
          {fullHike.hotels && fullHike.hotels.length > 0 && (
            <div>
              <p className="section-label mb-3">Accommodation Along Trail</p>
              <HotelDetails hotels={fullHike.hotels} hikeId={fullHike._id} hikeDate={fullHike.date} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// #endregion Component

// #region Exports
export default ConnectModal;
// #endregion Exports
