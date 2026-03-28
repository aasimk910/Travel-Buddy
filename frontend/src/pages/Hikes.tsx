// src/pages/Hikes.tsx
import React, { useMemo, useState, useEffect } from "react";
import { useScrollReveal } from "../hooks/useScrollReveal";
import { Link, useNavigate } from "react-router-dom";
import {
  Map,
  Globe2,
  Search,
  SlidersHorizontal,
  CalendarDays,
  Users,
  User,
  Mountain,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { getHikes } from "../services/hikes";
import ConnectModal from "../components/hikes/ConnectModal";
import CreateHikeModal from "../components/homepage/CreateHikeModal";

type Hike = {
  _id: string;
  title: string;
  location: string;
  difficulty: number; // 1–5
  date: string; // ISO date string
  spotsLeft: number;
  imageUrl?: string;
  description?: string;
  startPoint?: { lat: number; lng: number };
  endPoint?: { lat: number; lng: number };
  hotels?: Array<{
    _id: string;
    name: string;
    location: string;
  }>;
  createdAt?: string;
  updatedAt?: string;
};

// Helper function to format date
const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

// Helper function to extract place from location (fallback)
const extractPlace = (location: string): string => {
  // Try to extract place from common patterns
  if (location.toLowerCase().includes("kathmandu")) return "Kathmandu Valley";
  if (location.toLowerCase().includes("pokhara")) return "Pokhara";
  if (location.toLowerCase().includes("annapurna")) return "Annapurna Region";
  if (location.toLowerCase().includes("kavre") || location.toLowerCase().includes("dhulikhel")) return "Kavre";
  // Default fallback
  return "Nepal";
};

const difficultyLabel = (value: number) => `Difficulty: ${value}/5`;

const Hikes: React.FC = () => {
  const revealRef = useScrollReveal();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [search, setSearch] = useState("");
  const [difficulty, setDifficulty] = useState<
    "all" | "1" | "2" | "3" | "4" | "5"
  >("all");
  const [sortBy, setSortBy] = useState<"dateDesc" | "dateAsc">("dateDesc");
  const [place, setPlace] = useState<string>("all");
  const [hikes, setHikes] = useState<Hike[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [connectHike, setConnectHike] = useState<Hike | null>(null);
  const [isCreateHikeModalOpen, setIsCreateHikeModalOpen] = useState(false);

  // Fetch hikes from API
  useEffect(() => {
    const fetchHikes = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const fetched = await getHikes();
        setHikes(fetched);
      } catch (err) {
        console.error("Error fetching hikes:", err);
        setError(
          err instanceof Error
            ? err.message
            : "Unable to load hikes. Please try again."
        );
      } finally {
        setIsLoading(false);
      }
    };

    fetchHikes();
  }, []);

  // unique list of places inside Nepal
  const places = useMemo(
    () => Array.from(new Set(hikes.map((hike) => extractPlace(hike.location)))),
    [hikes]
  );

  const filteredHikes = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    let list = hikes.filter((h) => new Date(h.date) >= today);

    if (search.trim()) {
      const term = search.toLowerCase();
      list = list.filter(
        (hike) =>
          hike.title.toLowerCase().includes(term) ||
          hike.location.toLowerCase().includes(term) ||
          extractPlace(hike.location).toLowerCase().includes(term)
      );
    }

    if (difficulty !== "all") {
      const diff = Number(difficulty);
      list = list.filter((hike) => hike.difficulty === diff);
    }

    if (place !== "all") {
      list = list.filter((hike) => extractPlace(hike.location) === place);
    }

    list.sort((a, b) => {
      const aTime = new Date(a.date).getTime();
      const bTime = new Date(b.date).getTime();
      return sortBy === "dateDesc" ? bTime - aTime : aTime - bTime;
    });

    return list;
  }, [hikes, search, difficulty, place, sortBy]);

  return (
    <div ref={revealRef}>
      {/* Main content */}
        {/* Hero + filters */}
        <section className="py-8 lg:py-10">
          <div className="w-full px-4 sm:px-6 lg:px-12 xl:px-16">
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div>
                <p className="inline-flex items-center gap-2 rounded-full glass-strong px-3 py-1 text-xs font-medium text-black mb-3 reveal reveal-fade">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span>Hikes in Nepal • Find your next trail buddy</span>
                </p>
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-semibold text-white mb-2 reveal reveal-up delay-100">
                  Join group hikes in the hills and mountains of Nepal
                </h1>
                <p className="text-sm sm:text-base text-gray-200 max-w-2xl reveal reveal-fade delay-200">
                  Explore classic day hikes around Kathmandu and Pokhara, or
                  join short treks in the Annapurna region. Filter by difficulty
                  and place to find hikes that fit you.
                </p>
              </div>

              {/* Place filter */}
              <div className="mt-2 md:mt-0">
                <label className="block text-xs font-medium text-gray-300 mb-1">
                  Place
                </label>
                <div className="inline-flex items-center gap-2 rounded-full glass-strong px-3 py-1.5 shadow-sm">
                  <Globe2 className="w-4 h-4 text-gray-300" />
                  <select
                    value={place}
                    onChange={(e) => setPlace(e.target.value)}
                    className="bg-transparent border-none text-sm text-white placeholder:text-gray-300 focus:outline-none focus:ring-0 pr-3 [color-scheme:dark]"
                  >
                    <option value="all" className="bg-gray-900 text-white">All places</option>
                    {places.map((p) => (
                      <option key={p} value={p} className="bg-gray-900 text-white">
                        {p}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Search + filters row */}
            <div className="mt-6 space-y-3 reveal reveal-up delay-300">
              {/* Search */}
              <div className="relative">
                <Search className="w-4 h-4 text-gray-300 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search hikes, viewpoints, or trails in Nepal…"
                  className="w-full rounded-xl glass-input py-2.5 pl-9 pr-3 text-sm text-white placeholder:text-gray-300 focus:outline-none focus:ring-1 focus:ring-white"
                />
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-wrap gap-3 items-center">
                  {/* Difficulty */}
                  <div>
                    <label className="block text-xs font-medium text-gray-300 mb-1">
                      Difficulty
                    </label>
                    <select
                      value={difficulty}
                      onChange={(e) =>
                        setDifficulty(e.target.value as typeof difficulty)
                      }
                      className="rounded-lg glass-input px-3 py-2 text-xs sm:text-sm text-white placeholder:text-gray-300 focus:outline-none focus:ring-1 focus:ring-white [color-scheme:dark]"
                    >
                      <option value="all" className="bg-gray-900 text-white">All difficulties</option>
                      <option value="1" className="bg-gray-900 text-white">1/5 – Very easy</option>
                      <option value="2" className="bg-gray-900 text-white">2/5 – Easy</option>
                      <option value="3" className="bg-gray-900 text-white">3/5 – Moderate</option>
                      <option value="4" className="bg-gray-900 text-white">4/5 – Hard</option>
                      <option value="5" className="bg-gray-900 text-white">5/5 – Expert</option>
                    </select>
                  </div>

                  {/* Sort by */}
                  <div>
                    <label className="block text-xs font-medium text-gray-300 mb-1">
                      Sort by
                    </label>
                    <div className="flex items-center gap-2 rounded-lg glass-input px-3 py-2 text-xs sm:text-sm text-white focus-within:ring-1 focus-within:ring-white">
                      <SlidersHorizontal className="w-3.5 h-3.5 text-gray-300" />
                      <select
                        value={sortBy}
                        onChange={(e) =>
                          setSortBy(e.target.value as typeof sortBy)
                        }
                        className="bg-transparent border-none text-xs sm:text-sm text-white focus:outline-none focus:ring-0 [color-scheme:dark]"
                      >
                        <option value="dateDesc" className="bg-gray-900 text-white">Newest first</option>
                        <option value="dateAsc" className="bg-gray-900 text-white">Oldest first</option>
                      </select>
                    </div>
                  </div>
                </div>

                <p className="text-xs text-gray-300">
                  Showing{" "}
                  <span className="font-medium">{filteredHikes.length}</span> of{" "}
                  {hikes.length} hikes
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Create Hike banner */}
        <section className="pt-6 pb-2">
          <div className="w-full px-4 sm:px-6 lg:px-12 xl:px-16">
            <div className="glass-card rounded-xl shadow-sm p-6 flex items-center justify-between reveal reveal-up">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 flex-shrink-0 flex items-center justify-center rounded-xl bg-emerald-500/20">
                  <Mountain className="w-8 h-8 text-emerald-400" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white mb-1">Create Hike</h3>
                  <p className="text-sm text-gray-200">Organize and join group hiking events</p>
                </div>
              </div>
              <button
                onClick={() => {
                  if (!isAuthenticated) { navigate("/login", { state: { from: "/hikes" } }); return; }
                  setIsCreateHikeModalOpen(true);
                }}
                className="glass-button-dark font-semibold py-2.5 px-6 rounded-full transition-all shadow-md text-white"
              >
                Create Hike
              </button>
            </div>
          </div>
        </section>

        {/* Hikes grid */}
        <section className="pt-8 lg:pt-10 pb-4 lg:pb-6">
          <div className="w-full px-4 sm:px-6 lg:px-12 xl:px-16">
            {isLoading ? (
              <div className="text-center py-12">
                <p className="text-gray-200">Loading hikes...</p>
              </div>
            ) : error ? (
              <div className="text-center py-12">
                <p className="text-red-300 mb-4">{error}</p>
                <button
                  onClick={() => window.location.reload()}
                  className="px-4 py-2 glass-button-dark rounded-lg"
                >
                  Retry
                </button>
              </div>
            ) : filteredHikes.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-200">
                  {hikes.length === 0
                    ? "No hikes available yet. Be the first to create one!"
                    : "No hikes match your filters."}
                </p>
              </div>
            ) : (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
                {filteredHikes.map((hike, idx) => (
                  <article
                    key={hike._id}
                    className="glass-card rounded-xl shadow-sm overflow-hidden flex flex-col hover:shadow-md transition-shadow"
                  >
                    <div className="relative h-48 glass-dark">
                      {hike.imageUrl ? (
                        <img
                          src={hike.imageUrl}
                          alt={hike.title}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center glass-dark">
                          <Map className="w-12 h-12 text-white/30" />
                        </div>
                      )}
                      <span className="absolute top-3 right-3 inline-flex items-center rounded-full glass-strong px-3 py-1 text-[11px] font-medium text-black shadow-sm">
                        {difficultyLabel(hike.difficulty)}
                      </span>
                    </div>

                    <div className="flex-1 flex flex-col p-4">
                      <div className="mb-2">
                        <div className="flex items-start justify-between gap-3">
                          <p className="text-xs uppercase tracking-wide text-gray-300">
                            {hike.location} • {extractPlace(hike.location)}
                          </p>
                          <div className="inline-flex items-center gap-1 text-xs uppercase tracking-wide text-gray-300">
                            <Users className="w-3.5 h-3.5" />
                            <span>{hike.spotsLeft} spots left</span>
                          </div>
                        </div>
                        <h2 className="mt-1 text-base font-semibold text-white">
                          {hike.title}
                        </h2>
                        {hike.description && (
                          <p className="mt-2 text-xs text-gray-200 line-clamp-2">
                            {hike.description}
                          </p>
                        )}
                      </div>

                      <div className="mt-auto pt-2 flex items-center justify-between text-xs text-gray-300">
                        <div className="inline-flex items-center gap-1">
                          <CalendarDays className="w-3.5 h-3.5" />
                          <span>{formatDate(hike.date)}</span>
                        </div>
                        <button
                          type="button"
                          className="inline-flex items-center justify-center rounded-full glass-button px-3 py-1 text-[11px] font-medium text-white shadow-sm hover:opacity-80 active:scale-95 focus:outline-none focus:ring-2 focus:ring-white"
                          aria-label={`Open connect dialog for ${hike.title}`}
                          aria-haspopup="dialog"
                          aria-controls={`connect-dialog-${hike._id}`}
                          onClick={() => {
                            if (!isAuthenticated) {
                              navigate("/login", { state: { from: "/hikes" } });
                              return;
                            }
                            setConnectHike(hike);
                          }}
                        >
                          Connect
                        </button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}

          </div>
        </section>
        {connectHike && (
          <ConnectModal
            open={!!connectHike}
            hike={connectHike}
            onClose={() => setConnectHike(null)}
          />
        )}
        <CreateHikeModal
          open={isCreateHikeModalOpen}
          onClose={() => setIsCreateHikeModalOpen(false)}
        />
    </div>
  );
};

export default Hikes;
