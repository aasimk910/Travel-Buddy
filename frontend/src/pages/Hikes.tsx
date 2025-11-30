// src/pages/Hikes.tsx
import React, { useMemo, useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Map,
  Globe2,
  Search,
  SlidersHorizontal,
  CalendarDays,
  Users,
} from "lucide-react";

const API_BASE_URL =
  (import.meta as any).env?.VITE_API_BASE_URL || "http://localhost:5000";

type Hike = {
  _id: string;
  title: string;
  location: string;
  difficulty: number; // 1–5
  date: string; // ISO date string
  spotsLeft: number;
  imageUrl?: string;
  description?: string;
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
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [difficulty, setDifficulty] = useState<
    "all" | "1" | "2" | "3" | "4" | "5"
  >("all");
  const [sortBy, setSortBy] = useState<"dateDesc" | "dateAsc">("dateDesc");
  const [place, setPlace] = useState<string>("all");
  const [hikes, setHikes] = useState<Hike[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch hikes from API
  useEffect(() => {
    const fetchHikes = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const res = await fetch(`${API_BASE_URL}/api/hikes`);
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.message || "Unable to fetch hikes.");
        }
        setHikes(data);
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
    let list = [...hikes];

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
    <div className="min-h-screen flex flex-col bg-white">
      {/* Header */}
      <header className="border-b border-black bg-white">
        <div className="w-full px-4 sm:px-6 lg:px-12 xl:px-16 flex items-center justify-between h-16">
          {/* Logo */}
          <button
            type="button"
            className="flex items-center gap-2 cursor-pointer"
            onClick={() => navigate("/")}
          >
            <div className="bg-black text-white p-2 rounded-lg shadow-sm">
              <Map className="w-5 h-5" />
            </div>
            <span className="text-base sm:text-lg font-semibold text-black">
              Travel Buddy
            </span>
          </button>

          {/* Nav links (desktop) */}
          <nav className="hidden md:flex items-center gap-6 text-sm">
            <Link
              to="/"
              className="text-gray-600 hover:text-black transition-colors"
            >
              Home
            </Link>
            <Link
              to="/hikes"
              className="text-black font-medium border-b-2 border-black pb-1"
            >
              Hikes
            </Link>
          </nav>

          {/* Auth buttons */}
          <div className="flex items-center gap-3">
            <Link
              to="/login"
              className="hidden sm:inline-flex text-sm text-gray-700 hover:text-black"
            >
              Log in
            </Link>
            <Link
              to="/signup"
              className="inline-flex items-center justify-center rounded-full bg-black px-4 py-1.5 text-sm font-medium text-white shadow-sm hover:bg-gray-800"
            >
              Get started
            </Link>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1">
        {/* Hero + filters */}
        <section className="border-b border-black bg-white">
          <div className="w-full px-4 sm:px-6 lg:px-12 xl:px-16 py-8 lg:py-10">
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div>
                <p className="inline-flex items-center gap-2 rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700 mb-3">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span>Hikes in Nepal • Find your next trail buddy</span>
                </p>
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-semibold text-black mb-2">
                  Join group hikes in the hills and mountains of Nepal
                </h1>
                <p className="text-sm sm:text-base text-gray-600 max-w-2xl">
                  Explore classic day hikes around Kathmandu and Pokhara, or
                  join short treks in the Annapurna region. Filter by difficulty
                  and place to find hikes that fit you.
                </p>
              </div>

              {/* Place filter */}
              <div className="mt-2 md:mt-0">
                <label className="block text-xs font-medium text-gray-500 mb-1">
                  Place
                </label>
                <div className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-3 py-1.5 shadow-sm">
                  <Globe2 className="w-4 h-4 text-gray-500" />
                  <select
                    value={place}
                    onChange={(e) => setPlace(e.target.value)}
                    className="bg-transparent border-none text-sm text-gray-800 focus:outline-none focus:ring-0 pr-3"
                  >
                    <option value="all">All places</option>
                    {places.map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Search + filters row */}
            <div className="mt-6 space-y-3">
              {/* Search */}
              <div className="relative">
                <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search hikes, viewpoints, or trails in Nepal…"
                  className="w-full rounded-xl border border-gray-200 bg-gray-50/60 py-2.5 pl-9 pr-3 text-sm text-gray-800 placeholder:text-gray-400 focus:border-gray-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-gray-900/10"
                />
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-wrap gap-3 items-center">
                  {/* Difficulty */}
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">
                      Difficulty
                    </label>
                    <select
                      value={difficulty}
                      onChange={(e) =>
                        setDifficulty(e.target.value as typeof difficulty)
                      }
                      className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs sm:text-sm text-gray-800 focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900/10"
                    >
                      <option value="all">All difficulties</option>
                      <option value="1">1/5 – Very easy</option>
                      <option value="2">2/5 – Easy</option>
                      <option value="3">3/5 – Moderate</option>
                      <option value="4">4/5 – Hard</option>
                      <option value="5">5/5 – Expert</option>
                    </select>
                  </div>

                  {/* Sort by */}
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">
                      Sort by
                    </label>
                    <div className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs sm:text-sm text-gray-800 focus-within:border-gray-900 focus-within:ring-1 focus-within:ring-gray-900/10">
                      <SlidersHorizontal className="w-3.5 h-3.5 text-gray-400" />
                      <select
                        value={sortBy}
                        onChange={(e) =>
                          setSortBy(e.target.value as typeof sortBy)
                        }
                        className="bg-transparent border-none text-xs sm:text-sm text-gray-800 focus:outline-none focus:ring-0"
                      >
                        <option value="dateDesc">Newest first</option>
                        <option value="dateAsc">Oldest first</option>
                      </select>
                    </div>
                  </div>
                </div>

                <p className="text-xs text-gray-500">
                  Showing{" "}
                  <span className="font-medium">{filteredHikes.length}</span> of{" "}
                  {hikes.length} hikes
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Hikes grid */}
        <section className="py-8 lg:py-10">
          <div className="w-full px-4 sm:px-6 lg:px-12 xl:px-16">
            {isLoading ? (
              <div className="text-center py-12">
                <p className="text-gray-600">Loading hikes...</p>
              </div>
            ) : error ? (
              <div className="text-center py-12">
                <p className="text-red-600 mb-4">{error}</p>
                <button
                  onClick={() => window.location.reload()}
                  className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800"
                >
                  Retry
                </button>
              </div>
            ) : filteredHikes.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-600">
                  {hikes.length === 0
                    ? "No hikes available yet. Be the first to create one!"
                    : "No hikes match your filters."}
                </p>
              </div>
            ) : (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
                {filteredHikes.map((hike) => (
                  <article
                    key={hike._id}
                    className="bg-white rounded-xl shadow-sm border border-black overflow-hidden flex flex-col hover:shadow-md transition-shadow"
                  >
                    <div className="relative h-48 bg-gray-200">
                      {hike.imageUrl ? (
                        <img
                          src={hike.imageUrl}
                          alt={hike.title}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center bg-gray-100">
                          <Map className="w-12 h-12 text-gray-400" />
                        </div>
                      )}
                      <span className="absolute top-3 right-3 inline-flex items-center rounded-full bg-white/90 px-3 py-1 text-[11px] font-medium text-black shadow-sm">
                        {difficultyLabel(hike.difficulty)}
                      </span>
                    </div>

                    <div className="flex-1 flex flex-col p-4">
                      <div className="mb-2">
                        <p className="text-xs uppercase tracking-wide text-gray-400">
                          {hike.location} • {extractPlace(hike.location)}
                        </p>
                        <h2 className="mt-1 text-base font-semibold text-black">
                          {hike.title}
                        </h2>
                        {hike.description && (
                          <p className="mt-2 text-xs text-gray-600 line-clamp-2">
                            {hike.description}
                          </p>
                        )}
                      </div>

                      <div className="mt-auto pt-2 flex items-center justify-between text-xs text-gray-500">
                        <div className="inline-flex items-center gap-1">
                          <CalendarDays className="w-3.5 h-3.5" />
                          <span>{formatDate(hike.date)}</span>
                        </div>
                        <div className="inline-flex items-center gap-1">
                          <Users className="w-3.5 h-3.5" />
                          <span>{hike.spotsLeft} spots left</span>
                        </div>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}

          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-black">
        <div className="w-full px-4 sm:px-6 lg:px-12 xl:px-16 py-8 flex flex-col gap-8 md:flex-row md:items-start md:justify-between">
          {/* Brand + stores */}
          <div className="space-y-3 max-w-sm">
            <div className="flex items-center gap-2">
              <div className="bg-gray-900 text-white p-2 rounded-lg shadow-sm">
                <Map className="w-4 h-4" />
              </div>
              <span className="text-sm font-semibold text-gray-900">
                Travel Buddy
              </span>
            </div>
            <p className="text-xs text-gray-500">
              Find hiking friends, share routes, and turn solo weekend plans
              into small group adventures across Nepal.
            </p>
            <div className="flex gap-3">
              <button className="h-9 rounded-md border border-gray-200 px-3 text-[11px] font-medium text-gray-700 hover:bg-gray-50">
                App Store
              </button>
              <button className="h-9 rounded-md border border-gray-200 px-3 text-[11px] font-medium text-gray-700 hover:bg-gray-50">
                Google Play
              </button>
            </div>
          </div>

          {/* Link columns */}
          <div className="flex-1 grid grid-cols-2 sm:grid-cols-3 gap-6 text-xs text-gray-500">
            <div>
              <p className="mb-3 font-semibold text-gray-700">Explore</p>
              <ul className="space-y-2">
                <li>
                  <button className="hover:text-gray-800">Hikes</button>
                </li>
                <li>
                  <button className="hover:text-gray-800">Mountains</button>
                </li>
                <li>
                  <button className="hover:text-gray-800">Map</button>
                </li>
                <li>
                  <button className="hover:text-gray-800">Trails</button>
                </li>
              </ul>
            </div>

            <div>
              <p className="mb-3 font-semibold text-gray-700">Company</p>
              <ul className="space-y-2">
                <li>
                  <button className="hover:text-gray-800">About</button>
                </li>
                <li>
                  <button className="hover:text-gray-800">Partners</button>
                </li>
              </ul>
            </div>

            <div>
              <p className="mb-3 font-semibold text-gray-700">Legal</p>
              <ul className="space-y-2">
                <li>
                  <button className="hover:text-gray-800">
                    Privacy Policy
                  </button>
                </li>
                <li>
                  <button className="hover:text-gray-800">
                    Terms of Service
                  </button>
                </li>
                <li>
                  <button className="hover:text-gray-800">
                    Cookie Policy
                  </button>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Bottom row */}
        <div className="border-t border-gray-100">
          <div className="w-full px-4 sm:px-6 lg:px-12 xl:px-16 py-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-[11px] text-gray-500">
              © {new Date().getFullYear()} Travel Buddy. All rights reserved.
            </p>
            <div className="flex items-center gap-4 text-[11px] text-gray-500">
              <button className="hover:text-gray-800">Privacy</button>
              <button className="hover:text-gray-800">Terms</button>
              <div className="inline-flex items-center gap-1 rounded-full border border-gray-200 px-2 py-1">
                <span className="text-[11px] text-gray-600">EN</span>
                <span className="text-[11px] text-gray-400">English</span>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Hikes;
