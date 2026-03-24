import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CalendarDays, Users, Ruler } from "lucide-react";
import { useToast } from "../../context/ToastContext";
import { useAuth } from "../../context/AuthContext";
import { joinHike, getHike } from "../../services/hikes";
import { getUserTrips } from "../../services/trips";
import { MapContainer, TileLayer, Marker, Polyline, Tooltip } from 'react-leaflet';
import L from 'leaflet';
import HotelDetails from "./HotelDetails";

// Fix leaflet default icons
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const startIcon = L.divIcon({
  className: '',
  html: `<div style="background:#22c55e;width:16px;height:16px;border-radius:50%;border:3px solid white;box-shadow:0 0 6px rgba(0,0,0,.5);display:flex;align-items:center;justify-content:center"><span style="color:white;font-size:8px;font-weight:700">S</span></div>`,
  iconSize: [16, 16], iconAnchor: [8, 8],
});
const endIcon = L.divIcon({
  className: '',
  html: `<div style="background:#ef4444;width:16px;height:16px;border-radius:50%;border:3px solid white;box-shadow:0 0 6px rgba(0,0,0,.5);display:flex;align-items:center;justify-content:center"><span style="color:white;font-size:8px;font-weight:700">E</span></div>`,
  iconSize: [16, 16], iconAnchor: [8, 8],
});
const hotelIcon = L.divIcon({
  className: '',
  html: `<div style="background:#0f766e;width:26px;height:26px;border-radius:7px;border:2px solid white;box-shadow:0 2px 8px rgba(0,0,0,.5);display:flex;align-items:center;justify-content:center;"><svg xmlns='http://www.w3.org/2000/svg' width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='white' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'><path d='M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z'/><polyline points='9 22 9 12 15 12 15 22'/></svg></div>`,
  iconSize: [26, 26], iconAnchor: [13, 13],
});

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

const difficultyLabels = ["Very Easy", "Easy", "Moderate", "Hard", "Expert"];
const extractPlace = (location: string): string => {
  if (location.toLowerCase().includes("kathmandu")) return "Kathmandu Valley";
  if (location.toLowerCase().includes("pokhara")) return "Pokhara";
  if (location.toLowerCase().includes("annapurna")) return "Annapurna Region";
  if (location.toLowerCase().includes("kavre") || location.toLowerCase().includes("dhulikhel")) return "Kavre";
  return "Nepal";
};

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

  const formatDistance = (m: number) =>
    m >= 1000 ? `${(m / 1000).toFixed(2)} km` : `${Math.round(m)} m`;

  // Fetch full hike details including hotels and packages
  useEffect(() => {
    if (!open || !hike._id) return;
    
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

  const handleClose = () => {
    onClose();
    setTimeout(() => {
      lastFocusedElementRef.current?.focus();
    }, 0);
  };

  const handleJoin = async () => {
    const token = localStorage.getItem("travelBuddyToken");
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

  const handleGoToDashboard = () => {
    handleClose();
    navigate(`/dashboard/${hike._id}`);
  };

  if (!open) return null;

  const place = extractPlace(hike.location);
  const difficultyText = difficultyLabels[(hike.difficulty || 1) - 1] || difficultyLabels[0];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby={`connect-dialog-title-${hike._id}`}
      aria-describedby={`connect-dialog-desc-${hike._id}`}
      id={`connect-dialog-${hike._id}`}
    >
      <div ref={dialogRef} className="glass-card rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 glass-nav px-6 py-4 flex items-center justify-end rounded-t-2xl">
          <button type="button" onClick={handleClose} className="px-3 py-1.5 text-gray-200 hover:text-white glass-button rounded-lg text-sm font-medium transition-colors">
            Cancel
          </button>
        </div>

        <div className="p-6">
          <div className="rounded-2xl overflow-hidden mb-6">
            <div className="h-56 sm:h-72 bg-gray-200 relative">
              {hike.imageUrl ? (
                <img src={hike.imageUrl} alt={hike.title} className="h-full w-full object-cover" />
              ) : (
                <div className="h-full w-full bg-gray-100" />
              )}
              <div className="absolute top-3 left-3 flex gap-2">
                <span className="inline-flex items-center rounded-full glass-strong px-3 py-1 text-[11px] font-medium text-black shadow-sm">{place}</span>
                <span className="inline-flex items-center rounded-full glass-strong px-3 py-1 text-[11px] font-medium text-black shadow-sm">{difficultyText}</span>
              </div>
            </div>
          </div>

          <h2 id={`connect-dialog-title-${hike._id}`} className="text-2xl sm:text-3xl font-bold text-white">
            {hike.title}
          </h2>
          <div id={`connect-dialog-desc-${hike._id}`} className="mt-2 inline-flex items-center gap-2 text-sm text-gray-200">
            <CalendarDays className="w-4 h-4" />
            <span>{new Date(hike.date).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</span>
          </div>

          <div className="mt-6 glass-card rounded-xl overflow-hidden">
            <div className="px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full glass-button-dark flex items-center justify-center text-white">
                  <Users className="w-4 h-4" />
                </div>
                <span className="text-sm text-white">Spots left: {hike.spotsLeft}</span>
              </div>
              {isCheckingConnection ? (
                <button type="button" disabled className="px-5 py-2 glass-button-dark rounded-full font-semibold opacity-60 transition-colors shadow-lg text-white">
                  Loading...
                </button>
              ) : isAlreadyConnected ? (
                <button type="button" onClick={handleGoToDashboard} className="px-5 py-2 glass-button-dark rounded-full font-semibold transition-colors shadow-lg text-white hover:opacity-90">
                  Go to Dashboard
                </button>
              ) : (
                <button type="button" onClick={handleJoin} disabled={isJoining || hike.spotsLeft <= 0} className="px-5 py-2 glass-button-dark rounded-full font-semibold disabled:opacity-60 transition-colors shadow-lg text-white">
                  {isJoining ? "Joining…" : "Join Hike"}
                </button>
              )}
            </div>
          </div>

          <div className="mt-6 glass-card rounded-xl overflow-hidden">
            <div className="px-6 py-4">
              <p className="text-xs text-gray-300 mb-2">Organized By</p>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full glass-button-dark text-white flex items-center justify-center">TB</div>
                <div>
                  <p className="text-sm font-medium text-white">Travel Buddy</p>
                  <p className="text-xs text-gray-300">Hike Leader</p>
                </div>
              </div>
            </div>
          </div>

          {hike.description && (
            <div className="mt-6 glass-card rounded-xl overflow-hidden">
              <div className="px-6 py-4">
                <p className="text-xs text-gray-300 mb-2">About Hike</p>
                <p className="text-sm text-gray-200">{hike.description}</p>
              </div>
            </div>
          )}

          {/* Trail Route Map */}
          {(hike.startPoint || hike.endPoint) && (
            <div className="mt-6 glass-card rounded-xl overflow-hidden">
              <div className="px-6 py-4">
                <div className="flex items-center gap-2 mb-3">
                  <Ruler className="w-4 h-4 text-indigo-300" />
                  <p className="text-sm font-semibold text-white">Trail Route</p>
                  {routeLoading && (
                    <div className="w-4 h-4 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
                  )}
                  {routeDistance !== null && !routeLoading && (
                    <span className="ml-auto px-3 py-1 bg-indigo-600/40 border border-indigo-400/40 rounded-full text-xs font-bold text-indigo-200">
                      {formatDistance(routeDistance)}
                    </span>
                  )}
                </div>

                <div className="rounded-lg overflow-hidden border border-white/20" style={{ height: '220px' }}>
                  {(() => {
                    const sp = hike.startPoint;
                    const ep = hike.endPoint;
                    const center: [number, number] = sp
                      ? [sp.lat, sp.lng]
                      : ep
                      ? [ep.lat, ep.lng]
                      : [27.7172, 85.324];
                    return (
                      <MapContainer center={center} zoom={13} style={{ height: '100%', width: '100%' }} scrollWheelZoom={false}>
                        <TileLayer
                          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        />
                        {sp && <Marker position={[sp.lat, sp.lng]} icon={startIcon} />}
                        {ep && <Marker position={[ep.lat, ep.lng]} icon={endIcon} />}
                        {routeGeometry && routeGeometry.length > 0 && (
                          <Polyline positions={routeGeometry} pathOptions={{ color: '#6366f1', weight: 4 }}>
                            <Tooltip sticky>
                              <span className="font-semibold">
                                Trail: {routeDistance !== null ? formatDistance(routeDistance) : '…'}
                              </span>
                            </Tooltip>
                          </Polyline>
                        )}
                        {hotelTrailMarkers.map((hotel) => (
                          <React.Fragment key={`hotel-trail-${hotel._id}`}>
                            {hotel.nearestTrailPoint && (
                              <Polyline
                                positions={[hotel.nearestTrailPoint, hotel.position]}
                                pathOptions={{ color: '#0f766e', weight: 1.5, opacity: 0.7, dashArray: '4 4' }}
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

                <div className="flex flex-wrap gap-4 mt-2 text-xs text-gray-400">
                  <span className="flex items-center gap-1"><span className="inline-block w-3 h-3 rounded-full bg-green-500" /> Start</span>
                  <span className="flex items-center gap-1"><span className="inline-block w-3 h-3 rounded-full bg-red-500" /> End</span>
                  {hotelTrailMarkers.length > 0 && (
                    <span className="flex items-center gap-1">
                      <span className="inline-block w-3 h-3 rounded" style={{ background: '#0f766e' }} /> Accommodation
                    </span>
                  )}
                  {routeDistance !== null && !routeLoading && (
                    <span className="ml-auto font-semibold text-indigo-300">Trail distance: {formatDistance(routeDistance)}</span>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Hotels Along Trail */}
          {fullHike.hotels && fullHike.hotels.length > 0 && (
            <div className="mt-6 glass-card rounded-xl overflow-hidden">
              <div className="px-6 py-4">
                <HotelDetails hotels={fullHike.hotels} hikeId={fullHike._id} hikeDate={fullHike.date} />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ConnectModal;
