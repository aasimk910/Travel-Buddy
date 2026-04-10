// backend/scripts/reseed-products.js
// Deletes ALL existing products and inserts a fresh curated catalogue with stock.
// Usage: node scripts/reseed-products.js  (run from backend/)

const path = require("path");
const mongoose = require("mongoose");
const dotenv = require("dotenv");

dotenv.config({ path: path.join(__dirname, "..", ".env") });

const Product = require("../models/Product");

const MONGO_URI = process.env.MONGO_URI;
const MONGO_DB_NAME = process.env.MONGO_DB_NAME;

const products = [
  // ── Backpacks ──────────────────────────────────────────────────────────────
  {
    name: "Osprey Atmos AG 65L",
    category: "Backpacks",
    price: 24500,
    rating: 4.9,
    reviews: 512,
    badge: "Best Seller",
    featured: true,
    stock: 18,
    inStock: true,
    img: "https://images.pexels.com/photos/1365425/pexels-photo-1365425.jpeg?auto=compress&w=400",
    images: [
      "https://images.pexels.com/photos/1365425/pexels-photo-1365425.jpeg?auto=compress&w=800",
      "https://images.pexels.com/photos/2166456/pexels-photo-2166456.jpeg?auto=compress&w=800",
      "https://images.pexels.com/photos/3278215/pexels-photo-3278215.jpeg?auto=compress&w=800",
      "https://images.pexels.com/photos/1271620/pexels-photo-1271620.jpeg?auto=compress&w=800",
    ],
    description:
      "Award-winning 65 L Anti-Gravity suspension pack. The mesh trampoline back panel floats the load off your spine and channels air through the entire back. Ideal for multi-day Himalayan treks.",
  },
  {
    name: "Deuter Futura Pro 36L",
    category: "Backpacks",
    price: 11200,
    rating: 4.7,
    reviews: 223,
    badge: null,
    featured: false,
    stock: 25,
    inStock: true,
    img: "https://images.pexels.com/photos/2385210/pexels-photo-2385210.jpeg?auto=compress&w=400",
    images: [
      "https://images.pexels.com/photos/2385210/pexels-photo-2385210.jpeg?auto=compress&w=800",
      "https://images.pexels.com/photos/1153369/pexels-photo-1153369.jpeg?auto=compress&w=800",
      "https://images.pexels.com/photos/1271620/pexels-photo-1271620.jpeg?auto=compress&w=800",
      "https://images.pexels.com/photos/2166456/pexels-photo-2166456.jpeg?auto=compress&w=800",
    ],
    description:
      "Spacious 36 L trekking pack with Aircomfort Vari-Flex back system that self-adjusts to your stride. Twin hip-belt pockets and a separate lower compartment for wet gear.",
  },
  {
    name: "Gregory Baltoro 75L",
    category: "Backpacks",
    price: 23500,
    rating: 4.8,
    reviews: 115,
    badge: "Top Rated",
    featured: true,
    stock: 12,
    inStock: true,
    img: "https://images.pexels.com/photos/2166456/pexels-photo-2166456.jpeg?auto=compress&w=400",
    images: [
      "https://images.pexels.com/photos/2166456/pexels-photo-2166456.jpeg?auto=compress&w=800",
      "https://images.pexels.com/photos/1271620/pexels-photo-1271620.jpeg?auto=compress&w=800",
      "https://images.pexels.com/photos/2385210/pexels-photo-2385210.jpeg?auto=compress&w=800",
      "https://images.pexels.com/photos/3278215/pexels-photo-3278215.jpeg?auto=compress&w=800",
    ],
    description:
      "Industry benchmark for load-hauling comfort on extended expeditions. Response A3 hip-belt auto-adjusts with every step. Dual ice-axe loops and a rain cover make it fully expedition-ready.",
  },
  {
    name: "Black Diamond Speed 40L Pack",
    category: "Backpacks",
    price: 14800,
    rating: 4.6,
    reviews: 198,
    badge: "New",
    featured: false,
    stock: 20,
    inStock: true,
    img: "https://images.pexels.com/photos/3278215/pexels-photo-3278215.jpeg?auto=compress&w=400",
    images: [
      "https://images.pexels.com/photos/3278215/pexels-photo-3278215.jpeg?auto=compress&w=800",
      "https://images.pexels.com/photos/2385210/pexels-photo-2385210.jpeg?auto=compress&w=800",
      "https://images.pexels.com/photos/1153369/pexels-photo-1153369.jpeg?auto=compress&w=800",
      "https://images.pexels.com/photos/1365425/pexels-photo-1365425.jpeg?auto=compress&w=800",
    ],
    description:
      "Alpine-ready 40 L pack built for fast-and-light style missions. Removable framesheet doubles as a sit pad, helmet carry strap, and twin ice-axe attachment loops. Weather-resistant 210D ripstop nylon body.",
  },
  {
    name: "Tortuga Setout 45L Travel Pack",
    category: "Backpacks",
    price: 6800,
    rating: 4.5,
    reviews: 176,
    badge: null,
    featured: false,
    stock: 30,
    inStock: true,
    img: "https://images.pexels.com/photos/1153369/pexels-photo-1153369.jpeg?auto=compress&w=400",
    images: [
      "https://images.pexels.com/photos/1153369/pexels-photo-1153369.jpeg?auto=compress&w=800",
      "https://images.pexels.com/photos/2385210/pexels-photo-2385210.jpeg?auto=compress&w=800",
      "https://images.pexels.com/photos/1271620/pexels-photo-1271620.jpeg?auto=compress&w=800",
      "https://images.pexels.com/photos/1365425/pexels-photo-1365425.jpeg?auto=compress&w=800",
    ],
    description:
      "Carry-on compliant 45 L travel pack with a clamshell opening and lockable zippers. Hip-belt stows away when not needed. Durable 420D nylon handles monsoon conditions on the trail to Lukla.",
  },

  // ── Camping ────────────────────────────────────────────────────────────────
  {
    name: "Big Agnes Copper Spur HV UL 2P",
    category: "Camping",
    price: 32000,
    rating: 4.9,
    reviews: 241,
    badge: "Best Seller",
    featured: true,
    stock: 8,
    inStock: true,
    img: "https://images.pexels.com/photos/1525041/pexels-photo-1525041.jpeg?auto=compress&w=400",
    images: [
      "https://images.pexels.com/photos/1525041/pexels-photo-1525041.jpeg?auto=compress&w=800",
      "https://images.pexels.com/photos/2422265/pexels-photo-2422265.jpeg?auto=compress&w=800",
      "https://images.pexels.com/photos/1061640/pexels-photo-1061640.jpeg?auto=compress&w=800",
      "https://images.pexels.com/photos/618833/pexels-photo-618833.jpeg?auto=compress&w=800",
    ],
    description:
      "Featherlight freestanding 2-person tent at just 1.06 kg. Hub-and-pole architecture erects in 3 minutes. Dual vestibules provide gear storage. 1500 mm rated fly handles Himalayan rain squalls.",
  },
  {
    name: "MSR Hubba Hubba NX 2-Person Tent",
    category: "Camping",
    price: 27500,
    rating: 4.8,
    reviews: 187,
    badge: "Top Rated",
    featured: false,
    stock: 10,
    inStock: true,
    img: "https://images.pexels.com/photos/2422265/pexels-photo-2422265.jpeg?auto=compress&w=400",
    images: [
      "https://images.pexels.com/photos/2422265/pexels-photo-2422265.jpeg?auto=compress&w=800",
      "https://images.pexels.com/photos/1525041/pexels-photo-1525041.jpeg?auto=compress&w=800",
      "https://images.pexels.com/photos/618833/pexels-photo-618833.jpeg?auto=compress&w=800",
      "https://images.pexels.com/photos/1061640/pexels-photo-1061640.jpeg?auto=compress&w=800",
    ],
    description:
      "Ultralight 1.72 kg tent with 360° ventilation and easy clip-and-pole setup. Seasonally versatile fly extends to the ground for storm protection. Two spacious D-shaped doors with dual vestibules.",
  },
  {
    name: "Jetboil Flash Cooking System",
    category: "Camping",
    price: 7800,
    rating: 4.9,
    reviews: 334,
    badge: null,
    featured: false,
    stock: 35,
    inStock: true,
    img: "https://images.pexels.com/photos/6271625/pexels-photo-6271625.jpeg?auto=compress&w=400",
    images: [
      "https://images.pexels.com/photos/6271625/pexels-photo-6271625.jpeg?auto=compress&w=800",
      "https://images.pexels.com/photos/1504557/pexels-photo-1504557.jpeg?auto=compress&w=800",
      "https://images.pexels.com/photos/1525041/pexels-photo-1525041.jpeg?auto=compress&w=800",
      "https://images.pexels.com/photos/2422265/pexels-photo-2422265.jpeg?auto=compress&w=800",
    ],
    description:
      "All-in-one stove and pot that boils 500 ml in just 100 seconds. Push-button igniter, insulating cozy, and colour-change heat indicator. 50 % more fuel-efficient than conventional stoves at altitude.",
  },
  {
    name: "Western Mountaineering Alpinlite 35°F Sleeping Bag",
    category: "Camping",
    price: 18500,
    rating: 4.8,
    reviews: 178,
    badge: null,
    featured: false,
    stock: 14,
    inStock: true,
    img: "https://images.pexels.com/photos/1504557/pexels-photo-1504557.jpeg?auto=compress&w=400",
    images: [
      "https://images.pexels.com/photos/1504557/pexels-photo-1504557.jpeg?auto=compress&w=800",
      "https://images.pexels.com/photos/1525041/pexels-photo-1525041.jpeg?auto=compress&w=800",
      "https://images.pexels.com/photos/2422265/pexels-photo-2422265.jpeg?auto=compress&w=800",
      "https://images.pexels.com/photos/618833/pexels-photo-618833.jpeg?auto=compress&w=800",
    ],
    description:
      "850-fill power goose down in an ultralight 11 oz body. Comfort rating 2 °C, lower limit −4 °C. Full-length draft collar and anti-snag YKK zipper. Preferred high-altitude sleeping bag on Everest expeditions.",
  },
  {
    name: "Therm-a-Rest NeoAir XTherm NXT Sleeping Pad",
    category: "Camping",
    price: 13500,
    rating: 4.7,
    reviews: 156,
    badge: null,
    featured: false,
    stock: 22,
    inStock: true,
    img: "https://images.pexels.com/photos/1061640/pexels-photo-1061640.jpeg?auto=compress&w=400",
    images: [
      "https://images.pexels.com/photos/1061640/pexels-photo-1061640.jpeg?auto=compress&w=800",
      "https://images.pexels.com/photos/1504557/pexels-photo-1504557.jpeg?auto=compress&w=800",
      "https://images.pexels.com/photos/618833/pexels-photo-618833.jpeg?auto=compress&w=800",
      "https://images.pexels.com/photos/1525041/pexels-photo-1525041.jpeg?auto=compress&w=800",
    ],
    description:
      "R-value of 7.3 in a 430 g inflatable pad. Triangular Core Matrix baffles maximise insulation without bulk. WingLock valve inflates fully in 10 breaths and seals airtight — no more midnight deflation.",
  },

  // ── Photography ────────────────────────────────────────────────────────────
  {
    name: "DJI Action 5 Pro",
    category: "Photography",
    price: 44000,
    rating: 4.9,
    reviews: 312,
    badge: "Best Seller",
    featured: true,
    stock: 15,
    inStock: true,
    img: "https://images.pexels.com/photos/1787235/pexels-photo-1787235.jpeg?auto=compress&w=400",
    images: [
      "https://images.pexels.com/photos/1787235/pexels-photo-1787235.jpeg?auto=compress&w=800",
      "https://images.pexels.com/photos/243757/pexels-photo-243757.jpeg?auto=compress&w=800",
      "https://images.pexels.com/photos/821652/pexels-photo-821652.jpeg?auto=compress&w=800",
      "https://images.pexels.com/photos/414781/pexels-photo-414781.jpeg?auto=compress&w=800",
    ],
    description:
      "4K120 slow-motion video and 50 MP stills, waterproof to 20 m without a case. 10-bit D-Log M colour profile for stunning Annapurna sunset footage. Magnetic quick-release mount and 3-hour battery.",
  },
  {
    name: "GoPro Hero 13 Black",
    category: "Photography",
    price: 38500,
    rating: 4.8,
    reviews: 456,
    badge: "New",
    featured: true,
    stock: 20,
    inStock: true,
    img: "https://images.pexels.com/photos/243757/pexels-photo-243757.jpeg?auto=compress&w=400",
    images: [
      "https://images.pexels.com/photos/243757/pexels-photo-243757.jpeg?auto=compress&w=800",
      "https://images.pexels.com/photos/1787235/pexels-photo-1787235.jpeg?auto=compress&w=800",
      "https://images.pexels.com/photos/414781/pexels-photo-414781.jpeg?auto=compress&w=800",
      "https://images.pexels.com/photos/821652/pexels-photo-821652.jpeg?auto=compress&w=800",
    ],
    description:
      "5.3K60 video with HyperSmooth 7.0 stabilisation. Waterproof to 10 m. New Max Lens Mod 2.0 delivers an immersive 177° field of view perfect for summit selfies and trail footage.",
  },
  {
    name: "Peak Design Capture Clip V3",
    category: "Photography",
    price: 11500,
    rating: 4.9,
    reviews: 103,
    badge: "Top Rated",
    featured: false,
    stock: 40,
    inStock: true,
    img: "https://images.pexels.com/photos/821652/pexels-photo-821652.jpeg?auto=compress&w=400",
    images: [
      "https://images.pexels.com/photos/821652/pexels-photo-821652.jpeg?auto=compress&w=800",
      "https://images.pexels.com/photos/243757/pexels-photo-243757.jpeg?auto=compress&w=800",
      "https://images.pexels.com/photos/1787235/pexels-photo-1787235.jpeg?auto=compress&w=800",
      "https://images.pexels.com/photos/414781/pexels-photo-414781.jpeg?auto=compress&w=800",
    ],
    description:
      "Aluminium and stainless steel camera clip that mounts to any backpack strap in seconds. One-handed capture and re-attachment in under a second. Arca-Swiss compatible and tested to 45 kg pull strength.",
  },
  {
    name: "Anker 747 Power Bank 26000mAh",
    category: "Photography",
    price: 10500,
    rating: 4.8,
    reviews: 467,
    badge: null,
    featured: false,
    stock: 28,
    inStock: true,
    img: "https://images.pexels.com/photos/414781/pexels-photo-414781.jpeg?auto=compress&w=400",
    images: [
      "https://images.pexels.com/photos/414781/pexels-photo-414781.jpeg?auto=compress&w=800",
      "https://images.pexels.com/photos/821652/pexels-photo-821652.jpeg?auto=compress&w=800",
      "https://images.pexels.com/photos/243757/pexels-photo-243757.jpeg?auto=compress&w=800",
      "https://images.pexels.com/photos/1787235/pexels-photo-1787235.jpeg?auto=compress&w=800",
    ],
    description:
      "26000 mAh, 150 W bi-directional GaN charging. Charges a MacBook Pro from 0–80 % in 43 min and an iPhone 15 three full times. Three simultaneous outputs. Rated to −20 °C for high-altitude use.",
  },

  // ── Footwear ───────────────────────────────────────────────────────────────
  {
    name: "Salomon X Ultra 4 Mid GTX",
    category: "Footwear",
    price: 13800,
    rating: 4.8,
    reviews: 389,
    badge: "Best Seller",
    featured: true,
    stock: 16,
    inStock: true,
    img: "https://images.pexels.com/photos/2529148/pexels-photo-2529148.jpeg?auto=compress&w=400",
    images: [
      "https://images.pexels.com/photos/2529148/pexels-photo-2529148.jpeg?auto=compress&w=800",
      "https://images.pexels.com/photos/1464625/pexels-photo-1464625.jpeg?auto=compress&w=800",
      "https://images.pexels.com/photos/1619535/pexels-photo-1619535.jpeg?auto=compress&w=800",
      "https://images.pexels.com/photos/3682215/pexels-photo-3682215.jpeg?auto=compress&w=800",
    ],
    description:
      "Mid-cut waterproof Gore-Tex boot with reinforced ankle collar. Contagrip MA outsole locks in on wet rocks and muddy switchbacks. Sensifit cradle wraps the foot for a precision hold on long descent days.",
  },
  {
    name: "Scarpa Zodiac Plus GTX",
    category: "Footwear",
    price: 21500,
    rating: 4.9,
    reviews: 108,
    badge: "Top Rated",
    featured: false,
    stock: 9,
    inStock: true,
    img: "https://images.pexels.com/photos/1464625/pexels-photo-1464625.jpeg?auto=compress&w=400",
    images: [
      "https://images.pexels.com/photos/1464625/pexels-photo-1464625.jpeg?auto=compress&w=800",
      "https://images.pexels.com/photos/2529148/pexels-photo-2529148.jpeg?auto=compress&w=800",
      "https://images.pexels.com/photos/3682215/pexels-photo-3682215.jpeg?auto=compress&w=800",
      "https://images.pexels.com/photos/1619535/pexels-photo-1619535.jpeg?auto=compress&w=800",
    ],
    description:
      "Technical approach boot with full-grain leather upper and Gore-Tex lining. Vibram Drumlin outsole with Climbing Zone heel provides precise edging. Crampon-compatible welt for lightweight glacier travel.",
  },
  {
    name: "La Sportiva TX5 Low GTX",
    category: "Footwear",
    price: 16800,
    rating: 4.7,
    reviews: 134,
    badge: "New",
    featured: false,
    stock: 18,
    inStock: true,
    img: "https://images.pexels.com/photos/3682215/pexels-photo-3682215.jpeg?auto=compress&w=400",
    images: [
      "https://images.pexels.com/photos/3682215/pexels-photo-3682215.jpeg?auto=compress&w=800",
      "https://images.pexels.com/photos/2529148/pexels-photo-2529148.jpeg?auto=compress&w=800",
      "https://images.pexels.com/photos/1464625/pexels-photo-1464625.jpeg?auto=compress&w=800",
      "https://images.pexels.com/photos/1619535/pexels-photo-1619535.jpeg?auto=compress&w=800",
    ],
    description:
      "Low-cut trail shoe with Gore-Tex waterproofing and Vibram Megagrip outsole. Impact Brake System heel plate provides controlled downhill braking. Ideal for fast day hikes on Nepal's well-groomed teahouse trails.",
  },
  {
    name: "Smartwool PhD Outdoor Heavy Crew Socks (3-Pack)",
    category: "Footwear",
    price: 5800,
    rating: 4.7,
    reviews: 631,
    badge: null,
    featured: false,
    stock: 50,
    inStock: true,
    img: "https://images.pexels.com/photos/1619535/pexels-photo-1619535.jpeg?auto=compress&w=400",
    images: [
      "https://images.pexels.com/photos/1619535/pexels-photo-1619535.jpeg?auto=compress&w=800",
      "https://images.pexels.com/photos/1464625/pexels-photo-1464625.jpeg?auto=compress&w=800",
      "https://images.pexels.com/photos/2529148/pexels-photo-2529148.jpeg?auto=compress&w=800",
      "https://images.pexels.com/photos/3682215/pexels-photo-3682215.jpeg?auto=compress&w=800",
    ],
    description:
      "56 % fine Merino wool blend with indestructible Cordura nylon at heel and toe. Targeted cushioning under ball and arch. Machine-washable with a lifetime guarantee — no questions asked.",
  },

  // ── Navigation ─────────────────────────────────────────────────────────────
  {
    name: "Garmin inReach Mini 2",
    category: "Navigation",
    price: 45000,
    rating: 4.9,
    reviews: 158,
    badge: "Top Rated",
    featured: true,
    stock: 11,
    inStock: true,
    img: "https://images.pexels.com/photos/3608311/pexels-photo-3608311.jpeg?auto=compress&w=400",
    images: [
      "https://images.pexels.com/photos/3608311/pexels-photo-3608311.jpeg?auto=compress&w=800",
      "https://images.pexels.com/photos/2365457/pexels-photo-2365457.jpeg?auto=compress&w=800",
      "https://images.pexels.com/photos/346529/pexels-photo-346529.jpeg?auto=compress&w=800",
      "https://images.pexels.com/photos/1365425/pexels-photo-1365425.jpeg?auto=compress&w=800",
    ],
    description:
      "100 % global Iridium satellite coverage for two-way messaging and triggered SOS even beyond every mobile network. 90 g body pairs with Garmin Explore app for live track-sharing with family at base.",
  },
  {
    name: "Garmin Fenix 8 Solar GPS Watch",
    category: "Navigation",
    price: 72000,
    rating: 4.9,
    reviews: 89,
    badge: "New",
    featured: true,
    stock: 6,
    inStock: true,
    img: "https://images.pexels.com/photos/2365457/pexels-photo-2365457.jpeg?auto=compress&w=400",
    images: [
      "https://images.pexels.com/photos/2365457/pexels-photo-2365457.jpeg?auto=compress&w=800",
      "https://images.pexels.com/photos/3608311/pexels-photo-3608311.jpeg?auto=compress&w=800",
      "https://images.pexels.com/photos/346529/pexels-photo-346529.jpeg?auto=compress&w=800",
      "https://images.pexels.com/photos/1365425/pexels-photo-1365425.jpeg?auto=compress&w=800",
    ],
    description:
      "Multi-band GPS smartwatch with solar charging, sapphire lens, and titanium bezel. Barometric altimeter, storm alarm, preloaded TopoActive Nepal maps. Up to 428 hours GPS — outlasts the longest EBC itineraries.",
  },
  {
    name: "Garmin GPSMAP 67i Handheld GPS",
    category: "Navigation",
    price: 71000,
    rating: 4.9,
    reviews: 63,
    badge: "Best Seller",
    featured: false,
    stock: 7,
    inStock: true,
    img: "https://images.pexels.com/photos/346529/pexels-photo-346529.jpeg?auto=compress&w=400",
    images: [
      "https://images.pexels.com/photos/346529/pexels-photo-346529.jpeg?auto=compress&w=800",
      "https://images.pexels.com/photos/3608311/pexels-photo-3608311.jpeg?auto=compress&w=800",
      "https://images.pexels.com/photos/2365457/pexels-photo-2365457.jpeg?auto=compress&w=800",
      "https://images.pexels.com/photos/1365425/pexels-photo-1365425.jpeg?auto=compress&w=800",
    ],
    description:
      "Rugged handheld GPS with inReach satellite messaging, SOS, and 2.7-inch sunlight-readable display. 36-hour battery. Preloaded TopoActive Nepal maps at 1:24000 with hill shading.",
  },
  {
    name: "Suunto A-30 Field Compass",
    category: "Navigation",
    price: 2800,
    rating: 4.5,
    reviews: 342,
    badge: null,
    featured: false,
    stock: 60,
    inStock: true,
    img: "https://images.pexels.com/photos/1365425/pexels-photo-1365425.jpeg?auto=compress&w=400",
    images: [
      "https://images.pexels.com/photos/1365425/pexels-photo-1365425.jpeg?auto=compress&w=800",
      "https://images.pexels.com/photos/3608311/pexels-photo-3608311.jpeg?auto=compress&w=800",
      "https://images.pexels.com/photos/346529/pexels-photo-346529.jpeg?auto=compress&w=800",
      "https://images.pexels.com/photos/2365457/pexels-photo-2365457.jpeg?auto=compress&w=800",
    ],
    description:
      "Liquid-filled baseplate compass with built-in clinometer and 1:25000 map scale. Global needle works across all latitudes without tilting. Luminous bezel markings for night navigation — essential backup for any trek.",
  },

  // ── Safety ─────────────────────────────────────────────────────────────────
  {
    name: "Adventure Medical Kits Mountain Series 2.0",
    category: "Safety",
    price: 6500,
    rating: 4.8,
    reviews: 267,
    badge: "Best Seller",
    featured: false,
    stock: 24,
    inStock: true,
    img: "https://images.pexels.com/photos/3735747/pexels-photo-3735747.jpeg?auto=compress&w=400",
    images: [
      "https://images.pexels.com/photos/3735747/pexels-photo-3735747.jpeg?auto=compress&w=800",
      "https://images.pexels.com/photos/1061640/pexels-photo-1061640.jpeg?auto=compress&w=800",
      "https://images.pexels.com/photos/2422265/pexels-photo-2422265.jpeg?auto=compress&w=800",
      "https://images.pexels.com/photos/618833/pexels-photo-618833.jpeg?auto=compress&w=800",
    ],
    description:
      "250+ medical supplies for 4 people over 14 days. Includes SAM splint, QuikClot haemostatic gauze, altitude sickness guide, and hypothermia protocol cards. Roll-top waterproof bag at 690 g.",
  },
  {
    name: "Petzl Actik Core 600 lm Headlamp",
    category: "Safety",
    price: 3800,
    rating: 4.8,
    reviews: 534,
    badge: null,
    featured: false,
    stock: 45,
    inStock: true,
    img: "https://images.pexels.com/photos/1061640/pexels-photo-1061640.jpeg?auto=compress&w=400",
    images: [
      "https://images.pexels.com/photos/1061640/pexels-photo-1061640.jpeg?auto=compress&w=800",
      "https://images.pexels.com/photos/3735747/pexels-photo-3735747.jpeg?auto=compress&w=800",
      "https://images.pexels.com/photos/2422265/pexels-photo-2422265.jpeg?auto=compress&w=800",
      "https://images.pexels.com/photos/1504557/pexels-photo-1504557.jpeg?auto=compress&w=800",
    ],
    description:
      "600-lumen rechargeable headlamp with white and red lighting modes. REACTIVE LIGHTING adjusts brightness to ambient light automatically. IPX4 rated; accepts AAA batteries as backup when the core is depleted.",
  },
  {
    name: "Black Diamond Spot 400 Headlamp",
    category: "Safety",
    price: 2900,
    rating: 4.7,
    reviews: 418,
    badge: "New",
    featured: false,
    stock: 38,
    inStock: true,
    img: "https://images.pexels.com/photos/618833/pexels-photo-618833.jpeg?auto=compress&w=400",
    images: [
      "https://images.pexels.com/photos/618833/pexels-photo-618833.jpeg?auto=compress&w=800",
      "https://images.pexels.com/photos/1061640/pexels-photo-1061640.jpeg?auto=compress&w=800",
      "https://images.pexels.com/photos/3735747/pexels-photo-3735747.jpeg?auto=compress&w=800",
      "https://images.pexels.com/photos/2422265/pexels-photo-2422265.jpeg?auto=compress&w=800",
    ],
    description:
      "400 lumens with PowerTap technology — tap the face to switch between full and dimmed brightness. Waterproof IPX8, three white and two red modes. Runs 200 hours on low; ideal for multi-week trek camps.",
  },
  {
    name: "SOL Escape Pro Bivvy",
    category: "Safety",
    price: 3100,
    rating: 4.6,
    reviews: 358,
    badge: null,
    featured: false,
    stock: 32,
    inStock: true,
    img: "https://images.pexels.com/photos/2422265/pexels-photo-2422265.jpeg?auto=compress&w=400",
    images: [
      "https://images.pexels.com/photos/2422265/pexels-photo-2422265.jpeg?auto=compress&w=800",
      "https://images.pexels.com/photos/1061640/pexels-photo-1061640.jpeg?auto=compress&w=800",
      "https://images.pexels.com/photos/3735747/pexels-photo-3735747.jpeg?auto=compress&w=800",
      "https://images.pexels.com/photos/618833/pexels-photo-618833.jpeg?auto=compress&w=800",
    ],
    description:
      "Breathable aluminised shell reflects 80 % of radiated body heat while allowing moisture vapour to escape. Fits one adult with full sleeping bag clearance. Stuffs to fist size at 260 g with built-in hood drawcord.",
  },
  {
    name: "UST Blaze & Reflect Emergency Combo Kit",
    category: "Safety",
    price: 1150,
    rating: 4.5,
    reviews: 714,
    badge: null,
    featured: false,
    stock: 70,
    inStock: true,
    img: "https://images.pexels.com/photos/3735747/pexels-photo-3735747.jpeg?auto=compress&w=400",
    images: [
      "https://images.pexels.com/photos/3735747/pexels-photo-3735747.jpeg?auto=compress&w=800",
      "https://images.pexels.com/photos/618833/pexels-photo-618833.jpeg?auto=compress&w=800",
      "https://images.pexels.com/photos/1061640/pexels-photo-1061640.jpeg?auto=compress&w=800",
      "https://images.pexels.com/photos/2422265/pexels-photo-2422265.jpeg?auto=compress&w=800",
    ],
    description:
      "120 dB pealess whistle audible over 2.5 km, paired with a military-spec signal mirror visible to aircraft beyond 16 km. Clips to a locking carabiner — just 22 g of life-saving emergency signalling.",
  },
];

async function run() {
  try {
    const connectOptions = {};
    if (!MONGO_URI.includes("travelbuddy")) {
      connectOptions.dbName = MONGO_DB_NAME || "travelbuddy";
    }
    await mongoose.connect(MONGO_URI, connectOptions);
    console.log("✅ Connected to MongoDB");

    const deleted = await Product.deleteMany({});
    console.log(`🗑️  Deleted ${deleted.deletedCount} existing product(s)`);

    const created = await Product.insertMany(products);
    console.log(`✅ Inserted ${created.length} new product(s):`);
    created.forEach(p => console.log(`   • [${p.category}] ${p.name} — stock: ${p.stock}`));

    console.log("\n✨ Done.");
  } catch (err) {
    console.error("❌ Error:", err.message);
  } finally {
    await mongoose.disconnect();
  }
}

run();
