import React, { useEffect, useState, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { getHikes } from '../services/hikes';
import { MapPin, Search, Filter, X } from 'lucide-react';
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
  coordinates?: {
    lat: number;
    lng: number;
  };
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

// Get coordinates from hike data or use default
const getHikeCoordinates = (hike: Hike): [number, number] => {
  // Use actual coordinates if available
  if (hike.coordinates && hike.coordinates.lat && hike.coordinates.lng) {
    return [hike.coordinates.lat, hike.coordinates.lng];
  }
  
  // Default to Kathmandu if no coordinates
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
    const matchesSearch = hike.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          hike.location.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDifficulty = difficultyFilter === 'all' || hike.difficulty.toString() === difficultyFilter;
    return matchesSearch && matchesDifficulty;
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
      <div className="w-96 glass-card flex flex-col overflow-hidden">
        {/* Search and Filters */}
        <div className="p-4 space-y-3 border-b border-white/20">
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <MapPin className="w-6 h-6" />
            Hikes Map
          </h2>
          
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search hikes, locations..."
              className="w-full pl-10 pr-3 py-2 rounded-lg glass-input text-white placeholder:text-gray-400"
            />
          </div>

          {/* Difficulty Filter */}
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-300" />
            <select
              value={difficultyFilter}
              onChange={(e) => setDifficultyFilter(e.target.value)}
              className="flex-1 px-3 py-2 rounded-lg glass-input text-white"
            >
              <option value="all">All Difficulties</option>
              <option value="1">Easy</option>
              <option value="2">Moderate</option>
              <option value="3">Challenging</option>
              <option value="4">Hard</option>
              <option value="5">Expert</option>
            </select>
          </div>

          <div className="text-sm text-gray-300">
            Showing {filteredHikes.length} of {hikes.length} hikes
          </div>
        </div>

        {/* Hikes List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {isLoading ? (
            <div className="text-center py-8 text-gray-300">Loading hikes...</div>
          ) : filteredHikes.length === 0 ? (
            <div className="text-center py-8 text-gray-400">No hikes found</div>
          ) : (
            filteredHikes.map((hike) => {
              const coords = hikeCoordinates.get(hike._id) || [27.7172, 85.324];
              return (
                <div
                  key={hike._id}
                  onClick={() => handleHikeClick(hike, coords)}
                  className={`glass-card rounded-lg p-4 cursor-pointer transition hover:opacity-90 ${
                    selectedHike?._id === hike._id ? 'ring-2 ring-white' : ''
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-semibold text-white">{hike.title}</h3>
                    <span className={`px-2 py-1 rounded-full text-xs text-white ${getDifficultyColor(hike.difficulty)}`}>
                      {getDifficultyLabel(hike.difficulty)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-300 mb-2">
                    <MapPin className="w-3 h-3" />
                    <span>{hike.location}</span>
                  </div>
                  <div className="text-xs text-gray-400">
                    {new Date(hike.date).toLocaleDateString()} • {hike.spotsLeft} spots left
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Map Area */}
      <div className="flex-1 relative">
        <MapContainer
          center={mapCenter}
          zoom={mapZoom}
          style={{ height: '100%', width: '100%' }}
          className="z-0"
        >
          <ChangeMapView center={mapCenter} zoom={mapZoom} />
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
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
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 glass-card rounded-xl p-6 max-w-md w-full mx-4 shadow-2xl z-10">
            <button
              onClick={() => setSelectedHike(null)}
              className="absolute top-4 right-4 p-1 hover:bg-white/20 rounded-full transition"
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
            
            <div className="flex items-start justify-between mb-3">
              <h3 className="text-xl font-bold text-white">{selectedHike.title}</h3>
              <span className={`px-3 py-1 rounded-full text-xs text-white ${getDifficultyColor(selectedHike.difficulty)}`}>
                {getDifficultyLabel(selectedHike.difficulty)}
              </span>
            </div>
            
            <div className="flex items-center gap-2 text-sm text-gray-300 mb-3">
              <MapPin className="w-4 h-4" />
              <span>{selectedHike.location}</span>
            </div>
            
            {selectedHike.description && (
              <p className="text-sm text-gray-300 mb-4">{selectedHike.description}</p>
            )}
            
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-400">
                {new Date(selectedHike.date).toLocaleDateString('en-US', {
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric'
                })}
              </span>
              <span className="text-gray-400">{selectedHike.spotsLeft} spots left</span>
            </div>
            
            <button
              onClick={() => setConnectHike(selectedHike)}
              className="w-full mt-4 py-2 px-4 rounded-lg glass-button-dark text-white font-medium hover:opacity-90 transition"
            >
              View Details
            </button>
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
