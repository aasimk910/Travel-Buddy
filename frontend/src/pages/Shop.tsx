// src/pages/Shop.tsx
// E-commerce shop page for outdoor/travel gear with cart, checkout, and Khalti payment.
// #region Imports
import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  ShoppingCart, Star, Search, SlidersHorizontal, Backpack, Tent,
  Camera, Mountain, Compass, Shield, X, Plus, Minus, Trash2,
  Package, ChevronRight, Tag, User, Phone, Mail, MapPin, Loader2,
  ClipboardList, ChevronDown, ChevronUp, LogIn, PartyPopper, Wallet, Banknote, CheckCircle, Check, Heart,
} from 'lucide-react';
import { API_BASE_URL } from '../config/env';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { initiateKhaltiPayment } from '../services/payment';
import PaymentSuccessModal from '../components/common/PaymentSuccessModal';
import { getToken } from "../services/auth";
// #endregion Imports

// #region Helpers
const LS_ORDERS_KEY = 'tb_saved_orders';
// Handles ordersKey logic.
const ordersKey = (userId?: string) => userId ? `${LS_ORDERS_KEY}_${userId}` : LS_ORDERS_KEY;
// #endregion Helpers

// #region Types
// -- Types --------------------------------------------------------------------
interface Product {
  _id: string; name: string; category: string;
  price: number; rating: number; reviews: number;
  badge: string | null; img: string;
  images: string[];
  description: string;
  stock?: number;
  inStock?: boolean;
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
  status: 'placed' | 'processing' | 'out_for_delivery' | 'delivered' | 'cancelled';
}
// #endregion Types

// #region Data
const ORDER_STATUSES: { key: OrderSnapshot['status']; label: string; desc: string }[] = [
  { key: 'placed',           label: 'Order Placed',     desc: 'We received your order' },
  { key: 'processing',      label: 'Processing',       desc: 'Preparing your gear' },
  { key: 'out_for_delivery', label: 'Out for Delivery', desc: 'On the way to you' },
  { key: 'delivered',        label: 'Delivered',        desc: 'Enjoy your gear!' },
];

// -- Data ---------------------------------------------------------------------
const CATEGORIES = [
  { label: 'All',         icon: null },
  { label: 'Backpacks',   icon: <Backpack  className="w-3.5 h-3.5" /> },
  { label: 'Camping',     icon: <Tent      className="w-3.5 h-3.5" /> },
  { label: 'Photography', icon: <Camera    className="w-3.5 h-3.5" /> },
  { label: 'Footwear',    icon: <Mountain  className="w-3.5 h-3.5" /> },
  { label: 'Navigation',  icon: <Compass   className="w-3.5 h-3.5" /> },
  { label: 'Safety',      icon: <Shield    className="w-3.5 h-3.5" /> },
];

// Products are now loaded from the backend — this static list is kept only as a
// loading fallback and will be replaced once the API responds.
const STATIC_PRODUCTS: Product[] = [
  // -- Backpacks --------------------------------------------------------------
  {
    _id: "1", name: 'Osprey Atmos AG 65L', category: 'Backpacks', price: 24500, rating: 4.9, reviews: 512, badge: 'Best Seller',
    img: 'https://images.pexels.com/photos/1365425/pexels-photo-1365425.jpeg?auto=compress&w=400',
    images: [
      'https://images.pexels.com/photos/1365425/pexels-photo-1365425.jpeg?auto=compress&w=800',
      'https://images.pexels.com/photos/2166456/pexels-photo-2166456.jpeg?auto=compress&w=800',
      'https://images.pexels.com/photos/3278215/pexels-photo-3278215.jpeg?auto=compress&w=800',
      'https://images.pexels.com/photos/1271620/pexels-photo-1271620.jpeg?auto=compress&w=800',
    ],
    description: 'Award-winning 65 L Anti-Gravity suspension pack weighing 2.07 kg. The mesh trampoline back panel floats the load off your spine and channels air through the entire back. Ideal for multi-day Himalayan treks with heavy food carries.',
  },
  {
    _id: "2", name: 'Deuter Futura Pro 36L', category: 'Backpacks', price: 11200, rating: 4.7, reviews: 223, badge: null,
    img: 'https://images.pexels.com/photos/2385210/pexels-photo-2385210.jpeg?auto=compress&w=400',
    images: [
      'https://images.pexels.com/photos/2385210/pexels-photo-2385210.jpeg?auto=compress&w=800',
      'https://images.pexels.com/photos/1153369/pexels-photo-1153369.jpeg?auto=compress&w=800',
      'https://images.pexels.com/photos/1271620/pexels-photo-1271620.jpeg?auto=compress&w=800',
      'https://images.pexels.com/photos/2166456/pexels-photo-2166456.jpeg?auto=compress&w=800',
    ],
    description: 'Spacious 36 L trekking pack with Aircomfort Vari-Flex back system that self-adjusts to your stride. Generous 26 cm height adjustment range, twin hip-belt pockets, and a separate lower compartment for wet gear.',
  },
  {
    _id: "3", name: 'Gregory Baltoro 75L', category: 'Backpacks', price: 23500, rating: 4.8, reviews: 115, badge: 'Top Rated',
    img: 'https://images.pexels.com/photos/2166456/pexels-photo-2166456.jpeg?auto=compress&w=400',
    images: [
      'https://images.pexels.com/photos/2166456/pexels-photo-2166456.jpeg?auto=compress&w=800',
      'https://images.pexels.com/photos/1271620/pexels-photo-1271620.jpeg?auto=compress&w=800',
      'https://images.pexels.com/photos/2385210/pexels-photo-2385210.jpeg?auto=compress&w=800',
      'https://images.pexels.com/photos/3278215/pexels-photo-3278215.jpeg?auto=compress&w=800',
    ],
    description: 'Industry benchmark for load-hauling comfort on extended expeditions. Response A3 hip-belt auto-adjusts with every step. Dual ice-axe loops, a rain cover, and a floating top lid make it fully expedition-ready.',
  },
  {
    _id: "4", name: 'Tortuga Setout 45L Travel Pack', category: 'Backpacks', price: 6800, rating: 4.6, reviews: 176, badge: 'New',
    img: 'https://images.pexels.com/photos/3278215/pexels-photo-3278215.jpeg?auto=compress&w=400',
    images: [
      'https://images.pexels.com/photos/3278215/pexels-photo-3278215.jpeg?auto=compress&w=800',
      'https://images.pexels.com/photos/2385210/pexels-photo-2385210.jpeg?auto=compress&w=800',
      'https://images.pexels.com/photos/1153369/pexels-photo-1153369.jpeg?auto=compress&w=800',
      'https://images.pexels.com/photos/1365425/pexels-photo-1365425.jpeg?auto=compress&w=800',
    ],
    description: 'Carry-on compliant 45 L travel pack with a clamshell opening, lockable zippers, and padded laptop sleeve. Hip-belt stows away when not needed. Durable 420D nylon handles monsoon conditions on the trail to Lukla.',
  },
  // -- Camping ----------------------------------------------------------------
  {
    _id: "5", name: 'Big Agnes Copper Spur HV UL 2P', category: 'Camping', price: 32000, rating: 4.9, reviews: 241, badge: 'Best Seller',
    img: 'https://images.pexels.com/photos/1525041/pexels-photo-1525041.jpeg?auto=compress&w=400',
    images: [
      'https://images.pexels.com/photos/1525041/pexels-photo-1525041.jpeg?auto=compress&w=800',
      'https://images.pexels.com/photos/2422265/pexels-photo-2422265.jpeg?auto=compress&w=800',
      'https://images.pexels.com/photos/1061640/pexels-photo-1061640.jpeg?auto=compress&w=800',
      'https://images.pexels.com/photos/618833/pexels-photo-618833.jpeg?auto=compress&w=800',
    ],
    description: 'Featherlight freestanding 2-person tent at just 1.06 kg. Hub-and-pole architecture erects in 3 minutes. Dual vestibules provide 1.1 m— of gear storage each. 1500 mm rated fly handles Himalayan rain squalls with ease.',
  },
  {
    _id: "6", name: 'Western Mountaineering Alpinlite 35°F Bag', category: 'Camping', price: 18500, rating: 4.8, reviews: 178, badge: null,
    img: 'https://images.pexels.com/photos/1504557/pexels-photo-1504557.jpeg?auto=compress&w=400',
    images: [
      'https://images.pexels.com/photos/1504557/pexels-photo-1504557.jpeg?auto=compress&w=800',
      'https://images.pexels.com/photos/1525041/pexels-photo-1525041.jpeg?auto=compress&w=800',
      'https://images.pexels.com/photos/2422265/pexels-photo-2422265.jpeg?auto=compress&w=800',
      'https://images.pexels.com/photos/618833/pexels-photo-618833.jpeg?auto=compress&w=800',
    ],
    description: '850-fill power goose down in an ultralight 11 oz body. Comfort rating 2 °C, lower limit -4 °C. Full-length draft collar and anti-snag YKK zipper. The preferred high-altitude sleeping bag on Everest expedition teams.',
  },
  {
    _id: "7", name: 'Jetboil Flash Cooking System', category: 'Camping', price: 7800, rating: 4.9, reviews: 334, badge: 'Top Rated',
    img: 'https://images.pexels.com/photos/6271625/pexels-photo-6271625.jpeg?auto=compress&w=400',
    images: [
      'https://images.pexels.com/photos/6271625/pexels-photo-6271625.jpeg?auto=compress&w=800',
      'https://images.pexels.com/photos/1504557/pexels-photo-1504557.jpeg?auto=compress&w=800',
      'https://images.pexels.com/photos/1525041/pexels-photo-1525041.jpeg?auto=compress&w=800',
      'https://images.pexels.com/photos/2422265/pexels-photo-2422265.jpeg?auto=compress&w=800',
    ],
    description: 'All-in-one stove-and-pot system that boils 500 ml in just 100 seconds. Push-button igniter, insulating cozy, and colour-change heat indicator. FluxRing technology is 50 % more fuel efficient than conventional stoves at altitude.',
  },
  {
    _id: "8", name: 'Therm-a-Rest NeoAir XTherm NXT', category: 'Camping', price: 13500, rating: 4.7, reviews: 156, badge: null,
    img: 'https://images.pexels.com/photos/2422265/pexels-photo-2422265.jpeg?auto=compress&w=400',
    images: [
      'https://images.pexels.com/photos/2422265/pexels-photo-2422265.jpeg?auto=compress&w=800',
      'https://images.pexels.com/photos/1504557/pexels-photo-1504557.jpeg?auto=compress&w=800',
      'https://images.pexels.com/photos/618833/pexels-photo-618833.jpeg?auto=compress&w=800',
      'https://images.pexels.com/photos/1525041/pexels-photo-1525041.jpeg?auto=compress&w=800',
    ],
    description: 'R-value of 7.3 in a 430 g inflatable pad — the highest warmth-to-weight ratio available. Triangular Core Matrix baffles maximise insulation without bulk. WingLock valve inflates fully in 10 breaths and seals airtight.',
  },
  // -- Footwear ---------------------------------------------------------------
  {
    _id: "9", name: 'Salomon X Ultra 4 Mid GTX', category: 'Footwear', price: 13800, rating: 4.8, reviews: 389, badge: 'Best Seller',
    img: 'https://images.pexels.com/photos/2529148/pexels-photo-2529148.jpeg?auto=compress&w=400',
    images: [
      'https://images.pexels.com/photos/2529148/pexels-photo-2529148.jpeg?auto=compress&w=800',
      'https://images.pexels.com/photos/1464625/pexels-photo-1464625.jpeg?auto=compress&w=800',
      'https://images.pexels.com/photos/1619535/pexels-photo-1619535.jpeg?auto=compress&w=800',
      'https://images.pexels.com/photos/3682215/pexels-photo-3682215.jpeg?auto=compress&w=800',
    ],
    description: 'Mid-cut waterproof Gore-Tex membrane boot with reinforced ankle collar. Contagrip MA outsole locks in on wet rocks and muddy switchbacks across Nepal trails. Sensifit cradle wraps the foot for a precision hold on long descent days.',
  },
  {
    _id: "10", name: 'Scarpa Zodiac Plus GTX', category: 'Footwear', price: 21500, rating: 4.9, reviews: 108, badge: 'Top Rated',
    img: 'https://images.pexels.com/photos/1464625/pexels-photo-1464625.jpeg?auto=compress&w=400',
    images: [
      'https://images.pexels.com/photos/1464625/pexels-photo-1464625.jpeg?auto=compress&w=800',
      'https://images.pexels.com/photos/2529148/pexels-photo-2529148.jpeg?auto=compress&w=800',
      'https://images.pexels.com/photos/3682215/pexels-photo-3682215.jpeg?auto=compress&w=800',
      'https://images.pexels.com/photos/1619535/pexels-photo-1619535.jpeg?auto=compress&w=800',
    ],
    description: 'Technical approach boot with full-grain leather upper and Gore-Tex lining. Vibram Drumlin outsole with Climbing Zone heel provides precise edging on boulder approaches to base camps. Crampon-compatible welt for lightweight glacier travel.',
  },
  {
    _id: "11", name: 'Black Diamond Distance Carbon Z Poles', category: 'Footwear', price: 7800, rating: 4.7, reviews: 245, badge: null,
    img: 'https://images.pexels.com/photos/618833/pexels-photo-618833.jpeg?auto=compress&w=400',
    images: [
      'https://images.pexels.com/photos/618833/pexels-photo-618833.jpeg?auto=compress&w=800',
      'https://images.pexels.com/photos/2529148/pexels-photo-2529148.jpeg?auto=compress&w=800',
      'https://images.pexels.com/photos/1464625/pexels-photo-1464625.jpeg?auto=compress&w=800',
      'https://images.pexels.com/photos/1365425/pexels-photo-1365425.jpeg?auto=compress&w=800',
    ],
    description: 'Carbon fibre Z-style folding poles collapsing to just 38 cm. Non-flick FlickLock Pro collar adjusts in seconds even with gloves. Carbide tech tips, EVA cork grip, and interchangeable baskets for all terrain types.',
  },
  {
    _id: "12", name: 'Smartwool PhD Outdoor Heavy Crew Sock', category: 'Footwear', price: 2200, rating: 4.7, reviews: 631, badge: 'New',
    img: 'https://images.pexels.com/photos/1619535/pexels-photo-1619535.jpeg?auto=compress&w=400',
    images: [
      'https://images.pexels.com/photos/1619535/pexels-photo-1619535.jpeg?auto=compress&w=800',
      'https://images.pexels.com/photos/1464625/pexels-photo-1464625.jpeg?auto=compress&w=800',
      'https://images.pexels.com/photos/2529148/pexels-photo-2529148.jpeg?auto=compress&w=800',
      'https://images.pexels.com/photos/3682215/pexels-photo-3682215.jpeg?auto=compress&w=800',
    ],
    description: '56 % fine Merino wool blend with indestructible Cordura nylon reinforcement at heel and toe. Targeted cushioning zones under ball and arch. Machine-washable with a lifetime guarantee — no questions asked.',
  },
  // -- Photography ------------------------------------------------------------
  {
    _id: "13", name: 'DJI Action 5 Pro', category: 'Photography', price: 44000, rating: 4.9, reviews: 312, badge: 'Best Seller',
    img: 'https://images.pexels.com/photos/1787235/pexels-photo-1787235.jpeg?auto=compress&w=400',
    images: [
      'https://images.pexels.com/photos/1787235/pexels-photo-1787235.jpeg?auto=compress&w=800',
      'https://images.pexels.com/photos/243757/pexels-photo-243757.jpeg?auto=compress&w=800',
      'https://images.pexels.com/photos/821652/pexels-photo-821652.jpeg?auto=compress&w=800',
      'https://images.pexels.com/photos/414781/pexels-photo-414781.jpeg?auto=compress&w=800',
    ],
    description: '4K120 slow-motion video and 50 MP stills in a ruggedised body waterproof to 20 m without a case. 10-bit D-Log M colour profile for stunning sunset footage over Annapurna. Magnetic quick-release mount and 3-hour battery life.',
  },
  {
    _id: "14", name: 'Joby GorillaPod 5K Kit', category: 'Photography', price: 9800, rating: 4.6, reviews: 189, badge: null,
    img: 'https://images.pexels.com/photos/243757/pexels-photo-243757.jpeg?auto=compress&w=400',
    images: [
      'https://images.pexels.com/photos/243757/pexels-photo-243757.jpeg?auto=compress&w=800',
      'https://images.pexels.com/photos/1787235/pexels-photo-1787235.jpeg?auto=compress&w=800',
      'https://images.pexels.com/photos/414781/pexels-photo-414781.jpeg?auto=compress&w=800',
      'https://images.pexels.com/photos/821652/pexels-photo-821652.jpeg?auto=compress&w=800',
    ],
    description: 'Flexible tripod supports up to 5 kg and wraps around branches, railings, or uneven rock. Includes quick-release plate, ball head, and GorillaPod phone mount. Folds to 28 cm and weighs just 520 g.',
  },
  {
    _id: "15", name: 'Peak Design Capture Clip V3', category: 'Photography', price: 11500, rating: 4.9, reviews: 103, badge: 'Top Rated',
    img: 'https://images.pexels.com/photos/821652/pexels-photo-821652.jpeg?auto=compress&w=400',
    images: [
      'https://images.pexels.com/photos/821652/pexels-photo-821652.jpeg?auto=compress&w=800',
      'https://images.pexels.com/photos/243757/pexels-photo-243757.jpeg?auto=compress&w=800',
      'https://images.pexels.com/photos/1787235/pexels-photo-1787235.jpeg?auto=compress&w=800',
      'https://images.pexels.com/photos/414781/pexels-photo-414781.jpeg?auto=compress&w=800',
    ],
    description: 'Aluminium and stainless steel camera clip mounts to any backpack strap or belt in seconds. One-handed capture and re-attachment in under a second. Arca-Swiss compatible and tested to 45 kg pull strength — trail-proof.',
  },
  {
    _id: "16", name: 'Anker 747 Power Bank 26000mAh', category: 'Photography', price: 10500, rating: 4.8, reviews: 467, badge: null,
    img: 'https://images.pexels.com/photos/414781/pexels-photo-414781.jpeg?auto=compress&w=400',
    images: [
      'https://images.pexels.com/photos/414781/pexels-photo-414781.jpeg?auto=compress&w=800',
      'https://images.pexels.com/photos/821652/pexels-photo-821652.jpeg?auto=compress&w=800',
      'https://images.pexels.com/photos/243757/pexels-photo-243757.jpeg?auto=compress&w=800',
      'https://images.pexels.com/photos/1787235/pexels-photo-1787235.jpeg?auto=compress&w=800',
    ],
    description: '26000 mAh, 150 W bi-directional GaN charging. Charges a MacBook Pro from 0-80 % in 43 minutes and an iPhone 15 three full times. Three simultaneous outputs. Low-temperature rated to -20 °C for high-altitude use.',
  },
  // -- Navigation -------------------------------------------------------------
  {
    _id: "17", name: 'Garmin inReach Mini 2', category: 'Navigation', price: 45000, rating: 4.9, reviews: 158, badge: 'Top Rated',
    img: 'https://images.pexels.com/photos/3608311/pexels-photo-3608311.jpeg?auto=compress&w=400',
    images: [
      'https://images.pexels.com/photos/3608311/pexels-photo-3608311.jpeg?auto=compress&w=800',
      'https://images.pexels.com/photos/2365457/pexels-photo-2365457.jpeg?auto=compress&w=800',
      'https://images.pexels.com/photos/346529/pexels-photo-346529.jpeg?auto=compress&w=800',
      'https://images.pexels.com/photos/1365425/pexels-photo-1365425.jpeg?auto=compress&w=800',
    ],
    description: '100 % global Iridium satellite coverage for two-way messaging and triggered SOS even beyond every mobile network. 90 g body pairs with Garmin Explore app for live track-sharing with family at base.',
  },
  {
    _id: "18", name: 'Garmin Fenix 8 Solar', category: 'Navigation', price: 72000, rating: 4.9, reviews: 89, badge: 'New',
    img: 'https://images.pexels.com/photos/2365457/pexels-photo-2365457.jpeg?auto=compress&w=400',
    images: [
      'https://images.pexels.com/photos/2365457/pexels-photo-2365457.jpeg?auto=compress&w=800',
      'https://images.pexels.com/photos/3608311/pexels-photo-3608311.jpeg?auto=compress&w=800',
      'https://images.pexels.com/photos/346529/pexels-photo-346529.jpeg?auto=compress&w=800',
      'https://images.pexels.com/photos/1365425/pexels-photo-1365425.jpeg?auto=compress&w=800',
    ],
    description: 'Multi-band GPS smartwatch with solar charging, sapphire lens, and titanium bezel. Barometric altimeter, storm alarm, and preloaded TopoActive Nepal maps. Up to 428 hours GPS battery life — outlasts the longest EBC itineraries.',
  },
  {
    _id: "19", name: 'Suunto A-30 Field Compass', category: 'Navigation', price: 2800, rating: 4.5, reviews: 342, badge: null,
    img: 'https://images.pexels.com/photos/346529/pexels-photo-346529.jpeg?auto=compress&w=400',
    images: [
      'https://images.pexels.com/photos/346529/pexels-photo-346529.jpeg?auto=compress&w=800',
      'https://images.pexels.com/photos/3608311/pexels-photo-3608311.jpeg?auto=compress&w=800',
      'https://images.pexels.com/photos/2365457/pexels-photo-2365457.jpeg?auto=compress&w=800',
      'https://images.pexels.com/photos/1365425/pexels-photo-1365425.jpeg?auto=compress&w=800',
    ],
    description: 'Liquid-filled baseplate compass with a built-in clinometer and 1:25000 map scale. Global needle works across all latitudes without tilting. Luminous bezel markings for night navigation — essential backup for any trek.',
  },
  {
    _id: "20", name: 'Garmin GPSMAP 67i', category: 'Navigation', price: 71000, rating: 4.9, reviews: 63, badge: 'Best Seller',
    img: 'https://images.pexels.com/photos/1365425/pexels-photo-1365425.jpeg?auto=compress&w=400',
    images: [
      'https://images.pexels.com/photos/1365425/pexels-photo-1365425.jpeg?auto=compress&w=800',
      'https://images.pexels.com/photos/3608311/pexels-photo-3608311.jpeg?auto=compress&w=800',
      'https://images.pexels.com/photos/346529/pexels-photo-346529.jpeg?auto=compress&w=800',
      'https://images.pexels.com/photos/2365457/pexels-photo-2365457.jpeg?auto=compress&w=800',
    ],
    description: 'Rugged handheld GPS with built-in inReach satellite messaging and SOS, 2.7-inch sunlight-readable display, and 36-hour battery. Preloaded TopoActive Nepal maps at 1:24000 resolution with hill shading.',
  },
  // -- Safety -----------------------------------------------------------------
  {
    _id: "21", name: 'Adventure Medical Kits Mountain Series 2.0', category: 'Safety', price: 6500, rating: 4.8, reviews: 267, badge: 'Best Seller',
    img: 'https://images.pexels.com/photos/3735747/pexels-photo-3735747.jpeg?auto=compress&w=400',
    images: [
      'https://images.pexels.com/photos/3735747/pexels-photo-3735747.jpeg?auto=compress&w=800',
      'https://images.pexels.com/photos/1061640/pexels-photo-1061640.jpeg?auto=compress&w=800',
      'https://images.pexels.com/photos/2422265/pexels-photo-2422265.jpeg?auto=compress&w=800',
      'https://images.pexels.com/photos/618833/pexels-photo-618833.jpeg?auto=compress&w=800',
    ],
    description: '250+ medical supplies for 4 people over 14 days. Includes SAM splint, blister prevention kit, QuikClot haemostatic gauze, altitude sickness guide, and hypothermia protocol cards. Roll-top waterproof bag, 690 g.',
  },
  {
    _id: "22", name: 'Petzl Actik Core 600lm Headlamp', category: 'Safety', price: 3800, rating: 4.8, reviews: 534, badge: null,
    img: 'https://images.pexels.com/photos/1061640/pexels-photo-1061640.jpeg?auto=compress&w=400',
    images: [
      'https://images.pexels.com/photos/1061640/pexels-photo-1061640.jpeg?auto=compress&w=800',
      'https://images.pexels.com/photos/3735747/pexels-photo-3735747.jpeg?auto=compress&w=800',
      'https://images.pexels.com/photos/2422265/pexels-photo-2422265.jpeg?auto=compress&w=800',
      'https://images.pexels.com/photos/1504557/pexels-photo-1504557.jpeg?auto=compress&w=800',
    ],
    description: '600-lumen rechargeable headlamp with white and red lighting modes. REACTIVE LIGHTING technology automatically adjusts brightness to ambient light. IPX4 rated and accepts AAA batteries as backup when the core is depleted.',
  },
  {
    _id: "23", name: 'SOL Escape Pro Bivvy', category: 'Safety', price: 3100, rating: 4.6, reviews: 358, badge: null,
    img: 'https://images.pexels.com/photos/2422265/pexels-photo-2422265.jpeg?auto=compress&w=400',
    images: [
      'https://images.pexels.com/photos/2422265/pexels-photo-2422265.jpeg?auto=compress&w=800',
      'https://images.pexels.com/photos/1061640/pexels-photo-1061640.jpeg?auto=compress&w=800',
      'https://images.pexels.com/photos/3735747/pexels-photo-3735747.jpeg?auto=compress&w=800',
      'https://images.pexels.com/photos/618833/pexels-photo-618833.jpeg?auto=compress&w=800',
    ],
    description: 'Breathable aluminised shell reflects 80 % of radiated body heat while allowing moisture vapour to escape. Fits one adult with full sleeping bag clearance. Stuffs to fist size at 260 g with a built-in hood drawcord.',
  },
  {
    _id: "24", name: 'UST Blaze & Reflect Combo Kit', category: 'Safety', price: 1150, rating: 4.5, reviews: 714, badge: 'New',
    img: 'https://images.pexels.com/photos/618833/pexels-photo-618833.jpeg?auto=compress&w=400',
    images: [
      'https://images.pexels.com/photos/618833/pexels-photo-618833.jpeg?auto=compress&w=800',
      'https://images.pexels.com/photos/3735747/pexels-photo-3735747.jpeg?auto=compress&w=800',
      'https://images.pexels.com/photos/1061640/pexels-photo-1061640.jpeg?auto=compress&w=800',
      'https://images.pexels.com/photos/2422265/pexels-photo-2422265.jpeg?auto=compress&w=800',
    ],
    description: '120 dB pealess whistle audible over 2.5 km, paired with a military-spec acrylic signal mirror visible to search aircraft beyond 16 km. Combo clips to a locking carabiner — just 22 g of life-saving emergency signalling.',
  },
];

const BADGE_COLORS: Record<string, string> = {
  'Best Seller': 'bg-[#C6A16E]/15 border-[#C6A16E]/40 text-[#C6A16E]',
  'Top Rated':   'bg-[#8FA68E]/15 border-[#8FA68E]/40 text-[#8FA68E]',
  'New':         'bg-emerald-500/15 border-emerald-400/30 text-emerald-400',
};

const SHIPPING_THRESHOLD = 10000;
const SHIPPING_FEE       = 350;
// #endregion Data

// #region Component
// -- Component ----------------------------------------------------------------
const Shop: React.FC = () => {
  const [products, setProducts]             = useState<Product[]>(STATIC_PRODUCTS);
  const [productsLoading, setProductsLoading] = useState(true);
  const [sortBy, setSortBy] = useState<'default'|'price-asc'|'price-desc'|'rating'>('default');
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
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [orderSnapshot, setOrderSnapshot]   = useState<OrderSnapshot | null>(null);
  const [ordersOpen, setOrdersOpen]         = useState(false);
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [activeImg, setActiveImg]             = useState<string>('');
  const [, setSearchParams]                 = useSearchParams();
  const navigate                            = useNavigate();
  const { isAuthenticated, user }           = useAuth();
  const userOrdersKey                       = ordersKey(user?.id || user?.email);

  // Fetch products from backend — extracted so it can be called after order placement
  const fetchProducts = async () => {
    try {
      setProductsLoading(true);
      const res = await fetch(`${API_BASE_URL}/api/products?limit=100`);
      if (!res.ok) throw new Error('Failed to fetch products');
      const data = await res.json();
      if (Array.isArray(data.products) && data.products.length > 0) {
        setProducts(data.products);
      }
    } catch {
      // Keep static fallback already set in initial state
    } finally {
      setProductsLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // -- Pre-checkout stock validator ------------------------------------------
  // Fetches fresh product data, syncs cart quantities/status, returns false if
  // any item is now out of stock (so checkout can be blocked).
  const validateCartStock = async (): Promise<boolean> => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/products?limit=100`);
      if (!res.ok) return true; // allow through on network error
      const data = await res.json();
      if (!Array.isArray(data.products)) return true;

      const freshMap = new Map<string, Product>(data.products.map((p: Product) => [p._id, p]));
      // Update the product catalogue immediately
      setProducts(data.products);

      let blocked = false;
      setCartItems(prev => prev.flatMap(item => {
        const fresh = freshMap.get(item.product._id);
        if (!fresh || !fresh.inStock || (fresh.stock !== undefined && fresh.stock === 0)) {
          showError(`"${item.product.name}" is now out of stock and has been removed from your cart.`);
          blocked = true;
          return [];
        }
        if (fresh.stock !== undefined && item.qty > fresh.stock) {
          showError(`Only ${fresh.stock} unit${fresh.stock === 1 ? '' : 's'} of "${fresh.name}" available. Quantity adjusted.`);
          blocked = true;
          return [{ ...item, product: fresh, qty: fresh.stock }];
        }
        return [{ ...item, product: fresh }];
      }));

      return !blocked;
    } catch {
      return true; // allow through on error
    }
  };

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

  // Sync order statuses from backend whenever the orders panel opens
  useEffect(() => {
    if (!ordersOpen) return;
    const token = getToken();
    if (!token) return;
    fetch(`${API_BASE_URL}/api/orders/mine`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.ok ? r.json() : null)
      .then((data: { orders: Array<{ orderId: string; status: string; paymentStatus: string; paymentMethod?: 'cod' | 'khalti' }> } | null) => {
        if (!data?.orders?.length) return;
        const orderMap = new Map(data.orders.map(o => [o.orderId, o]));
        setSavedOrders(prev => {
          const updated = prev.map(o => {
            const backend = orderMap.get(o.orderId);
            if (!backend) return o;
            return { ...o, status: backend.status as OrderSnapshot['status'], ...(backend.paymentMethod ? { paymentMethod: backend.paymentMethod } : {}) };
          });
          localStorage.setItem(userOrdersKey, JSON.stringify(updated));
          return updated;
        });
      })
      .catch(() => {/* silent — localStorage copy is still shown */});
  }, [ordersOpen, userOrdersKey]);

  // Lock body scroll when orders panel is open (compensate scrollbar width to prevent layout shift)
  useEffect(() => {
    if (ordersOpen) {
      const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
      document.body.style.overflow = 'hidden';
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    } else {
      document.body.style.overflow = '';
      document.body.style.paddingRight = '';
    }
    return () => {
      document.body.style.overflow = '';
      document.body.style.paddingRight = '';
    };
  }, [ordersOpen]);

  // Reset active image whenever a new product is opened
  useEffect(() => {
    if (selectedProduct) setActiveImg(selectedProduct.images[0]);
  }, [selectedProduct]);

  // -- Cart helpers -----------------------------------------------------------
  const { showError, showSuccess } = useToast();

  const addToCart = (product: Product) => {
    // Block out-of-stock products
    if (!product.inStock || product.stock === 0) {
      showError(`"${product.name}" is out of stock.`);
      return;
    }
    setCartItems(prev => {
      const existing = prev.find(i => i.product._id === product._id);
      if (existing) {
        // Enforce stock limit
        if (product.stock !== undefined && existing.qty >= product.stock) {
          showError(`Only ${product.stock} unit${product.stock === 1 ? '' : 's'} available for "${product.name}".`);
          return prev;
        }
        return prev.map(i => i.product._id === product._id ? { ...i, qty: i.qty + 1 } : i);
      }
      showSuccess(`"${product.name}" added to cart.`);
      return [...prev, { product, qty: 1 }];
    });
  };

  // Handles changeQty logic.
  const changeQty = (id: string, delta: number) => {
    setCartItems(prev =>
      prev.flatMap(i => {
        if (i.product._id !== id) return [i];
        const next = i.qty + delta;
        if (next <= 0) return [];
        // Enforce stock limit on increase
        if (delta > 0 && i.product.stock !== undefined && next > i.product.stock) {
          showError(`Only ${i.product.stock} unit${i.product.stock === 1 ? '' : 's'} available for "${i.product.name}".`);
          return [i];
        }
        return [{ ...i, qty: next }];
      })
    );
  };

  // Handles removeItem logic.
  const removeItem = (id: string) => setCartItems(prev => prev.filter(i => i.product._id !== id));
  // Handles clearCart logic.
  const clearCart  = () => {
    setCartItems([]); setCheckedOut(false); setDetailsStep(false);
    setPaymentStep(false); setPaymentMethod(null); setOrderSnapshot(null);
    setCustomer({ name: '', phone: '', email: '', address: '', city: '' });
    setDetailsErrors({});
  };

  // -- Persist a new order to localStorage and backend ----------------------
  const saveOrder = async (snapshot: OrderSnapshot): Promise<void> => {
    setSavedOrders(prev => {
      const updated = [snapshot, ...prev];
      localStorage.setItem(userOrdersKey, JSON.stringify(updated));
      return updated;
    });
    // Await backend so stock is decremented before we re-fetch product list
    const token = getToken();
    try {
      await fetch(`${API_BASE_URL}/api/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          orderId: snapshot.orderId,
          items: snapshot.items.map(i => ({
            productId: i.product._id,
            name: i.product.name,
            category: i.product.category,
            price: i.product.price,
            qty: i.qty,
            img: i.product.img,
          })),
          customer: snapshot.customer,
          subtotal: snapshot.subtotal,
          shipping: snapshot.shipping,
          total: snapshot.total,
          paymentMethod: snapshot.paymentMethod,
        }),
      });
    } catch (err) {
      console.warn('Order sync failed:', err);
    }
  };

  // -- Khalti payment initiation ---------------------------------------------
  const handleKhaltiPay = async () => {
    setKhaltiLoading(true);
    try {
      const stockOk = await validateCartStock();
      if (!stockOk) { setKhaltiLoading(false); return; }

      const token = getToken();
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
        alert('Khalti payment initiation failed. Please try again.');
      }
    } catch (err: any) {
      console.error('Khalti payment error:', err);
      const errMsg = err?.message || 'Could not connect to Khalti. Please check your connection.';
      alert(errMsg);
    } finally {
      setKhaltiLoading(false);
    }
  };

  // -- Detect return from Khalti gateway -------------------------------------
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const status = params.get('status');
    const pidx   = params.get('pidx');
    if (status === 'Completed' && pidx) {
      const raw = sessionStorage.getItem('khalti_pending');
      if (raw) {
        (async () => {
          const saved = JSON.parse(raw) as { cartItems: CartItem[]; customer: CustomerInfo; subtotal: number; shipping: number; total: number; orderId: string; paymentMethod: 'khalti' };
          // Verify payment server-side before accepting
          const token = getToken();
          const verifyRes = await fetch(`${API_BASE_URL}/api/payment/khalti/verify`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
            body: JSON.stringify({ pidx }),
          });
          if (!verifyRes.ok) {
            alert('Payment verification failed. Please contact support if you were charged.');
            sessionStorage.removeItem('khalti_pending');
            setSearchParams({});
            return;
          }
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
          setShowPaymentModal(true);
          sessionStorage.removeItem('khalti_pending');
          setSearchParams({});
          // Refresh product list so stock counts reflect the purchase
          fetchProducts();
        })();
      }
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // -- Place COD order -------------------------------------------------------
  const placeCodOrder = async () => {
    const stockOk = await validateCartStock();
    if (!stockOk) return; // cart was adjusted — user sees toast, must review
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
    await saveOrder(snap); // wait for backend to decrement stock
    setPaymentStep(false);
    setCheckedOut(true);
    // Refresh product list AFTER backend has updated stock
    await fetchProducts();
  };

  // -- Validate customer details & advance -----------------------------------
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

  // -- Filtered + sorted products -------------------------------------------
  const filtered = [...products.filter(p => {
    const matchCat    = activeCategory === 'All' || p.category === activeCategory;
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  })].sort((a, b) => {
    if (sortBy === 'price-asc')  return a.price - b.price;
    if (sortBy === 'price-desc') return b.price - a.price;
    if (sortBy === 'rating')     return b.rating - a.rating;
    return 0;
  });

  const bestsellers = products.filter(p => p.badge === 'Best Seller' || p.badge === 'Top Rated');

  return (
    <div className="min-h-screen w-full">

      {/* Payment Success Popup Modal (shown after Khalti return) */}
      <PaymentSuccessModal
        open={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        amount={orderSnapshot?.total}
        reference={orderSnapshot?.orderId}
        actionLabel="View Order"
        onAction={() => {
          setShowPaymentModal(false);
          setCartOpen(true);
        }}
      />

      {/* ── Shop Hero Banner ──────────────────────────────────────────── */}
      <div className="relative overflow-hidden">
        {/* Background image with cinematic overlay */}
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: "url('https://images.pexels.com/photos/1271620/pexels-photo-1271620.jpeg?auto=compress&cs=tinysrgb&w=1400')" }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0B0F0C]/95 via-[#0B0F0C]/75 to-[#0B0F0C]/40" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0B0F0C] via-transparent to-transparent" />

        <div className="relative px-4 sm:px-6 lg:px-12 xl:px-16 py-16 lg:py-24">
          <div className="max-w-2xl">
            <p className="inline-flex items-center gap-2 surface-pill rounded-full px-3 py-1 text-xs font-medium mb-4">
              <span className="w-1.5 h-1.5 rounded-full bg-[#C6A16E] inline-block" />
              Premium Trekking &amp; Outdoor Gear
            </p>
            <h1 className="text-4xl sm:text-5xl font-bold text-[#F5F3EE] mb-4 font-heading leading-[1.1]">
              Gear Up for Your
              <span className="block bg-gradient-to-r from-[#C6A16E] via-[#E8D5B0] to-[#F5F3EE] bg-clip-text text-transparent">
                Next Adventure
              </span>
            </h1>
            <p className="text-[#B8B4AA] text-sm sm:text-base max-w-lg leading-relaxed mb-6">
              Curated backpacks, tents, navigation tools, and safety gear trusted by Himalayan trekkers.
            </p>
            {/* Value props */}
            <div className="flex flex-wrap gap-3 text-xs">
              {[
                { icon: <Tag className="w-3.5 h-3.5" />, text: 'Free shipping over NPR 10,000' },
                { icon: <Shield className="w-3.5 h-3.5" />, text: '1-year warranty on all gear' },
                { icon: <Package className="w-3.5 h-3.5" />, text: '3–5 day delivery' },
              ].map((v, i) => (
                <div key={i} className="flex items-center gap-1.5 bg-white/6 border border-white/10 rounded-full px-3 py-1.5 text-[#B8B4AA]">
                  <span className="text-[#C6A16E]">{v.icon}</span>
                  {v.text}
                </div>
              ))}
            </div>
          </div>

          {/* Action buttons — top right */}
          <div className="absolute top-6 right-4 sm:right-6 lg:right-12 xl:right-16 flex items-center gap-3">
            <button
              onClick={() => setOrdersOpen(true)}
              className="relative flex items-center gap-2 px-4 py-2 rounded-md btn-outline text-sm font-medium"
            >
              <ClipboardList className="w-4 h-4" />
              <span className="hidden sm:inline">My Orders</span>
              {savedOrders.length > 0 && (
                <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-[#C6A16E] text-[#0B0F0C] text-[9px] font-bold flex items-center justify-center">
                  {savedOrders.length}
                </span>
              )}
            </button>
            <button
              onClick={() => { setCartOpen(true); if (cartItems.length > 0) validateCartStock(); }}
              className="relative flex items-center gap-2 px-4 py-2 rounded-md btn-primary text-sm font-semibold"
            >
              <ShoppingCart className="w-4 h-4" />
              Cart
              {totalItems > 0 && (
                <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-[#0B0F0C] text-[#C6A16E] text-[9px] font-bold flex items-center justify-center border border-[#C6A16E]/40">
                  {totalItems}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* ── Sticky filter toolbar ─────────────────────────────────────── */}
      <div className="sticky top-[64px] z-30 bg-[#0B0F0C]/90 backdrop-blur-md border-b border-white/8">
        <div className="px-4 sm:px-6 lg:px-12 xl:px-16 py-3 flex flex-col sm:flex-row sm:items-center gap-3">
          {/* Search */}
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8E8A81]" />
            <input
              type="text" placeholder="Search gear…"
              value={search} onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 site-input rounded-lg text-sm focus:outline-none"
            />
          </div>

          {/* Category pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide flex-1">
            {CATEGORIES.map(cat => (
              <button key={cat.label} onClick={() => setActiveCategory(cat.label)}
                className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all border ${
                  activeCategory === cat.label
                    ? 'bg-[#C6A16E]/15 border-[#C6A16E]/40 text-[#C6A16E]'
                    : 'border-white/10 text-[#8E8A81] hover:border-white/25 hover:text-[#F5F3EE]'
                }`}>
                {cat.icon && <span>{cat.icon}</span>}
                {cat.label}
              </button>
            ))}
          </div>

          {/* Sort */}
          <div className="flex items-center gap-2 shrink-0">
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value as typeof sortBy)}
              className="site-input rounded-lg text-xs px-3 py-2 [color-scheme:dark] min-w-[140px]"
            >
              <option value="default" className="bg-[#161D19]">Featured</option>
              <option value="price-asc" className="bg-[#161D19]">Price: Low → High</option>
              <option value="price-desc" className="bg-[#161D19]">Price: High → Low</option>
              <option value="rating" className="bg-[#161D19]">Top Rated</option>
            </select>
          </div>
        </div>
      </div>

      {/* ── Main content ─────────────────────────────────────────────── */}
      <div className="px-4 sm:px-6 lg:px-12 xl:px-16 py-7">

        {/* Result count + active filter hint */}
        <div className="flex items-center gap-2 mb-5 text-xs text-[#8E8A81]">
          <span className="text-[#F5F3EE] font-semibold">{filtered.length}</span> products
          {activeCategory !== 'All' && (
            <>
              <span>in</span>
              <button onClick={() => setActiveCategory('All')}
                className="surface-pill rounded-full px-2.5 py-0.5 flex items-center gap-1 hover:opacity-80 transition-opacity">
                {activeCategory} <X className="w-3 h-3" />
              </button>
            </>
          )}
          {search && (
            <button onClick={() => setSearch('')}
              className="surface-pill rounded-full px-2.5 py-0.5 flex items-center gap-1 hover:opacity-80 transition-opacity">
              "{search}" <X className="w-3 h-3" />
            </button>
          )}
        </div>

        {/* Featured bestsellers strip */}
        {activeCategory === 'All' && !search && bestsellers.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <Star className="w-3.5 h-3.5 text-[#C6A16E] fill-[#C6A16E]" />
              <p className="section-label">Bestsellers</p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
              {bestsellers.slice(0, 6).map(product => (
                <div key={`feat-${product._id}`}
                  onClick={() => setSelectedProduct(product)}
                  className="relative overflow-hidden rounded-xl cursor-pointer group h-36 sm:h-40">
                  <img
                    src={product.img.replace('?auto=compress&', '?auto=compress&cs=tinysrgb&')}
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-[1.07] transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0B0F0C]/94 via-[#0B0F0C]/20 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-3">
                    <p className="text-[#F5F3EE] text-[11px] font-semibold font-heading line-clamp-1">{product.name}</p>
                    <p className="text-[#C6A16E] text-[11px] font-bold mt-0.5">NPR {product.price.toLocaleString()}</p>
                  </div>
                  {product.badge && (
                    <span className={`absolute top-2 left-2 px-2 py-0.5 rounded-full text-[9px] font-semibold border ${BADGE_COLORS[product.badge]}`}>
                      {product.badge}
                    </span>
                  )}
                </div>
              ))}
            </div>
            <hr className="gold-rule mt-6" />
          </div>
        )}

        {/* Loading skeletons */}
        {productsLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="site-card rounded-xl overflow-hidden animate-pulse">
                <div className="h-52 bg-[#1B2420]" />
                <div className="p-3 space-y-2">
                  <div className="h-3 bg-[#1B2420] rounded w-3/4" />
                  <div className="h-2.5 bg-[#1B2420] rounded w-1/2" />
                  <div className="h-5 bg-[#1B2420] rounded w-1/3 mt-2" />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
            <div className="w-20 h-20 rounded-2xl bg-[#161D19] border border-white/8 flex items-center justify-center">
              <Mountain className="w-10 h-10 text-[#8E8A81]/30" />
            </div>
            <div>
              <p className="text-[#F5F3EE] font-medium font-heading mb-1">No products found</p>
              <p className="text-sm text-[#8E8A81]">Try adjusting your search or category filter.</p>
            </div>
            <button onClick={() => { setSearch(''); setActiveCategory('All'); }} className="btn-outline rounded-md px-4 py-2 text-sm">
              Clear filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {filtered.map(product => {
              const inCart = cartItems.find(i => i.product._id === product._id);
              return (
                <div key={product._id}
                  onClick={() => setSelectedProduct(product)}
                  className="site-card rounded-xl overflow-hidden flex flex-col group cursor-pointer">
                  {/* Image */}
                  <div className="relative h-48 overflow-hidden bg-[#111714]">
                    <img
                      src={product.img.replace('?auto=compress&', '?auto=compress&cs=tinysrgb&')}
                      alt={product.name}
                      onError={(e) => { e.currentTarget.src = `https://placehold.co/400x300/161D19/C6A16E?text=${encodeURIComponent(product.name)}`; e.currentTarget.onerror = null; }}
                      className="w-full h-full object-cover group-hover:scale-[1.05] transition-transform duration-500" />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0B0F0C]/80 via-transparent to-transparent" />
                    {product.badge && (
                      <span className={`absolute top-2.5 left-2.5 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${BADGE_COLORS[product.badge]}`}>
                        {product.badge}
                      </span>
                    )}
                    {(product.inStock === false || product.stock === 0) ? (
                      <span className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-red-900/70 text-red-300 border border-red-700/40">Out</span>
                    ) : product.stock !== undefined && product.stock > 0 && product.stock <= 5 ? (
                      <span className="absolute bottom-2.5 left-2.5 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-900/60 text-amber-300 border border-amber-700/40">Only {product.stock} left</span>
                    ) : null}
                  </div>

                  {/* Card body */}
                  <div className="p-3 flex flex-col gap-2 flex-1">
                    <h3 className="font-semibold text-[#F5F3EE] text-xs leading-snug font-heading line-clamp-2">{product.name}</h3>

                    <div className="flex items-center justify-between mt-auto">
                      <p className="text-[#F5F3EE] font-bold text-sm leading-none">
                        <span className="text-[#8E8A81] text-[10px] font-normal">NPR </span>
                        {product.price.toLocaleString()}
                      </p>

                      {(!product.inStock || product.stock === 0) ? (
                        <span className="text-red-400 text-[10px] font-medium">Sold out</span>
                      ) : inCart ? (
                        <div onClick={e => e.stopPropagation()} className="flex items-center gap-0.5 rounded-lg border border-[#C6A16E]/35 bg-[#C6A16E]/[0.08] px-1 py-0.5">
                          <button onClick={() => changeQty(product._id, -1)} className="w-5 h-5 flex items-center justify-center rounded text-[#C6A16E] hover:bg-white/10">
                            <Minus className="w-2.5 h-2.5" />
                          </button>
                          <span className="text-[#F5F3EE] text-xs font-bold w-4 text-center">{inCart.qty}</span>
                          <button onClick={() => changeQty(product._id, 1)} className="w-5 h-5 flex items-center justify-center rounded text-[#C6A16E] hover:bg-white/10">
                            <Plus className="w-2.5 h-2.5" />
                          </button>
                        </div>
                      ) : (
                        <button onClick={e => { e.stopPropagation(); addToCart(product); }}
                          className="btn-primary flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-semibold">
                          <ShoppingCart className="w-3 h-3" /> Add
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>{/* end main content */}

      {/* -- Product detail modal ---------------------------------------- */}
      {selectedProduct && (
        <>
          <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-50" onClick={() => setSelectedProduct(null)} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
            <div
              onClick={e => e.stopPropagation()}
              className="pointer-events-auto w-full max-w-3xl site-card rounded-2xl overflow-hidden flex flex-col md:flex-row shadow-2xl border border-white/10"
              style={{ maxHeight: '92vh' }}
            >
              {/* -- Left: image gallery ------------------------- */}
              <div className="md:w-96 shrink-0 flex flex-col bg-[#111714]">
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
                          ? 'border-[#C6A16E] opacity-100 scale-105'
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

              {/* -- Right: product info ------------------------- */}
              <div className="flex flex-col flex-1 overflow-y-auto">
                {/* Sticky header */}
                <div className="flex items-start justify-between gap-3 px-6 pt-6 pb-4 border-b border-white/8">
                  <div>
                    <span className="text-xs text-[#C6A16E]/70 uppercase tracking-widest font-medium">{selectedProduct.category}</span>
                    <h2 className="text-[#F5F3EE] font-bold text-xl leading-snug mt-0.5 font-heading">{selectedProduct.name}</h2>
                  </div>
                  <button onClick={() => setSelectedProduct(null)}
                    className="hidden md:flex p-2 rounded-lg btn-outline text-[#8E8A81] hover:text-[#F5F3EE] transition-all shrink-0 mt-0.5">
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex flex-col gap-4 px-6 py-5">
                  {/* Price + Stock */}
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-[#F5F3EE] font-bold text-3xl font-heading">{selectedProduct.price.toLocaleString()}</span>
                    <span className="text-[#8E8A81] text-sm">NPR</span>
                  </div>
                  {(selectedProduct.inStock === false || selectedProduct.stock === 0) ? (
                    <span className="inline-block px-3 py-1 rounded-lg bg-red-500/15 border border-red-400/30 text-red-400 text-xs font-semibold">Out of Stock</span>
                  ) : (selectedProduct.stock !== undefined && selectedProduct.stock > 0) ? (
                    <span className={`inline-block px-3 py-1 rounded-lg text-xs font-semibold border ${
                      selectedProduct.stock <= 5
                        ? 'bg-amber-500/15 border-amber-400/30 text-amber-400'
                        : 'bg-emerald-500/15 border-emerald-400/30 text-emerald-400'
                    }`}>
                      {selectedProduct.stock <= 5 ? `Only ${selectedProduct.stock} left!` : `${selectedProduct.stock} in stock`}
                    </span>
                  ) : null}

                  {/* Description */}
                  <p className="text-[#B8B4AA] text-sm leading-relaxed">{selectedProduct.description}</p>

                  {/* Highlights */}
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { icon: <Tag className="w-3.5 h-3.5" />,     text: selectedProduct.badge ?? 'Standard' },
                      { icon: <Package className="w-3.5 h-3.5" />, text: 'Free shipping on NPR 10k+' },
                      { icon: <Shield className="w-3.5 h-3.5" />,  text: '1-year warranty' },
                      { icon: <Compass className="w-3.5 h-3.5" />, text: selectedProduct.category },
                    ].map((h, i) => (
                      <div key={i} className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-[#111714] border border-white/8 text-[#8E8A81] text-xs">
                        <span className="text-[#C6A16E]">{h.icon}</span>{h.text}
                      </div>
                    ))}
                  </div>

                  {/* CTA */}
                  <div className="pt-2 mt-auto">
                    {(() => {
                      const inCart = cartItems.find(i => i.product._id === selectedProduct._id);
                      if (selectedProduct.inStock === false || selectedProduct.stock === 0) return (
                        <div className="w-full py-3.5 rounded-2xl bg-red-500/10 border border-red-400/30 text-red-400 font-semibold text-base text-center">
                          Out of Stock
                        </div>
                      );
                      return inCart ? (
                        <div className="flex items-center justify-between rounded-2xl border border-[#C6A16E]/35 bg-[#C6A16E]/[0.08] px-4 py-3">
                          <span className="text-white/60 text-sm">In cart</span>
                          <div className="flex items-center gap-3">
                            <button onClick={() => changeQty(selectedProduct._id, -1)}
                              className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/10 transition-all text-[#C6A16E]">
                              <Minus className="w-3.5 h-3.5" />
                            </button>
                            <span className="text-[#F5F3EE] font-bold w-6 text-center text-lg">{inCart.qty}</span>
                            <button onClick={() => changeQty(selectedProduct._id, 1)}
                              className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/10 transition-all text-[#C6A16E]">
                              <Plus className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button onClick={() => addToCart(selectedProduct)}
                          className="btn-primary w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-semibold text-base">
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

      {/* -- Orders drawer backdrop --------------------------------------- */}
      {ordersOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40" onClick={() => setOrdersOpen(false)} />
      )}

      {/* -- Orders drawer ------------------------------------------------- */}
      <div
        className={`fixed top-0 right-0 h-full w-full max-w-md z-50 flex flex-col transition-transform duration-300 ease-in-out border-l border-white/8 ${ordersOpen ? 'translate-x-0' : 'translate-x-full'}`}
        style={{ background: 'linear-gradient(180deg,#0F1612 0%,#0B0F0C 100%)' }}
      >
        {/* Header */}
        <div className="relative overflow-hidden shrink-0">
          <div className="absolute inset-0 bg-[url('https://images.pexels.com/photos/3278215/pexels-photo-3278215.jpeg?auto=compress&cs=tinysrgb&w=600')] bg-cover bg-center opacity-8" />
          <div className="absolute inset-0 bg-gradient-to-b from-[#0F1612]/90 to-[#0B0F0C]" />
          <div className="relative flex items-center justify-between px-6 py-5 border-b border-white/8">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#C6A16E]/[0.12] border border-[#C6A16E]/25 flex items-center justify-center">
                <ClipboardList className="w-4.5 h-4.5 text-[#C6A16E]" />
              </div>
              <div>
                <h2 className="text-[#F5F3EE] font-bold text-base font-heading leading-tight">My Orders</h2>
                {savedOrders.length > 0 && (
                  <p className="text-[#8E8A81] text-xs">{savedOrders.length} order{savedOrders.length !== 1 ? 's' : ''} placed</p>
                )}
              </div>
            </div>
            <button onClick={() => setOrdersOpen(false)}
              className="w-8 h-8 flex items-center justify-center rounded-xl bg-white/6 border border-white/10 text-[#8E8A81] hover:text-[#F5F3EE] transition-all">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 min-h-0 overflow-y-auto px-4 py-4 flex flex-col gap-3">
          {savedOrders.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-5 text-center px-6">
              <div className="relative w-24 h-24 rounded-2xl overflow-hidden">
                <div className="absolute inset-0 bg-[url('https://images.pexels.com/photos/1365425/pexels-photo-1365425.jpeg?auto=compress&cs=tinysrgb&w=300')] bg-cover bg-center opacity-25" />
                <div className="absolute inset-0 bg-[#161D19]/70" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <ClipboardList className="w-10 h-10 text-[#C6A16E]/50" />
                </div>
              </div>
              <div>
                <p className="text-[#F5F3EE] font-semibold font-heading mb-1">No orders yet</p>
                <p className="text-[#8E8A81] text-sm">Your placed orders will appear here.</p>
              </div>
              <button onClick={() => setOrdersOpen(false)}
                className="btn-primary flex items-center gap-1.5 px-5 py-2.5 rounded-lg text-sm font-semibold">
                Browse Shop <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          ) : (
            savedOrders.map((order) => {
              const expanded = expandedOrderId === order.orderId;
              const statusColor = {
                delivered:        'text-[#8FA68E]',
                out_for_delivery: 'text-amber-400',
                processing:       'text-blue-400',
                cancelled:        'text-red-400',
              }[order.status] ?? 'text-[#C6A16E]';
              const statusDot = {
                delivered:        'bg-[#8FA68E]',
                out_for_delivery: 'bg-amber-400 animate-pulse',
                processing:       'bg-blue-400 animate-pulse',
                cancelled:        'bg-red-400',
              }[order.status] ?? 'bg-[#C6A16E] animate-pulse';

              return (
                <div key={order.orderId}
                  className="rounded-2xl border border-white/8"
                  style={{ background: 'linear-gradient(145deg,#1B2420 0%,#161D19 100%)' }}
                >
                  {/* Order card header */}
                  <div
                    onClick={() => setExpandedOrderId(expanded ? null : order.orderId)}
                    className="px-4 py-4 hover:bg-white/[0.04] transition-all cursor-pointer w-full">
                    {/* Product thumbnails strip */}
                    {order.items.length > 0 && (
                      <div className="flex gap-1.5 mb-3">
                        {order.items.slice(0, 4).map((i, idx) => (
                          <div key={idx} className="w-10 h-10 rounded-lg overflow-hidden border border-white/10 shrink-0 bg-[#111714]">
                            <img
                              src={(i.product.img || '').replace('?auto=compress&', '?auto=compress&cs=tinysrgb&')}
                              alt={i.product.name}
                              onError={(e) => { e.currentTarget.src = 'https://placehold.co/40x40/161D19/C6A16E'; e.currentTarget.onerror = null; }}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        ))}
                        {order.items.length > 4 && (
                          <div className="w-10 h-10 rounded-lg bg-[#111714] border border-white/10 flex items-center justify-center text-[10px] text-[#8E8A81] font-bold">
                            +{order.items.length - 4}
                          </div>
                        )}
                      </div>
                    )}

                    <div className="flex items-start justify-between gap-3">
                      <div className="text-left min-w-0 flex-1">
                        <p className="text-[#F5F3EE] font-mono text-xs font-semibold truncate mb-1">{order.orderId}</p>
                        <div className="flex items-center gap-1.5">
                          <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${statusDot}`} />
                          <p className={`text-xs font-semibold ${statusColor}`}>
                            {order.status === 'cancelled' ? 'Cancelled' : (ORDER_STATUSES.find(s => s.key === order.status)?.label ?? 'Order Placed')}
                          </p>
                          <span className="text-[#8E8A81] text-[10px]">·</span>
                          <p className="text-[#8E8A81] text-[11px]">
                            {order.placedAt.toLocaleDateString('en-NP', { day: '2-digit', month: 'short', year: 'numeric' })}
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1 shrink-0">
                        <p className="text-[#C6A16E] font-bold text-base font-heading leading-none">NPR {order.total.toLocaleString()}</p>
                        <div className="flex items-center gap-1.5">
                          <span className={`text-[10px] px-1.5 py-0.5 rounded-full border font-semibold ${
                            order.paymentMethod === 'khalti'
                              ? 'bg-purple-500/15 border-purple-400/25 text-purple-300'
                              : 'bg-[#8FA68E]/[0.12] border-[#8FA68E]/25 text-[#8FA68E]'
                          }`}>
                            {order.paymentMethod === 'khalti' ? 'Khalti' : 'COD'}
                          </span>
                          {expanded ? <ChevronUp className="w-3.5 h-3.5 text-[#8E8A81]" /> : <ChevronDown className="w-3.5 h-3.5 text-[#8E8A81]" />}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Expanded details */}
                  {expanded && (
                    <div className="px-4 pb-4 space-y-4 border-t border-white/8 pt-4">

                      {/* Items list */}
                      <div className="space-y-2">
                        <p className="section-label">Items Ordered</p>
                        {order.items.map(i => (
                          <div key={i.product._id} className="flex items-center gap-3 bg-[#111714] border border-white/6 rounded-xl p-2.5">
                            <img
                              src={(i.product.img || '').replace('?auto=compress&', '?auto=compress&cs=tinysrgb&')}
                              alt={i.product.name}
                              onError={(e) => { e.currentTarget.src = 'https://placehold.co/40x40/161D19/C6A16E'; e.currentTarget.onerror = null; }}
                              className="w-10 h-10 rounded-lg object-cover shrink-0 border border-white/8" />
                            <div className="flex-1 min-w-0">
                              <p className="text-[#F5F3EE] text-xs font-semibold line-clamp-1 font-heading">{i.product.name}</p>
                              <p className="text-[#8E8A81] text-[10px] mt-0.5">NPR {i.product.price.toLocaleString()} × {i.qty}</p>
                            </div>
                            <p className="text-[#C6A16E] text-xs font-bold shrink-0">NPR {(i.product.price * i.qty).toLocaleString()}</p>
                          </div>
                        ))}
                      </div>

                      {/* Price breakdown */}
                      <div className="bg-[#111714] border border-white/6 rounded-xl px-4 py-3 space-y-2">
                        <div className="flex justify-between text-xs">
                          <span className="text-[#8E8A81]">Subtotal</span>
                          <span className="text-[#B8B4AA]">NPR {order.subtotal.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="text-[#8E8A81]">Shipping</span>
                          <span className={order.shipping === 0 ? 'text-[#8FA68E] font-medium' : 'text-[#B8B4AA]'}>
                            {order.shipping === 0 ? 'FREE' : `NPR ${order.shipping.toLocaleString()}`}
                          </span>
                        </div>
                        <div className="h-px bg-white/8" />
                        <div className="flex justify-between items-baseline">
                          <span className="text-sm font-semibold text-[#F5F3EE]">Total</span>
                          <span className="text-lg font-bold text-[#C6A16E] font-heading">NPR {order.total.toLocaleString()}</span>
                        </div>
                      </div>

                      {/* Delivery tracker */}
                      <div>
                        <p className="section-label mb-3">Delivery Status</p>
                        {order.status === 'cancelled' ? (
                          <div className="flex items-center gap-2.5 px-4 py-3 rounded-xl bg-red-900/20 border border-red-700/30">
                            <div className="w-2 h-2 rounded-full bg-red-400 shrink-0" />
                            <div>
                              <p className="text-red-400 text-xs font-semibold">Order Cancelled</p>
                              <p className="text-[#8E8A81] text-[10px] mt-0.5">This order has been cancelled.</p>
                            </div>
                          </div>
                        ) : (
                          <div className="flex flex-col">
                            {ORDER_STATUSES.map((step, idx) => {
                              const activeIdx = ORDER_STATUSES.findIndex(s => s.key === order.status);
                              const isDone    = idx <= activeIdx;
                              const isCurrent = idx === activeIdx;
                              const isLast    = idx === ORDER_STATUSES.length - 1;
                              return (
                                <div key={step.key} className="flex items-start gap-3">
                                  <div className="flex flex-col items-center shrink-0">
                                    <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all ${
                                      isCurrent ? 'border-[#C6A16E] bg-[#C6A16E] shadow-[0_0_8px_rgba(198,161,110,0.5)]'
                                        : isDone  ? 'border-[#8FA68E] bg-[#8FA68E]'
                                        : 'border-white/15 bg-white/5'
                                    }`}>
                                      {isDone && !isCurrent && <Check className="w-2 h-2 text-[#0B0F0C]" />}
                                      {isCurrent && <div className="w-1.5 h-1.5 rounded-full bg-[#0B0F0C]" />}
                                    </div>
                                    {!isLast && (
                                      <div className={`w-0.5 h-7 mt-0.5 rounded-full ${idx < activeIdx ? 'bg-[#8FA68E]/50' : 'bg-white/8'}`} />
                                    )}
                                  </div>
                                  <div className={`pb-5 ${isLast ? 'pb-0' : ''}`}>
                                    <p className={`text-xs font-semibold ${isCurrent ? 'text-[#C6A16E]' : isDone ? 'text-[#B8B4AA]' : 'text-white/20'}`}>{step.label}</p>
                                    <p className={`text-[10px] mt-0.5 ${isCurrent ? 'text-[#8E8A81]' : isDone ? 'text-[#8E8A81]/60' : 'text-white/10'}`}>{step.desc}</p>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>

                      {/* Delivery address */}
                      <div className="bg-[#111714] border border-white/6 rounded-xl p-3 space-y-1.5">
                        <p className="section-label mb-2">Delivered To</p>
                        {[
                          { icon: <User className="w-3 h-3 text-[#C6A16E]" />, text: order.customer.name },
                          { icon: <Phone className="w-3 h-3 text-[#C6A16E]" />, text: order.customer.phone },
                          ...(order.customer.email ? [{ icon: <Mail className="w-3 h-3 text-[#C6A16E]" />, text: order.customer.email }] : []),
                          { icon: <MapPin className="w-3 h-3 text-[#C6A16E]" />, text: `${order.customer.address}, ${order.customer.city}` },
                        ].map(({ icon, text }, i) => (
                          <div key={i} className="flex items-start gap-2 text-xs">
                            <span className="mt-0.5 shrink-0">{icon}</span>
                            <span className="text-[#B8B4AA]">{text}</span>
                          </div>
                        ))}
                      </div>

                      {/* Payment method */}
                      <div className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl border text-xs ${
                        order.paymentMethod === 'khalti'
                          ? 'bg-purple-500/[0.08] border-purple-400/20'
                          : 'bg-[#8FA68E]/[0.08] border-[#8FA68E]/20'
                      }`}>
                        {order.paymentMethod === 'khalti'
                          ? <Heart className="w-4 h-4 text-purple-400 shrink-0" />
                          : <Banknote className="w-4 h-4 text-[#8FA68E] shrink-0" />}
                        <span className={`font-semibold ${order.paymentMethod === 'khalti' ? 'text-purple-300' : 'text-[#8FA68E]'}`}>
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

      {/* -- Cart drawer backdrop ------------------------------------------ */}
      {cartOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40" onClick={() => setCartOpen(false)} />
      )}

      {/* -- Cart drawer --------------------------------------------------- */}
      <div
        className={`fixed top-0 right-0 h-full w-full max-w-md z-50 flex flex-col transition-transform duration-300 ease-in-out border-l border-white/8 ${cartOpen ? 'translate-x-0' : 'translate-x-full'}`}
        style={{ background: 'linear-gradient(180deg,#0F1612 0%,#0B0F0C 100%)' }}
      >
        {/* Drawer header */}
        <div className="relative overflow-hidden shrink-0">
          <div className="absolute inset-0 bg-[url('https://images.pexels.com/photos/1054218/pexels-photo-1054218.jpeg?auto=compress&cs=tinysrgb&w=600')] bg-cover bg-center opacity-8" />
          <div className="absolute inset-0 bg-gradient-to-b from-[#0F1612]/90 to-[#0B0F0C]" />
          <div className="relative flex items-center justify-between px-6 py-5 border-b border-white/8">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#C6A16E]/[0.12] border border-[#C6A16E]/25 flex items-center justify-center">
                <ShoppingCart className="w-4.5 h-4.5 text-[#C6A16E]" />
              </div>
              <div>
                <h2 className="text-[#F5F3EE] font-bold text-base font-heading leading-tight">Your Cart</h2>
                {totalItems > 0 && <p className="text-[#8E8A81] text-xs">{totalItems} item{totalItems !== 1 ? 's' : ''} selected</p>}
              </div>
            </div>
            <button onClick={() => setCartOpen(false)}
              className="w-8 h-8 flex items-center justify-center rounded-xl bg-white/6 border border-white/10 text-[#8E8A81] hover:text-[#F5F3EE] transition-all">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Drawer body */}
        <div className="flex-1 overflow-y-auto px-6 py-4 flex flex-col gap-4">
          {checkedOut && orderSnapshot ? (
            /* -- Order confirmed — full receipt -- */
            <div className="flex flex-col gap-4 py-2 pb-6">
              {/* Header */}
              <div className="flex flex-col items-center text-center gap-3 py-4">
                <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center">
                  <Package className="w-8 h-8 text-emerald-400" />
                </div>
                <div>
                  <h3 className="text-white font-bold text-xl flex items-center gap-2">Order Placed! <PartyPopper className="w-5 h-5 text-emerald-400" /></h3>
                  <p className="text-white/55 text-sm mt-1">Your gear is on its way. Estimated delivery in 3-5 business days.</p>
                </div>
              </div>

              {/* Order meta */}
              <div className="flex justify-between items-start px-4 py-3 rounded-xl bg-white/5 border border-white/10">
                <div>
                  <p className="text-white/40 text-[10px] uppercase tracking-widest">Order ID</p>
                  <p className="text-[#C6A16E] font-mono font-semibold text-sm mt-0.5">{orderSnapshot.orderId}</p>
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
              <div className="site-card rounded-xl p-4 space-y-3">
                <p className="text-white/40 text-[10px] uppercase tracking-widest">Items Ordered</p>
                {orderSnapshot.items.map(i => (
                  <div key={i.product._id} className="flex items-center gap-3">
                    <img
                      src={i.product.img.replace('?auto=compress&', '?auto=compress&cs=tinysrgb&')}
                      alt={i.product.name}
                      onError={(e) => { e.currentTarget.src = 'https://placehold.co/40x40/1e1b4b/6366f1'; e.currentTarget.onerror = null; }}
                      className="w-10 h-10 rounded-lg object-cover shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-xs font-semibold line-clamp-1">{i.product.name}</p>
                      <p className="text-white/40 text-[11px]">NPR {i.product.price.toLocaleString()} — {i.qty}</p>
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
                    <span className="text-[#C6A16E]">NPR {orderSnapshot.total.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Delivery info */}
              <div className="site-card rounded-xl p-4 space-y-2">
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
                  <div className="w-4 h-4 rounded-full border-2 border-[#C6A16E] bg-[#C6A16E] shadow-[0_0_8px_rgba(198,161,110,0.5)] flex items-center justify-center shrink-0">
                    <div className="w-1.5 h-1.5 rounded-full bg-white" />
                  </div>
                  <div>
                    <p className="text-[#C6A16E] text-sm font-semibold">Order Placed</p>
                    <p className="text-white/45 text-xs">Estimated delivery in 3-5 business days</p>
                  </div>
                </div>
              </div>

              {/* Payment method */}
              <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border ${
                orderSnapshot.paymentMethod === 'khalti'
                  ? 'bg-purple-500/10 border-purple-400/30'
                  : 'bg-emerald-500/10 border-emerald-400/30'
              }`}>
                {orderSnapshot.paymentMethod === 'khalti' ? <Wallet className="w-5 h-5 text-purple-400" /> : <Banknote className="w-5 h-5 text-emerald-400" />}
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
                className="btn-primary w-full py-3 rounded-xl font-semibold">
                Continue Shopping
              </button>
              <button onClick={() => { setCartOpen(false); clearCart(); setOrdersOpen(true); }}
                className="w-full flex items-center justify-center gap-2 text-sm text-[#8E8A81] hover:text-[#C6A16E] transition-all py-1">
                <ClipboardList className="w-4 h-4" /> View all my orders
              </button>
            </div>
          ) : detailsStep ? (
            /* -- Customer details form -- */
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
                <label className="section-label mb-1.5 block">Full Name <span className="text-red-400">*</span></label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                  <input type="text" placeholder="e.g. Aasim Khan" value={customer.name}
                    onChange={e => setCustomer(c => ({ ...c, name: e.target.value }))}
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl site-input text-sm" />
                </div>
                {detailsErrors.name && <p className="text-red-400 text-xs mt-1">{detailsErrors.name}</p>}
              </div>

              {/* Phone */}
              <div>
                <label className="section-label mb-1.5 block">Phone Number <span className="text-red-400">*</span></label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                  <input type="tel" placeholder="98XXXXXXXX" value={customer.phone}
                    onChange={e => setCustomer(c => ({ ...c, phone: e.target.value }))}
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl site-input text-sm" />
                </div>
                {detailsErrors.phone && <p className="text-red-400 text-xs mt-1">{detailsErrors.phone}</p>}
              </div>

              {/* Email */}
              <div>
                <label className="section-label mb-1.5 block">Email Address <span className="text-white/30 font-normal">(optional)</span></label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                  <input type="email" placeholder="you@example.com" value={customer.email}
                    onChange={e => setCustomer(c => ({ ...c, email: e.target.value }))}
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl site-input text-sm" />
                </div>
              </div>

              {/* Street Address */}
              <div>
                <label className="section-label mb-1.5 block">Street Address <span className="text-red-400">*</span></label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3 w-4 h-4 text-white/30" />
                  <textarea placeholder="House / Street / Ward" rows={2} value={customer.address}
                    onChange={e => setCustomer(c => ({ ...c, address: e.target.value }))}
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl site-input text-sm resize-none" />
                </div>
                {detailsErrors.address && <p className="text-red-400 text-xs mt-1">{detailsErrors.address}</p>}
              </div>

              {/* City */}
              <div>
                <label className="section-label mb-1.5 block">City / District <span className="text-red-400">*</span></label>
                <input type="text" placeholder="e.g. Kathmandu" value={customer.city}
                  onChange={e => setCustomer(c => ({ ...c, city: e.target.value }))}
                  className="w-full px-3 py-2.5 rounded-xl site-input text-sm" />
                {detailsErrors.city && <p className="text-red-400 text-xs mt-1">{detailsErrors.city}</p>}
              </div>

              <button onClick={validateAndProceed}
                className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl btn-primary font-bold text-sm mt-1">
                Continue to Payment <ChevronRight className="w-4 h-4" />
              </button>
            </div>

          ) : paymentStep ? (
            /* -- Payment method selection -- */
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
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${
                  paymentMethod === 'cod' ? 'bg-emerald-500/20' : 'bg-white/5'
                }`}><Banknote className="w-6 h-6 text-emerald-400" /></div>
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
                  <Heart className="w-6 h-6 text-purple-400" />
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
                    ? 'btn-primary cursor-pointer'
                    : 'bg-white/5 border border-white/10 text-white/30 cursor-not-allowed'
                }`}
              >
                {khaltiLoading ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Redirecting to Khalti...</>
                ) : (
                  <>Place Order — NPR {total.toLocaleString()} <ChevronRight className="w-4 h-4" /></>
                )}
              </button>
            </div>
          ) : cartItems.length === 0 ? (
            /* -- Empty cart -- */
            <div className="flex flex-col items-center justify-center h-full gap-5 text-center px-6">
              <div className="relative">
                <div className="w-24 h-24 rounded-2xl overflow-hidden">
                  <div className="absolute inset-0 bg-[url('https://images.pexels.com/photos/1365425/pexels-photo-1365425.jpeg?auto=compress&cs=tinysrgb&w=300')] bg-cover bg-center opacity-30" />
                  <div className="absolute inset-0 bg-[#161D19]/70" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <ShoppingCart className="w-10 h-10 text-[#C6A16E]/50" />
                  </div>
                </div>
              </div>
              <div>
                <p className="text-[#F5F3EE] font-semibold font-heading mb-1">Your cart is empty</p>
                <p className="text-[#8E8A81] text-sm">Browse the shop and add some gear!</p>
              </div>
              <button onClick={() => setCartOpen(false)}
                className="btn-primary flex items-center gap-1.5 px-5 py-2.5 rounded-lg text-sm font-semibold">
                Browse Shop <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          ) : (
            /* -- Cart items list -- */
            <div className="space-y-2.5">
              {cartItems.map(({ product, qty }) => (
                <div key={product._id}
                  className="flex gap-3.5 rounded-xl p-3"
                  style={{ background: 'linear-gradient(145deg,#1B2420 0%,#161D19 100%)', border: '1px solid rgba(255,255,255,0.08)' }}
                >
                  {/* Product image */}
                  <div className="relative w-18 h-18 rounded-xl overflow-hidden shrink-0 border border-white/8" style={{ width: 72, height: 72 }}>
                    <img
                      src={product.img.replace('?auto=compress&', '?auto=compress&cs=tinysrgb&')}
                      alt={product.name}
                      onError={(e) => { e.currentTarget.src = `https://placehold.co/72x72/161D19/C6A16E?text=${encodeURIComponent(product.category)}`; e.currentTarget.onerror = null; }}
                      className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0B0F0C]/40 to-transparent" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-[#F5F3EE] text-sm font-semibold leading-snug line-clamp-2 mb-1.5 font-heading">{product.name}</p>
                    <p className="text-[#8E8A81] text-[11px] mb-2">{product.category}</p>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-[#C6A16E] text-sm font-bold leading-none">NPR {(product.price * qty).toLocaleString()}</p>
                        {qty > 1 && <p className="text-[#8E8A81] text-[10px] mt-0.5">{product.price.toLocaleString()} × {qty}</p>}
                      </div>
                      {/* Qty controls */}
                      <div className="flex items-center gap-1 rounded-lg border border-[#C6A16E]/25 bg-[#C6A16E]/[0.06] px-1 py-0.5">
                        <button onClick={() => changeQty(product._id, -1)}
                          className="w-6 h-6 flex items-center justify-center rounded text-[#C6A16E] hover:bg-[#C6A16E]/15 transition-all">
                          <Minus className="w-2.5 h-2.5" />
                        </button>
                        <span className="text-[#F5F3EE] text-xs font-bold w-5 text-center">{qty}</span>
                        <button onClick={() => changeQty(product._id, 1)}
                          className="w-6 h-6 flex items-center justify-center rounded text-[#C6A16E] hover:bg-[#C6A16E]/15 transition-all">
                          <Plus className="w-2.5 h-2.5" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Remove */}
                  <button onClick={() => removeItem(product._id)}
                    className="self-start p-1.5 rounded-lg hover:bg-red-900/25 text-[#8E8A81] hover:text-red-400 transition-all mt-0.5 shrink-0">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
              <button onClick={clearCart}
                className="flex items-center gap-1.5 text-xs text-[#8E8A81] hover:text-red-400 transition-all self-end pt-1">
                <Trash2 className="w-3 h-3" /> Clear all
              </button>
            </div>
          )}
        </div>

        {/* Drawer footer — order summary + checkout */}
        {!checkedOut && !paymentStep && !detailsStep && cartItems.length > 0 && (
          <div className="px-5 pt-4 pb-6 border-t border-white/8 shrink-0 space-y-3"
            style={{ background: 'linear-gradient(180deg,#0D1210 0%,#0B0F0C 100%)' }}>

            {/* Free shipping progress */}
            {!shippingFree ? (
              <div>
                <div className="flex items-center justify-between text-[11px] mb-1.5">
                  <span className="text-[#8E8A81]">NPR {subtotal.toLocaleString()} of NPR {SHIPPING_THRESHOLD.toLocaleString()}</span>
                  <span className="text-[#C6A16E] font-medium">Free shipping at NPR {SHIPPING_THRESHOLD.toLocaleString()}</span>
                </div>
                <div className="h-1.5 bg-[#161D19] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-[#C6A16E] to-[#D4AE7A] rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, (subtotal / SHIPPING_THRESHOLD) * 100)}%` }}
                  />
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[#8FA68E]/10 border border-[#8FA68E]/20">
                <CheckCircle className="w-4 h-4 text-[#8FA68E] shrink-0" />
                <p className="text-xs text-[#8FA68E] font-medium">Free shipping unlocked!</p>
              </div>
            )}

            {/* Totals */}
            <div className="bg-[#111714] border border-white/8 rounded-xl px-4 py-3 space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-[#8E8A81]">Subtotal</span>
                <span className="text-[#B8B4AA]">NPR {subtotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-[#8E8A81]">Shipping</span>
                <span className={shippingFree ? 'text-[#8FA68E] font-medium' : 'text-[#B8B4AA]'}>
                  {shippingFree ? 'FREE' : `NPR ${SHIPPING_FEE.toLocaleString()}`}
                </span>
              </div>
              <div className="h-px bg-white/8" />
              <div className="flex justify-between items-baseline">
                <span className="text-sm font-semibold text-[#F5F3EE]">Total</span>
                <span className="text-xl font-bold text-[#C6A16E] font-heading">NPR {total.toLocaleString()}</span>
              </div>
            </div>

            {/* Checkout button */}
            {isAuthenticated ? (
              <button
                onClick={() => setDetailsStep(true)}
                className="btn-primary w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-bold text-sm"
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
                  className="btn-primary w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-bold text-sm"
                >
                  <LogIn className="w-4 h-4" /> Log in to Checkout
                </button>
                <button
                  onClick={() => navigate('/signup')}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg btn-outline text-[#F5F3EE] text-sm font-medium"
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
// #endregion Component

// #region Exports
export default Shop;
// #endregion Exports
