// src/pages/Maps.tsx
// Interactive Leaflet map page showing hike locations with clickable markers.
// #region Imports
import React, { useEffect, useState, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents, Polyline, Tooltip } from 'react-leaflet';
import { getHikes, getHike } from '../services/hikes';
import { MapPin, Search, Filter, X, Ruler, Navigation, BedDouble, Hotel } from 'lucide-react';
import L from 'leaflet';
import ConnectModal from '../components/hikes/ConnectModal';

// #endregion Imports

// #region Setup
// Fix for default marker icons in React-Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});
// #endregion Setup

// #region Types
interface Hike {
  _id: string;
  title: string;
  location: string;
  coordinates?: { lat: number; lng: number };
  startPoint?: { lat: number; lng: number };
  endPoint?: { lat: number; lng: number };
  difficulty: number;
  date: string;
  spotsLeft: number;
  imageUrl?: string;
  description?: string;
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
}
// #endregion Types

// #region Helpers
// Component to handle map center changes
const ChangeMapView: React.FC<{ center: [number, number]; zoom: number; focusPoints?: [number, number][] }> = ({
  center,
  zoom,
  focusPoints = [],
}) => {
  const map = useMap();

  useEffect(() => {
    if (focusPoints.length >= 2) {
      const bounds = L.latLngBounds(focusPoints);
      map.fitBounds(bounds, { padding: [60, 60], maxZoom: 13 });
      return;
    }

    map.setView(center, zoom);
  }, [map, center, zoom, focusPoints]);

  return null;
};

// Custom icons for distance measurement points
const pointAIcon = L.divIcon({
  className: '',
  html: `<div style="background:#C6A16E;width:16px;height:16px;border-radius:50%;border:3px solid #0B0F0C;box-shadow:0 0 8px rgba(198,161,110,0.7);"></div>`,
  iconSize: [16, 16],
  iconAnchor: [8, 8],
});

const pointBIcon = L.divIcon({
  className: '',
  html: `<div style="background:#ef4444;width:16px;height:16px;border-radius:50%;border:3px solid #0B0F0C;box-shadow:0 0 8px rgba(239,68,68,0.6);"></div>`,
  iconSize: [16, 16],
  iconAnchor: [8, 8],
});

const hotelMarkerIcon = L.divIcon({
  className: '',
  html: `<div style="background:#8FA68E;width:32px;height:32px;border-radius:10px;border:2px solid #0B0F0C;box-shadow:0 4px 14px rgba(0,0,0,0.7);display:flex;align-items:center;justify-content:center;">
    <svg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='#0B0F0C' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'><path d='M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z'/><polyline points='9 22 9 12 15 12 15 22'/></svg>
  </div>`,
  iconSize: [32, 32],
  iconAnchor: [16, 16],
});

// Custom gold hike marker icon
const hikeMarkerIcon = L.divIcon({
  className: '',
  html: `<div style="position:relative;width:36px;height:44px;">
    <div style="width:36px;height:36px;background:linear-gradient(135deg,#D4AE7A,#C6A16E);border-radius:50% 50% 50% 0;transform:rotate(-45deg);border:3px solid #0B0F0C;box-shadow:0 4px 16px rgba(198,161,110,0.6);"></div>
    <div style="position:absolute;top:6px;left:6px;width:24px;height:24px;background:#0B0F0C;border-radius:50%;display:flex;align-items:center;justify-content:center;">
      <svg xmlns='http://www.w3.org/2000/svg' width='13' height='13' viewBox='0 0 24 24' fill='none' stroke='#C6A16E' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'><path d='m8 3 4 8 5-5 5 15H2L8 3z'/></svg>
    </div>
  </div>`,
  iconSize: [36, 44],
  iconAnchor: [18, 44],
});

// Selected hike marker (brighter)
const selectedHikeMarkerIcon = L.divIcon({
  className: '',
  html: `<div style="position:relative;width:40px;height:50px;">
    <div style="width:40px;height:40px;background:linear-gradient(135deg,#DDBA84,#D4AE7A);border-radius:50% 50% 50% 0;transform:rotate(-45deg);border:3px solid #0B0F0C;box-shadow:0 4px 20px rgba(198,161,110,0.85);"></div>
    <div style="position:absolute;top:7px;left:7px;width:26px;height:26px;background:#0B0F0C;border-radius:50%;display:flex;align-items:center;justify-content:center;">
      <svg xmlns='http://www.w3.org/2000/svg' width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='#E8D5B0' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'><path d='m8 3 4 8 5-5 5 15H2L8 3z'/></svg>
    </div>
  </div>`,
  iconSize: [40, 50],
  iconAnchor: [20, 50],
});

// Distance measurement click handler
const DistanceMeasure: React.FC<{
  active: boolean;
  pointA: [number, number] | null;
  pointB: [number, number] | null;
  routeGeometry: [number, number][] | null;
  routeDistance: number | null;
  routeLoading: boolean;
  onPointSet: (pt: [number, number]) => void;
}> = ({ active, pointA, pointB, routeGeometry, routeDistance, routeLoading, onPointSet }) => {
  useMapEvents({
    click(e) {
      if (!active) return;
      onPointSet([e.latlng.lat, e.latlng.lng]);
    },
  });

  // Handles formatDistance logic.
  const formatDistance = (meters: number) => {
    if (meters >= 1000) return `${(meters / 1000).toFixed(2)} km`;
    return `${Math.round(meters)} m`;
  };

  return (
    <>
      {pointA && (
        <Marker position={pointA} icon={pointAIcon}>
          <Tooltip permanent direction="top" offset={[0, -10]}>
            <span className="text-xs font-semibold">A</span>
          </Tooltip>
        </Marker>
      )}
      {pointB && (
        <Marker position={pointB} icon={pointBIcon}>
          <Tooltip permanent direction="top" offset={[0, -10]}>
            <span className="text-xs font-semibold">B</span>
          </Tooltip>
        </Marker>
      )}
      {/* Show a faint straight preview while route is loading */}
      {pointA && pointB && routeLoading && (
        <Polyline
          positions={[pointA, pointB]}
          pathOptions={{ color: '#a5b4fc', weight: 2, dashArray: '6 6' }}
        />
      )}
      {/* Actual trail route polyline */}
      {routeGeometry && routeGeometry.length > 0 && (
        <Polyline
          positions={routeGeometry}
          pathOptions={{ color: '#6366f1', weight: 4 }}
        >
          <Tooltip sticky>
            <span className="font-semibold">
              Trail distance: {routeDistance !== null ? formatDistance(routeDistance) : '...'}
            </span>
          </Tooltip>
        </Polyline>
      )}
    </>
  );
};

// Get coordinates from hike data or use default
const getHikeCoordinates = (hike: Hike): [number, number] => {
  if (hike.coordinates?.lat && hike.coordinates?.lng)
    return [hike.coordinates.lat, hike.coordinates.lng];
  if (hike.startPoint?.lat && hike.startPoint?.lng)
    return [hike.startPoint.lat, hike.startPoint.lng];
  return [27.7172, 85.324];
};

// Handles getStableIndexFromId logic.
const getStableIndexFromId = (id: string, length: number) => {
  if (length <= 0) return 0;
  let hash = 0;
  for (let i = 0; i < id.length; i += 1) {
    hash = (hash << 5) - hash + id.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash) % length;
};
// #endregion Helpers

// #region Component
const Maps: React.FC = () => {
  const [hikes, setHikes] = useState<Hike[]>([]);
  const [selectedHike, setSelectedHike] = useState<Hike | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [difficultyFilter, setDifficultyFilter] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [mapCenter, setMapCenter] = useState<[number, number]>([27.7172, 85.324]);
  const [mapZoom, setMapZoom] = useState(10);
  const [connectHike, setConnectHike] = useState<Hike | null>(null);

  // Distance measurement state
  const [measureActive, setMeasureActive] = useState(false);
  const [pointA, setPointA] = useState<[number, number] | null>(null);
  const [pointB, setPointB] = useState<[number, number] | null>(null);
  const [routeGeometry, setRouteGeometry] = useState<[number, number][] | null>(null);
  const [routeDistance, setRouteDistance] = useState<number | null>(null);
  const [routeLoading, setRouteLoading] = useState(false);
  const [routeError, setRouteError] = useState<string | null>(null);
  const [selectedTrailGeometry, setSelectedTrailGeometry] = useState<[number, number][] | null>(null);

  // Handles handleMeasurePoint logic.
  const handleMeasurePoint = (pt: [number, number]) => {
    if (!pointA || (pointA && pointB)) {
      // Start fresh — clear previous route
      setPointA(pt);
      setPointB(null);
      setRouteGeometry(null);
      setRouteDistance(null);
      setRouteError(null);
    } else {
      setPointB(pt);
    }
  };

  // Handles clearMeasurement logic.
  const clearMeasurement = () => {
    setPointA(null);
    setPointB(null);
    setRouteGeometry(null);
    setRouteDistance(null);
    setRouteError(null);
  };

  // Handles formatDistance logic.
  const formatDistance = (meters: number) => {
    if (meters >= 1000) return `${(meters / 1000).toFixed(2)} km`;
    return `${Math.round(meters)} m`;
  };

  // Fetch trail route from OSRM when both points are set
  useEffect(() => {
    if (!pointA || !pointB) return;
    const controller = new AbortController();
    setRouteLoading(true);
    setRouteError(null);

    // OSRM expects lon,lat order; use 'foot' profile for walking/hiking trails
    const url =
      `https://router.project-osrm.org/route/v1/foot/` +
      `${pointA[1]},${pointA[0]};${pointB[1]},${pointB[0]}` +
      `?overview=full&geometries=geojson`;

    fetch(url, { signal: controller.signal })
      .then((res) => res.json())
      .then((data) => {
        if (data.code !== 'Ok' || !data.routes?.length) {
          setRouteError('No route found between these points.');
          setRouteGeometry(null);
          setRouteDistance(null);
          return;
        }
        const route = data.routes[0];
        // OSRM GeoJSON coords are [lon, lat] — flip to [lat, lon] for Leaflet
        const coords: [number, number][] = route.geometry.coordinates.map(
          ([lon, lat]: [number, number]) => [lat, lon]
        );
        setRouteGeometry(coords);
        setRouteDistance(route.distance); // metres
      })
      .catch((err) => {
        if (err.name !== 'AbortError') {
          setRouteError('Could not fetch route. Check your connection.');
        }
      })
      .finally(() => setRouteLoading(false));

    return () => controller.abort();
  }, [pointA, pointB]);

  // Build selected hike trail geometry from start/end points.
  useEffect(() => {
    if (!selectedHike?.startPoint?.lat || !selectedHike?.startPoint?.lng || !selectedHike?.endPoint?.lat || !selectedHike?.endPoint?.lng) {
      setSelectedTrailGeometry(null);
      return;
    }

    const controller = new AbortController();
    const start = selectedHike.startPoint;
    const end = selectedHike.endPoint;
    const url =
      `https://router.project-osrm.org/route/v1/foot/` +
      `${start.lng},${start.lat};${end.lng},${end.lat}` +
      `?overview=full&geometries=geojson`;

    fetch(url, { signal: controller.signal })
      .then((res) => res.json())
      .then((data) => {
        if (data.code !== 'Ok' || !data.routes?.length) {
          setSelectedTrailGeometry(null);
          return;
        }
        const coords: [number, number][] = data.routes[0].geometry.coordinates.map(
          ([lon, lat]: [number, number]) => [lat, lon]
        );
        setSelectedTrailGeometry(coords);
      })
      .catch((err) => {
        if (err.name !== 'AbortError') {
          setSelectedTrailGeometry(null);
        }
      });

    return () => controller.abort();
  }, [selectedHike]);

  // Create a mapping of hike IDs to coordinates
  const hikeCoordinates = useMemo(() => {
    const coordMap = new Map<string, [number, number]>();
    hikes.forEach(hike => {
      coordMap.set(hike._id, getHikeCoordinates(hike));
    });
    return coordMap;
  }, [hikes]);

  const selectedHikeHotels = useMemo(() => {
    if (!selectedHike?.hotels?.length) return [] as Array<{
      _id: string;
      name: string;
      location: string;
      position: [number, number];
      isApproximate: boolean;
      nearestTrailPoint: [number, number] | null;
    }>;

    const normalizedHotels = selectedHike.hotels.filter(
      (hotel) => typeof hotel === 'object' && hotel !== null
    );

    if (!normalizedHotels.length) return [];

    // Find the closest point on the trail to a given [lat, lng] position
    const getNearestTrailPoint = (pos: [number, number]): [number, number] | null => {
      if (!selectedTrailGeometry || selectedTrailGeometry.length < 2) return null;
      let nearest = selectedTrailGeometry[0];
      let minDist = Infinity;
      for (const pt of selectedTrailGeometry) {
        const d = (pt[0] - pos[0]) ** 2 + (pt[1] - pos[1]) ** 2;
        if (d < minDist) { minDist = d; nearest = pt; }
      }
      return nearest;
    };

    const [centerLat, centerLng] = getHikeCoordinates(selectedHike);
    const missingCoordsHotels = normalizedHotels.filter(
      (hotel) =>
        !Number.isFinite(hotel.coordinates?.lat) ||
        !Number.isFinite(hotel.coordinates?.lng)
    );

    return normalizedHotels.map((hotel) => {
      const hasCoords =
        Number.isFinite(hotel.coordinates?.lat) &&
        Number.isFinite(hotel.coordinates?.lng);

      if (hasCoords) {
        const position: [number, number] = [hotel.coordinates!.lat, hotel.coordinates!.lng];
        return {
          _id: hotel._id,
          name: hotel.name,
          location: hotel.location,
          position,
          isApproximate: false,
          nearestTrailPoint: getNearestTrailPoint(position),
        };
      }

      // Prefer placing missing hotels offset beside a stable trail point.
      if (selectedTrailGeometry && selectedTrailGeometry.length > 1) {
        const trailIndex = getStableIndexFromId(hotel._id, selectedTrailGeometry.length);
        const trailPoint = selectedTrailGeometry[trailIndex];
        // Offset slightly perpendicular to trail so marker doesn't overlap the line
        const offsetLat = trailPoint[0] + 0.0015;
        const offsetLng = trailPoint[1] + 0.0015;
        const position: [number, number] = [offsetLat, offsetLng];
        return {
          _id: hotel._id,
          name: hotel.name,
          location: hotel.location,
          position,
          isApproximate: true,
          nearestTrailPoint: trailPoint,
        };
      }

      // Fallback: place around hike center in a small ring.
      const missingIndex = Math.max(
        0,
        missingCoordsHotels.findIndex((h) => h._id === hotel._id)
      );
      const angle = (missingIndex * 2 * Math.PI) / Math.max(missingCoordsHotels.length, 1);
      const radiusDeg = 0.004;
      const latOffset = Math.sin(angle) * radiusDeg;
      const lngOffset =
        (Math.cos(angle) * radiusDeg) /
        Math.max(Math.cos((centerLat * Math.PI) / 180), 0.2);
      const position: [number, number] = [centerLat + latOffset, centerLng + lngOffset];
      return {
        _id: hotel._id,
        name: hotel.name,
        location: hotel.location,
        position,
        isApproximate: true,
        nearestTrailPoint: null,
      };
    });
  }, [selectedHike, selectedTrailGeometry]);

  const selectedHikeFocusPoints = useMemo(() => {
    if (!selectedHike) return [] as [number, number][];

    const hikeCenter = getHikeCoordinates(selectedHike);
    if (!selectedHikeHotels.length) return [hikeCenter];

    return [hikeCenter, ...selectedHikeHotels.map((hotel) => hotel.position)];
  }, [selectedHike, selectedHikeHotels]);

  useEffect(() => {
    // Handles fetchHikes logic.
    const fetchHikes = async () => {
      try {
        const data = await getHikes();
        setHikes(data);
      } catch (error) {
        console.error('Failed to fetch hikes:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchHikes();
  }, []);

  const filteredHikes = hikes.filter(hike => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const isUpcoming = new Date(hike.date) >= today;
    const matchesSearch = hike.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          hike.location.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDifficulty = difficultyFilter === 'all' || hike.difficulty.toString() === difficultyFilter;
    return isUpcoming && matchesSearch && matchesDifficulty;
  });

  // Handles getDifficultyColor logic.
  const getDifficultyColor = (difficulty: number) => {
    switch(difficulty) {
      case 1: return 'bg-green-500';
      case 2: return 'bg-blue-500';
      case 3: return 'bg-yellow-500';
      case 4: return 'bg-orange-500';
      case 5: return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  // Handles getDifficultyLabel logic.
  const getDifficultyLabel = (difficulty: number) => {
    const labels = ['', 'Easy', 'Moderate', 'Challenging', 'Hard', 'Expert'];
    return labels[difficulty] || 'Unknown';
  };

  // Handles handleHikeClick logic.
  const handleHikeClick = async (hike: Hike, coords: [number, number]) => {
    setSelectedHike(hike);
    setMapCenter(coords);
    setMapZoom(13);

    try {
      const fullHike = await getHike(hike._id);
      setSelectedHike(fullHike as Hike);
    } catch (error) {
      console.error('Failed to fetch full hike details:', error);
    }
  };

  return (
    <div className="h-[calc(100vh-64px)] flex bg-[#0B0F0C]">
      {/* ── Sidebar ────────────────────────────────────────────────────── */}
      <div className="w-96 flex flex-col overflow-hidden bg-[#0D1210] border-r border-white/8">

        {/* Cinematic nature banner header */}
        <div className="relative overflow-hidden">
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: "url('https://images.pexels.com/photos/618833/pexels-photo-618833.jpeg?auto=compress&cs=tinysrgb&w=600')" }}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#0B0F0C]/55 via-[#0B0F0C]/65 to-[#0D1210]" />
          <div className="relative px-5 pt-5 pb-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 rounded-lg bg-[#C6A16E]/20 border border-[#C6A16E]/40 flex items-center justify-center shrink-0">
                <MapPin className="w-4 h-4 text-[#C6A16E]" />
              </div>
              <div>
                <p className="section-label">Trail Explorer</p>
                <h2 className="text-lg font-bold text-[#F5F3EE] font-heading leading-tight">Hikes Map</h2>
              </div>
            </div>

            {/* Search */}
            <div className="relative mb-3">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8E8A81]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search hikes or locations…"
                className="w-full pl-10 pr-3 py-2.5 rounded-lg site-input text-sm"
              />
            </div>

            {/* Difficulty filter */}
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-[#8E8A81] shrink-0" />
              <select
                value={difficultyFilter}
                onChange={(e) => setDifficultyFilter(e.target.value)}
                className="flex-1 px-3 py-2 rounded-lg site-input text-sm [color-scheme:dark]"
              >
                <option value="all" className="bg-[#161D19]">All Difficulties</option>
                <option value="1" className="bg-[#161D19]">Easy</option>
                <option value="2" className="bg-[#161D19]">Moderate</option>
                <option value="3" className="bg-[#161D19]">Challenging</option>
                <option value="4" className="bg-[#161D19]">Hard</option>
                <option value="5" className="bg-[#161D19]">Expert</option>
              </select>
            </div>

            <p className="mt-3 text-xs text-[#8E8A81]">
              <span className="text-[#C6A16E] font-medium">{filteredHikes.length}</span> of {hikes.length} hikes
            </p>
          </div>
        </div>

        {/* Hikes list */}
        <div className="flex-1 overflow-y-auto px-3 py-3 space-y-2">
          {isLoading ? (
            <div className="flex items-center justify-center gap-2 py-10 text-[#B8B4AA]">
              <div className="w-4 h-4 rounded-full border-2 border-[#C6A16E] border-t-transparent animate-spin" />
              <span className="text-sm">Loading hikes…</span>
            </div>
          ) : filteredHikes.length === 0 ? (
            <div className="text-center py-10">
              <Mountain className="w-8 h-8 text-[#8E8A81]/30 mx-auto mb-2" />
              <p className="text-sm text-[#8E8A81]">No hikes found</p>
            </div>
          ) : (
            filteredHikes.map((hike) => {
              const coords = hikeCoordinates.get(hike._id) || [27.7172, 85.324];
              const isSelected = selectedHike?._id === hike._id;
              return (
                <div
                  key={hike._id}
                  onClick={() => handleHikeClick(hike, coords)}
                  className={`rounded-xl p-3.5 cursor-pointer transition-all border group ${
                    isSelected
                      ? 'bg-[#C6A16E]/[0.08] border-[#C6A16E]/35'
                      : 'bg-[#161D19]/60 border-white/8 hover:border-[#C6A16E]/20 hover:bg-[#161D19]'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <h3 className={`font-semibold text-sm leading-snug ${
                      isSelected ? 'text-[#F5F3EE]' : 'text-[#B8B4AA] group-hover:text-[#F5F3EE]'
                    }`}>{hike.title}</h3>
                    <span className={`shrink-0 px-2 py-0.5 rounded-md text-[10px] font-semibold text-white ${getDifficultyColor(hike.difficulty)}`}>
                      {getDifficultyLabel(hike.difficulty)}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-[#8E8A81] mb-1.5">
                    <MapPin className="w-3 h-3 text-[#C6A16E] shrink-0" />
                    <span className="truncate">{hike.location}</span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-[#8E8A81]">
                    <span>{new Date(hike.date).toLocaleDateString()}</span>
                    <span className={hike.spotsLeft > 0 ? 'text-[#8FA68E]' : 'text-red-400'}>
                      {hike.spotsLeft > 0 ? `${hike.spotsLeft} spots left` : 'Full'}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* ── Map area ───────────────────────────────────────────────────── */}
      <div className="flex-1 relative m-2 rounded-2xl overflow-hidden" style={{ boxShadow: '0 4px 48px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.06)' }}>
        {/* Measure Distance Toolbar */}
        <div className="absolute top-4 right-4 z-[1000] flex flex-col gap-2 items-end">
          <button
            onClick={() => {
              const next = !measureActive;
              setMeasureActive(next);
              if (!next) clearMeasurement();
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-sm shadow-lg transition-all ${
              measureActive
                ? 'bg-[#C6A16E] text-[#0B0F0C] border border-[#C6A16E]'
                : 'bg-[#0D1210]/85 text-[#F5F3EE] border border-white/15 hover:border-[#C6A16E]/40 hover:text-[#C6A16E] backdrop-blur-md'
            }`}
          >
            <Ruler className="w-4 h-4" />
            {measureActive ? 'Measuring…' : 'Measure Distance'}
          </button>

          {measureActive && (
            <div className="bg-[#0D1210]/92 backdrop-blur-md border border-white/12 rounded-xl p-4 min-w-[224px] shadow-2xl">
              <p className="text-xs text-[#B8B4AA] mb-3 leading-relaxed">
                {!pointA
                  ? '1. Click the map to set Point A'
                  : !pointB
                  ? '2. Click the map to set Point B'
                  : 'Points set — click again to reset'}
              </p>

              <div className="space-y-2 mb-3">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-blue-500 border-2 border-white shadow shrink-0" />
                  <span className="text-xs text-[#B8B4AA] font-mono">
                    {pointA ? `${pointA[0].toFixed(4)}, ${pointA[1].toFixed(4)}` : '—'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-red-500 border-2 border-white shadow shrink-0" />
                  <span className="text-xs text-[#B8B4AA] font-mono">
                    {pointB ? `${pointB[0].toFixed(4)}, ${pointB[1].toFixed(4)}` : '—'}
                  </span>
                </div>
              </div>

              {routeLoading && (
                <div className="bg-[#C6A16E]/10 border border-[#C6A16E]/25 rounded-lg px-3 py-2.5 flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-[#C6A16E] border-t-transparent rounded-full animate-spin shrink-0" />
                  <p className="text-xs text-[#C6A16E] font-medium">Calculating trail…</p>
                </div>
              )}
              {routeError && !routeLoading && (
                <div className="bg-red-900/20 border border-red-700/30 rounded-lg px-3 py-2 text-center">
                  <p className="text-xs text-red-400">{routeError}</p>
                </div>
              )}
              {routeDistance !== null && !routeLoading && !routeError && (
                <div className="bg-[#C6A16E]/[0.08] border border-[#C6A16E]/25 rounded-lg px-3 py-3 text-center">
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-[#C6A16E] mb-1">Trail Distance</p>
                  <p className="text-2xl font-bold text-[#F5F3EE] font-heading">{formatDistance(routeDistance)}</p>
                </div>
              )}

              {(pointA || pointB) && (
                <button
                  onClick={clearMeasurement}
                  className="mt-3 w-full text-xs text-[#8E8A81] hover:text-red-400 transition py-1"
                >
                  Clear points
                </button>
              )}
            </div>
          )}
        </div>

        <MapContainer
          center={mapCenter}
          zoom={mapZoom}
          style={{ height: '100%', width: '100%', cursor: measureActive ? 'crosshair' : '' }}
          className="z-0"
        >
          <ChangeMapView center={mapCenter} zoom={mapZoom} focusPoints={selectedHikeFocusPoints} />
          {/* Dark tile from CartoDB — matches cinematic UI */}
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          />

          <DistanceMeasure
            active={measureActive}
            pointA={pointA}
            pointB={pointB}
            routeGeometry={routeGeometry}
            routeDistance={routeDistance}
            routeLoading={routeLoading}
            onPointSet={handleMeasurePoint}
          />

          {selectedTrailGeometry && selectedTrailGeometry.length > 1 && (
            <Polyline
              positions={selectedTrailGeometry}
              pathOptions={{ color: '#14b8a6', weight: 3, opacity: 0.8 }}
            >
              <Tooltip sticky>
                <span className="font-semibold">Selected hike trail</span>
              </Tooltip>
            </Polyline>
          )}
          
          {filteredHikes.map((hike) => {
            const coords = hikeCoordinates.get(hike._id) || [27.7172, 85.324];
            const isSelected = selectedHike?._id === hike._id;
            return (
              <Marker
                key={hike._id}
                position={coords}
                icon={isSelected ? selectedHikeMarkerIcon : hikeMarkerIcon}
                eventHandlers={{
                  click: () => handleHikeClick(hike, coords),
                }}
              >
                <Popup>
                  <div style={{ fontFamily: 'Inter, system-ui, sans-serif', minWidth: '180px' }}>
                    <h3 style={{ fontWeight: 700, fontSize: '13px', marginBottom: '4px', color: '#0B0F0C' }}>{hike.title}</h3>
                    <p style={{ fontSize: '11px', color: '#555', marginBottom: '6px' }}>{hike.location}</p>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: '10px', fontWeight: 600, padding: '2px 8px', borderRadius: '99px', color: 'white', background: '#C6A16E' }}>
                        {getDifficultyLabel(hike.difficulty)}
                      </span>
                      <span style={{ fontSize: '11px', color: '#8FA68E', fontWeight: 600 }}>{hike.spotsLeft} spots</span>
                    </div>
                  </div>
                </Popup>
              </Marker>
            );
          })}

          {/* Hotel connector lines from trail to marker */}
          {selectedHikeHotels.map((hotel) => {
            if (!hotel.nearestTrailPoint) return null;
            return (
              <Polyline
                key={`hotel-connector-${hotel._id}`}
                positions={[hotel.nearestTrailPoint, hotel.position]}
                pathOptions={{ color: '#0f766e', weight: 1.5, opacity: 0.6, dashArray: '4 4' }}
              />
            );
          })}

          {selectedHikeHotels.map((hotel) => (
            <Marker key={`hotel-${hotel._id}`} position={hotel.position} icon={hotelMarkerIcon}>
              <Popup>
                <div className="p-2 min-w-[160px]">
                  <h4 className="font-bold text-sm mb-1 flex items-center gap-1">
                    <BedDouble className="w-4 h-4 inline text-teal-600" /> {hotel.name}
                  </h4>
                  <p className="text-xs text-gray-600 mb-1">{hotel.location}</p>
                  {hotel.isApproximate && (
                    <p className="text-[10px] text-amber-600 italic">Approximate position along trail</p>
                  )}
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>

        {/* ── Selected Hike Details Panel ──────────────────────────────── */}
        {selectedHike && (
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 w-[420px] max-w-[calc(100%-2rem)] z-[999]">
            <div
              className="rounded-2xl overflow-hidden relative"
              style={{ background: 'rgba(13,18,16,0.96)', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 8px 40px rgba(0,0,0,0.7)' }}
            >
              {/* Close */}
              <button
                onClick={() => setSelectedHike(null)}
                className="absolute top-3 right-3 z-10 w-7 h-7 flex items-center justify-center rounded-lg bg-[#0B0F0C]/70 border border-white/15 text-[#8E8A81] hover:text-[#F5F3EE] transition-all"
              >
                <X className="w-3.5 h-3.5" />
              </button>

              {/* Cover image */}
              {selectedHike.imageUrl ? (
                <div className="relative h-36 overflow-hidden">
                  <img src={selectedHike.imageUrl} alt={selectedHike.title} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0D1210] via-[#0D1210]/40 to-transparent" />
                  <span className={`absolute top-3 left-3 px-2 py-0.5 rounded-md text-[11px] font-semibold text-white ${getDifficultyColor(selectedHike.difficulty)}`}>
                    {getDifficultyLabel(selectedHike.difficulty)}
                  </span>
                </div>
              ) : (
                <div className="h-1 w-full bg-gradient-to-r from-[#C6A16E]/60 via-[#E8D5B0]/30 to-transparent" />
              )}

              <div className="px-5 pb-5 pt-4">
                <div className="flex items-start gap-2 mb-2">
                  <h3 className="text-lg font-bold text-[#F5F3EE] font-heading leading-tight flex-1">
                    {selectedHike.title}
                  </h3>
                  {!selectedHike.imageUrl && (
                    <span className={`shrink-0 px-2 py-0.5 rounded-md text-[11px] font-semibold text-white ${getDifficultyColor(selectedHike.difficulty)}`}>
                      {getDifficultyLabel(selectedHike.difficulty)}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-1.5 text-sm text-[#B8B4AA] mb-2">
                  <MapPin className="w-3.5 h-3.5 text-[#C6A16E] shrink-0" />
                  {selectedHike.location}
                </div>

                {selectedHike.description && (
                  <p className="text-xs text-[#8E8A81] leading-relaxed line-clamp-2 mb-3">{selectedHike.description}</p>
                )}

                <div className="flex items-center justify-between py-2.5 border-t border-b border-white/8 mb-3 text-sm">
                  <span className="text-[#B8B4AA]">
                    {new Date(selectedHike.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                  </span>
                  <span className={`font-semibold ${selectedHike.spotsLeft > 0 ? 'text-[#8FA68E]' : 'text-red-400'}`}>
                    {selectedHike.spotsLeft > 0 ? `${selectedHike.spotsLeft} spots left` : 'Full'}
                  </span>
                </div>

                {selectedHikeHotels.length > 0 && (
                  <div className="mb-3">
                    <h4 className="text-[10px] font-semibold uppercase tracking-widest text-[#C6A16E] mb-2 flex items-center gap-1.5">
                      <BedDouble className="w-3.5 h-3.5" />
                      Accommodation ({selectedHikeHotels.length})
                    </h4>
                    <div className="space-y-1.5 max-h-24 overflow-y-auto">
                      {selectedHikeHotels.map((hotel) => (
                        <div key={hotel._id} className="flex items-center gap-2 rounded-lg bg-[#111714] border border-white/6 px-2.5 py-1.5">
                          <Hotel className="w-3.5 h-3.5 text-[#8FA68E] shrink-0" />
                          <div className="min-w-0 flex-1">
                            <p className="text-xs text-[#F5F3EE] font-medium truncate">{hotel.name}</p>
                            <p className="text-[10px] text-[#8E8A81] truncate">{hotel.location}</p>
                          </div>
                          {hotel.isApproximate && <span className="text-[9px] text-amber-400 shrink-0">~</span>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <button
                  onClick={() => setConnectHike(selectedHike)}
                  className="btn-primary w-full py-2.5 rounded-xl font-semibold text-sm"
                >
                  View Details &amp; Book
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {connectHike && (
        <ConnectModal
          open={!!connectHike}
          hike={connectHike}
          onClose={() => setConnectHike(null)}
        />
      )}
    </div>
  );
};

// #endregion Component

// #region Exports
export default Maps;
// #endregion Exports
