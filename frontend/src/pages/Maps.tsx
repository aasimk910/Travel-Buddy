import React, { useEffect, useState, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents, Polyline, Tooltip } from 'react-leaflet';
import { getHikes } from '../services/hikes';
import { MapPin, Search, Filter, X, Ruler, Navigation } from 'lucide-react';
import L from 'leaflet';
import ConnectModal from '../components/hikes/ConnectModal';

// Fix for default marker icons in React-Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

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
}

// Component to handle map center changes
const ChangeMapView: React.FC<{ center: [number, number]; zoom: number }> = ({ center, zoom }) => {
  const map = useMap();
  map.setView(center, zoom);
  return null;
};

// Custom icons for distance measurement points
const pointAIcon = L.divIcon({
  className: '',
  html: `<div style="background:#3b82f6;width:16px;height:16px;border-radius:50%;border:3px solid white;box-shadow:0 0 6px rgba(0,0,0,0.5);"></div>`,
  iconSize: [16, 16],
  iconAnchor: [8, 8],
});

const pointBIcon = L.divIcon({
  className: '',
  html: `<div style="background:#ef4444;width:16px;height:16px;border-radius:50%;border:3px solid white;box-shadow:0 0 6px rgba(0,0,0,0.5);"></div>`,
  iconSize: [16, 16],
  iconAnchor: [8, 8],
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
              Trail distance: {routeDistance !== null ? formatDistance(routeDistance) : '…'}
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

  const clearMeasurement = () => {
    setPointA(null);
    setPointB(null);
    setRouteGeometry(null);
    setRouteDistance(null);
    setRouteError(null);
  };

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

  // Create a mapping of hike IDs to coordinates
  const hikeCoordinates = useMemo(() => {
    const coordMap = new Map<string, [number, number]>();
    hikes.forEach(hike => {
      coordMap.set(hike._id, getHikeCoordinates(hike));
    });
    return coordMap;
  }, [hikes]);

  useEffect(() => {
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

  const getDifficultyLabel = (difficulty: number) => {
    const labels = ['', 'Easy', 'Moderate', 'Challenging', 'Hard', 'Expert'];
    return labels[difficulty] || 'Unknown';
  };

  const handleHikeClick = (hike: Hike, coords: [number, number]) => {
    setSelectedHike(hike);
    setMapCenter(coords);
    setMapZoom(13);
  };

  return (
    <div className="h-[calc(100vh-64px)] flex">
      {/* Sidebar */}
      <div className="w-96 flex flex-col overflow-hidden">
        {/* Search and Filters */}
        <div className="m-3 p-4 space-y-3 rounded-xl glass-card">
          <h2 className="text-2xl font-bold text-glass flex items-center gap-2">
            <MapPin className="w-6 h-6" />
            Hikes Map
          </h2>
          
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-glass-dim" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search hikes, locations..."
              className="w-full pl-10 pr-3 py-2 rounded-lg glass-input text-glass placeholder:text-glass-dim"
            />
          </div>

          {/* Difficulty Filter */}
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-glass-light" />
            <select
              value={difficultyFilter}
              onChange={(e) => setDifficultyFilter(e.target.value)}
              className="flex-1 px-3 py-2 rounded-lg glass-input text-white [color-scheme:dark]"
            >
              <option value="all" className="bg-gray-900 text-white">All Difficulties</option>
              <option value="1" className="bg-gray-900 text-white">Easy</option>
              <option value="2" className="bg-gray-900 text-white">Moderate</option>
              <option value="3" className="bg-gray-900 text-white">Challenging</option>
              <option value="4" className="bg-gray-900 text-white">Hard</option>
              <option value="5" className="bg-gray-900 text-white">Expert</option>
            </select>
          </div>

          <div className="text-sm text-glass-dim">
            Showing {filteredHikes.length} of {hikes.length} hikes
          </div>
        </div>

        {/* Hikes List */}
        <div className="flex-1 overflow-y-auto px-3 py-2 space-y-3">
          {isLoading ? (
            <div className="text-center py-8 text-glass-light">Loading hikes...</div>
          ) : filteredHikes.length === 0 ? (
            <div className="text-center py-8 text-glass-dim">No hikes found</div>
          ) : (
            filteredHikes.map((hike) => {
              const coords = hikeCoordinates.get(hike._id) || [27.7172, 85.324];
              return (
                <div
                  key={hike._id}
                  onClick={() => handleHikeClick(hike, coords)}
                  className={`glass-card rounded-xl p-4 cursor-pointer transition-all ${
                    selectedHike?._id === hike._id ? 'glass-strong' : 'glass-button hover:glass-strong'
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-semibold text-glass">{hike.title}</h3>
                    <span className={`px-2 py-1 rounded-full text-xs text-white ${getDifficultyColor(hike.difficulty)}`}>
                      {getDifficultyLabel(hike.difficulty)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-glass-light mb-2">
                    <MapPin className="w-3 h-3" />
                    <span>{hike.location}</span>
                  </div>
                  <div className="text-xs text-glass-dim">
                    {new Date(hike.date).toLocaleDateString()} • {hike.spotsLeft} spots left
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Map Area */}
      <div className="flex-1 relative m-3 rounded-xl overflow-hidden glass-card">
        {/* Measure Distance Toolbar */}
        <div className="absolute top-4 right-4 z-10 flex flex-col gap-2 items-end">
          <button
            onClick={() => {
              const next = !measureActive;
              setMeasureActive(next);
              if (!next) clearMeasurement();
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm shadow-lg transition ${
              measureActive
                ? 'bg-indigo-600 text-white'
                : 'glass text-white hover:opacity-90'
            }`}
          >
            <Ruler className="w-4 h-4" />
            {measureActive ? 'Measuring…' : 'Measure Distance'}
          </button>

          {measureActive && (
            <div className="glass-strong rounded-xl p-4 min-w-[220px]">
              <p className="text-xs text-gray-300 mb-2">
                {!pointA
                  ? '1. Click the map to set Point A'
                  : !pointB
                  ? '2. Click the map to set Point B'
                  : 'Points set — click again to reset'}
              </p>

              <div className="flex gap-3 text-sm mb-3">
                <div className="flex items-center gap-1">
                  <span className="inline-block w-3 h-3 rounded-full bg-blue-500 border-2 border-white shadow" />
                  <span className="text-gray-300">
                    {pointA ? `${pointA[0].toFixed(4)}, ${pointA[1].toFixed(4)}` : '—'}
                  </span>
                </div>
              </div>
              <div className="flex gap-3 text-sm mb-3">
                <div className="flex items-center gap-1">
                  <span className="inline-block w-3 h-3 rounded-full bg-red-500 border-2 border-white shadow" />
                  <span className="text-gray-300">
                    {pointB ? `${pointB[0].toFixed(4)}, ${pointB[1].toFixed(4)}` : '—'}
                  </span>
                </div>
              </div>

              {routeLoading && (
                <div className="bg-indigo-500/20 border border-indigo-400/40 rounded-lg px-3 py-2 text-center">
                  <p className="text-xs text-indigo-300 font-medium uppercase tracking-wide">Calculating trail…</p>
                  <div className="mt-1 h-5 flex items-center justify-center">
                    <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                  </div>
                </div>
              )}
              {routeError && !routeLoading && (
                <div className="bg-red-500/20 border border-red-400/40 rounded-lg px-3 py-2 text-center">
                  <p className="text-xs text-red-300">{routeError}</p>
                </div>
              )}
              {routeDistance !== null && !routeLoading && !routeError && (
                <div className="bg-indigo-500/20 border border-indigo-400/40 rounded-lg px-3 py-2 text-center">
                  <p className="text-xs text-indigo-300 font-medium uppercase tracking-wide">Trail Distance</p>
                  <p className="text-xl font-bold text-white">{formatDistance(routeDistance)}</p>
                </div>
              )}

              {(pointA || pointB) && (
                <button
                  onClick={clearMeasurement}
                  className="mt-3 w-full text-xs text-gray-400 hover:text-red-400 transition"
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
          <ChangeMapView center={mapCenter} zoom={mapZoom} />
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
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
          
          {filteredHikes.map((hike) => {
            const coords = hikeCoordinates.get(hike._id) || [27.7172, 85.324];
            return (
              <Marker
                key={hike._id}
                position={coords}
                eventHandlers={{
                  click: () => handleHikeClick(hike, coords),
                }}
              >
                <Popup>
                  <div className="p-2">
                    <h3 className="font-bold text-sm mb-1">{hike.title}</h3>
                    <p className="text-xs text-gray-600 mb-1">{hike.location}</p>
                    <div className="flex items-center justify-between text-xs">
                      <span className={`px-2 py-0.5 rounded-full text-white ${getDifficultyColor(hike.difficulty)}`}>
                        {getDifficultyLabel(hike.difficulty)}
                      </span>
                      <span className="text-gray-600">{hike.spotsLeft} spots</span>
                    </div>
                  </div>
                </Popup>
              </Marker>
            );
          })}
        </MapContainer>

        {/* Selected Hike Details Popup */}
        {selectedHike && (
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 max-w-md w-full mx-4 z-10"
               style={{ filter: 'drop-shadow(0 8px 32px rgba(0,0,0,0.7))' }}>
            <div className="rounded-xl p-6 shadow-2xl"
                 style={{ background: 'rgba(10,15,30,0.92)', border: '1px solid rgba(255,255,255,0.18)', backdropFilter: 'blur(16px)' }}>
            <button
              onClick={() => setSelectedHike(null)}
              className="absolute top-4 right-4 p-1 rounded-full bg-white/10 hover:bg-white/25 transition"
            >
              <X className="w-4 h-4 text-white" />
            </button>
            
            {selectedHike.imageUrl && (
              <img 
                src={selectedHike.imageUrl} 
                alt={selectedHike.title}
                className="w-full h-40 object-cover rounded-lg mb-4"
              />
            )}
            
            <div className="flex items-start justify-between mb-3 pr-6">
              <h3 className="text-xl font-bold text-white">{selectedHike.title}</h3>
              <span className={`ml-2 shrink-0 px-3 py-1 rounded-full text-xs font-semibold text-white ${getDifficultyColor(selectedHike.difficulty)}`}>
                {getDifficultyLabel(selectedHike.difficulty)}
              </span>
            </div>
            
            <div className="flex items-center gap-2 text-sm text-gray-300 mb-3">
              <MapPin className="w-4 h-4 text-emerald-400 shrink-0" />
              <span className="text-gray-200">{selectedHike.location}</span>
            </div>
            
            {selectedHike.description && (
              <p className="text-sm text-gray-300 mb-4 leading-relaxed">{selectedHike.description}</p>
            )}
            
            <div className="flex items-center justify-between text-sm py-3 border-t border-white/10">
              <span className="text-white font-medium">
                {new Date(selectedHike.date).toLocaleDateString('en-US', {
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric'
                })}
              </span>
              <span className="text-emerald-400 font-medium">{selectedHike.spotsLeft} spots left</span>
            </div>
            
            <button
              onClick={() => setConnectHike(selectedHike)}
              className="w-full mt-3 py-2.5 px-4 rounded-lg text-white font-semibold transition"
              style={{ background: 'linear-gradient(135deg, #2563eb, #22c55e)' }}
            >
              View Details
            </button>
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

export default Maps;
