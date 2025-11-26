// src/pages/Hikes.tsx
import React, { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Map,
  Globe2,
  Search,
  SlidersHorizontal,
  CalendarDays,
  Users,
} from "lucide-react";

type Hike = {
  id: number;
  title: string;
  location: string; // specific spot
  place: string; // area/region within Nepal
  difficulty: number; // 1–5
  date: string; // ISO
  dateLabel: string; // for display
  imageUrl: string;
  spotsLeft: number;
};

const hikesData: Hike[] = [
  {
    id: 1,
    title: "Nagarkot Sunrise View Hike",
    location: "Nagarkot View Tower",
    place: "Kathmandu Valley",
    difficulty: 1,
    date: "2025-11-16",
    dateLabel: "November 16, 2025",
    imageUrl:
      "https://images.pexels.com/photos/417074/pexels-photo-417074.jpeg?auto=compress&cs=tinysrgb&w=1200",
    spotsLeft: 5,
  },
  {
    id: 2,
    title: "Shivapuri Day Hike",
    location: "Shivapuri National Park",
    place: "Kathmandu Valley",
    difficulty: 3,
    date: "2025-11-02",
    dateLabel: "November 2, 2025",
    imageUrl:
      "https://images.pexels.com/photos/552785/pexels-photo-552785.jpeg?auto=compress&cs=tinysrgb&w=1200",
    spotsLeft: 4,
  },
  {
    id: 3,
    title: "Australian Camp Viewpoint",
    location: "Australian Camp",
    place: "Pokhara",
    difficulty: 2,
    date: "2025-09-28",
    dateLabel: "September 28, 2025",
    imageUrl:
      "https://images.pexels.com/photos/4482900/pexels-photo-4482900.jpeg?auto=compress&cs=tinysrgb&w=1200",
    spotsLeft: 6,
  },
  {
    id: 4,
    title: "Sarangkot Sunrise Trail",
    location: "Sarangkot Viewpoint",
    place: "Pokhara",
    difficulty: 2,
    date: "2025-09-11",
    dateLabel: "September 11, 2025",
    imageUrl:
      "https://images.pexels.com/photos/221455/pexels-photo-221455.jpeg?auto=compress&cs=tinysrgb&w=1200",
    spotsLeft: 3,
  },
  {
    id: 5,
    title: "Dhulikhel – Namo Buddha Hike",
    location: "Dhulikhel & Namo Buddha",
    place: "Kavre",
    difficulty: 3,
    date: "2025-08-22",
    dateLabel: "August 22, 2025",
    imageUrl:
      "https://images.pexels.com/photos/618833/pexels-photo-618833.jpeg?auto=compress&cs=tinysrgb&w=1200",
    spotsLeft: 8,
  },
  {
    id: 6,
    title: "Poon Hill Sunrise Trek (Short)",
    location: "Poon Hill Viewpoint",
    place: "Annapurna Region",
    difficulty: 4,
    date: "2025-08-21",
    dateLabel: "August 21, 2025",
    imageUrl:
      "https://images.pexels.com/photos/1028225/pexels-photo-1028225.jpeg?auto=compress&cs=tinysrgb&w=1200",
    spotsLeft: 2,
  },
];

const difficultyLabel = (value: number) => `Difficulty: ${value}/5`;

const Hikes: React.FC = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [difficulty, setDifficulty] = useState<
    "all" | "1" | "2" | "3" | "4" | "5"
  >("all");
  const [sortBy, setSortBy] = useState<"dateDesc" | "dateAsc">("dateDesc");
  const [place, setPlace] = useState<string>("all");

  // unique list of places inside Nepal
  const places = useMemo(
    () => Array.from(new Set(hikesData.map((hike) => hike.place))),
    []
  );

  const filteredHikes = useMemo(() => {
    let list = [...hikesData];

    if (search.trim()) {
      const term = search.toLowerCase();
      list = list.filter(
        (hike) =>
          hike.title.toLowerCase().includes(term) ||
          hike.location.toLowerCase().includes(term) ||
          hike.place.toLowerCase().includes(term)
      );
    }

    if (difficulty !== "all") {
      const diff = Number(difficulty);
      list = list.filter((hike) => hike.difficulty === diff);
    }

    if (place !== "all") {
      list = list.filter((hike) => hike.place === place);
    }

    list.sort((a, b) => {
      const aTime = new Date(a.date).getTime();
      const bTime = new Date(b.date).getTime();
      return sortBy === "dateDesc" ? bTime - aTime : aTime - bTime;
    });

    return list;
  }, [search, difficulty, place, sortBy]);

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <header className="border-b border-gray-100 bg-white/80 backdrop-blur">
        <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
          {/* Logo */}
          <button
            type="button"
            className="flex items-center gap-2 cursor-pointer"
            onClick={() => navigate("/")}
          >
            <div className="bg-gray-900 text-white p-2 rounded-lg shadow-sm">
              <Map className="w-5 h-5" />
            </div>
            <span className="text-base sm:text-lg font-semibold text-gray-900">
              Travel Buddy
            </span>
          </button>

          {/* Nav links (desktop) */}
          <nav className="hidden md:flex items-center gap-6 text-sm">
            <Link
              to="/"
              className="text-gray-600 hover:text-gray-900 transition-colors"
            >
              Home
            </Link>
            <Link
              to="/hikes"
              className="text-gray-900 font-medium border-b-2 border-gray-900 pb-1"
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
              className="inline-flex items-center justify-center rounded-full bg-gray-900 px-4 py-1.5 text-sm font-medium text-white shadow-sm hover:bg-black"
            >
              Get started
            </Link>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1">
        {/* Hero + filters */}
        <section className="border-b border-gray-100 bg-white">
          <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-10">
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div>
                <p className="inline-flex items-center gap-2 rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700 mb-3">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span>Hikes in Nepal • Find your next trail buddy</span>
                </p>
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-semibold text-gray-900 mb-2">
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
                  {hikesData.length} hikes
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Hikes grid */}
        <section className="py-8 lg:py-10">
          <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {filteredHikes.map((hike) => (
                <article
                  key={hike.id}
                  className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col hover:shadow-md transition-shadow"
                >
                  <div className="relative h-48 bg-gray-200">
                    <img
                      src={hike.imageUrl}
                      alt={hike.title}
                      className="h-full w-full object-cover"
                    />
                    <span className="absolute top-3 right-3 inline-flex items-center rounded-full bg-white/90 px-3 py-1 text-[11px] font-medium text-gray-800 shadow-sm">
                      {difficultyLabel(hike.difficulty)}
                    </span>
                  </div>

                  <div className="flex-1 flex flex-col p-4">
                    <div className="mb-2">
                      <p className="text-xs uppercase tracking-wide text-gray-400">
                        {hike.location} • {hike.place}
                      </p>
                      <h2 className="mt-1 text-base font-semibold text-gray-900">
                        {hike.title}
                      </h2>
                    </div>

                    <div className="mt-auto pt-2 flex items-center justify-between text-xs text-gray-500">
                      <div className="inline-flex items-center gap-1">
                        <CalendarDays className="w-3.5 h-3.5" />
                        <span>{hike.dateLabel}</span>
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

            {/* Load more */}
            <div className="mt-8 flex justify-center">
              <button
                type="button"
                className="inline-flex items-center gap-2 rounded-full bg-emerald-100 px-5 py-2 text-sm font-medium text-emerald-900 hover:bg-emerald-200 transition-colors"
              >
                Load more
              </button>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-100">
        <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col gap-8 md:flex-row md:items-start md:justify-between">
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
          <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
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
