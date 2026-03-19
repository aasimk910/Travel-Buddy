import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  ShoppingCart, Star, Search, SlidersHorizontal, Backpack, Tent,
  Camera, Mountain, Compass, Shield, X, Plus, Minus, Trash2,
  Package, ChevronRight, Tag, User, Phone, Mail, MapPin, Loader2,
  ClipboardList, ChevronDown, ChevronUp, LogIn,
} from 'lucide-react';
import { API_BASE_URL } from '../config/env';
import { useAuth } from '../context/AuthContext';
import { initiateKhaltiPayment } from '../services/payment';

const LS_ORDERS_KEY = 'tb_saved_orders';
const ordersKey = (userId?: string) => userId ? `${LS_ORDERS_KEY}_${userId}` : LS_ORDERS_KEY;

// ── Types ────────────────────────────────────────────────────────────────────
interface Product {
  id: number; name: string; category: string;
  price: number; rating: number; reviews: number;
  badge: string | null; img: string;
  images: string[];
  description: string;
}
interface CartItem { product: Product; qty: number; }
interface CustomerInfo {
  name: string; phone: string; email: string;
  address: string; city: string;
}
interface OrderSnapshot {
  orderId: string;
  placedAt: Date;
  items: CartItem[];
  customer: CustomerInfo;
  subtotal: number;
  shipping: number;
  total: number;
  paymentMethod: 'cod' | 'khalti';
  status: 'placed' | 'processing' | 'out_for_delivery' | 'delivered';
}

const ORDER_STATUSES: { key: OrderSnapshot['status']; label: string; desc: string }[] = [
  { key: 'placed',           label: 'Order Placed',     desc: 'We received your order' },
  { key: 'processing',      label: 'Processing',       desc: 'Preparing your gear' },
  { key: 'out_for_delivery', label: 'Out for Delivery', desc: 'On the way to you' },
  { key: 'delivered',        label: 'Delivered',        desc: 'Enjoy your gear! 🎉' },
];

// ── Data ─────────────────────────────────────────────────────────────────────
const CATEGORIES = [
  { label: 'All',         icon: null },
  { label: 'Backpacks',   icon: <Backpack  className="w-3.5 h-3.5" /> },
  { label: 'Camping',     icon: <Tent      className="w-3.5 h-3.5" /> },
  { label: 'Photography', icon: <Camera    className="w-3.5 h-3.5" /> },
  { label: 'Footwear',    icon: <Mountain  className="w-3.5 h-3.5" /> },
  { label: 'Navigation',  icon: <Compass   className="w-3.5 h-3.5" /> },
  { label: 'Safety',      icon: <Shield    className="w-3.5 h-3.5" /> },
];

const PRODUCTS: Product[] = [
  // ── Backpacks ──────────────────────────────────────────────────────────────
  {
    id: 1, name: 'Osprey Atmos AG 65L', category: 'Backpacks', price: 18500, rating: 4.9, reviews: 312, badge: 'Best Seller',
    img: 'https://images.pexels.com/photos/1271620/pexels-photo-1271620.jpeg?auto=compress&w=400',
    images: [
      'https://images.pexels.com/photos/1271620/pexels-photo-1271620.jpeg?auto=compress&w=800',
      'https://images.pexels.com/photos/2166456/pexels-photo-2166456.jpeg?auto=compress&w=800',
      'https://images.pexels.com/photos/1365425/pexels-photo-1365425.jpeg?auto=compress&w=800',
      'https://images.pexels.com/photos/3278215/pexels-photo-3278215.jpeg?auto=compress&w=800',
    ],
    description: 'Industry-leading Anti-Gravity suspension distributes weight across hips and back. Includes integrated rain cover, sleeping bag compartment, and 65 L of organised storage. Ideal for Annapurna Circuit and EBC treks.',
  },
  {
    id: 2, name: 'Deuter Speed Lite 32L', category: 'Backpacks', price: 9800, rating: 4.7, reviews: 184, badge: null,
    img: 'https://images.pexels.com/photos/2385210/pexels-photo-2385210.jpeg?auto=compress&w=400',
    images: [
      'https://images.pexels.com/photos/2385210/pexels-photo-2385210.jpeg?auto=compress&w=800',
      'https://images.pexels.com/photos/1153369/pexels-photo-1153369.jpeg?auto=compress&w=800',
      'https://images.pexels.com/photos/1271620/pexels-photo-1271620.jpeg?auto=compress&w=800',
      'https://images.pexels.com/photos/2166456/pexels-photo-2166456.jpeg?auto=compress&w=800',
    ],
    description: 'Ultralight 32 L pack weighing just 780 g. Ventilated Aircomfort back system, hip belt pockets, and hydration sleeve. The go-to pack for single-day summit attempts.',
  },
  {
    id: 3, name: 'Gregory Baltoro 75L', category: 'Backpacks', price: 22000, rating: 4.8, reviews: 97, badge: 'Top Rated',
    img: 'https://images.pexels.com/photos/2166456/pexels-photo-2166456.jpeg?auto=compress&w=400',
    images: [
      'https://images.pexels.com/photos/2166456/pexels-photo-2166456.jpeg?auto=compress&w=800',
      'https://images.pexels.com/photos/1271620/pexels-photo-1271620.jpeg?auto=compress&w=800',
      'https://images.pexels.com/photos/2385210/pexels-photo-2385210.jpeg?auto=compress&w=800',
      'https://images.pexels.com/photos/3278215/pexels-photo-3278215.jpeg?auto=compress&w=800',
    ],
    description: 'The benchmark for load-hauling comfort on extended expeditions. Response A3 hip-belt auto-adjusts with every step. Dual ice-axe loops and a floating lid make it fully mountaineering-ready.',
  },
  {
    id: 4, name: 'Black Diamond Bullet 16L', category: 'Backpacks', price: 5600, rating: 4.5, reviews: 148, badge: 'New',
    img: 'https://images.pexels.com/photos/3278215/pexels-photo-3278215.jpeg?auto=compress&w=400',
    images: [
      'https://images.pexels.com/photos/3278215/pexels-photo-3278215.jpeg?auto=compress&w=800',
      'https://images.pexels.com/photos/2385210/pexels-photo-2385210.jpeg?auto=compress&w=800',
      'https://images.pexels.com/photos/1153369/pexels-photo-1153369.jpeg?auto=compress&w=800',
      'https://images.pexels.com/photos/1365425/pexels-photo-1365425.jpeg?auto=compress&w=800',
    ],
    description: 'Minimalist 16 L climbing pack with a clean top-loading design and removable frame sheet. Durable Dyneema face fabric keeps it under 450 g — perfect for via ferrata and sport climbing days.',
  },
  // ── Camping ────────────────────────────────────────────────────────────────
  {
    id: 5, name: 'MSR Hubba Hubba NX 2P', category: 'Camping', price: 28500, rating: 4.9, reviews: 203, badge: 'Best Seller',
    img: 'https://images.pexels.com/photos/1525041/pexels-photo-1525041.jpeg?auto=compress&w=400',
    images: [
      'https://images.pexels.com/photos/1525041/pexels-photo-1525041.jpeg?auto=compress&w=800',
      'https://images.pexels.com/photos/2422265/pexels-photo-2422265.jpeg?auto=compress&w=800',
      'https://images.pexels.com/photos/1061640/pexels-photo-1061640.jpeg?auto=compress&w=800',
      'https://images.pexels.com/photos/618833/pexels-photo-618833.jpeg?auto=compress&w=800',
    ],
    description: 'Ultralight freestanding 3-season tent, 1.72 kg. Dual-door design with full-coverage fly, 3000 mm hydrostatic rating, and Easton Syclone poles that snap together in under 3 minutes.',
  },
  {
    id: 6, name: 'Sea to Summit Reactor Sleeping Bag', category: 'Camping', price: 14200, rating: 4.7, reviews: 156, badge: null,
    img: 'https://images.pexels.com/photos/1504557/pexels-photo-1504557.jpeg?auto=compress&w=400',
    images: [
      'https://images.pexels.com/photos/1504557/pexels-photo-1504557.jpeg?auto=compress&w=800',
      'https://images.pexels.com/photos/1525041/pexels-photo-1525041.jpeg?auto=compress&w=800',
      'https://images.pexels.com/photos/2422265/pexels-photo-2422265.jpeg?auto=compress&w=800',
      'https://images.pexels.com/photos/618833/pexels-photo-618833.jpeg?auto=compress&w=800',
    ],
    description: '850-fill ethically sourced down rated to -12 °C.  Thermal Comfort mapping adds insulation at feet and core. Side-block baffles prevent down shifting — no more cold spots at night in high camp.',
  },
  {
    id: 7, name: 'MSR PocketRocket Deluxe Stove', category: 'Camping', price: 6500, rating: 4.8, reviews: 289, badge: 'Top Rated',
    img: 'https://images.pexels.com/photos/6271625/pexels-photo-6271625.jpeg?auto=compress&w=400',
    images: [
      'https://images.pexels.com/photos/6271625/pexels-photo-6271625.jpeg?auto=compress&w=800',
      'https://images.pexels.com/photos/1504557/pexels-photo-1504557.jpeg?auto=compress&w=800',
      'https://images.pexels.com/photos/1525041/pexels-photo-1525041.jpeg?auto=compress&w=800',
      'https://images.pexels.com/photos/2422265/pexels-photo-2422265.jpeg?auto=compress&w=800',
    ],
    description: 'Weighs just 73 g and boils 1 L of water in 3.5 minutes. Precision flame control from full simmer to roaring boil. Wind-resistant burner and integrated pressure regulator performs at altitude.',
  },
  {
    id: 8, name: 'Therm-a-Rest NeoAir XLite', category: 'Camping', price: 11800, rating: 4.6, reviews: 134, badge: null,
    img: 'https://images.pexels.com/photos/2422265/pexels-photo-2422265.jpeg?auto=compress&w=400',
    images: [
      'https://images.pexels.com/photos/2422265/pexels-photo-2422265.jpeg?auto=compress&w=800',
      'https://images.pexels.com/photos/1504557/pexels-photo-1504557.jpeg?auto=compress&w=800',
      'https://images.pexels.com/photos/618833/pexels-photo-618833.jpeg?auto=compress&w=800',
      'https://images.pexels.com/photos/1525041/pexels-photo-1525041.jpeg?auto=compress&w=800',
    ],
    description: 'R-value of 4.2 in a 350 g ultralight inflatable pad. Triangular Core Matrix construction and heat-reflective film keep you off the cold ground. WingLock valve inflates in under 60 seconds.',
  },
  // ── Footwear ───────────────────────────────────────────────────────────────
  {
    id: 9, name: 'Salomon X Ultra 4 GTX', category: 'Footwear', price: 12500, rating: 4.8, reviews: 347, badge: 'Best Seller',
    img: 'https://images.pexels.com/photos/2529148/pexels-photo-2529148.jpeg?auto=compress&w=400',
    images: [
      'https://images.pexels.com/photos/2529148/pexels-photo-2529148.jpeg?auto=compress&w=800',
      'https://images.pexels.com/photos/1464625/pexels-photo-1464625.jpeg?auto=compress&w=800',
      'https://images.pexels.com/photos/1619535/pexels-photo-1619535.jpeg?auto=compress&w=800',
      'https://images.pexels.com/photos/3682215/pexels-photo-3682215.jpeg?auto=compress&w=800',
    ],
    description: 'Waterproof Gore-Tex membrane with suede and textile upper. Contagrip MA outsole locks in on wet rocks and muddy switchbacks. Sensifit cradle wraps the foot for a precision, glove-like hold.',
  },
  {
    id: 10, name: 'La Sportiva Trango TRK GTX', category: 'Footwear', price: 18900, rating: 4.9, reviews: 92, badge: 'Top Rated',
    img: 'https://images.pexels.com/photos/1464625/pexels-photo-1464625.jpeg?auto=compress&w=400',
    images: [
      'https://images.pexels.com/photos/1464625/pexels-photo-1464625.jpeg?auto=compress&w=800',
      'https://images.pexels.com/photos/2529148/pexels-photo-2529148.jpeg?auto=compress&w=800',
      'https://images.pexels.com/photos/3682215/pexels-photo-3682215.jpeg?auto=compress&w=800',
      'https://images.pexels.com/photos/1619535/pexels-photo-1619535.jpeg?auto=compress&w=800',
    ],
    description: 'Backpacking boot with a Nubuck leather upper and Gore-Tex lining rated to 3-season use. FriXion AT outsole with self-cleaning lugs designed specifically for Himalayan approach terrain.',
  },
  {
    id: 11, name: 'Black Diamond Distance Carbon Z Poles', category: 'Footwear', price: 7200, rating: 4.7, reviews: 218, badge: null,
    img: 'https://images.pexels.com/photos/618833/pexels-photo-618833.jpeg?auto=compress&w=400',
    images: [
      'https://images.pexels.com/photos/618833/pexels-photo-618833.jpeg?auto=compress&w=800',
      'https://images.pexels.com/photos/2529148/pexels-photo-2529148.jpeg?auto=compress&w=800',
      'https://images.pexels.com/photos/1464625/pexels-photo-1464625.jpeg?auto=compress&w=800',
      'https://images.pexels.com/photos/1365425/pexels-photo-1365425.jpeg?auto=compress&w=800',
    ],
    description: 'Carbon fibre Z-style folding poles that pack to 38 cm. Non-flick FlickLock Pro collar adjusts in seconds with gloves. Carbide tech tips and interchangeable baskets for all terrain.',
  },
  {
    id: 12, name: 'Darn Tough Hiker Boot Sock', category: 'Footwear', price: 1850, rating: 4.6, reviews: 504, badge: 'New',
    img: 'https://images.pexels.com/photos/1619535/pexels-photo-1619535.jpeg?auto=compress&w=400',
    images: [
      'https://images.pexels.com/photos/1619535/pexels-photo-1619535.jpeg?auto=compress&w=800',
      'https://images.pexels.com/photos/1464625/pexels-photo-1464625.jpeg?auto=compress&w=800',
      'https://images.pexels.com/photos/2529148/pexels-photo-2529148.jpeg?auto=compress&w=800',
      'https://images.pexels.com/photos/3682215/pexels-photo-3682215.jpeg?auto=compress&w=800',
    ],
    description: '61 % fine merino wool construction with targeted cushioning under heel and ball. Machine-washable and backed by the brand\'s unconditional lifetime guarantee against holes and wear.',
  },
  // ── Photography ────────────────────────────────────────────────────────────
  {
    id: 13, name: 'GoPro HERO 12 Black', category: 'Photography', price: 38000, rating: 4.8, reviews: 276, badge: 'Best Seller',
    img: 'https://images.pexels.com/photos/1787235/pexels-photo-1787235.jpeg?auto=compress&w=400',
    images: [
      'https://images.pexels.com/photos/1787235/pexels-photo-1787235.jpeg?auto=compress&w=800',
      'https://images.pexels.com/photos/243757/pexels-photo-243757.jpeg?auto=compress&w=800',
      'https://images.pexels.com/photos/821652/pexels-photo-821652.jpeg?auto=compress&w=800',
      'https://images.pexels.com/photos/414781/pexels-photo-414781.jpeg?auto=compress&w=800',
    ],
    description: '5.3K60 video and 27 MP photos in a waterproof body rated to 10 m. HyperSmooth 6.0 eliminates trail-induced shake. Enduro battery adds 38 % more run time in cold mountain conditions.',
  },
  {
    id: 14, name: 'Joby GorillaPod 3K Kit', category: 'Photography', price: 8900, rating: 4.6, reviews: 163, badge: null,
    img: 'https://images.pexels.com/photos/243757/pexels-photo-243757.jpeg?auto=compress&w=400',
    images: [
      'https://images.pexels.com/photos/243757/pexels-photo-243757.jpeg?auto=compress&w=800',
      'https://images.pexels.com/photos/1787235/pexels-photo-1787235.jpeg?auto=compress&w=800',
      'https://images.pexels.com/photos/414781/pexels-photo-414781.jpeg?auto=compress&w=800',
      'https://images.pexels.com/photos/821652/pexels-photo-821652.jpeg?auto=compress&w=800',
    ],
    description: 'Flexible tripod holds up to 3 kg and wraps around branches, railings, or uneven rock. Includes quick-release plate and ball head. Folds to 26 cm and weighs just 485 g.',
  },
  {
    id: 15, name: 'Peak Design Capture Clip V3', category: 'Photography', price: 11200, rating: 4.9, reviews: 88, badge: 'Top Rated',
    img: 'https://images.pexels.com/photos/821652/pexels-photo-821652.jpeg?auto=compress&w=400',
    images: [
      'https://images.pexels.com/photos/821652/pexels-photo-821652.jpeg?auto=compress&w=800',
      'https://images.pexels.com/photos/243757/pexels-photo-243757.jpeg?auto=compress&w=800',
      'https://images.pexels.com/photos/1787235/pexels-photo-1787235.jpeg?auto=compress&w=800',
      'https://images.pexels.com/photos/414781/pexels-photo-414781.jpeg?auto=compress&w=800',
    ],
    description: 'Stainless steel camera clip that mounts to any backpack strap or belt. One-handed capture and re-attachment in under a second. Arca-Swiss compatible and rated to 45 kg pull strength.',
  },
  {
    id: 16, name: 'Anker 737 Power Bank 26800mAh', category: 'Photography', price: 9500, rating: 4.7, reviews: 412, badge: null,
    img: 'https://images.pexels.com/photos/414781/pexels-photo-414781.jpeg?auto=compress&w=400',
    images: [
      'https://images.pexels.com/photos/414781/pexels-photo-414781.jpeg?auto=compress&w=800',
      'https://images.pexels.com/photos/821652/pexels-photo-821652.jpeg?auto=compress&w=800',
      'https://images.pexels.com/photos/243757/pexels-photo-243757.jpeg?auto=compress&w=800',
      'https://images.pexels.com/photos/1787235/pexels-photo-1787235.jpeg?auto=compress&w=800',
    ],
    description: '26800 mAh, 140 W bi-directional charging charges a MacBook from 0–80 % in 45 min. Charges 3 devices simultaneously. Temperature-optimised for cold ridgeline conditions down to -10 °C.',
  },
  // ── Navigation ─────────────────────────────────────────────────────────────
  {
    id: 17, name: 'Garmin inReach Mini 2', category: 'Navigation', price: 42000, rating: 4.9, reviews: 134, badge: 'Top Rated',
    img: 'https://images.pexels.com/photos/3608311/pexels-photo-3608311.jpeg?auto=compress&w=400',
    images: [
      'https://images.pexels.com/photos/3608311/pexels-photo-3608311.jpeg?auto=compress&w=800',
      'https://images.pexels.com/photos/2365457/pexels-photo-2365457.jpeg?auto=compress&w=800',
      'https://images.pexels.com/photos/346529/pexels-photo-346529.jpeg?auto=compress&w=800',
      'https://images.pexels.com/photos/1365425/pexels-photo-1365425.jpeg?auto=compress&w=800',
    ],
    description: '100 % global satellite coverage for two-way messaging and SOS even where no mobile signal exists. Tracks your route by GPS, syncs with Garmin Explore app, and the 90 g body clips to any strap.',
  },
  {
    id: 18, name: 'Suunto 9 Baro Titanium', category: 'Navigation', price: 56000, rating: 4.8, reviews: 67, badge: 'New',
    img: 'https://images.pexels.com/photos/2365457/pexels-photo-2365457.jpeg?auto=compress&w=400',
    images: [
      'https://images.pexels.com/photos/2365457/pexels-photo-2365457.jpeg?auto=compress&w=800',
      'https://images.pexels.com/photos/3608311/pexels-photo-3608311.jpeg?auto=compress&w=800',
      'https://images.pexels.com/photos/346529/pexels-photo-346529.jpeg?auto=compress&w=800',
      'https://images.pexels.com/photos/1365425/pexels-photo-1365425.jpeg?auto=compress&w=800',
    ],
    description: 'GPS multisport watch with barometric altimeter and storm-alert function. 170-hour battery in Tour mode. Titanium bezel, sapphire glass, and 100 m water resistance built for serious expedition use.',
  },
  {
    id: 19, name: 'Suunto A-10 Field Compass', category: 'Navigation', price: 2400, rating: 4.5, reviews: 298, badge: null,
    img: 'https://images.pexels.com/photos/346529/pexels-photo-346529.jpeg?auto=compress&w=400',
    images: [
      'https://images.pexels.com/photos/346529/pexels-photo-346529.jpeg?auto=compress&w=800',
      'https://images.pexels.com/photos/3608311/pexels-photo-3608311.jpeg?auto=compress&w=800',
      'https://images.pexels.com/photos/2365457/pexels-photo-2365457.jpeg?auto=compress&w=800',
      'https://images.pexels.com/photos/1365425/pexels-photo-1365425.jpeg?auto=compress&w=800',
    ],
    description: 'Liquid-filled baseplate compass with a clinometer and 1:25000 scale. Luminous bezel markings for night navigation. A reliable backup for any electronic device in the field.',
  },
  {
    id: 20, name: 'Garmin GPSMAP 67i', category: 'Navigation', price: 68000, rating: 4.9, reviews: 49, badge: 'Best Seller',
    img: 'https://images.pexels.com/photos/1365425/pexels-photo-1365425.jpeg?auto=compress&w=400',
    images: [
      'https://images.pexels.com/photos/1365425/pexels-photo-1365425.jpeg?auto=compress&w=800',
      'https://images.pexels.com/photos/3608311/pexels-photo-3608311.jpeg?auto=compress&w=800',
      'https://images.pexels.com/photos/346529/pexels-photo-346529.jpeg?auto=compress&w=800',
      'https://images.pexels.com/photos/2365457/pexels-photo-2365457.jpeg?auto=compress&w=800',
    ],
    description: 'Handheld GPS with built-in inReach satellite communication, 2.7-inch sunlight-readable display, and 36-hour Li-ion battery. Preloaded TopoActive maps cover all of Nepal at 1:24000 resolution.',
  },
  // ── Safety ─────────────────────────────────────────────────────────────────
  {
    id: 21, name: 'Adventure Medical Kits Mountain', category: 'Safety', price: 5800, rating: 4.8, reviews: 231, badge: 'Best Seller',
    img: 'https://images.pexels.com/photos/3735747/pexels-photo-3735747.jpeg?auto=compress&w=400',
    images: [
      'https://images.pexels.com/photos/3735747/pexels-photo-3735747.jpeg?auto=compress&w=800',
      'https://images.pexels.com/photos/1061640/pexels-photo-1061640.jpeg?auto=compress&w=800',
      'https://images.pexels.com/photos/2422265/pexels-photo-2422265.jpeg?auto=compress&w=800',
      'https://images.pexels.com/photos/618833/pexels-photo-618833.jpeg?auto=compress&w=800',
    ],
    description: '200+ medical supplies for up to 4 people over 10 days. Includes SAM splint, blister kit, QuikClot gauze, and a comprehensive first-aid guide. Waterproof roll-top bag weighs 620 g.',
  },
  {
    id: 22, name: 'Black Diamond Spot 400 Headlamp', category: 'Safety', price: 3200, rating: 4.7, reviews: 489, badge: null,
    img: 'https://images.pexels.com/photos/1061640/pexels-photo-1061640.jpeg?auto=compress&w=400',
    images: [
      'https://images.pexels.com/photos/1061640/pexels-photo-1061640.jpeg?auto=compress&w=800',
      'https://images.pexels.com/photos/3735747/pexels-photo-3735747.jpeg?auto=compress&w=800',
      'https://images.pexels.com/photos/2422265/pexels-photo-2422265.jpeg?auto=compress&w=800',
      'https://images.pexels.com/photos/1504557/pexels-photo-1504557.jpeg?auto=compress&w=800',
    ],
    description: '400-lumen waterproof headlamp with strobe, dimming, and red mode. Proximity and distance beams in a single light. PowerTap technology shifts instantly from full to dimmed with a single tap.',
  },
  {
    id: 23, name: 'SOL Escape Bivvy', category: 'Safety', price: 2600, rating: 4.5, reviews: 307, badge: null,
    img: 'https://images.pexels.com/photos/2422265/pexels-photo-2422265.jpeg?auto=compress&w=400',
    images: [
      'https://images.pexels.com/photos/2422265/pexels-photo-2422265.jpeg?auto=compress&w=800',
      'https://images.pexels.com/photos/1061640/pexels-photo-1061640.jpeg?auto=compress&w=800',
      'https://images.pexels.com/photos/3735747/pexels-photo-3735747.jpeg?auto=compress&w=800',
      'https://images.pexels.com/photos/618833/pexels-photo-618833.jpeg?auto=compress&w=800',
    ],
    description: 'Breathable aluminised shell reflects 70 % of radiated body heat. Fits one adult with room for a sleeping bag. Stuffs to fist size at 241 g — the lightest survival shelter in its class.',
  },
  {
    id: 24, name: 'Fox Whistle + Signal Mirror Combo', category: 'Safety', price: 950, rating: 4.4, reviews: 622, badge: 'New',
    img: 'https://images.pexels.com/photos/618833/pexels-photo-618833.jpeg?auto=compress&w=400',
    images: [
      'https://images.pexels.com/photos/618833/pexels-photo-618833.jpeg?auto=compress&w=800',
      'https://images.pexels.com/photos/3735747/pexels-photo-3735747.jpeg?auto=compress&w=800',
      'https://images.pexels.com/photos/1061640/pexels-photo-1061640.jpeg?auto=compress&w=800',
      'https://images.pexels.com/photos/2422265/pexels-photo-2422265.jpeg?auto=compress&w=800',
    ],
    description: '120 dB pealess whistle audible up to 2 km combined with an acrylic signal mirror visible to aircraft beyond 15 km. Both attach to a single carabiner — 18 g of emergency signalling capability.',
  },
];

const BADGE_COLORS: Record<string, string> = {
  'Best Seller': 'bg-amber-500/20 border-amber-400/40 text-amber-300',
  'Top Rated':   'bg-indigo-500/20 border-indigo-400/40 text-indigo-300',
  'New':         'bg-emerald-500/20 border-emerald-400/40 text-emerald-300',
};

const SHIPPING_THRESHOLD = 10000;
const SHIPPING_FEE       = 350;

// ── Component ────────────────────────────────────────────────────────────────
const Shop: React.FC = () => {
  const [activeCategory, setActiveCategory] = useState('All');
  const [search, setSearch]                 = useState('');
  const [cartItems, setCartItems]           = useState<CartItem[]>(() => {
    // Restore cart saved before login redirect
    try {
      const saved = sessionStorage.getItem('tb_pending_cart');
      if (saved) { sessionStorage.removeItem('tb_pending_cart'); return JSON.parse(saved); }
    } catch { /* ignore */ }
    return [];
  });
  const [cartOpen, setCartOpen]             = useState(() => {
    // Auto-open cart if we just returned from login with a saved cart
    try { return !!sessionStorage.getItem('tb_cart_open_after_login'); } catch { return false; }
  });

  // Clear the open-after-login flag once used
  useEffect(() => {
    try { sessionStorage.removeItem('tb_cart_open_after_login'); } catch { /* ignore */ }
  }, []);
  const [checkedOut, setCheckedOut]         = useState(false);
  const [detailsStep, setDetailsStep]       = useState(false);
  const [paymentStep, setPaymentStep]       = useState(false);
  const [paymentMethod, setPaymentMethod]   = useState<'cod' | 'khalti' | null>(null);
  const [customer, setCustomer]             = useState<CustomerInfo>({ name: '', phone: '', email: '', address: '', city: '' });
  const [detailsErrors, setDetailsErrors]   = useState<Record<string, string>>({});
  const [khaltiLoading, setKhaltiLoading]   = useState(false);
  const [orderSnapshot, setOrderSnapshot]   = useState<OrderSnapshot | null>(null);
  const [ordersOpen, setOrdersOpen]         = useState(false);
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [activeImg, setActiveImg]             = useState<string>('');
  const [, setSearchParams]                 = useSearchParams();
  const navigate                            = useNavigate();
  const { isAuthenticated, user }           = useAuth();
  const userOrdersKey                       = ordersKey(user?.id || user?.email);

  // Load orders scoped to the current user
  const [savedOrders, setSavedOrders]       = useState<OrderSnapshot[]>([]);
  useEffect(() => {
    try {
      const raw = localStorage.getItem(userOrdersKey);
      if (!raw) { setSavedOrders([]); return; }
      setSavedOrders(
        (JSON.parse(raw) as Array<OrderSnapshot & { placedAt: string }>).map(o => ({
          ...o, placedAt: new Date(o.placedAt), status: o.status ?? 'placed',
        }))
      );
    } catch { setSavedOrders([]); }
  }, [userOrdersKey]);


  // Reset active image whenever a new product is opened
  useEffect(() => {
    if (selectedProduct) setActiveImg(selectedProduct.images[0]);
  }, [selectedProduct]);

  // ── Cart helpers ───────────────────────────────────────────────────────────
  const addToCart = (product: Product) => {
    setCartItems(prev => {
      const existing = prev.find(i => i.product.id === product.id);
      if (existing) return prev.map(i => i.product.id === product.id ? { ...i, qty: i.qty + 1 } : i);
      return [...prev, { product, qty: 1 }];
    });
  };

  const changeQty = (id: number, delta: number) => {
    setCartItems(prev =>
      prev.flatMap(i => {
        if (i.product.id !== id) return [i];
        const next = i.qty + delta;
        return next <= 0 ? [] : [{ ...i, qty: next }];
      })
    );
  };

  const removeItem = (id: number) => setCartItems(prev => prev.filter(i => i.product.id !== id));
  const clearCart  = () => {
    setCartItems([]); setCheckedOut(false); setDetailsStep(false);
    setPaymentStep(false); setPaymentMethod(null); setOrderSnapshot(null);
    setCustomer({ name: '', phone: '', email: '', address: '', city: '' });
    setDetailsErrors({});
  };

  // ── Persist a new order to localStorage ───────────────────────────────────────
  const saveOrder = (snapshot: OrderSnapshot) => {
    setSavedOrders(prev => {
      const updated = [snapshot, ...prev];
      localStorage.setItem(userOrdersKey, JSON.stringify(updated));
      return updated;
    });
  };

  // ── Khalti payment initiation ─────────────────────────────────────────────
  const handleKhaltiPay = async () => {
    setKhaltiLoading(true);
    try {
      const token = localStorage.getItem('travelBuddyToken');
      if (!token) {
        alert('Your session has expired. Please log in again.');
        navigate('/login', { state: { from: '/shop' } });
        return;
      }
      const orderId = `TB-${Date.now()}`;
      sessionStorage.setItem('khalti_pending', JSON.stringify({ cartItems, customer, subtotal, shipping, total, orderId, paymentMethod: 'khalti' }));
      
      const data = await initiateKhaltiPayment({
        amount: total,
        orderId,
        orderName: `Travel Buddy Order (${totalItems} item${totalItems !== 1 ? 's' : ''})`,
        returnUrl: `${window.location.origin}/shop`,
        customer: {
          name: customer.name,
          email: customer.email || 'customer@travelbuddy.app',
          phone: customer.phone,
        },
      }, token);
      
      if (data.payment_url) {
        window.location.href = data.payment_url;
      } else {
        alert(data.error || 'Khalti payment initiation failed. Please try again.');
      }
    } catch (err: any) {
      console.error('Khalti payment error:', err);
      const errMsg = err?.message || 'Could not connect to Khalti. Please check your connection.';
      alert(errMsg);
    } finally {
      setKhaltiLoading(false);
    }
  };

  // ── Detect return from Khalti gateway ─────────────────────────────────────
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const status = params.get('status');
    const pidx   = params.get('pidx');
    if (status === 'Completed' && pidx) {
      const raw = sessionStorage.getItem('khalti_pending');
      if (raw) {
        const saved = JSON.parse(raw) as { cartItems: CartItem[]; customer: CustomerInfo; subtotal: number; shipping: number; total: number; orderId: string; paymentMethod: 'khalti' };
        const snap: OrderSnapshot = {
          orderId:       saved.orderId,
          placedAt:      new Date(),
          items:         saved.cartItems,
          customer:      saved.customer,
          subtotal:      saved.subtotal,
          shipping:      saved.shipping,
          total:         saved.total,
          paymentMethod: 'khalti',
          status:        'placed',
        };
        setCartItems(saved.cartItems);
        setCustomer(saved.customer);
        setPaymentMethod('khalti');
        setOrderSnapshot(snap);
        saveOrder(snap);
        setCheckedOut(true);
        setCartOpen(true);
        sessionStorage.removeItem('khalti_pending');
        setSearchParams({});
      }
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Place COD order ───────────────────────────────────────────────────────
  const placeCodOrder = () => {
    const snap: OrderSnapshot = {
      orderId:       `TB-${Date.now()}`,
      placedAt:      new Date(),
      items:         cartItems,
      customer,
      subtotal,
      shipping,
      total,
      paymentMethod: 'cod',
      status:        'placed',
    };
    setOrderSnapshot(snap);
    saveOrder(snap);
    setPaymentStep(false);
    setCheckedOut(true);
  };

  // ── Validate customer details & advance ───────────────────────────────────
  const validateAndProceed = () => {
    const errs: Record<string, string> = {};
    if (!customer.name.trim())    errs.name    = 'Name is required';
    if (!customer.phone.trim())   errs.phone   = 'Phone number is required';
    else if (!/^[9][6-9]\d{8}$/.test(customer.phone)) errs.phone = 'Enter a valid Nepal phone number (e.g. 98XXXXXXXX)';
    if (!customer.address.trim()) errs.address = 'Address is required';
    if (!customer.city.trim())    errs.city    = 'City / District is required';
    setDetailsErrors(errs);
    if (Object.keys(errs).length === 0) { setDetailsStep(false); setPaymentStep(true); }
  };


  const totalItems   = cartItems.reduce((s, i) => s + i.qty, 0);
  const subtotal     = cartItems.reduce((s, i) => s + i.product.price * i.qty, 0);
  const shippingFree = subtotal >= SHIPPING_THRESHOLD;
  const shipping     = subtotal === 0 ? 0 : shippingFree ? 0 : SHIPPING_FEE;
  const total        = subtotal + shipping;

  // ── Filtered products ──────────────────────────────────────────────────────
  const filtered = PRODUCTS.filter(p => {
    const matchCat    = activeCategory === 'All' || p.category === activeCategory;
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  return (
    <div className="min-h-screen w-full px-4 sm:px-6 lg:px-12 xl:px-16 py-8">

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white">Gear Shop</h1>
          <p className="text-white/55 text-sm mt-1">Premium trekking &amp; outdoor equipment for every adventure</p>
        </div>
        <div className="flex items-center gap-3 self-start sm:self-auto">
          <button
            onClick={() => setOrdersOpen(true)}
            className="relative flex items-center gap-2 px-5 py-2.5 rounded-xl glass-button-dark text-white font-semibold shadow-lg"
          >
            <ClipboardList className="w-5 h-5" />
            My Orders
            {savedOrders.length > 0 && (
              <span className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-purple-500 text-white text-[10px] font-bold flex items-center justify-center">
                {savedOrders.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setCartOpen(true)}
            className="relative flex items-center gap-2 px-5 py-2.5 rounded-xl glass-button-dark text-white font-semibold shadow-lg"
          >
            <ShoppingCart className="w-5 h-5" />
            Cart
            {totalItems > 0 && (
              <span className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-indigo-500 text-white text-[10px] font-bold flex items-center justify-center">
                {totalItems}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* ── Main layout: sidebar + grid ─────────────────────────────── */}
      <div className="flex gap-6 items-start">

        {/* ── Left Sidebar ─────────────────────────────────────────────── */}
        <aside className="w-52 shrink-0 flex flex-col gap-4 sticky top-24">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
            <input
              type="text" placeholder="Search gear..."
              value={search} onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2.5 rounded-xl glass-input text-sm text-white placeholder:text-white/35 focus:outline-none"
            />
          </div>

          {/* Categories */}
          <div className="glass-card rounded-2xl p-4 flex flex-col gap-1">
            <div className="flex items-center gap-2 mb-2 px-1">
              <SlidersHorizontal className="w-3.5 h-3.5 text-white/40" />
              <p className="text-white/40 text-[10px] uppercase tracking-widest font-semibold">Categories</p>
            </div>
            {CATEGORIES.map(cat => (
              <button key={cat.label} onClick={() => setActiveCategory(cat.label)}
                className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl border text-sm font-medium transition-all text-left w-full ${
                  activeCategory === cat.label
                    ? 'glass-button-dark border-transparent text-white'
                    : 'border-transparent text-white/50 hover:bg-white/5 hover:text-white/80'
                }`}>
                {cat.icon && <span className="shrink-0">{cat.icon}</span>}
                {cat.label}
              </button>
            ))}
          </div>

          <p className="text-white/35 text-xs px-1">{filtered.length} item{filtered.length !== 1 ? 's' : ''} found</p>
        </aside>

        {/* ── Product grid ─────────────────────────────────────────────── */}
        <div className="flex-1 min-w-0">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 gap-4">
              <Mountain className="w-12 h-12 text-white/20" />
              <p className="text-white/40 font-medium">No products found</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-5">
          {filtered.map(product => {
            const inCart = cartItems.find(i => i.product.id === product.id);
            return (
              <div key={product.id}
              onClick={() => setSelectedProduct(product)}
              className="glass-card rounded-2xl overflow-hidden flex flex-col group hover:border-white/30 transition-all duration-300 cursor-pointer">
                <div className="relative h-48 overflow-hidden">
                  <img
                    src={product.img.replace('?auto=compress&', '?auto=compress&cs=tinysrgb&')}
                    alt={product.name}
                    onError={(e) => { e.currentTarget.src = `https://placehold.co/400x300/1e1b4b/6366f1?text=${encodeURIComponent(product.name)}`; e.currentTarget.onerror = null; }}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                  {product.badge && (
                    <span className={`absolute top-3 left-3 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${BADGE_COLORS[product.badge]}`}>
                      {product.badge}
                    </span>
                  )}
                  <span className="absolute top-3 right-3 px-2 py-0.5 rounded-lg bg-black/40 backdrop-blur-sm text-[11px] text-white/70 border border-white/10">
                    {product.category}
                  </span>
                </div>

                <div className="p-4 flex flex-col gap-3 flex-1">
                  <h3 className="font-semibold text-white text-sm leading-snug">{product.name}</h3>

                  <div className="flex items-center gap-1.5">
                    <div className="flex items-center gap-0.5">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className={`w-3 h-3 ${i < Math.floor(product.rating) ? 'text-amber-400 fill-amber-400' : 'text-white/20'}`} />
                      ))}
                    </div>
                    <span className="text-xs text-white/55">{product.rating} ({product.reviews})</span>
                  </div>

                  <div className="flex items-center justify-between mt-auto">
                    <p className="text-white font-bold text-lg">
                      <span className="text-xs font-normal text-white/50 mr-0.5">NPR</span>
                      {product.price.toLocaleString()}
                    </p>

                    {inCart ? (
                      <div onClick={e => e.stopPropagation()} className="flex items-center gap-1 rounded-xl border border-indigo-400/40 bg-indigo-500/10 px-1 py-1">
                        <button onClick={() => changeQty(product.id, -1)}
                          className="w-6 h-6 flex items-center justify-center rounded-lg hover:bg-white/10 transition-all text-white/70">
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="text-white text-sm font-semibold w-5 text-center">{inCart.qty}</span>
                        <button onClick={() => changeQty(product.id, 1)}
                          className="w-6 h-6 flex items-center justify-center rounded-lg hover:bg-white/10 transition-all text-white/70">
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    ) : (
                      <button onClick={e => { e.stopPropagation(); addToCart(product); }}
                        className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl glass-button-dark text-white text-xs font-semibold transition-all">
                        <ShoppingCart className="w-3.5 h-3.5" /> Add to Cart
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
            </div>
          )}
        </div>{/* end flex-1 product area */}
      </div>{/* end sidebar + grid flex row */}

      {/* ── Product detail modal ──────────────────────────────────────── */}
      {selectedProduct && (
        <>
          <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-50" onClick={() => setSelectedProduct(null)} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
            <div
              onClick={e => e.stopPropagation()}
              className="pointer-events-auto w-full max-w-3xl glass-card rounded-3xl overflow-hidden flex flex-col md:flex-row shadow-2xl"
              style={{ maxHeight: '92vh' }}
            >
              {/* ── Left: image gallery ───────────────────────── */}
              <div className="md:w-96 shrink-0 flex flex-col bg-white/3">
                {/* Main image */}
                <div className="relative flex-1 min-h-64 md:min-h-0 overflow-hidden">
                  <img
                    key={activeImg}
                    src={(activeImg || selectedProduct.images[0]).replace('?auto=compress&', '?auto=compress&cs=tinysrgb&')}
                    alt={selectedProduct.name}
                    onError={(e) => { e.currentTarget.src = `https://placehold.co/800x600/1e1b4b/6366f1?text=${encodeURIComponent(selectedProduct.name)}`; e.currentTarget.onerror = null; }}
                    className="w-full h-full object-cover transition-opacity duration-200"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent pointer-events-none" />
                  {selectedProduct.badge && (
                    <span className={`absolute top-4 left-4 px-2.5 py-1 rounded-full text-[11px] font-semibold border ${BADGE_COLORS[selectedProduct.badge]}`}>
                      {selectedProduct.badge}
                    </span>
                  )}
                  <button
                    onClick={() => setSelectedProduct(null)}
                    className="md:hidden absolute top-3 right-3 p-1.5 rounded-lg bg-black/50 backdrop-blur-sm border border-white/15 text-white/80 hover:text-white transition-all">
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Thumbnail strip */}
                <div className="flex gap-2 p-3 bg-black/20 overflow-x-auto shrink-0">
                  {selectedProduct.images.map((src, idx) => (
                    <button
                      key={idx}
                      onClick={() => setActiveImg(src)}
                      className={`shrink-0 w-16 h-14 rounded-xl overflow-hidden border-2 transition-all ${
                        (activeImg || selectedProduct.images[0]) === src
                          ? 'border-indigo-400 opacity-100 scale-105'
                          : 'border-white/15 opacity-55 hover:opacity-90 hover:border-white/40'
                      }`}
                    >
                      <img
                        src={src.replace('?auto=compress&', '?auto=compress&cs=tinysrgb&').replace('w=800', 'w=120')}
                        alt={`view ${idx + 1}`}
                        onError={(e) => { e.currentTarget.src = 'https://placehold.co/120x96/1e1b4b/6366f1'; e.currentTarget.onerror = null; }}
                        className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              </div>

              {/* ── Right: product info ───────────────────────── */}
              <div className="flex flex-col flex-1 overflow-y-auto">
                {/* Sticky header */}
                <div className="flex items-start justify-between gap-3 px-6 pt-6 pb-4 border-b border-white/8">
                  <div>
                    <span className="text-xs text-indigo-300/70 uppercase tracking-widest font-medium">{selectedProduct.category}</span>
                    <h2 className="text-white font-bold text-xl leading-snug mt-0.5">{selectedProduct.name}</h2>
                  </div>
                  <button onClick={() => setSelectedProduct(null)}
                    className="hidden md:flex p-2 rounded-xl glass-button text-white/50 hover:text-white transition-all shrink-0 mt-0.5">
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex flex-col gap-4 px-6 py-5">
                  {/* Rating */}
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-0.5">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className={`w-4 h-4 ${i < Math.floor(selectedProduct.rating) ? 'text-amber-400 fill-amber-400' : 'text-white/20'}`} />
                      ))}
                    </div>
                    <span className="text-sm text-white font-semibold">{selectedProduct.rating}</span>
                    <span className="text-xs text-white/40">({selectedProduct.reviews} reviews)</span>
                  </div>

                  {/* Price */}
                  <div className="flex items-baseline gap-1">
                    <span className="text-white/45 text-sm">NPR</span>
                    <span className="text-white font-bold text-3xl">{selectedProduct.price.toLocaleString()}</span>
                  </div>

                  {/* Description */}
                  <p className="text-white/60 text-sm leading-relaxed">{selectedProduct.description}</p>

                  {/* Highlights */}
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { icon: <Tag className="w-3.5 h-3.5" />,     text: selectedProduct.badge ?? 'Standard' },
                      { icon: <Package className="w-3.5 h-3.5" />, text: 'Free shipping on NPR 10k+' },
                      { icon: <Shield className="w-3.5 h-3.5" />,  text: '1-year warranty' },
                      { icon: <Compass className="w-3.5 h-3.5" />, text: selectedProduct.category },
                    ].map((h, i) => (
                      <div key={i} className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-white/5 border border-white/8 text-white/55 text-xs">
                        {h.icon}{h.text}
                      </div>
                    ))}
                  </div>

                  {/* CTA */}
                  <div className="pt-2 mt-auto">
                    {(() => {
                      const inCart = cartItems.find(i => i.product.id === selectedProduct.id);
                      return inCart ? (
                        <div className="flex items-center justify-between rounded-2xl border border-indigo-400/40 bg-indigo-500/10 px-4 py-3">
                          <span className="text-white/60 text-sm">In cart</span>
                          <div className="flex items-center gap-3">
                            <button onClick={() => changeQty(selectedProduct.id, -1)}
                              className="w-8 h-8 flex items-center justify-center rounded-xl glass-button transition-all text-white">
                              <Minus className="w-3.5 h-3.5" />
                            </button>
                            <span className="text-white font-bold w-6 text-center text-lg">{inCart.qty}</span>
                            <button onClick={() => changeQty(selectedProduct.id, 1)}
                              className="w-8 h-8 flex items-center justify-center rounded-xl glass-button transition-all text-white">
                              <Plus className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button onClick={() => addToCart(selectedProduct)}
                          className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl glass-button-dark text-white font-semibold text-base transition-all">
                          <ShoppingCart className="w-5 h-5" /> Add to Cart
                        </button>
                      );
                    })()}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* ── Orders drawer backdrop ─────────────────────────────────────── */}
      {ordersOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40" onClick={() => setOrdersOpen(false)} />
      )}

      {/* ── Orders drawer ───────────────────────────────────────────────── */}
      <div
        className={`fixed top-0 right-0 h-full w-full max-w-md z-50 flex flex-col transition-transform duration-300 ease-in-out ${ordersOpen ? 'translate-x-0' : 'translate-x-full'}`}
        style={{ background: 'rgba(15,23,42,0.97)', backdropFilter: 'blur(20px)', borderLeft: '1px solid rgba(255,255,255,0.1)' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-white/10 shrink-0">
          <div className="flex items-center gap-2">
            <ClipboardList className="w-5 h-5 text-purple-400" />
            <h2 className="text-white font-bold text-lg">My Orders</h2>
            {savedOrders.length > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-purple-500/20 border border-purple-400/40 text-purple-300 text-xs font-semibold">
                {savedOrders.length}
              </span>
            )}
          </div>
          <button onClick={() => setOrdersOpen(false)}
            className="p-2 rounded-lg glass-button text-white/60 hover:text-white transition-all">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-4 flex flex-col gap-4">
          {savedOrders.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-4 text-center">
              <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
                <ClipboardList className="w-8 h-8 text-white/25" />
              </div>
              <p className="text-white/50 font-medium">No orders yet</p>
              <p className="text-white/35 text-sm">Your placed orders will appear here.</p>
              <button onClick={() => setOrdersOpen(false)}
                className="mt-2 flex items-center gap-1.5 px-5 py-2.5 rounded-xl glass-button-dark text-white text-sm font-semibold transition-all">
                Browse Shop <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          ) : (
            savedOrders.map((order) => {
              const expanded = expandedOrderId === order.orderId;
              return (
                <div key={order.orderId} className="glass-card rounded-2xl overflow-hidden">
                  {/* Order card header — always visible */}
                  <button
                    onClick={() => setExpandedOrderId(expanded ? null : order.orderId)}
                    className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-white/5 transition-all"
                  >
                    <div className="text-left">
                      <div className="flex items-center gap-2">
                        <p className="text-white font-semibold text-sm">{order.orderId}</p>
                        <span className="text-[10px] px-2 py-0.5 rounded-full border font-semibold bg-emerald-500/15 border-emerald-400/30 text-emerald-300">
                          COD
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <div className={`w-1.5 h-1.5 rounded-full ${
                          order.status === 'delivered'        ? 'bg-emerald-400' :
                          order.status === 'out_for_delivery' ? 'bg-amber-400 animate-pulse' :
                          order.status === 'processing'       ? 'bg-blue-400 animate-pulse' :
                                                                'bg-indigo-400 animate-pulse'
                        }`} />
                        <p className={`text-xs font-medium ${
                          order.status === 'delivered'        ? 'text-emerald-400' :
                          order.status === 'out_for_delivery' ? 'text-amber-400' :
                          order.status === 'processing'       ? 'text-blue-400' :
                                                                'text-indigo-400'
                        }`}>
                          {ORDER_STATUSES.find(s => s.key === order.status)?.label ?? 'Order Placed'}
                        </p>
                        <span className="text-white/25 text-xs">&middot;</span>
                        <p className="text-white/40 text-xs">
                          {order.placedAt.toLocaleDateString('en-NP', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <p className="text-indigo-300 font-bold text-sm">NPR {order.total.toLocaleString()}</p>
                      {expanded
                        ? <ChevronUp className="w-4 h-4 text-white/40" />
                        : <ChevronDown className="w-4 h-4 text-white/40" />}
                    </div>
                  </button>

                  {/* Expanded details */}
                  {expanded && (
                    <div className="px-4 pb-4 space-y-3 border-t border-white/10 pt-3">
                      {/* Placed timestamp */}
                      <p className="text-white/35 text-[11px]">
                        Placed on {order.placedAt.toLocaleDateString('en-NP', { day: '2-digit', month: 'long', year: 'numeric' })}
                        {' at '}
                        {order.placedAt.toLocaleTimeString('en-NP', { hour: '2-digit', minute: '2-digit' })}
                      </p>

                      {/* Items */}
                      <div className="space-y-2.5">
                        {order.items.map(i => (
                          <div key={i.product.id} className="flex items-center gap-3">
                            <img
                              src={i.product.img.replace('?auto=compress&', '?auto=compress&cs=tinysrgb&')}
                              alt={i.product.name}
                              onError={(e) => { e.currentTarget.src = 'https://placehold.co/36x36/1e1b4b/6366f1'; e.currentTarget.onerror = null; }}
                              className="w-9 h-9 rounded-lg object-cover shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="text-white text-xs font-semibold line-clamp-1">{i.product.name}</p>
                              <p className="text-white/40 text-[11px]">NPR {i.product.price.toLocaleString()} × {i.qty}</p>
                            </div>
                            <p className="text-white text-xs font-semibold shrink-0">NPR {(i.product.price * i.qty).toLocaleString()}</p>
                          </div>
                        ))}
                      </div>

                      {/* Price breakdown */}
                      <div className="space-y-1 border-t border-white/10 pt-2.5">
                        <div className="flex justify-between text-xs">
                          <span className="text-white/45">Subtotal</span>
                          <span className="text-white">NPR {order.subtotal.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="text-white/45">Shipping</span>
                          <span className={order.shipping === 0 ? 'text-emerald-400' : 'text-white'}>
                            {order.shipping === 0 ? 'FREE' : `NPR ${order.shipping.toLocaleString()}`}
                          </span>
                        </div>
                        <div className="flex justify-between font-bold text-sm pt-1 border-t border-white/10">
                          <span className="text-white">Total</span>
                          <span className="text-indigo-300">NPR {order.total.toLocaleString()}</span>
                        </div>
                      </div>

                      {/* Delivery Status Tracker */}
                      <div className="border-t border-white/10 pt-3">
                        <p className="text-white/40 text-[10px] uppercase tracking-widest mb-3">Delivery Status</p>
                        <div className="flex flex-col gap-0">
                          {ORDER_STATUSES.map((step, idx) => {
                            const activeIdx = ORDER_STATUSES.findIndex(s => s.key === order.status);
                            const isDone    = idx <= activeIdx;
                            const isCurrent = idx === activeIdx;
                            const isLast    = idx === ORDER_STATUSES.length - 1;
                            return (
                              <div key={step.key} className="flex items-start gap-3">
                                {/* Dot + line */}
                                <div className="flex flex-col items-center shrink-0">
                                  <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all ${
                                    isCurrent
                                      ? 'border-indigo-400 bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.6)]'
                                      : isDone
                                        ? 'border-emerald-400 bg-emerald-500'
                                        : 'border-white/15 bg-white/5'
                                  }`}>
                                    {isDone && !isCurrent && (
                                      <svg className="w-2 h-2 text-white" fill="currentColor" viewBox="0 0 12 12">
                                        <path d="M10 3L5 8.5 2 5.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
                                      </svg>
                                    )}
                                    {isCurrent && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                                  </div>
                                  {!isLast && (
                                    <div className={`w-0.5 h-6 mt-0.5 rounded-full ${
                                      idx < activeIdx ? 'bg-emerald-500/50' : 'bg-white/10'
                                    }`} />
                                  )}
                                </div>
                                {/* Label */}
                                <div className={`pb-5 ${isLast ? 'pb-0' : ''}`}>
                                  <p className={`text-xs font-semibold ${
                                    isCurrent ? 'text-indigo-300' : isDone ? 'text-white/80' : 'text-white/25'
                                  }`}>{step.label}</p>
                                  <p className={`text-[11px] mt-0.5 ${
                                    isCurrent ? 'text-white/55' : isDone ? 'text-white/35' : 'text-white/15'
                                  }`}>{step.desc}</p>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Delivery details */}
                      <div className="space-y-1.5 border-t border-white/10 pt-2.5">
                        <p className="text-white/40 text-[10px] uppercase tracking-widest mb-1">Delivered To</p>
                        <div className="flex items-center gap-2 text-xs">
                          <User className="w-3 h-3 text-white/30 shrink-0" />
                          <span className="text-white/80">{order.customer.name}</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs">
                          <Phone className="w-3 h-3 text-white/30 shrink-0" />
                          <span className="text-white/70">{order.customer.phone}</span>
                        </div>
                        {order.customer.email && (
                          <div className="flex items-center gap-2 text-xs">
                            <Mail className="w-3 h-3 text-white/30 shrink-0" />
                            <span className="text-white/70">{order.customer.email}</span>
                          </div>
                        )}
                        <div className="flex items-start gap-2 text-xs">
                          <MapPin className="w-3 h-3 text-white/30 shrink-0 mt-0.5" />
                          <span className="text-white/70">{order.customer.address}, {order.customer.city}</span>
                        </div>
                      </div>

                      {/* Payment badge */}
                      <div className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs ${
                        order.paymentMethod === 'khalti'
                          ? 'bg-purple-500/10 border-purple-400/30'
                          : 'bg-emerald-500/10 border-emerald-400/30'
                      }`}>
                        <span>{order.paymentMethod === 'khalti' ? '💜' : '💵'}</span>
                        <span className={order.paymentMethod === 'khalti' ? 'text-purple-300 font-semibold' : 'text-emerald-300 font-semibold'}>
                          {order.paymentMethod === 'khalti' ? 'Paid via Khalti' : 'Cash on Delivery'}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* ── Cart drawer backdrop ────────────────────────────────────────── */}
      {cartOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40" onClick={() => setCartOpen(false)} />
      )}

      {/* ── Cart drawer ─────────────────────────────────────────────────── */}
      <div
        className={`fixed top-0 right-0 h-full w-full max-w-md z-50 flex flex-col transition-transform duration-300 ease-in-out ${cartOpen ? 'translate-x-0' : 'translate-x-full'}`}
        style={{ background: 'rgba(15,23,42,0.97)', backdropFilter: 'blur(20px)', borderLeft: '1px solid rgba(255,255,255,0.1)' }}
      >
        {/* Drawer header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-white/10 shrink-0">
          <div className="flex items-center gap-2">
            <ShoppingCart className="w-5 h-5 text-indigo-400" />
            <h2 className="text-white font-bold text-lg">Your Cart</h2>
            {totalItems > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-indigo-500/20 border border-indigo-400/40 text-indigo-300 text-xs font-semibold">
                {totalItems} item{totalItems !== 1 ? 's' : ''}
              </span>
            )}
          </div>
          <button onClick={() => setCartOpen(false)}
            className="p-2 rounded-lg glass-button text-white/60 hover:text-white transition-all">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Drawer body */}
        <div className="flex-1 overflow-y-auto px-6 py-4 flex flex-col gap-4">
          {checkedOut && orderSnapshot ? (
            /* ── Order confirmed — full receipt ── */
            <div className="flex flex-col gap-4 py-2 pb-6">
              {/* Header */}
              <div className="flex flex-col items-center text-center gap-3 py-4">
                <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center">
                  <Package className="w-8 h-8 text-emerald-400" />
                </div>
                <div>
                  <h3 className="text-white font-bold text-xl">Order Placed! 🎉</h3>
                  <p className="text-white/55 text-sm mt-1">Your gear is on its way. Estimated delivery in 3–5 business days.</p>
                </div>
              </div>

              {/* Order meta */}
              <div className="flex justify-between items-start px-4 py-3 rounded-xl bg-white/5 border border-white/10">
                <div>
                  <p className="text-white/40 text-[10px] uppercase tracking-widest">Order ID</p>
                  <p className="text-indigo-300 font-mono font-semibold text-sm mt-0.5">{orderSnapshot.orderId}</p>
                </div>
                <div className="text-right">
                  <p className="text-white/40 text-[10px] uppercase tracking-widest">Placed At</p>
                  <p className="text-white/70 text-sm mt-0.5">
                    {orderSnapshot.placedAt.toLocaleDateString('en-NP', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </p>
                  <p className="text-white/40 text-xs">
                    {orderSnapshot.placedAt.toLocaleTimeString('en-NP', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>

              {/* Items */}
              <div className="glass-card rounded-xl p-4 space-y-3">
                <p className="text-white/40 text-[10px] uppercase tracking-widest">Items Ordered</p>
                {orderSnapshot.items.map(i => (
                  <div key={i.product.id} className="flex items-center gap-3">
                    <img
                      src={i.product.img.replace('?auto=compress&', '?auto=compress&cs=tinysrgb&')}
                      alt={i.product.name}
                      onError={(e) => { e.currentTarget.src = 'https://placehold.co/40x40/1e1b4b/6366f1'; e.currentTarget.onerror = null; }}
                      className="w-10 h-10 rounded-lg object-cover shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-xs font-semibold line-clamp-1">{i.product.name}</p>
                      <p className="text-white/40 text-[11px]">NPR {i.product.price.toLocaleString()} × {i.qty}</p>
                    </div>
                    <p className="text-white font-semibold text-sm shrink-0">NPR {(i.product.price * i.qty).toLocaleString()}</p>
                  </div>
                ))}
                {/* Price breakdown */}
                <div className="border-t border-white/10 pt-3 space-y-1.5">
                  <div className="flex justify-between text-sm">
                    <span className="text-white/50">Subtotal</span>
                    <span className="text-white">NPR {orderSnapshot.subtotal.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-white/50">Shipping</span>
                    <span className={orderSnapshot.shipping === 0 ? 'text-emerald-400' : 'text-white'}>
                      {orderSnapshot.shipping === 0 ? 'FREE' : `NPR ${orderSnapshot.shipping.toLocaleString()}`}
                    </span>
                  </div>
                  <div className="flex justify-between font-bold text-base pt-1 border-t border-white/10">
                    <span className="text-white">Total Paid</span>
                    <span className="text-indigo-300">NPR {orderSnapshot.total.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Delivery info */}
              <div className="glass-card rounded-xl p-4 space-y-2">
                <p className="text-white/40 text-[10px] uppercase tracking-widest mb-2">Deliver To</p>
                <div className="flex items-center gap-2 text-sm">
                  <User className="w-3.5 h-3.5 text-white/30 shrink-0" />
                  <span className="text-white/85 font-medium">{orderSnapshot.customer.name}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="w-3.5 h-3.5 text-white/30 shrink-0" />
                  <span className="text-white/75">{orderSnapshot.customer.phone}</span>
                </div>
                {orderSnapshot.customer.email && (
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="w-3.5 h-3.5 text-white/30 shrink-0" />
                    <span className="text-white/75">{orderSnapshot.customer.email}</span>
                  </div>
                )}
                <div className="flex items-start gap-2 text-sm">
                  <MapPin className="w-3.5 h-3.5 text-white/30 shrink-0 mt-0.5" />
                  <span className="text-white/75">{orderSnapshot.customer.address}, {orderSnapshot.customer.city}</span>
                </div>
              </div>

              {/* Delivery status on confirmation */}
              <div className="w-full px-4 py-3 rounded-xl border bg-emerald-500/10 border-emerald-400/30">
                <p className="text-white/40 text-[10px] uppercase tracking-widest mb-2">Delivery Status</p>
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 rounded-full border-2 border-indigo-400 bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.6)] flex items-center justify-center shrink-0">
                    <div className="w-1.5 h-1.5 rounded-full bg-white" />
                  </div>
                  <div>
                    <p className="text-indigo-300 text-sm font-semibold">Order Placed</p>
                    <p className="text-white/45 text-xs">Estimated delivery in 3–5 business days</p>
                  </div>
                </div>
              </div>

              {/* Payment method */}
              <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border ${
                orderSnapshot.paymentMethod === 'khalti'
                  ? 'bg-purple-500/10 border-purple-400/30'
                  : 'bg-emerald-500/10 border-emerald-400/30'
              }`}>
                <span className="text-xl">{orderSnapshot.paymentMethod === 'khalti' ? '💜' : '💵'}</span>
                <div>
                  <p className="text-white/40 text-[10px] uppercase tracking-widest">Payment</p>
                  <p className={`text-sm font-semibold ${
                    orderSnapshot.paymentMethod === 'khalti' ? 'text-purple-300' : 'text-emerald-300'
                  }`}>
                    {orderSnapshot.paymentMethod === 'khalti' ? 'Paid via Khalti' : 'Cash on Delivery'}
                  </p>
                </div>
              </div>

              <button onClick={() => { setCartOpen(false); clearCart(); }}
                className="w-full py-3 rounded-xl glass-button-dark text-white font-semibold transition-all">
                Continue Shopping
              </button>
              <button onClick={() => { setCartOpen(false); clearCart(); setOrdersOpen(true); }}
                className="w-full flex items-center justify-center gap-2 text-sm text-white/50 hover:text-purple-300 transition-all py-1">
                <ClipboardList className="w-4 h-4" /> View all my orders
              </button>
            </div>
          ) : detailsStep ? (
            /* ── Customer details form ── */
            <div className="flex flex-col gap-4 py-2">
              <div>
                <button onClick={() => setDetailsStep(false)}
                  className="flex items-center gap-1.5 text-xs text-white/40 hover:text-white/70 transition-all mb-4">
                  <ChevronRight className="w-3.5 h-3.5 rotate-180" /> Back to cart
                </button>
                <h3 className="text-white font-bold text-lg">Delivery Details</h3>
                <p className="text-white/45 text-sm mt-1">Where should we send your gear?</p>
              </div>

              {/* Full Name */}
              <div>
                <label className="text-white/60 text-xs mb-1.5 block">Full Name <span className="text-red-400">*</span></label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                  <input type="text" placeholder="e.g. Aasim Khan" value={customer.name}
                    onChange={e => setCustomer(c => ({ ...c, name: e.target.value }))}
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl glass-input text-sm" />
                </div>
                {detailsErrors.name && <p className="text-red-400 text-xs mt-1">{detailsErrors.name}</p>}
              </div>

              {/* Phone */}
              <div>
                <label className="text-white/60 text-xs mb-1.5 block">Phone Number <span className="text-red-400">*</span></label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                  <input type="tel" placeholder="98XXXXXXXX" value={customer.phone}
                    onChange={e => setCustomer(c => ({ ...c, phone: e.target.value }))}
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl glass-input text-sm" />
                </div>
                {detailsErrors.phone && <p className="text-red-400 text-xs mt-1">{detailsErrors.phone}</p>}
              </div>

              {/* Email */}
              <div>
                <label className="text-white/60 text-xs mb-1.5 block">Email Address <span className="text-white/30 font-normal">(optional)</span></label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                  <input type="email" placeholder="you@example.com" value={customer.email}
                    onChange={e => setCustomer(c => ({ ...c, email: e.target.value }))}
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl glass-input text-sm" />
                </div>
              </div>

              {/* Street Address */}
              <div>
                <label className="text-white/60 text-xs mb-1.5 block">Street Address <span className="text-red-400">*</span></label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3 w-4 h-4 text-white/30" />
                  <textarea placeholder="House / Street / Ward" rows={2} value={customer.address}
                    onChange={e => setCustomer(c => ({ ...c, address: e.target.value }))}
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl glass-input text-sm resize-none" />
                </div>
                {detailsErrors.address && <p className="text-red-400 text-xs mt-1">{detailsErrors.address}</p>}
              </div>

              {/* City */}
              <div>
                <label className="text-white/60 text-xs mb-1.5 block">City / District <span className="text-red-400">*</span></label>
                <input type="text" placeholder="e.g. Kathmandu" value={customer.city}
                  onChange={e => setCustomer(c => ({ ...c, city: e.target.value }))}
                  className="w-full px-3 py-2.5 rounded-xl glass-input text-sm" />
                {detailsErrors.city && <p className="text-red-400 text-xs mt-1">{detailsErrors.city}</p>}
              </div>

              <button onClick={validateAndProceed}
                className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl glass-button-dark text-white font-bold text-sm transition-all mt-1">
                Continue to Payment <ChevronRight className="w-4 h-4" />
              </button>
            </div>

          ) : paymentStep ? (
            /* ── Payment method selection ── */
            <div className="flex flex-col gap-5 py-2">
              <div>
                <button onClick={() => { setPaymentStep(false); setDetailsStep(true); }}
                  className="flex items-center gap-1.5 text-xs text-white/40 hover:text-white/70 transition-all mb-4">
                  <ChevronRight className="w-3.5 h-3.5 rotate-180" /> Back to cart
                </button>
                <h3 className="text-white font-bold text-lg">Select Payment Method</h3>
                <p className="text-white/45 text-sm mt-1">Choose how you'd like to pay</p>
              </div>

              {/* Cash on Delivery */}
              <button
                onClick={() => setPaymentMethod(paymentMethod === 'cod' ? null : 'cod')}
                className={`w-full flex items-center gap-4 px-4 py-4 rounded-2xl border transition-all ${
                  paymentMethod === 'cod'
                    ? 'bg-emerald-500/15 border-emerald-400/50'
                    : 'bg-white/5 border-white/10 hover:border-white/20'
                }`}
              >
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-xl shrink-0 ${
                  paymentMethod === 'cod' ? 'bg-emerald-500/20' : 'bg-white/5'
                }`}>💵</div>
                <div className="text-left flex-1">
                  <p className="text-white font-semibold text-sm">Cash on Delivery</p>
                  <p className="text-white/45 text-xs mt-0.5">Pay when your order arrives</p>
                </div>
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
                  paymentMethod === 'cod' ? 'border-emerald-400 bg-emerald-400' : 'border-white/20'
                }`}>
                  {paymentMethod === 'cod' && <div className="w-2 h-2 rounded-full bg-white" />}
                </div>
              </button>

              {/* Pay by Khalti */}
              <button
                onClick={() => setPaymentMethod(paymentMethod === 'khalti' ? null : 'khalti')}
                className={`w-full flex items-center gap-4 px-4 py-4 rounded-2xl border transition-all ${
                  paymentMethod === 'khalti'
                    ? 'bg-purple-500/15 border-purple-400/50'
                    : 'bg-white/5 border-white/10 hover:border-white/20'
                }`}
              >
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${
                  paymentMethod === 'khalti' ? 'bg-purple-500/20' : 'bg-white/5'
                }`}>
                  <span className="text-xl">💜</span>
                </div>
                <div className="text-left flex-1">
                  <p className="text-white font-semibold text-sm">Pay by Khalti</p>
                  <p className="text-white/45 text-xs mt-0.5">Fast & secure digital payment</p>
                </div>
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
                  paymentMethod === 'khalti' ? 'border-purple-400 bg-purple-400' : 'border-white/20'
                }`}>
                  {paymentMethod === 'khalti' && <div className="w-2 h-2 rounded-full bg-white" />}
                </div>
              </button>

              {/* Place Order button */}
              <button
                disabled={!paymentMethod || khaltiLoading}
                onClick={() => {
                  if (!paymentMethod) return;
                  if (paymentMethod === 'khalti') {
                    handleKhaltiPay();
                  } else {
                    placeCodOrder();
                  }
                }}
                className={`w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-bold text-sm transition-all shadow-lg mt-2 ${
                  paymentMethod && !khaltiLoading
                    ? 'glass-button-dark cursor-pointer'
                    : 'bg-white/5 border border-white/10 text-white/30 cursor-not-allowed'
                }`}
              >
                {khaltiLoading ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Redirecting to Khalti…</>
                ) : (
                  <>Place Order — NPR {total.toLocaleString()} <ChevronRight className="w-4 h-4" /></>
                )}
              </button>
            </div>
          ) : cartItems.length === 0 ? (
            /* ── Empty cart ── */
            <div className="flex flex-col items-center justify-center h-full gap-4 text-center">
              <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
                <ShoppingCart className="w-8 h-8 text-white/25" />
              </div>
              <p className="text-white/50 font-medium">Your cart is empty</p>
              <p className="text-white/35 text-sm">Browse the shop and add some gear!</p>
              <button onClick={() => setCartOpen(false)}
                className="mt-2 flex items-center gap-1.5 px-5 py-2.5 rounded-xl glass-button-dark text-white text-sm font-semibold transition-all">
                Browse Shop <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          ) : (
            /* ── Cart items list ── */
            <>
              {cartItems.map(({ product, qty }) => (
                <div key={product.id} className="flex gap-3 glass-card rounded-xl p-3">
                  <img
                    src={product.img.replace('?auto=compress&', '?auto=compress&cs=tinysrgb&')}
                    alt={product.name}
                    onError={(e) => { e.currentTarget.src = `https://placehold.co/64x64/1e1b4b/6366f1?text=${encodeURIComponent(product.category)}`; e.currentTarget.onerror = null; }}
                    className="w-16 h-16 rounded-lg object-cover shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-semibold leading-snug line-clamp-2 mb-1">{product.name}</p>
                    <p className="text-indigo-300 text-sm font-bold">NPR {(product.price * qty).toLocaleString()}</p>
                    <p className="text-white/35 text-[11px]">NPR {product.price.toLocaleString()} each</p>
                  </div>
                  <div className="flex flex-col items-end justify-between shrink-0">
                    <button onClick={() => removeItem(product.id)}
                      className="p-1 rounded hover:bg-red-500/20 text-white/40 hover:text-red-400 transition-all">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                    <div className="flex items-center gap-1 rounded-lg border border-white/10 bg-white/5 px-1 py-0.5">
                      <button onClick={() => changeQty(product.id, -1)}
                        className="w-5 h-5 flex items-center justify-center rounded hover:bg-white/10 text-white/60 transition-all">
                        <Minus className="w-2.5 h-2.5" />
                      </button>
                      <span className="text-white text-xs font-semibold w-4 text-center">{qty}</span>
                      <button onClick={() => changeQty(product.id, 1)}
                        className="w-5 h-5 flex items-center justify-center rounded hover:bg-white/10 text-white/60 transition-all">
                        <Plus className="w-2.5 h-2.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              <button onClick={clearCart}
                className="flex items-center gap-1.5 text-xs text-white/40 hover:text-red-400 transition-all self-end">
                <Trash2 className="w-3.5 h-3.5" /> Clear all
              </button>
            </>
          )}
        </div>

        {/* Drawer footer — order summary + checkout */}
        {!checkedOut && !paymentStep && !detailsStep && cartItems.length > 0 && (
          <div className="px-6 py-5 border-t border-white/10 shrink-0 space-y-4">
            {/* Free shipping banner */}
            {!shippingFree ? (
              <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-amber-500/10 border border-amber-400/20">
                <Tag className="w-4 h-4 text-amber-400 shrink-0" />
                <p className="text-xs text-amber-300">
                  Add <span className="font-bold">NPR {(SHIPPING_THRESHOLD - subtotal).toLocaleString()}</span> more for free shipping!
                </p>
              </div>
            ) : (
              <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-emerald-500/10 border border-emerald-400/20">
                <Tag className="w-4 h-4 text-emerald-400 shrink-0" />
                <p className="text-xs text-emerald-300 font-medium">🎉 Free shipping unlocked!</p>
              </div>
            )}

            {/* Totals */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-white/55">Subtotal</span>
                <span className="text-white">NPR {subtotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-white/55">Shipping</span>
                <span className={shippingFree ? 'text-emerald-400 font-medium' : 'text-white'}>
                  {shippingFree ? 'FREE' : `NPR ${SHIPPING_FEE.toLocaleString()}`}
                </span>
              </div>
              <div className="flex justify-between font-bold text-base pt-2 border-t border-white/10">
                <span className="text-white">Total</span>
                <span className="text-indigo-300 text-lg">NPR {total.toLocaleString()}</span>
              </div>
            </div>

            {/* Checkout button */}
            {isAuthenticated ? (
              <button
                onClick={() => setDetailsStep(true)}
                className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl glass-button-dark text-white font-bold text-sm transition-all"
              >
                Checkout — NPR {total.toLocaleString()} <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <div className="space-y-2">
                <div className="flex items-start gap-3 px-3 py-3 rounded-xl bg-amber-500/10 border border-amber-400/25">
                  <LogIn className="w-4 h-4 text-amber-300 shrink-0 mt-0.5" />
                  <p className="text-xs text-amber-200 leading-relaxed">
                    You need to be logged in to place an order.
                  </p>
                </div>
                <button
                  onClick={() => {
                    try {
                      sessionStorage.setItem('tb_pending_cart', JSON.stringify(cartItems));
                      sessionStorage.setItem('tb_cart_open_after_login', '1');
                    } catch { /* ignore */ }
                    navigate('/login', { state: { from: '/shop' } });
                  }}
                  className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl glass-button-dark text-white font-bold text-sm transition-all"
                >
                  <LogIn className="w-4 h-4" /> Log in to Checkout
                </button>
                <button
                  onClick={() => navigate('/signup')}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl glass-button text-white text-sm font-medium transition-all"
                >
                  Create a free account
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Shop;
