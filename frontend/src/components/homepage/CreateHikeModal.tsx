import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Users, MapPin, Navigation } from "lucide-react";
import DOMPurify from "dompurify";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import { createHike } from "../../services/hikes";
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';

// Fix for default marker icons in React-Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const startIcon = L.divIcon({
  className: '',
  html: `<div style="background:#22c55e;width:18px;height:18px;border-radius:50%;border:3px solid white;box-shadow:0 0 6px rgba(0,0,0,0.5);display:flex;align-items:center;justify-content:center"><span style="color:white;font-size:9px;font-weight:700">S</span></div>`,
  iconSize: [18, 18],
  iconAnchor: [9, 9],
});

const endIcon = L.divIcon({
  className: '',
  html: `<div style="background:#ef4444;width:18px;height:18px;border-radius:50%;border:3px solid white;box-shadow:0 0 6px rgba(0,0,0,0.5);display:flex;align-items:center;justify-content:center"><span style="color:white;font-size:9px;font-weight:700">E</span></div>`,
  iconSize: [18, 18],
  iconAnchor: [9, 9],
});

type CreateHikeModalProps = {
  open: boolean;
  onClose: () => void;
};

const difficultyLabels = ["Very Easy", "Easy", "Moderate", "Hard", "Expert"];

// Component to handle map clicks
const LocationPicker: React.FC<{ onLocationSelect: (lat: number, lng: number) => void }> = ({ onLocationSelect }) => {
  useMapEvents({
    click: (e) => { onLocationSelect(e.latlng.lat, e.latlng.lng); },
  });
  return null;
};

type LatLng = { lat: number; lng: number };

const CreateHikeModal: React.FC<CreateHikeModalProps> = ({ open, onClose }) => {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const { showSuccess, showError } = useToast();
  const [title, setTitle] = useState("");
  const [location, setLocation] = useState("");
  const [startPoint, setStartPoint] = useState<LatLng | null>(null);
  const [endPoint, setEndPoint] = useState<LatLng | null>(null);
  const [activePoint, setActivePoint] = useState<'start' | 'end'>('start');
  const [date, setDate] = useState("");
  const [difficulty, setDifficulty] = useState<number>(1);
  const [spotsLeft, setSpotsLeft] = useState<number>(10);
  const [imagePreview, setImagePreview] = useState<string>("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [description, setDescription] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(true);
  const [isHikeDetailsExpanded, setIsHikeDetailsExpanded] = useState(false);

  const convertFileToBase64 = (file: File): Promise<string> =>
    new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
    });

  const handleImageChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      setImageFile(null);
      setImagePreview("");
      return;
    }
    setImageFile(file);
    try {
      const preview = await convertFileToBase64(file);
      setImagePreview(preview);
    } catch {
      setImagePreview("");
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!title || !location || !date) {
      setMessage({ type: "error", text: "Please fill in all required fields (Title, Location, Date)." });
      return;
    }
    setIsCreating(true);
    setMessage(null);
    try {
      let imageBase64: string | undefined;
      if (imageFile) imageBase64 = await convertFileToBase64(imageFile);
      const token = localStorage.getItem("travelBuddyToken");
      if (!token) {
        setMessage({ type: "error", text: "You must be logged in to create a hike." });
        return;
      }
      const payload = {
        title: DOMPurify.sanitize(title),
        location: DOMPurify.sanitize(location),
        coordinates: startPoint ?? undefined,
        startPoint: startPoint ?? undefined,
        endPoint: endPoint ?? undefined,
        date,
        difficulty,
        spotsLeft,
        imageUrl: imageBase64,
        description: description ? DOMPurify.sanitize(description) : undefined,
      };
      await createHike(payload, token);
      setMessage({ type: "success", text: "Hike created successfully!" });
      setTitle("");
      setLocation("");
      setStartPoint(null);
      setEndPoint(null);
      setActivePoint('start');
      setDate("");
      setDifficulty(1);
      setSpotsLeft(10);
      setImageFile(null);
      setImagePreview("");
      setDescription("");
      setTimeout(() => {
        onClose();
        setMessage(null);
      }, 1500);
    } catch (err: any) {
      if (err?.message === 'AUTH_EXPIRED') {
        logout();
        navigate('/login');
        showError('Your session has expired. Please log in again.');
      } else {
        const errorMessage = err?.message || "Unable to create hike. Please try again.";
        setMessage({ type: "error", text: errorMessage });
      }
    } finally {
      setIsCreating(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="glass-card rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 glass-nav px-8 py-6 flex items-center justify-between rounded-t-2xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg glass-button-dark flex items-center justify-center">
              <Users className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">Create Hike</h2>
              <p className="text-sm text-gray-200">Organize and join group hiking events</p>
            </div>
          </div>
          <button type="button" onClick={() => { onClose(); setMessage(null); setIsDescriptionExpanded(true); setIsHikeDetailsExpanded(false); }} className="px-4 py-2 text-gray-200 hover:text-white glass-button rounded-lg font-medium transition-colors">
            Hide
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8">
          {message && (
            <div className={`mb-6 rounded-lg px-4 py-3 text-sm ${message.type === "success" ? "glass-strong text-black" : "glass-dark text-white"}`}>{message.text}</div>
          )}

          <div className="mb-6 glass-card rounded-xl overflow-hidden">
            <button type="button" onClick={() => setIsDescriptionExpanded(!isDescriptionExpanded)} className="w-full px-6 py-4 flex items-center justify-between hover:bg-white/10 transition-colors">
              <div className="flex items-center gap-3">
                <Users className="w-5 h-5 text-white" />
                <span className="font-semibold text-white">Description</span>
              </div>
              <span className="text-gray-300">{isDescriptionExpanded ? "▲" : "▼"}</span>
            </button>
            {isDescriptionExpanded && (
              <div className="px-6 pb-6 space-y-4 border-t border-white/20">
                <div>
                  <label className="block text-sm font-medium text-white mb-2">Hike Title <span className="text-white">*</span></label>
                  <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Give your hike a catchy title." className="w-full px-4 py-2.5 glass-input rounded-lg focus:outline-none focus:ring-2 focus:ring-white text-white placeholder-gray-300" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-white mb-2">Description</label>
                  <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Describe the hike, its route, start time and location, what to bring." rows={5} className="w-full px-4 py-2.5 glass-input rounded-lg focus:outline-none focus:ring-2 focus:ring-white resize-y text-white placeholder-gray-300" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-white mb-3">Difficulty <span className="text-white">*</span></label>
                  <div className="relative">
                    <input type="range" min="1" max="5" value={difficulty} onChange={(e) => setDifficulty(Number(e.target.value))} className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-black" />
                    <div className="flex justify-between mt-2">
                      {[1, 2, 3, 4, 5].map((num) => (
                        <button key={num} type="button" onClick={() => setDifficulty(num)} className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-xs font-medium transition-all ${difficulty === num ? "glass-button-dark border-white text-white scale-110" : "glass border-white/30 text-white hover:border-white/50"}`}>{num}</button>
                      ))}
                    </div>
                    <div className="mt-2 text-right">
                      <span className="inline-block px-3 py-1 glass-strong text-black text-sm font-medium rounded-full">{difficultyLabels[difficulty - 1]}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="mb-6 glass-card rounded-xl overflow-hidden">
            <button type="button" onClick={() => setIsHikeDetailsExpanded(!isHikeDetailsExpanded)} className="w-full px-6 py-4 flex items-center justify-between hover:bg-white/10 transition-colors">
              <div className="flex items-center gap-3">
                <MapPin className="w-5 h-5 text-white" />
                <span className="font-semibold text-white">Hike Details</span>
              </div>
              <span className="text-gray-300">{isHikeDetailsExpanded ? "▲" : "▼"}</span>
            </button>
            {isHikeDetailsExpanded && (
              <div className="px-6 pb-6 space-y-4 border-t border-white/20">
                <div>
                  <label className="block text-sm font-medium text-white mb-2">Location <span className="text-white">*</span></label>
                  <input type="text" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="e.g., Nagarkot View Tower, Kathmandu Valley" className="w-full px-4 py-2.5 glass-input rounded-lg focus:outline-none focus:ring-2 focus:ring-white text-white placeholder-gray-300" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-white mb-2">Trail Start &amp; End Points</label>
                  {/* Toggle buttons */}
                  <div className="flex gap-2 mb-3">
                    <button
                      type="button"
                      onClick={() => setActivePoint('start')}
                      className={`flex-1 py-2 rounded-lg text-sm font-semibold transition border-2 ${
                        activePoint === 'start'
                          ? 'bg-green-500/30 border-green-400 text-green-300'
                          : 'glass border-white/20 text-gray-300 hover:border-white/40'
                      }`}
                    >
                      {startPoint ? `✅ Start (${startPoint.lat.toFixed(4)}, ${startPoint.lng.toFixed(4)})` : '📍 Set Start Point'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setActivePoint('end')}
                      className={`flex-1 py-2 rounded-lg text-sm font-semibold transition border-2 ${
                        activePoint === 'end'
                          ? 'bg-red-500/30 border-red-400 text-red-300'
                          : 'glass border-white/20 text-gray-300 hover:border-white/40'
                      }`}
                    >
                      {endPoint ? `✅ End (${endPoint.lat.toFixed(4)}, ${endPoint.lng.toFixed(4)})` : '🏁 Set End Point'}
                    </button>
                  </div>
                  <p className="text-xs text-gray-300 mb-2">
                    {activePoint === 'start' ? '👇 Click on the map to set the trail start point' : '👇 Click on the map to set the trail end point'}
                  </p>
                  <div className="glass rounded-lg overflow-hidden border border-white/20" style={{ height: '300px' }}>
                    <MapContainer
                      center={startPoint ? [startPoint.lat, startPoint.lng] : [27.7172, 85.324]}
                      zoom={startPoint || endPoint ? 13 : 8}
                      style={{ height: '100%', width: '100%' }}
                    >
                      <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                      />
                      <LocationPicker
                        onLocationSelect={(lat, lng) => {
                          if (activePoint === 'start') setStartPoint({ lat, lng });
                          else setEndPoint({ lat, lng });
                        }}
                      />
                      {startPoint && <Marker position={[startPoint.lat, startPoint.lng]} icon={startIcon} />}
                      {endPoint && <Marker position={[endPoint.lat, endPoint.lng]} icon={endIcon} />}
                    </MapContainer>
                  </div>
                  <div className="flex gap-4 mt-2 text-xs text-gray-300">
                    <span className="flex items-center gap-1"><span className="inline-block w-3 h-3 rounded-full bg-green-500" /> Start</span>
                    <span className="flex items-center gap-1"><span className="inline-block w-3 h-3 rounded-full bg-red-500" /> End</span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-white mb-2">Date <span className="text-white">*</span></label>
                    <input type="date" value={date} onChange={(e) => setDate(e.target.value)} min={new Date().toISOString().split("T")[0]} className="w-full px-4 py-2.5 glass-input rounded-lg focus:outline-none focus:ring-2 focus:ring-white text-white" required />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-white mb-2">Spots Available</label>
                    <input type="number" value={spotsLeft} onChange={(e) => setSpotsLeft(Number(e.target.value))} min="0" className="w-full px-4 py-2.5 glass-input rounded-lg focus:outline-none focus:ring-2 focus:ring-white text-white" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-white mb-2">Upload Photo (optional)</label>
                  <input type="file" accept="image/*" onChange={handleImageChange} className="w-full px-4 py-2.5 glass-input rounded-lg focus:outline-none focus:ring-2 focus:ring-white text-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:glass-button-dark file:text-white hover:file:opacity-80 file:cursor-pointer" />
                  {imagePreview && (
                    <div className="mt-3">
                      <p className="text-xs text-gray-300 mb-2">Preview:</p>
                      <div className="relative w-full h-48 rounded-lg overflow-hidden glass border border-white/20">
                        <img src={imagePreview} alt="Hike preview" className="w-full h-full object-cover" />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-end">
            <button type="submit" disabled={isCreating} className="px-8 py-3 glass-button-dark rounded-full font-semibold disabled:opacity-60 transition-colors shadow-lg text-white">
              {isCreating ? "Creating..." : "Create Hike"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateHikeModal;
