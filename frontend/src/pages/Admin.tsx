// src/pages/Admin.tsx
// Admin dashboard with tabs for managing users, hikes, hotels, packages, bookings, products, and orders.
// #region Imports
import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { MapContainer, TileLayer, Marker, Polyline, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import {
  Users, Mountain, ShieldCheck, Trash2, ChevronLeft, ChevronRight,
  Search, RefreshCw, Plus, Pencil, X, LogOut, MapPin, CalendarDays,
  Navigation, Eye, CheckCircle2, Flag, Hotel, BookOpen, Package,
  Star, Phone, Mail, Globe, ChevronDown, ChevronUp, ShoppingBag, Tag, ToggleLeft, ToggleRight,
  ClipboardList, Truck, CheckCheck,
} from "lucide-react";
import { API_BASE_URL } from "../config/env";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { getToken } from "../services/auth";
// #endregion Imports

// #region Leaflet Helpers
// -- Leaflet helpers -----------------------------------------------------
const adminStartIcon = L.divIcon({
  className: '',
  html: `<div style="background:#22c55e;width:18px;height:18px;border-radius:50%;border:3px solid white;box-shadow:0 0 6px rgba(0,0,0,0.5);display:flex;align-items:center;justify-content:center"><span style="color:white;font-size:9px;font-weight:700">S</span></div>`,
  iconSize: [18, 18],
  iconAnchor: [9, 9],
});
const adminEndIcon = L.divIcon({
  className: '',
  html: `<div style="background:#ef4444;width:18px;height:18px;border-radius:50%;border:3px solid white;box-shadow:0 0 6px rgba(0,0,0,0.5);display:flex;align-items:center;justify-content:center"><span style="color:white;font-size:9px;font-weight:700">E</span></div>`,
  iconSize: [18, 18],
  iconAnchor: [9, 9],
});
const AdminLocationPicker: React.FC<{ onSelect: (lat: number, lng: number) => void }> = ({ onSelect }) => {
  useMapEvents({ click: (e) => onSelect(e.latlng.lat, e.latlng.lng) });
  return null;
};
// #endregion Leaflet Helpers

// #region Types
interface AdminUser {
  _id: string;
  name: string;
  email: string;
  role: "user" | "admin";
  provider: string;
  createdAt: string;
  country?: string;
  travelStyle?: string;
  budgetRange?: string;
  interests?: string[];
  avatarUrl?: string;
}

interface AdminHike {
  _id: string;
  title: string;
  location: string;
  date: string;
  difficulty: number;
  spotsLeft: number;
  description?: string;
  imageUrl?: string;
  coordinates?: { lat: number; lng: number };
  startPoint?: { lat: number; lng: number };
  endPoint?: { lat: number; lng: number };
  userId: { name: string; email: string } | null;
  participants: { name: string }[];
}

interface AdminHotelPackage {
  _id: string;
  name: string;
  roomType: string;
  pricePerNight: number;
  capacity: number;
  amenities: string[];
  availableRooms: number;
  minStayNights: number;
  maxStayNights?: number;
  cancellationPolicy: string;
}

interface AdminHotel {
  _id: string;
  name: string;
  location: string;
  description?: string;
  contactPhone?: string;
  email?: string;
  website?: string;
  imageUrl?: string;
  rating: number;
  reviewCount: number;
  amenities: string[];
  packages: AdminHotelPackage[] | string[];
  coordinates?: { lat: number; lng: number };
}

interface AdminBooking {
  _id: string;
  bookingReference: string;
  userId: { name: string; email: string } | null;
  hotelId: { name: string; location: string } | null;
  packageId: { name: string; roomType: string; pricePerNight: number } | null;
  guestName: string;
  guestEmail: string;
  checkInDate: string;
  checkOutDate: string;
  numberOfRooms: number;
  numberOfNights: number;
  totalPrice: number;
  status: "pending" | "confirmed" | "cancelled";
  paymentStatus: "unpaid" | "partial" | "paid";
  createdAt: string;
}

interface AdminProduct {
  _id: string;
  name: string;
  category: string;
  price: number;
  description: string;
  badge: string | null;
  img: string;
  images: string[];
  rating: number;
  reviews: number;
  inStock: boolean;
  featured: boolean;
  createdAt: string;
}

interface Stats { totalUsers: number; totalAdmins: number; totalHikes: number; totalHotels: number; totalBookings: number; pendingBookings: number; totalProducts: number; totalOrders: number; pendingOrders: number; }
type Tab = "users" | "hikes" | "hotels" | "packages" | "bookings" | "shop" | "orders";

interface AdminOrderItem { productId: string; name: string; category: string; price: number; qty: number; img: string; }
interface AdminOrderCustomer { name: string; phone: string; email: string; address: string; city: string; }
interface AdminOrder {
  _id: string;
  orderId: string;
  userId?: string | null;
  items: AdminOrderItem[];
  customer: AdminOrderCustomer;
  subtotal: number;
  shipping: number;
  total: number;
  paymentMethod: 'cod' | 'khalti';
  paymentStatus: 'unpaid' | 'paid';
  status: 'placed' | 'processing' | 'out_for_delivery' | 'delivered' | 'cancelled';
  createdAt: string;
}

interface AdminPackageFull extends AdminHotelPackage {
  hotelId: { _id: string; name: string; location: string } | null;
  createdAt: string;
}
// #endregion Types

// #region Constants
const PRODUCT_CATEGORIES = ["Backpacks", "Camping", "Photography", "Footwear", "Navigation", "Safety"];

const defaultUserForm = { name: "", email: "", password: "", role: "user" as "user" | "admin", country: "", travelStyle: "", budgetRange: "", interests: "", avatarUrl: "" };
const defaultHikeForm = { title: "", location: "", date: "", difficulty: "1", spotsLeft: "0", description: "", imageUrl: "", lat: "", lng: "" };
const defaultHotelForm = { name: "", location: "", description: "", contactPhone: "", email: "", website: "", imageUrl: "", rating: "4.0", amenities: "" };
const defaultPackageForm = { name: "", roomType: "double", pricePerNight: "", capacity: "2", amenities: "", availableRooms: "5", minStayNights: "1", maxStayNights: "", cancellationPolicy: "free" };
const defaultProductForm = { name: "", category: "Backpacks", price: "", description: "", badge: "", img: "", images: "", inStock: true, featured: false };
// #endregion Constants

// #region Component
const Admin: React.FC = () => {
  const { logout } = useAuth();
  const { showSuccess, showError } = useToast();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<Tab>("users");
  const [stats, setStats] = useState<Stats | null>(null);

  // Users state
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [userSearch, setUserSearch] = useState("");
  const [userPage, setUserPage] = useState(1);
  const [userPages, setUserPages] = useState(1);
  const [userTotal, setUserTotal] = useState(0);
  const [usersLoading, setUsersLoading] = useState(false);

  // Hikes state
  const [hikes, setHikes] = useState<AdminHike[]>([]);
  const [hikeSearch, setHikeSearch] = useState("");
  const [hikePage, setHikePage] = useState(1);
  const [hikePages, setHikePages] = useState(1);
  const [hikeTotal, setHikeTotal] = useState(0);
  const [hikesLoading, setHikesLoading] = useState(false);

  // User modal
  const [userModal, setUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
  const [userForm, setUserForm] = useState(defaultUserForm);
  const [userSaving, setUserSaving] = useState(false);

  // Hike modal
  const [hikeModal, setHikeModal] = useState(false);
  const [editingHike, setEditingHike] = useState<AdminHike | null>(null);
  const [hikeForm, setHikeForm] = useState(defaultHikeForm);
  const [hikeSaving, setHikeSaving] = useState(false);

  // Hike detail view
  const [viewHike, setViewHike] = useState<AdminHike | null>(null);

  // Hike detail map (OSRM route)
  const [viewHikeRoute, setViewHikeRoute] = useState<[number, number][]>([]);
  const [viewHikeDistance, setViewHikeDistance] = useState<number | null>(null);

  // Hike trail points (for create/edit modal)
  const [hikeStartPoint, setHikeStartPoint] = useState<{ lat: number; lng: number } | null>(null);
  const [hikeEndPoint, setHikeEndPoint] = useState<{ lat: number; lng: number } | null>(null);
  const [hikeActivePoint, setHikeActivePoint] = useState<'start' | 'end'>('start');

  // Hotels state
  const [hotels, setHotels] = useState<AdminHotel[]>([]);
  const [hotelSearch, setHotelSearch] = useState("");
  const [hotelPage, setHotelPage] = useState(1);
  const [hotelPages, setHotelPages] = useState(1);
  const [hotelTotal, setHotelTotal] = useState(0);
  const [hotelsLoading, setHotelsLoading] = useState(false);
  const [hotelModal, setHotelModal] = useState(false);
  const [editingHotel, setEditingHotel] = useState<AdminHotel | null>(null);
  const [hotelForm, setHotelForm] = useState(defaultHotelForm);
  const [hotelSaving, setHotelSaving] = useState(false);
  const [viewHotel, setViewHotel] = useState<AdminHotel | null>(null);
  const [viewHotelPackages, setViewHotelPackages] = useState<AdminHotelPackage[]>([]);
  const [viewHotelLoading, setViewHotelLoading] = useState(false);
  const [pkgModal, setPkgModal] = useState(false);
  const [editingPkg, setEditingPkg] = useState<AdminHotelPackage | null>(null);
  const [pkgForm, setPkgForm] = useState(defaultPackageForm);
  const [pkgSaving, setPkgSaving] = useState(false);
  const [pkgHotelId, setPkgHotelId] = useState<string>("");
  const [expandedHotel, setExpandedHotel] = useState<string | null>(null);

  // Packages tab state
  const [allPackages, setAllPackages] = useState<AdminPackageFull[]>([]);
  const [pkgTabSearch, setPkgTabSearch] = useState("");
  const [pkgTabHotelFilter, setPkgTabHotelFilter] = useState("");
  const [pkgTabPage, setPkgTabPage] = useState(1);
  const [pkgTabPages, setPkgTabPages] = useState(1);
  const [pkgTabTotal, setPkgTabTotal] = useState(0);
  const [pkgTabLoading, setPkgTabLoading] = useState(false);

  // Bookings state
  const [bookings, setBookings] = useState<AdminBooking[]>([]);
  const [bookingSearch, setBookingSearch] = useState("");
  const [bookingStatusFilter, setBookingStatusFilter] = useState("all");
  const [bookingPage, setBookingPage] = useState(1);
  const [bookingPages, setBookingPages] = useState(1);
  const [bookingTotal, setBookingTotal] = useState(0);
  const [bookingsLoading, setBookingsLoading] = useState(false);

  // Orders state
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [orderSearch, setOrderSearch] = useState("");
  const [orderStatusFilter, setOrderStatusFilter] = useState("all");
  const [orderPaymentFilter, setOrderPaymentFilter] = useState("all");
  const [orderPage, setOrderPage] = useState(1);
  const [orderPages, setOrderPages] = useState(1);
  const [orderTotal, setOrderTotal] = useState(0);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);

  // Shop / Products state
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [productSearch, setProductSearch] = useState("");
  const [productCategory, setProductCategory] = useState("");
  const [productPage, setProductPage] = useState(1);
  const [productPages, setProductPages] = useState(1);
  const [productTotal, setProductTotal] = useState(0);
  const [productsLoading, setProductsLoading] = useState(false);
  const [productModal, setProductModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<AdminProduct | null>(null);
  const [productForm, setProductForm] = useState(defaultProductForm);
  const [productSaving, setProductSaving] = useState(false);

  // Handles authHeader logic.
  const authHeader = () => ({ Authorization: `Bearer ${getToken()}` });

  // Handles throwIfNotOk logic.
  const throwIfNotOk = async (res: Response) => {
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      const err: any = new Error(data.message || "Request failed");
      err.status = res.status;
      throw err;
    }
  };

  const handleAuthError = useCallback((err: any) => {
    if (err?.status === 401 || err?.message === "AUTH_EXPIRED") { logout(); navigate("/login"); }
    else showError(err?.message || "An error occurred");
  }, [logout, navigate, showError]);

  // --- Fetch -----------------------------------------------------------------

  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/stats`, { headers: authHeader() });
      await throwIfNotOk(res);
      setStats(await res.json());
    } catch (err: any) { handleAuthError(err); }
  }, [handleAuthError]);

  const fetchUsers = useCallback(async () => {
    setUsersLoading(true);
    try {
      const params = new URLSearchParams({ page: String(userPage), limit: "10", search: userSearch });
      const res = await fetch(`${API_BASE_URL}/api/admin/users?${params}`, { headers: authHeader() });
      await throwIfNotOk(res);
      const data = await res.json();
      setUsers(data.users); setUserPages(data.pagination.pages); setUserTotal(data.pagination.total);
    } catch (err: any) { handleAuthError(err); }
    finally { setUsersLoading(false); }
  }, [userPage, userSearch, handleAuthError]);

  const fetchHikes = useCallback(async () => {
    setHikesLoading(true);
    try {
      const params = new URLSearchParams({ page: String(hikePage), limit: "10", search: hikeSearch });
      const res = await fetch(`${API_BASE_URL}/api/admin/hikes?${params}`, { headers: authHeader() });
      await throwIfNotOk(res);
      const data = await res.json();
      setHikes(data.hikes); setHikePages(data.pagination.pages); setHikeTotal(data.pagination.total);
    } catch (err: any) { handleAuthError(err); }
    finally { setHikesLoading(false); }
  }, [hikePage, hikeSearch, handleAuthError]);

  const fetchHotels = useCallback(async () => {
    setHotelsLoading(true);
    try {
      const params = new URLSearchParams({ page: String(hotelPage), limit: "10", search: hotelSearch });
      const res = await fetch(`${API_BASE_URL}/api/admin/hotels?${params}`, { headers: authHeader() });
      await throwIfNotOk(res);
      const data = await res.json();
      setHotels(data.hotels); setHotelPages(data.pagination.pages); setHotelTotal(data.pagination.total);
    } catch (err: any) { handleAuthError(err); }
    finally { setHotelsLoading(false); }
  }, [hotelPage, hotelSearch, handleAuthError]);

  const fetchBookings = useCallback(async () => {
    setBookingsLoading(true);
    try {
      const params = new URLSearchParams({ page: String(bookingPage), limit: "10", search: bookingSearch, status: bookingStatusFilter });
      const res = await fetch(`${API_BASE_URL}/api/admin/bookings?${params}`, { headers: authHeader() });
      await throwIfNotOk(res);
      const data = await res.json();
      setBookings(data.bookings); setBookingPages(data.pagination.pages); setBookingTotal(data.pagination.total);
    } catch (err: any) { handleAuthError(err); }
    finally { setBookingsLoading(false); }
  }, [bookingPage, bookingSearch, bookingStatusFilter, handleAuthError]);

  const fetchProducts = useCallback(async () => {
    setProductsLoading(true);
    try {
      const params = new URLSearchParams({ page: String(productPage), limit: "12", search: productSearch, category: productCategory });
      const res = await fetch(`${API_BASE_URL}/api/admin/products?${params}`, { headers: authHeader() });
      await throwIfNotOk(res);
      const data = await res.json();
      setProducts(data.products); setProductPages(data.pagination.pages); setProductTotal(data.pagination.total);
    } catch (err: any) { handleAuthError(err); }
    finally { setProductsLoading(false); }
  }, [productPage, productSearch, productCategory, handleAuthError]);

  const fetchOrders = useCallback(async () => {
    setOrdersLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(orderPage), limit: "15", search: orderSearch,
        ...(orderStatusFilter !== "all" ? { status: orderStatusFilter } : {}),
        ...(orderPaymentFilter !== "all" ? { paymentMethod: orderPaymentFilter } : {}),
      });
      const res = await fetch(`${API_BASE_URL}/api/admin/orders?${params}`, { headers: authHeader() });
      await throwIfNotOk(res);
      const data = await res.json();
      setOrders(data.orders); setOrderPages(data.pagination.pages); setOrderTotal(data.pagination.total);
    } catch (err: any) { handleAuthError(err); }
    finally { setOrdersLoading(false); }
  }, [orderPage, orderSearch, orderStatusFilter, orderPaymentFilter, handleAuthError]);

  const fetchAllPackages = useCallback(async () => {
    setPkgTabLoading(true);
    try {
      const params = new URLSearchParams({ page: String(pkgTabPage), limit: "15", search: pkgTabSearch, hotelId: pkgTabHotelFilter });
      const res = await fetch(`${API_BASE_URL}/api/admin/packages?${params}`, { headers: authHeader() });
      await throwIfNotOk(res);
      const data = await res.json();
      setAllPackages(data.packages); setPkgTabPages(data.pagination.pages); setPkgTabTotal(data.pagination.total);
    } catch (err: any) { handleAuthError(err); }
    finally { setPkgTabLoading(false); }
  }, [pkgTabPage, pkgTabSearch, pkgTabHotelFilter, handleAuthError]);

  useEffect(() => { fetchStats(); }, [fetchStats]);
  useEffect(() => { fetchUsers(); }, [fetchUsers]);
  useEffect(() => { if (activeTab === "hikes") fetchHikes(); }, [fetchHikes, activeTab]);
  useEffect(() => { if (activeTab === "hotels" || activeTab === "packages") fetchHotels(); }, [fetchHotels, activeTab]);
  useEffect(() => { if (activeTab === "packages") fetchAllPackages(); }, [fetchAllPackages, activeTab]);
  useEffect(() => { if (activeTab === "bookings") fetchBookings(); }, [fetchBookings, activeTab]);
  useEffect(() => { if (activeTab === "shop") fetchProducts(); }, [fetchProducts, activeTab]);
  useEffect(() => { if (activeTab === "orders") fetchOrders(); }, [fetchOrders, activeTab]);

  // --- User CRUD -------------------------------------------------------------

  const openCreateUser = () => { setEditingUser(null); setUserForm(defaultUserForm); setUserModal(true); };

  // Handles openEditUser logic.
  const openEditUser = (u: AdminUser) => {
    setEditingUser(u);
    setUserForm({
      name: u.name, email: u.email, password: "", role: u.role,
      country: u.country || "", travelStyle: u.travelStyle || "",
      budgetRange: u.budgetRange || "", interests: u.interests?.join(", ") || "",
      avatarUrl: u.avatarUrl || "",
    });
    setUserModal(true);
  };

  // Handles saveUser logic.
  const saveUser = async () => {
    if (!userForm.name.trim() || !userForm.email.trim()) { showError("Name and email are required."); return; }
    if (!editingUser && !userForm.password.trim()) { showError("Password is required for new users."); return; }
    setUserSaving(true);
    try {
      const isEdit = !!editingUser;
      const url = isEdit ? `${API_BASE_URL}/api/admin/users/${editingUser!._id}` : `${API_BASE_URL}/api/admin/users`;
      const body: any = { name: userForm.name, email: userForm.email, role: userForm.role };
      if (!isEdit) body.password = userForm.password;
      if (userForm.country) body.country = userForm.country;
      if (userForm.travelStyle) body.travelStyle = userForm.travelStyle;
      if (userForm.budgetRange) body.budgetRange = userForm.budgetRange;
      if (userForm.avatarUrl) body.avatarUrl = userForm.avatarUrl;
      if (userForm.interests) body.interests = userForm.interests.split(",").map((s) => s.trim()).filter(Boolean);
      const res = await fetch(url, {
        method: isEdit ? "PUT" : "POST",
        headers: { ...authHeader(), "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      await throwIfNotOk(res);
      showSuccess(isEdit ? "User updated." : "User created.");
      setUserModal(false);
      fetchUsers(); fetchStats();
    } catch (err: any) { showError(err.message || "Failed to save user."); }
    finally { setUserSaving(false); }
  };

  // Handles handleRoleChange logic.
  const handleRoleChange = async (userId: string, role: "user" | "admin") => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/users/${userId}/role`, {
        method: "PATCH",
        headers: { ...authHeader(), "Content-Type": "application/json" },
        body: JSON.stringify({ role }),
      });
      await throwIfNotOk(res);
      showSuccess(`Role updated to '${role}'.`);
      fetchUsers(); fetchStats();
    } catch (err: any) { showError(err.message || "Failed to update role."); }
  };

  // Handles handleDeleteUser logic.
  const handleDeleteUser = async (userId: string, name: string) => {
    if (!confirm(`Delete user "${name}"? This cannot be undone.`)) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/users/${userId}`, { method: "DELETE", headers: authHeader() });
      await throwIfNotOk(res);
      showSuccess("User deleted."); fetchUsers(); fetchStats();
    } catch (err: any) { showError(err.message || "Failed to delete user."); }
  };

  // --- Hike CRUD -------------------------------------------------------------

  // Fetch OSRM route whenever the detail modal opens with start+end points
  useEffect(() => {
    if (!viewHike?.startPoint || !viewHike?.endPoint) {
      setViewHikeRoute([]);
      setViewHikeDistance(null);
      return;
    }
    const { startPoint: s, endPoint: e } = viewHike;
    fetch(
      `https://router.project-osrm.org/route/v1/foot/${s.lng},${s.lat};${e.lng},${e.lat}?overview=full&geometries=geojson`
    )
      .then((r) => r.json())
      .then((data) => {
        if (data.routes?.[0]) {
          const coords: [number, number][] = data.routes[0].geometry.coordinates.map(
            ([lon, lat]: [number, number]) => [lat, lon]
          );
          setViewHikeRoute(coords);
          setViewHikeDistance(data.routes[0].distance);
        }
      })
      .catch(() => {
        // fallback: straight line
        setViewHikeRoute([[s.lat, s.lng], [e.lat, e.lng]]);
        setViewHikeDistance(null);
      });
  }, [viewHike]);

  // Handles openCreateHike logic.
  const openCreateHike = () => { setEditingHike(null); setHikeForm(defaultHikeForm); setHikeStartPoint(null); setHikeEndPoint(null); setHikeActivePoint('start'); setHikeModal(true); };

  // Handles openEditHike logic.
  const openEditHike = (h: AdminHike) => {
    setEditingHike(h);
    setHikeForm({
      title: h.title, location: h.location,
      date: h.date ? new Date(h.date).toISOString().split("T")[0] : "",
      difficulty: String(h.difficulty), spotsLeft: String(h.spotsLeft), description: h.description || "",
      imageUrl: h.imageUrl || "",
      lat: h.coordinates?.lat ? String(h.coordinates.lat) : "",
      lng: h.coordinates?.lng ? String(h.coordinates.lng) : "",
    });
    setHikeStartPoint(h.startPoint ?? null);
    setHikeEndPoint(h.endPoint ?? null);
    setHikeActivePoint('start');
    setHikeModal(true);
  };

  // Handles saveHike logic.
  const saveHike = async () => {
    if (!hikeForm.title.trim() || !hikeForm.location.trim() || !hikeForm.date) {
      showError("Title, location and date are required."); return;
    }
    setHikeSaving(true);
    try {
      const isEdit = !!editingHike;
      const url = isEdit ? `${API_BASE_URL}/api/admin/hikes/${editingHike!._id}` : `${API_BASE_URL}/api/admin/hikes`;
      const res = await fetch(url, {
        method: isEdit ? "PUT" : "POST",
        headers: { ...authHeader(), "Content-Type": "application/json" },
        body: JSON.stringify({
          title: hikeForm.title, location: hikeForm.location, date: hikeForm.date,
          difficulty: Number(hikeForm.difficulty), spotsLeft: Number(hikeForm.spotsLeft), description: hikeForm.description,
          ...(hikeForm.imageUrl && { imageUrl: hikeForm.imageUrl }),
          ...(hikeStartPoint && { coordinates: hikeStartPoint, startPoint: hikeStartPoint }),
          ...(hikeEndPoint && { endPoint: hikeEndPoint }),
        }),
      });
      await throwIfNotOk(res);
      showSuccess(isEdit ? "Hike updated." : "Hike created.");
      setHikeModal(false); fetchHikes(); fetchStats();
    } catch (err: any) { showError(err.message || "Failed to save hike."); }
    finally { setHikeSaving(false); }
  };

  // Handles handleDeleteHike logic.
  const handleDeleteHike = async (hikeId: string, title: string) => {
    if (!confirm(`Delete hike "${title}"? This cannot be undone.`)) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/hikes/${hikeId}`, { method: "DELETE", headers: authHeader() });
      await throwIfNotOk(res);
      showSuccess("Hike deleted."); fetchHikes(); fetchStats();
    } catch (err: any) { showError(err.message || "Failed to delete hike."); }
  };

  // --- Hotel CRUD ------------------------------------------------------------

  const openCreateHotel = () => { setEditingHotel(null); setHotelForm(defaultHotelForm); setHotelModal(true); };

  // Handles openEditHotel logic.
  const openEditHotel = (h: AdminHotel) => {
    setEditingHotel(h);
    setHotelForm({
      name: h.name, location: h.location, description: h.description || "",
      contactPhone: h.contactPhone || "", email: h.email || "", website: h.website || "",
      imageUrl: h.imageUrl || "", rating: String(h.rating), amenities: h.amenities.join(", "),
    });
    setHotelModal(true);
  };

  // Handles saveHotel logic.
  const saveHotel = async () => {
    if (!hotelForm.name.trim() || !hotelForm.location.trim()) { showError("Name and location are required."); return; }
    setHotelSaving(true);
    try {
      const isEdit = !!editingHotel;
      const url = isEdit ? `${API_BASE_URL}/api/admin/hotels/${editingHotel!._id}` : `${API_BASE_URL}/api/admin/hotels`;
      const body: any = {
        name: hotelForm.name, location: hotelForm.location, description: hotelForm.description,
        contactPhone: hotelForm.contactPhone, email: hotelForm.email, website: hotelForm.website,
        imageUrl: hotelForm.imageUrl, rating: Number(hotelForm.rating),
        amenities: hotelForm.amenities.split(",").map(s => s.trim()).filter(Boolean),
      };
      const res = await fetch(url, {
        method: isEdit ? "PUT" : "POST",
        headers: { ...authHeader(), "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      await throwIfNotOk(res);
      showSuccess(isEdit ? "Hotel updated." : "Hotel created.");
      setHotelModal(false); fetchHotels(); fetchStats();
    } catch (err: any) { showError(err.message || "Failed to save hotel."); }
    finally { setHotelSaving(false); }
  };

  // Handles handleDeleteHotel logic.
  const handleDeleteHotel = async (hotelId: string, name: string) => {
    if (!confirm(`Delete hotel "${name}" and all its packages? This cannot be undone.`)) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/hotels/${hotelId}`, { method: "DELETE", headers: authHeader() });
      await throwIfNotOk(res);
      showSuccess("Hotel deleted."); fetchHotels(); fetchStats();
      if (viewHotel?._id === hotelId) setViewHotel(null);
    } catch (err: any) { showError(err.message || "Failed to delete hotel."); }
  };

  // Handles openViewHotel logic.
  const openViewHotel = async (h: AdminHotel) => {
    setViewHotel(h); setViewHotelLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/hotels/${h._id}`, { headers: authHeader() });
      await throwIfNotOk(res);
      const data = await res.json();
      setViewHotelPackages(data.packages || []);
    } catch (err: any) { showError(err.message || "Failed to fetch hotel details."); }
    finally { setViewHotelLoading(false); }
  };

  // --- Package CRUD ----------------------------------------------------------

  const openAddPackage = (hotelId: string) => {
    setEditingPkg(null); setPkgForm(defaultPackageForm); setPkgHotelId(hotelId); setPkgModal(true);
  };

  // Handles openEditPackage logic.
  const openEditPackage = (pkg: AdminHotelPackage, hotelId: string) => {
    setEditingPkg(pkg);
    setPkgForm({
      name: pkg.name, roomType: pkg.roomType, pricePerNight: String(pkg.pricePerNight),
      capacity: String(pkg.capacity), amenities: pkg.amenities.join(", "),
      availableRooms: String(pkg.availableRooms), minStayNights: String(pkg.minStayNights),
      maxStayNights: pkg.maxStayNights ? String(pkg.maxStayNights) : "",
      cancellationPolicy: pkg.cancellationPolicy,
    });
    setPkgHotelId(hotelId); setPkgModal(true);
  };

  // Handles savePackage logic.
  const savePackage = async () => {
    if (!pkgForm.name.trim() || !pkgForm.pricePerNight) { showError("Name and price are required."); return; }
    setPkgSaving(true);
    try {
      const body = {
        name: pkgForm.name, roomType: pkgForm.roomType, pricePerNight: Number(pkgForm.pricePerNight),
        capacity: Number(pkgForm.capacity), availableRooms: Number(pkgForm.availableRooms),
        minStayNights: Number(pkgForm.minStayNights),
        maxStayNights: pkgForm.maxStayNights ? Number(pkgForm.maxStayNights) : undefined,
        cancellationPolicy: pkgForm.cancellationPolicy,
        amenities: pkgForm.amenities.split(",").map(s => s.trim()).filter(Boolean),
      };
      let res;
      if (editingPkg) {
        res = await fetch(`${API_BASE_URL}/api/admin/packages/${editingPkg._id}`, {
          method: "PUT", headers: { ...authHeader(), "Content-Type": "application/json" }, body: JSON.stringify(body),
        });
      } else {
        res = await fetch(`${API_BASE_URL}/api/admin/hotels/${pkgHotelId}/packages`, {
          method: "POST", headers: { ...authHeader(), "Content-Type": "application/json" }, body: JSON.stringify(body),
        });
      }
      await throwIfNotOk(res);
      showSuccess(editingPkg ? "Package updated." : "Package added.");
      setPkgModal(false);
      if (viewHotel) openViewHotel(viewHotel);
      if (activeTab === "packages") fetchAllPackages();
      if (activeTab === "hotels" || activeTab === "packages") fetchHotels();
    } catch (err: any) { showError(err.message || "Failed to save package."); }
    finally { setPkgSaving(false); }
  };

  // Handles handleDeletePackage logic.
  const handleDeletePackage = async (pkgId: string) => {
    if (!confirm("Delete this package?")) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/packages/${pkgId}`, { method: "DELETE", headers: authHeader() });
      await throwIfNotOk(res);
      showSuccess("Package deleted.");
      if (viewHotel) openViewHotel(viewHotel);
      if (activeTab === "packages") fetchAllPackages();
      if (activeTab === "hotels" || activeTab === "packages") fetchHotels();
    } catch (err: any) { showError(err.message || "Failed to delete package."); }
  };

  // --- Booking management ----------------------------------------------------

  const handleBookingStatusChange = async (bookingId: string, status: string) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/bookings/${bookingId}/status`, {
        method: "PATCH",
        headers: { ...authHeader(), "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      await throwIfNotOk(res);
      showSuccess("Booking status updated."); fetchBookings(); fetchStats();
    } catch (err: any) { showError(err.message || "Failed to update booking."); }
  };

  // Handles handlePaymentStatusChange logic.
  const handlePaymentStatusChange = async (bookingId: string, paymentStatus: string) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/bookings/${bookingId}/status`, {
        method: "PATCH",
        headers: { ...authHeader(), "Content-Type": "application/json" },
        body: JSON.stringify({ paymentStatus }),
      });
      await throwIfNotOk(res);
      showSuccess("Payment status updated."); fetchBookings();
    } catch (err: any) { showError(err.message || "Failed to update payment status."); }
  };

  // Handles handleDeleteBooking logic.
  const handleDeleteBooking = async (bookingId: string, ref: string) => {
    if (!confirm(`Delete booking ${ref}? This cannot be undone.`)) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/bookings/${bookingId}`, { method: "DELETE", headers: authHeader() });
      await throwIfNotOk(res);
      showSuccess("Booking deleted."); fetchBookings(); fetchStats();
    } catch (err: any) { showError(err.message || "Failed to delete booking."); }
  };

  // --- UI --------------------------------------------------------------------


  // --- Product CRUD ----------------------------------------------------------

  const openCreateProduct = () => { setEditingProduct(null); setProductForm(defaultProductForm); setProductModal(true); };

  // Handles openEditProduct logic.
  const openEditProduct = (p: AdminProduct) => {
    setEditingProduct(p);
    setProductForm({
      name: p.name, category: p.category, price: String(p.price),
      description: p.description || "", badge: p.badge || "",
      img: p.img || "", images: p.images.join(", "),
      inStock: p.inStock, featured: p.featured,
    });
    setProductModal(true);
  };

  // Handles saveProduct logic.
  const saveProduct = async () => {
    if (!productForm.name.trim() || !productForm.category || !productForm.price) {
      showError("Name, category, and price are required."); return;
    }
    setProductSaving(true);
    try {
      const body = {
        name: productForm.name.trim(),
        category: productForm.category,
        price: parseFloat(productForm.price as string),
        description: productForm.description.trim(),
        badge: (productForm.badge as string).trim() || null,
        img: (productForm.img as string).trim(),
        images: (productForm.images as string).split(",").map((s: string) => s.trim()).filter(Boolean),
        inStock: productForm.inStock,
        featured: productForm.featured,
      };
      const url = editingProduct
        ? `${API_BASE_URL}/api/admin/products/${editingProduct._id}`
        : `${API_BASE_URL}/api/admin/products`;
      const method = editingProduct ? "PUT" : "POST";
      const res = await fetch(url, { method, headers: { ...authHeader(), "Content-Type": "application/json" }, body: JSON.stringify(body) });
      await throwIfNotOk(res);
      showSuccess(editingProduct ? "Product updated." : "Product created.");
      setProductModal(false); fetchProducts(); fetchStats();
    } catch (err: any) { showError(err.message || "Failed to save product."); }
    finally { setProductSaving(false); }
  };

  // Handles handleDeleteProduct logic.
  const handleDeleteProduct = async (id: string, name: string) => {
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/products/${id}`, { method: "DELETE", headers: authHeader() });
      await throwIfNotOk(res);
      showSuccess("Product deleted."); fetchProducts(); fetchStats();
    } catch (err: any) { showError(err.message || "Failed to delete product."); }
  };

  // --- Order management ------------------------------------------------------

  const handleOrderStatusChange = async (orderId: string, status: string) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/orders/${orderId}/status`, {
        method: "PATCH",
        headers: { ...authHeader(), "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      await throwIfNotOk(res);
      showSuccess("Order status updated."); fetchOrders(); fetchStats();
    } catch (err: any) { showError(err.message || "Failed to update order."); }
  };

  // Handles handleOrderPaymentChange logic.
  const handleOrderPaymentChange = async (orderId: string, paymentStatus: string) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/orders/${orderId}/status`, {
        method: "PATCH",
        headers: { ...authHeader(), "Content-Type": "application/json" },
        body: JSON.stringify({ paymentStatus }),
      });
      await throwIfNotOk(res);
      showSuccess("Payment status updated."); fetchOrders();
    } catch (err: any) { showError(err.message || "Failed to update payment status."); }
  };

  // Handles handleDeleteOrder logic.
  const handleDeleteOrder = async (orderId: string, ref: string) => {
    if (!confirm(`Delete order ${ref}? This cannot be undone.`)) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/orders/${orderId}`, { method: "DELETE", headers: authHeader() });
      await throwIfNotOk(res);
      showSuccess("Order deleted."); fetchOrders(); fetchStats();
    } catch (err: any) { showError(err.message || "Failed to delete order."); }
  };

  // Handles toggleProductField logic.
  const toggleProductField = async (p: AdminProduct, field: "inStock" | "featured") => {
    try {
      const body = {
        name: p.name, category: p.category, price: p.price,
        description: p.description, badge: p.badge, img: p.img, images: p.images,
        inStock: field === "inStock" ? !p.inStock : p.inStock,
        featured: field === "featured" ? !p.featured : p.featured,
      };
      const res = await fetch(`${API_BASE_URL}/api/admin/products/${p._id}`, {
        method: "PUT", headers: { ...authHeader(), "Content-Type": "application/json" }, body: JSON.stringify(body),
      });
      await throwIfNotOk(res);
      fetchProducts();
    } catch (err: any) { showError(err.message || "Failed to update product."); }
  };
  return (
    <div className="min-h-screen p-6 text-glass">

      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <ShieldCheck className="w-8 h-8 text-emerald-400" />
          <h1 className="text-2xl font-bold text-glass-light">Admin Dashboard</h1>
        </div>
        <button
          onClick={() => { logout(); navigate("/login"); }}
          className="flex items-center gap-2 px-4 py-2 rounded-lg glass-button text-sm text-glass-dim hover:text-red-400 transition-colors"
        >
          <LogOut className="w-4 h-4" /> Logout
        </button>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          {[
            { label: "Users", value: stats.totalUsers, icon: <Users className="w-5 h-5" /> },
            { label: "Admins", value: stats.totalAdmins, icon: <ShieldCheck className="w-5 h-5" /> },
            { label: "Hikes", value: stats.totalHikes, icon: <Mountain className="w-5 h-5" /> },
            { label: "Hotels", value: stats.totalHotels, icon: <Hotel className="w-5 h-5" /> },
            { label: "Bookings", value: stats.totalBookings, icon: <BookOpen className="w-5 h-5" /> },
            { label: "Pending", value: stats.pendingBookings, icon: <Package className="w-5 h-5" />, accent: stats.pendingBookings > 0 },
            { label: "Products", value: stats.totalProducts, icon: <ShoppingBag className="w-5 h-5" /> },
            { label: "Orders", value: stats.totalOrders, icon: <ClipboardList className="w-5 h-5" /> },
            { label: "Pending Orders", value: stats.pendingOrders, icon: <Truck className="w-5 h-5" />, accent: stats.pendingOrders > 0 },
          ].map((s) => (
            <div key={s.label} className={`glass-card rounded-xl p-4 flex items-center gap-3 ${(s as any).accent ? "border border-amber-500/30" : ""}`}>
              <div className={`${(s as any).accent ? "text-amber-400" : "text-emerald-400"}`}>{s.icon}</div>
              <div>
                <div className="text-xl font-bold text-glass-light">{s.value}</div>
                <div className="text-xs text-glass-dim">{s.label}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {([
          { key: "users", label: "Users", icon: <Users className="w-3.5 h-3.5" /> },
          { key: "hikes", label: "Hikes", icon: <Mountain className="w-3.5 h-3.5" /> },
          { key: "hotels", label: "Hotels", icon: <Hotel className="w-3.5 h-3.5" /> },
          { key: "packages", label: "Packages", icon: <Package className="w-3.5 h-3.5" /> },
          { key: "bookings", label: "Bookings", icon: <BookOpen className="w-3.5 h-3.5" /> },
          { key: "shop", label: "Shop", icon: <ShoppingBag className="w-3.5 h-3.5" /> },
          { key: "orders", label: "Orders", icon: <ClipboardList className="w-3.5 h-3.5" /> },
        ] as { key: Tab; label: string; icon: React.ReactNode }[]).map(({ key, label, icon }) => (
          <button key={key} onClick={() => setActiveTab(key)}
            className={`flex items-center gap-1.5 px-5 py-2 rounded-lg font-medium transition-all ${
              activeTab === key ? "glass-button-dark text-white" : "glass-button text-glass-dim"
            }`}
          >{icon}{label}</button>
        ))}
      </div>

      {/* -- Users Tab -- */}
      {activeTab === "users" && (
        <div className="glass-card rounded-xl p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-glass-dim" />
              <input type="text" placeholder="Search by name or email..." value={userSearch}
                onChange={(e) => { setUserSearch(e.target.value); setUserPage(1); }}
                className="w-full pl-9 pr-4 py-2 rounded-lg glass-input text-sm" />
            </div>
            <button onClick={fetchUsers} className="glass-button p-2 rounded-lg" title="Refresh"><RefreshCw className="w-4 h-4" /></button>
            <span className="text-sm text-glass-dim">{userTotal} total</span>
            <button onClick={openCreateUser}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg glass-button-dark text-white text-sm font-medium transition-all">
              <Plus className="w-4 h-4" /> Add User
            </button>
          </div>

          {usersLoading ? <p className="text-glass-dim text-center py-8">Loading...</p> : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/10 text-glass-dim text-left">
                    <th className="pb-2 pr-4">Name</th><th className="pb-2 pr-4">Email</th>
                    <th className="pb-2 pr-4">Provider</th><th className="pb-2 pr-4">Role</th>
                    <th className="pb-2 pr-4">Joined</th><th className="pb-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u._id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                      <td className="py-3 pr-4 font-medium text-glass-light">{u.name}</td>
                      <td className="py-3 pr-4 text-glass-dim">{u.email}</td>
                      <td className="py-3 pr-4"><span className="px-2 py-0.5 rounded-full text-xs bg-white/10">{u.provider}</span></td>
                      <td className="py-3 pr-4">
                        <select value={u.role} onChange={(e) => handleRoleChange(u._id, e.target.value as "user" | "admin")}
                          className={`text-xs px-2 py-1 rounded-lg border outline-none cursor-pointer [color-scheme:dark] ${
                            u.role === "admin" ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-300" : "bg-white/10 border-white/20 text-glass"
                          }`}>
                          <option value="user" className="bg-gray-900 text-white">user</option>
                          <option value="admin" className="bg-gray-900 text-white">admin</option>
                        </select>
                      </td>
                      <td className="py-3 pr-4 text-glass-dim text-xs">{new Date(u.createdAt).toLocaleDateString()}</td>
                      <td className="py-3 flex items-center gap-1">
                        <button onClick={() => openEditUser(u)} className="p-1.5 rounded-lg text-blue-400 hover:bg-blue-500/20 transition-colors" title="Edit user">
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => handleDeleteUser(u._id, u.name)} className="p-1.5 rounded-lg text-red-400 hover:bg-red-500/20 transition-colors" title="Delete user">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {userPages > 1 && (
            <div className="flex items-center justify-end gap-2 mt-4">
              <button onClick={() => setUserPage((p) => Math.max(1, p - 1))} disabled={userPage === 1} className="glass-button p-1.5 rounded-lg disabled:opacity-40"><ChevronLeft className="w-4 h-4" /></button>
              <span className="text-sm text-glass-dim">{userPage} / {userPages}</span>
              <button onClick={() => setUserPage((p) => Math.min(userPages, p + 1))} disabled={userPage === userPages} className="glass-button p-1.5 rounded-lg disabled:opacity-40"><ChevronRight className="w-4 h-4" /></button>
            </div>
          )}
        </div>
      )}

      {/* -- Hikes Tab -- */}
      {activeTab === "hikes" && (
        <div className="glass-card rounded-xl p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-glass-dim" />
              <input type="text" placeholder="Search by title or location..." value={hikeSearch}
                onChange={(e) => { setHikeSearch(e.target.value); setHikePage(1); }}
                className="w-full pl-9 pr-4 py-2 rounded-lg glass-input text-sm" />
            </div>
            <button onClick={fetchHikes} className="glass-button p-2 rounded-lg" title="Refresh"><RefreshCw className="w-4 h-4" /></button>
            <span className="text-sm text-glass-dim">{hikeTotal} total</span>
            <button onClick={openCreateHike}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg glass-button-dark text-white text-sm font-medium transition-all">
              <Plus className="w-4 h-4" /> Add Hike
            </button>
          </div>

          {hikesLoading ? <p className="text-glass-dim text-center py-8">Loading...</p> : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/10 text-glass-dim text-left">
                    <th className="pb-2 pr-4">Title</th><th className="pb-2 pr-4">Location</th>
                    <th className="pb-2 pr-4">Creator</th><th className="pb-2 pr-4">Difficulty</th>
                    <th className="pb-2 pr-4">Spots</th><th className="pb-2 pr-4">Participants</th>
                    <th className="pb-2 pr-4">Date</th><th className="pb-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {hikes.map((h) => (
                    <tr key={h._id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                      <td className="py-3 pr-4 font-medium">
                        <button
                          onClick={() => setViewHike(h)}
                          className="text-emerald-300 hover:text-emerald-200 hover:underline text-left transition-colors"
                        >
                          {h.title}
                        </button>
                      </td>
                      <td className="py-3 pr-4 text-glass-dim">{h.location}</td>
                      <td className="py-3 pr-4 text-glass-dim">{h.userId?.name || "..."}</td>
                      <td className="py-3 pr-4 text-glass-dim">{h.difficulty}/5</td>
                      <td className="py-3 pr-4 text-glass-dim">{h.spotsLeft}</td>
                      <td className="py-3 pr-4 text-glass-dim">{h.participants?.length ?? 0}</td>
                      <td className="py-3 pr-4 text-glass-dim text-xs">{new Date(h.date).toLocaleDateString()}</td>
                      <td className="py-3 flex items-center gap-1">
                        <button onClick={() => openEditHike(h)} className="p-1.5 rounded-lg text-blue-400 hover:bg-blue-500/20 transition-colors" title="Edit hike">
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => handleDeleteHike(h._id, h.title)} className="p-1.5 rounded-lg text-red-400 hover:bg-red-500/20 transition-colors" title="Delete hike">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {hikePages > 1 && (
            <div className="flex items-center justify-end gap-2 mt-4">
              <button onClick={() => setHikePage((p) => Math.max(1, p - 1))} disabled={hikePage === 1} className="glass-button p-1.5 rounded-lg disabled:opacity-40"><ChevronLeft className="w-4 h-4" /></button>
              <span className="text-sm text-glass-dim">{hikePage} / {hikePages}</span>
              <button onClick={() => setHikePage((p) => Math.min(hikePages, p + 1))} disabled={hikePage === hikePages} className="glass-button p-1.5 rounded-lg disabled:opacity-40"><ChevronRight className="w-4 h-4" /></button>
            </div>
          )}
        </div>
      )}

      {/* -- Hotels Tab -- */}
      {activeTab === "hotels" && (
        <div className="glass-card rounded-xl p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-glass-dim" />
              <input type="text" placeholder="Search by name or location..." value={hotelSearch}
                onChange={(e) => { setHotelSearch(e.target.value); setHotelPage(1); }}
                className="w-full pl-9 pr-4 py-2 rounded-lg glass-input text-sm" />
            </div>
            <button onClick={fetchHotels} className="glass-button p-2 rounded-lg" title="Refresh"><RefreshCw className="w-4 h-4" /></button>
            <span className="text-sm text-glass-dim">{hotelTotal} total</span>
            <button onClick={openCreateHotel}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg glass-button-dark text-white text-sm font-medium">
              <Plus className="w-4 h-4" /> Add Hotel
            </button>
          </div>

          {hotelsLoading ? <p className="text-glass-dim text-center py-8">Loading...</p> : (
            <div className="space-y-3">
              {hotels.map((h) => (
                <div key={h._id} className="glass rounded-xl overflow-hidden">
                  <div className="flex items-center gap-4 p-4">
                    {h.imageUrl && (
                      <img src={h.imageUrl} alt={h.name} className="w-16 h-16 object-cover rounded-lg flex-shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <button onClick={() => openViewHotel(h)}
                            className="text-emerald-300 hover:text-emerald-200 font-semibold hover:underline text-left">
                            {h.name}
                          </button>
                          <div className="flex items-center gap-2 mt-0.5">
                            <MapPin className="w-3 h-3 text-glass-dim" />
                            <span className="text-xs text-glass-dim">{h.location}</span>
                            <Star className="w-3 h-3 text-yellow-400 ml-2" />
                            <span className="text-xs text-glass-dim">{h.rating}</span>
                            <span className="text-xs text-glass-dim">?</span>
                            <span className="text-xs text-glass-dim">{Array.isArray(h.packages) ? h.packages.length : 0} packages</span>
                          </div>
                          {h.amenities.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-1.5">
                              {h.amenities.slice(0, 4).map(a => (
                                <span key={a} className="px-1.5 py-0.5 rounded text-[10px] bg-white/10 text-glass-dim">{a}</span>
                              ))}
                              {h.amenities.length > 4 && <span className="text-[10px] text-glass-dim">+{h.amenities.length - 4}</span>}
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <button onClick={() => openAddPackage(h._id)}
                            className="p-1.5 rounded-lg text-emerald-400 hover:bg-emerald-500/20 transition-colors" title="Add package">
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => openEditHotel(h)}
                            className="p-1.5 rounded-lg text-blue-400 hover:bg-blue-500/20 transition-colors" title="Edit hotel">
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => handleDeleteHotel(h._id, h.name)}
                            className="p-1.5 rounded-lg text-red-400 hover:bg-red-500/20 transition-colors" title="Delete hotel">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => setExpandedHotel(expandedHotel === h._id ? null : h._id)}
                            className="p-1.5 rounded-lg glass-button transition-colors" title="Toggle packages">
                            {expandedHotel === h._id ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                  {/* Inline packages preview */}
                  {expandedHotel === h._id && (
                    <div className="border-t border-white/10 px-4 pb-4 pt-3">
                      <p className="text-xs text-glass-dim uppercase tracking-wide mb-2">Packages</p>
                      {Array.isArray(h.packages) && h.packages.length > 0 ? (
                        <div className="space-y-1.5">
                          {(h.packages as AdminHotelPackage[]).map((pkg: any) => typeof pkg === "object" && (
                            <div key={pkg._id} className="flex items-center justify-between glass rounded-lg p-2 text-xs">
                              <div>
                                <span className="font-medium text-glass-light">{pkg.name}</span>
                                <span className="text-glass-dim ml-2">{pkg.roomType} ? NPR {pkg.pricePerNight?.toLocaleString()}/night</span>
                                <span className="text-glass-dim ml-2">{pkg.availableRooms} rooms</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <button onClick={() => openEditPackage(pkg, h._id)}
                                  className="p-1 rounded text-blue-400 hover:bg-blue-500/20"><Pencil className="w-3 h-3" /></button>
                                <button onClick={() => handleDeletePackage(pkg._id)}
                                  className="p-1 rounded text-red-400 hover:bg-red-500/20"><Trash2 className="w-3 h-3" /></button>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-glass-dim italic">No packages yet.</p>
                      )}
                      <button onClick={() => openAddPackage(h._id)}
                        className="mt-2 flex items-center gap-1 text-xs text-emerald-400 hover:text-emerald-300 transition-colors">
                        <Plus className="w-3 h-3" /> Add Package
                      </button>
                    </div>
                  )}
                </div>
              ))}
              {hotels.length === 0 && <p className="text-glass-dim text-center py-8 text-sm">No hotels found.</p>}
            </div>
          )}

          {hotelPages > 1 && (
            <div className="flex items-center justify-end gap-2 mt-4">
              <button onClick={() => setHotelPage(p => Math.max(1, p - 1))} disabled={hotelPage === 1} className="glass-button p-1.5 rounded-lg disabled:opacity-40"><ChevronLeft className="w-4 h-4" /></button>
              <span className="text-sm text-glass-dim">{hotelPage} / {hotelPages}</span>
              <button onClick={() => setHotelPage(p => Math.min(hotelPages, p + 1))} disabled={hotelPage === hotelPages} className="glass-button p-1.5 rounded-lg disabled:opacity-40"><ChevronRight className="w-4 h-4" /></button>
            </div>
          )}
        </div>
      )}

      {/* -- Bookings Tab -- */}
      {activeTab === "bookings" && (
        <div className="glass-card rounded-xl p-5">
          <div className="flex items-center gap-3 mb-4 flex-wrap">
            <div className="relative flex-1 min-w-[160px]">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-glass-dim" />
              <input type="text" placeholder="Search ref, guest..." value={bookingSearch}
                onChange={(e) => { setBookingSearch(e.target.value); setBookingPage(1); }}
                className="w-full pl-9 pr-4 py-2 rounded-lg glass-input text-sm" />
            </div>
            <select value={bookingStatusFilter}
              onChange={(e) => { setBookingStatusFilter(e.target.value); setBookingPage(1); }}
              className="px-3 py-2 rounded-lg glass-input text-sm [color-scheme:dark]">
              <option value="all" className="bg-gray-900">All Statuses</option>
              <option value="pending" className="bg-gray-900">Pending</option>
              <option value="confirmed" className="bg-gray-900">Confirmed</option>
              <option value="cancelled" className="bg-gray-900">Cancelled</option>
            </select>
            <button onClick={fetchBookings} className="glass-button p-2 rounded-lg" title="Refresh"><RefreshCw className="w-4 h-4" /></button>
            <span className="text-sm text-glass-dim">{bookingTotal} total</span>
          </div>

          {bookingsLoading ? <p className="text-glass-dim text-center py-8">Loading...</p> : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/10 text-glass-dim text-left">
                    <th className="pb-2 pr-3">Reference</th>
                    <th className="pb-2 pr-3">Guest</th>
                    <th className="pb-2 pr-3">Hotel</th>
                    <th className="pb-2 pr-3">Package</th>
                    <th className="pb-2 pr-3">Check-in</th>
                    <th className="pb-2 pr-3">Nights</th>
                    <th className="pb-2 pr-3">Total (NPR)</th>
                    <th className="pb-2 pr-3">Status</th>
                    <th className="pb-2 pr-3">Payment</th>
                    <th className="pb-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {bookings.map((b) => (
                    <tr key={b._id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                      <td className="py-3 pr-3 font-mono text-xs text-emerald-300">{b.bookingReference}</td>
                      <td className="py-3 pr-3">
                        <div className="font-medium text-glass-light text-xs">{b.guestName}</div>
                        <div className="text-glass-dim text-[10px]">{b.guestEmail}</div>
                      </td>
                      <td className="py-3 pr-3 text-glass-dim text-xs">{b.hotelId?.name || "?"}</td>
                      <td className="py-3 pr-3 text-glass-dim text-xs">{b.packageId?.name || "?"}</td>
                      <td className="py-3 pr-3 text-glass-dim text-xs">{new Date(b.checkInDate).toLocaleDateString()}</td>
                      <td className="py-3 pr-3 text-glass-dim text-xs">{b.numberOfNights}</td>
                      <td className="py-3 pr-3 text-glass-light text-xs font-medium">NPR {b.totalPrice?.toLocaleString()}</td>
                      <td className="py-3 pr-3">
                        <select value={b.status}
                          onChange={(e) => handleBookingStatusChange(b._id, e.target.value)}
                          className={`text-xs px-2 py-1 rounded-lg border outline-none cursor-pointer [color-scheme:dark] ${
                            b.status === "confirmed" ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-300"
                            : b.status === "cancelled" ? "bg-red-500/20 border-red-500/40 text-red-300"
                            : "bg-amber-500/20 border-amber-500/40 text-amber-300"
                          }`}>
                          <option value="pending" className="bg-gray-900 text-white">pending</option>
                          <option value="confirmed" className="bg-gray-900 text-white">confirmed</option>
                          <option value="cancelled" className="bg-gray-900 text-white">cancelled</option>
                        </select>
                      </td>
                      <td className="py-3 pr-3">
                        <select value={b.paymentStatus}
                          onChange={(e) => handlePaymentStatusChange(b._id, e.target.value)}
                          className={`text-xs px-2 py-1 rounded-lg border outline-none cursor-pointer [color-scheme:dark] ${
                            b.paymentStatus === "paid" ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-300"
                            : b.paymentStatus === "partial" ? "bg-blue-500/20 border-blue-500/40 text-blue-300"
                            : "bg-white/10 border-white/20 text-glass-dim"
                          }`}>
                          <option value="unpaid" className="bg-gray-900 text-white">unpaid</option>
                          <option value="partial" className="bg-gray-900 text-white">partial</option>
                          <option value="paid" className="bg-gray-900 text-white">paid</option>
                        </select>
                      </td>
                      <td className="py-3">
                        <button onClick={() => handleDeleteBooking(b._id, b.bookingReference)}
                          className="p-1.5 rounded-lg text-red-400 hover:bg-red-500/20 transition-colors" title="Delete booking">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {bookings.length === 0 && <p className="text-glass-dim text-center py-8 text-sm">No bookings found.</p>}
            </div>
          )}

          {bookingPages > 1 && (
            <div className="flex items-center justify-end gap-2 mt-4">
              <button onClick={() => setBookingPage(p => Math.max(1, p - 1))} disabled={bookingPage === 1} className="glass-button p-1.5 rounded-lg disabled:opacity-40"><ChevronLeft className="w-4 h-4" /></button>
              <span className="text-sm text-glass-dim">{bookingPage} / {bookingPages}</span>
              <button onClick={() => setBookingPage(p => Math.min(bookingPages, p + 1))} disabled={bookingPage === bookingPages} className="glass-button p-1.5 rounded-lg disabled:opacity-40"><ChevronRight className="w-4 h-4" /></button>
            </div>
          )}
        </div>
      )}

      {/* -- Shop / Products Tab -- */}
      {activeTab === "shop" && (
        <div className="glass-card rounded-xl p-5">
          <div className="flex items-center gap-3 mb-4 flex-wrap">
            <div className="relative flex-1 min-w-48">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-glass-dim" />
              <input type="text" placeholder="Search products..." value={productSearch}
                onChange={e => { setProductSearch(e.target.value); setProductPage(1); }}
                className="w-full pl-9 pr-4 py-2 rounded-lg glass-input text-sm" />
            </div>
            <select value={productCategory} onChange={e => { setProductCategory(e.target.value); setProductPage(1); }}
              className="px-3 py-2 rounded-lg glass-input text-sm [color-scheme:dark]">
              <option value="" className="bg-gray-900 text-white">All Categories</option>
              {PRODUCT_CATEGORIES.map(c => <option key={c} value={c} className="bg-gray-900 text-white">{c}</option>)}
            </select>
            <button onClick={fetchProducts} className="glass-button p-2 rounded-lg" title="Refresh"><RefreshCw className="w-4 h-4" /></button>
            <span className="text-sm text-glass-dim">{productTotal} products</span>
            <button onClick={openCreateProduct}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg glass-button-dark text-white text-sm font-medium transition-all">
              <Plus className="w-4 h-4" /> Add Product
            </button>
          </div>

          {productsLoading ? (
            <p className="text-glass-dim text-center py-8">Loading products...</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {products.map(p => (
                <div key={p._id} className="glass rounded-xl overflow-hidden flex flex-col">
                  {p.img ? (
                    <div className="h-36 overflow-hidden relative">
                      <img src={p.img} alt={p.name} className="w-full h-full object-cover" />
                      {p.badge && (
                        <span className="absolute top-2 left-2 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500 text-white">{p.badge}</span>
                      )}
                      {p.featured && (
                        <span className="absolute top-2 right-2 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500 text-white">Featured</span>
                      )}
                    </div>
                  ) : (
                    <div className="h-20 flex items-center justify-center bg-white/5">
                      <ShoppingBag className="w-8 h-8 text-glass-dim" />
                    </div>
                  )}
                  <div className="p-3 flex flex-col gap-2 flex-1">
                    <div>
                      <p className="text-sm font-semibold text-glass-light truncate">{p.name}</p>
                      <div className="flex items-center gap-2 text-xs text-glass-dim mt-0.5">
                        <span className="flex items-center gap-1"><Tag className="w-3 h-3" />{p.category}</span>
                        <span className="flex items-center gap-1"><Star className="w-3 h-3 text-yellow-400" />{p.rating}</span>
                      </div>
                    </div>
                    <p className="text-base font-bold text-emerald-400">NPR {p.price.toLocaleString()}</p>
                    <div className="flex items-center gap-3 text-xs mt-auto">
                      <button onClick={() => toggleProductField(p, "inStock")}
                        className={`flex items-center gap-1 transition-colors ${p.inStock ? "text-emerald-400" : "text-red-400"}`}>
                        {p.inStock ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
                        {p.inStock ? "In Stock" : "Out of Stock"}
                      </button>
                      <button onClick={() => toggleProductField(p, "featured")}
                        className={`flex items-center gap-1 transition-colors ${p.featured ? "text-amber-400" : "text-glass-dim"}`}>
                        <Star className="w-3.5 h-3.5" /> {p.featured ? "Featured" : "Feature"}
                      </button>
                    </div>
                    <div className="flex gap-2 mt-1">
                      <button onClick={() => openEditProduct(p)}
                        className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg glass-button text-xs text-blue-400">
                        <Pencil className="w-3 h-3" /> Edit
                      </button>
                      <button onClick={() => handleDeleteProduct(p._id, p.name)}
                        className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg glass-button text-xs text-red-400">
                        <Trash2 className="w-3 h-3" /> Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              {products.length === 0 && (
                <div className="col-span-3 text-center py-12">
                  <ShoppingBag className="w-10 h-10 text-glass-dim mx-auto mb-3 opacity-50" />
                  <p className="text-glass-dim text-sm">No products yet. Click "Add Product" to get started.</p>
                </div>
              )}
            </div>
          )}

          {productPages > 1 && (
            <div className="flex items-center justify-end gap-2 mt-4">
              <button onClick={() => setProductPage(p => Math.max(1, p - 1))} disabled={productPage === 1} className="glass-button p-1.5 rounded-lg disabled:opacity-40"><ChevronLeft className="w-4 h-4" /></button>
              <span className="text-sm text-glass-dim">{productPage} / {productPages}</span>
              <button onClick={() => setProductPage(p => Math.min(productPages, p + 1))} disabled={productPage === productPages} className="glass-button p-1.5 rounded-lg disabled:opacity-40"><ChevronRight className="w-4 h-4" /></button>
            </div>
          )}
        </div>
      )}

      {/* -- Orders Tab -- */}
      {activeTab === "orders" && (
        <div className="glass-card rounded-2xl p-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
            <div>
              <h2 className="text-lg font-semibold text-glass">Orders</h2>
              <p className="text-xs text-glass-dim mt-0.5">{orderTotal} order{orderTotal !== 1 ? "s" : ""} total</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <input
                value={orderSearch}
                onChange={e => { setOrderSearch(e.target.value); setOrderPage(1); }}
                placeholder="Search order ID / customer..."
                className="glass-input text-sm rounded-lg px-3 py-1.5 w-52"
              />
              <select
                value={orderStatusFilter}
                onChange={e => { setOrderStatusFilter(e.target.value); setOrderPage(1); }}
                className="glass-input text-sm rounded-lg px-3 py-1.5"
              >
                <option value="all">All Statuses</option>
                <option value="placed">Placed</option>
                <option value="processing">Processing</option>
                <option value="out_for_delivery">Out for Delivery</option>
                <option value="delivered">Delivered</option>
                <option value="cancelled">Cancelled</option>
              </select>
              <select
                value={orderPaymentFilter}
                onChange={e => { setOrderPaymentFilter(e.target.value); setOrderPage(1); }}
                className="glass-input text-sm rounded-lg px-3 py-1.5"
              >
                <option value="all">All Payments</option>
                <option value="unpaid">Unpaid</option>
                <option value="paid">Paid</option>
              </select>
              <button onClick={fetchOrders} className="glass-button px-3 py-1.5 rounded-lg text-sm flex items-center gap-1.5">
                <RefreshCw className="w-3.5 h-3.5" /> Refresh
              </button>
            </div>
          </div>

          {/* Table */}
          {ordersLoading ? (
            <div className="text-center py-12 text-glass-dim text-sm">Loading orders...</div>
          ) : orders.length === 0 ? (
            <div className="text-center py-12">
              <ClipboardList className="w-10 h-10 text-glass-dim mx-auto mb-3 opacity-50" />
              <p className="text-glass-dim text-sm">No orders found.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-glass-dim text-xs border-b border-white/10">
                    <th className="text-left pb-2 pr-3">Order ID</th>
                    <th className="text-left pb-2 pr-3">Customer</th>
                    <th className="text-left pb-2 pr-3">Items</th>
                    <th className="text-right pb-2 pr-3">Total</th>
                    <th className="text-left pb-2 pr-3">Payment</th>
                    <th className="text-left pb-2 pr-3">Status</th>
                    <th className="text-left pb-2 pr-3">Date</th>
                    <th className="text-right pb-2">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {orders.map(order => (
                    <>
                      <tr key={order._id} className="hover:bg-white/5 transition-colors">
                        <td className="py-2.5 pr-3">
                          <button
                            onClick={() => setExpandedOrder(expandedOrder === order._id ? null : order._id)}
                            className="font-mono text-xs text-emerald-400 hover:underline"
                          >
                            {order.orderId}
                          </button>
                        </td>
                        <td className="py-2.5 pr-3">
                          <div className="text-glass text-xs font-medium">{order.customer.name}</div>
                          <div className="text-glass-dim text-xs">{order.customer.phone}</div>
                        </td>
                        <td className="py-2.5 pr-3 text-glass-dim text-xs">{order.items.length} item{order.items.length !== 1 ? "s" : ""}</td>
                        <td className="py-2.5 pr-3 text-right text-glass font-semibold text-xs">Rs {order.total.toLocaleString()}</td>
                        <td className="py-2.5 pr-3">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${order.paymentMethod === "khalti" ? "bg-purple-500/20 text-purple-300" : "bg-amber-500/20 text-amber-300"}`}>
                            {order.paymentMethod === "khalti" ? "Khalti" : "COD"}
                          </span>
                          <span className={`ml-1 inline-flex items-center px-1.5 py-0.5 rounded text-xs ${order.paymentStatus === "paid" ? "bg-emerald-500/20 text-emerald-300" : "bg-red-500/20 text-red-300"}`}>
                            {order.paymentStatus}
                          </span>
                        </td>
                        <td className="py-2.5 pr-3">
                          <select
                            value={order.status}
                            onChange={e => handleOrderStatusChange(order._id, e.target.value)}
                            className="glass-input text-xs rounded px-2 py-1"
                          >
                            <option value="placed">Placed</option>
                            <option value="processing">Processing</option>
                            <option value="out_for_delivery">Out for Delivery</option>
                            <option value="delivered">Delivered</option>
                            <option value="cancelled">Cancelled</option>
                          </select>
                        </td>
                        <td className="py-2.5 pr-3 text-glass-dim text-xs">{new Date(order.createdAt).toLocaleDateString()}</td>
                        <td className="py-2.5 text-right">
                          <button
                            onClick={() => handleDeleteOrder(order._id, order.orderId)}
                            className="glass-button p-1.5 rounded-lg text-red-400 hover:text-red-300"
                            title="Delete order"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                      {expandedOrder === order._id && (
                        <tr key={`${order._id}-detail`}>
                          <td colSpan={8} className="pb-3 pt-0 px-2">
                            <div className="bg-white/5 rounded-xl p-4">
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-3 text-xs">
                                <div>
                                  <p className="text-glass-dim mb-1 font-medium">Delivery Address</p>
                                  <p className="text-glass">{order.customer.address}, {order.customer.city}</p>
                                  <p className="text-glass-dim">{order.customer.email}</p>
                                </div>
                                <div>
                                  <p className="text-glass-dim mb-1 font-medium">Order Summary</p>
                                  <p className="text-glass">Subtotal: Rs {order.subtotal.toLocaleString()}</p>
                                  <p className="text-glass">Shipping: Rs {order.shipping.toLocaleString()}</p>
                                  <p className="text-glass font-semibold">Total: Rs {order.total.toLocaleString()}</p>
                                </div>
                              </div>
                              <table className="w-full text-xs">
                                <thead>
                                  <tr className="text-glass-dim border-b border-white/10">
                                    <th className="text-left pb-1.5">Product</th>
                                    <th className="text-left pb-1.5">Category</th>
                                    <th className="text-right pb-1.5">Price</th>
                                    <th className="text-right pb-1.5">Qty</th>
                                    <th className="text-right pb-1.5">Subtotal</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                  {order.items.map((item, idx) => (
                                    <tr key={idx}>
                                      <td className="py-1.5 text-glass">{item.name}</td>
                                      <td className="py-1.5 text-glass-dim capitalize">{item.category}</td>
                                      <td className="py-1.5 text-right text-glass">Rs {item.price.toLocaleString()}</td>
                                      <td className="py-1.5 text-right text-glass">{item.qty}</td>
                                      <td className="py-1.5 text-right text-glass font-medium">Rs {(item.price * item.qty).toLocaleString()}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {orderPages > 1 && (
            <div className="flex items-center justify-end gap-2 mt-4">
              <button onClick={() => setOrderPage(p => Math.max(1, p - 1))} disabled={orderPage === 1} className="glass-button p-1.5 rounded-lg disabled:opacity-40"><ChevronLeft className="w-4 h-4" /></button>
              <span className="text-sm text-glass-dim">{orderPage} / {orderPages}</span>
              <button onClick={() => setOrderPage(p => Math.min(orderPages, p + 1))} disabled={orderPage === orderPages} className="glass-button p-1.5 rounded-lg disabled:opacity-40"><ChevronRight className="w-4 h-4" /></button>
            </div>
          )}
        </div>
      )}

      {/* -- Hike Detail Modal -- */}
      {viewHike && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="glass-card rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="sticky top-0 glass-nav px-6 py-4 flex items-center justify-between rounded-t-2xl">
              <div className="flex items-center gap-2">
                <Eye className="w-5 h-5 text-emerald-400" />
                <h2 className="text-lg font-semibold text-glass-light">Hike Details</h2>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => { setViewHike(null); openEditHike(viewHike); }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg glass-button-dark text-white text-xs font-medium transition-all"
                >
                  <Pencil className="w-3.5 h-3.5" /> Edit
                </button>
                <button onClick={() => setViewHike(null)} className="p-1.5 glass-button rounded-lg">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Cover image */}
            {viewHike.imageUrl && (
              <div className="h-52 overflow-hidden">
                <img src={viewHike.imageUrl} alt={viewHike.title} className="w-full h-full object-cover" />
              </div>
            )}

            <div className="p-6 space-y-5">
              {/* Title + difficulty badge */}
              <div className="flex items-start justify-between gap-3">
                <h3 className="text-xl font-bold text-white leading-snug">{viewHike.title}</h3>
                <span className={`flex-shrink-0 px-3 py-1 rounded-full text-xs font-semibold text-white ${
                  viewHike.difficulty <= 1 ? 'bg-green-600'
                  : viewHike.difficulty === 2 ? 'bg-blue-600'
                  : viewHike.difficulty === 3 ? 'bg-yellow-600'
                  : viewHike.difficulty === 4 ? 'bg-orange-600'
                  : 'bg-red-600'
                }`}>
                  {(['','Easy','Moderate','Challenging','Hard','Expert'] as const)[viewHike.difficulty] ?? `${viewHike.difficulty}/5`}
                </span>
              </div>

              {/* Location */}
              <div className="flex items-center gap-2 text-sm text-gray-300">
                <MapPin className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <span>{viewHike.location}</span>
              </div>

              {/* Date */}
              <div className="flex items-center gap-2 text-sm text-gray-300">
                <CalendarDays className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <span>{new Date(viewHike.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
              </div>

              {/* Stats row */}
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: 'Spots Left', value: viewHike.spotsLeft },
                  { label: 'Participants', value: viewHike.participants?.length ?? 0 },
                  { label: 'Difficulty', value: `${viewHike.difficulty}/5` },
                ].map(({ label, value }) => (
                  <div key={label} className="glass rounded-xl p-3 text-center">
                    <p className="text-lg font-bold text-white">{value}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{label}</p>
                  </div>
                ))}
              </div>

              {/* Creator */}
              <div className="glass-card rounded-xl p-4">
                <p className="text-xs text-gray-400 mb-2 uppercase tracking-wide">Created By</p>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full glass-button-dark text-white flex items-center justify-center font-semibold text-sm">
                    {viewHike.userId?.name?.charAt(0).toUpperCase() ?? '?'}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">{viewHike.userId?.name ?? '?'}</p>
                    <p className="text-xs text-gray-400">{viewHike.userId?.email ?? ''}</p>
                  </div>
                </div>
              </div>

              {/* Participants */}
              {viewHike.participants?.length > 0 && (
                <div className="glass-card rounded-xl p-4">
                  <p className="text-xs text-gray-400 mb-3 uppercase tracking-wide">Participants ({viewHike.participants.length})</p>
                  <div className="flex flex-wrap gap-2">
                    {viewHike.participants.map((p, i) => (
                      <span key={i} className="px-3 py-1 rounded-full glass text-xs text-gray-200">{p.name}</span>
                    ))}
                  </div>
                </div>
              )}

              {/* Trail map */}
              {(viewHike.startPoint || viewHike.endPoint || viewHike.coordinates) && (
                <div className="glass-card rounded-xl overflow-hidden">
                  <div className="flex items-center justify-between px-4 pt-3 pb-2">
                    <div className="flex items-center gap-2">
                      <Navigation className="w-4 h-4 text-emerald-400" />
                      <p className="text-xs text-gray-400 uppercase tracking-wide">Trail Map</p>
                    </div>
                    {viewHikeDistance != null && (
                      <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-semibold">
                        {viewHikeDistance >= 1000
                          ? `${(viewHikeDistance / 1000).toFixed(2)} km`
                          : `${Math.round(viewHikeDistance)} m`}
                      </span>
                    )}
                  </div>
                  <div style={{ height: '240px' }}>
                    <MapContainer
                      center={
                        viewHike.startPoint
                          ? [viewHike.startPoint.lat, viewHike.startPoint.lng]
                          : viewHike.coordinates
                          ? [viewHike.coordinates.lat, viewHike.coordinates.lng]
                          : [27.7172, 85.324]
                      }
                      zoom={viewHike.startPoint || viewHike.endPoint ? 12 : 10}
                      scrollWheelZoom={false}
                      style={{ height: '100%', width: '100%' }}
                    >
                      <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                      />
                      {viewHike.startPoint && (
                        <Marker position={[viewHike.startPoint.lat, viewHike.startPoint.lng]} icon={adminStartIcon} />
                      )}
                      {viewHike.endPoint && (
                        <Marker position={[viewHike.endPoint.lat, viewHike.endPoint.lng]} icon={adminEndIcon} />
                      )}
                      {!viewHike.startPoint && viewHike.coordinates && (
                        <Marker position={[viewHike.coordinates.lat, viewHike.coordinates.lng]} />
                      )}
                      {viewHikeRoute.length > 1 && (
                        <Polyline positions={viewHikeRoute} color="#10b981" weight={4} opacity={0.85} />
                      )}
                    </MapContainer>
                  </div>
                  {(viewHike.startPoint || viewHike.endPoint) && (
                    <div className="flex gap-4 px-4 py-2 text-[10px] text-gray-400">
                      {viewHike.startPoint && (
                        <span className="flex items-center gap-1">
                          <span className="inline-block w-2.5 h-2.5 rounded-full bg-green-500" />
                          Start {viewHike.startPoint.lat.toFixed(4)}, {viewHike.startPoint.lng.toFixed(4)}
                        </span>
                      )}
                      {viewHike.endPoint && (
                        <span className="flex items-center gap-1">
                          <span className="inline-block w-2.5 h-2.5 rounded-full bg-red-500" />
                          End {viewHike.endPoint.lat.toFixed(4)}, {viewHike.endPoint.lng.toFixed(4)}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Description */}
              {viewHike.description && (
                <div className="glass-card rounded-xl p-4">
                  <p className="text-xs text-gray-400 mb-2 uppercase tracking-wide">Description</p>
                  <p className="text-sm text-gray-200 leading-relaxed">{viewHike.description}</p>
                </div>
              )}

              {/* Delete button */}
              <button
                onClick={() => { setViewHike(null); handleDeleteHike(viewHike._id, viewHike.title); }}
                className="w-full flex items-center justify-center gap-2 py-2 rounded-lg text-red-400 hover:bg-red-500/20 border border-red-500/30 text-sm transition-colors"
              >
                <Trash2 className="w-4 h-4" /> Delete Hike
              </button>
            </div>
          </div>
        </div>
      )}

      {/* -- User Modal -- */}
      {userModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="glass-card rounded-2xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-semibold text-glass-light">{editingUser ? "Edit User" : "Add New User"}</h2>
              <button onClick={() => setUserModal(false)} className="p-1.5 glass-button rounded-lg"><X className="w-4 h-4" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-xs text-glass-dim mb-1">Name *</label>
                <input type="text" value={userForm.name} onChange={(e) => setUserForm({ ...userForm, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg glass-input text-sm" placeholder="Full name" />
              </div>
              <div>
                <label className="block text-xs text-glass-dim mb-1">Email *</label>
                <input type="email" value={userForm.email} onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg glass-input text-sm" placeholder="email@example.com" />
              </div>
              {!editingUser && (
                <div>
                  <label className="block text-xs text-glass-dim mb-1">Password *</label>
                  <input type="password" value={userForm.password} onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg glass-input text-sm" placeholder="Min. 6 characters" />
                </div>
              )}
              <div>
                <label className="block text-xs text-glass-dim mb-1">Role *</label>
                <select value={userForm.role} onChange={(e) => setUserForm({ ...userForm, role: e.target.value as "user" | "admin" })}
                  className="w-full px-3 py-2 rounded-lg glass-input text-sm [color-scheme:dark]">
                  <option value="user" className="bg-gray-900 text-white">user</option>
                  <option value="admin" className="bg-gray-900 text-white">admin</option>
                </select>
              </div>
              <div>
                <label className="block text-xs text-glass-dim mb-1">Country</label>
                <input type="text" value={userForm.country} onChange={(e) => setUserForm({ ...userForm, country: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg glass-input text-sm" placeholder="e.g. Pakistan" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-glass-dim mb-1">Travel Style</label>
                  <input type="text" value={userForm.travelStyle} onChange={(e) => setUserForm({ ...userForm, travelStyle: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg glass-input text-sm" placeholder="e.g. Adventure" />
                </div>
                <div>
                  <label className="block text-xs text-glass-dim mb-1">Budget Range</label>
                  <input type="text" value={userForm.budgetRange} onChange={(e) => setUserForm({ ...userForm, budgetRange: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg glass-input text-sm" placeholder="e.g. Budget" />
                </div>
              </div>
              <div>
                <label className="block text-xs text-glass-dim mb-1">Interests <span className="opacity-60">(comma-separated)</span></label>
                <input type="text" value={userForm.interests} onChange={(e) => setUserForm({ ...userForm, interests: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg glass-input text-sm" placeholder="Hiking, Photography, Camping" />
              </div>
              <div>
                <label className="block text-xs text-glass-dim mb-1">Avatar URL</label>
                <input type="url" value={userForm.avatarUrl} onChange={(e) => setUserForm({ ...userForm, avatarUrl: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg glass-input text-sm" placeholder="https://..." />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setUserModal(false)} className="flex-1 py-2 rounded-lg glass-button text-sm text-glass-dim">Cancel</button>
              <button onClick={saveUser} disabled={userSaving}
                className="flex-1 py-2 rounded-lg glass-button-dark text-white text-sm font-medium transition-all disabled:opacity-50">
                {userSaving ? "Saving..." : editingUser ? "Update User" : "Create User"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* -- Hike Modal -- */}
      {hikeModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="glass-card rounded-2xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-semibold text-glass-light">{editingHike ? "Edit Hike" : "Add New Hike"}</h2>
              <button onClick={() => setHikeModal(false)} className="p-1.5 glass-button rounded-lg"><X className="w-4 h-4" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-xs text-glass-dim mb-1">Title *</label>
                <input type="text" value={hikeForm.title} onChange={(e) => setHikeForm({ ...hikeForm, title: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg glass-input text-sm" placeholder="Hike title" />
              </div>
              <div>
                <label className="block text-xs text-glass-dim mb-1">Location *</label>
                <input type="text" value={hikeForm.location} onChange={(e) => setHikeForm({ ...hikeForm, location: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg glass-input text-sm" placeholder="Location" />
              </div>
              <div>
                <label className="block text-xs text-glass-dim mb-1">Date *</label>
                <input type="date" value={hikeForm.date} onChange={(e) => setHikeForm({ ...hikeForm, date: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg glass-input text-sm" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-glass-dim mb-1">Difficulty (1-5)</label>
                  <input type="number" min="1" max="5" value={hikeForm.difficulty}
                    onChange={(e) => setHikeForm({ ...hikeForm, difficulty: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg glass-input text-sm" />
                </div>
                <div>
                  <label className="block text-xs text-glass-dim mb-1">Spots Left</label>
                  <input type="number" min="0" value={hikeForm.spotsLeft}
                    onChange={(e) => setHikeForm({ ...hikeForm, spotsLeft: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg glass-input text-sm" />
                </div>
              </div>
              <div>
                <label className="block text-xs text-glass-dim mb-1">Description</label>
                <textarea rows={3} value={hikeForm.description} onChange={(e) => setHikeForm({ ...hikeForm, description: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg glass-input text-sm resize-none" placeholder="Optional description..." />
              </div>
              <div>
                <label className="block text-xs text-glass-dim mb-1">Image URL</label>
                <input type="url" value={hikeForm.imageUrl} onChange={(e) => setHikeForm({ ...hikeForm, imageUrl: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg glass-input text-sm" placeholder="https://..." />
              </div>
              <div>
                <label className="block text-xs text-glass-dim mb-1">Trail Start &amp; End Points</label>
                <div className="flex gap-2 mb-2">
                  <button
                    type="button"
                    onClick={() => setHikeActivePoint('start')}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition border-2 ${
                      hikeActivePoint === 'start'
                        ? 'bg-green-500/20 border-green-400/60 text-green-300'
                        : 'glass border-white/20 text-gray-400 hover:border-white/40'
                    }`}
                  >
                    {hikeStartPoint ? <><CheckCircle2 className="w-3 h-3 inline mr-1" />Start ({hikeStartPoint.lat.toFixed(3)}, {hikeStartPoint.lng.toFixed(3)})</> : <><MapPin className="w-3 h-3 inline mr-1" />Set Start</>}
                  </button>
                  <button
                    type="button"
                    onClick={() => setHikeActivePoint('end')}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition border-2 ${
                      hikeActivePoint === 'end'
                        ? 'bg-red-500/20 border-red-400/60 text-red-300'
                        : 'glass border-white/20 text-gray-400 hover:border-white/40'
                    }`}
                  >
                    {hikeEndPoint ? <><CheckCircle2 className="w-3 h-3 inline mr-1" />End ({hikeEndPoint.lat.toFixed(3)}, {hikeEndPoint.lng.toFixed(3)})</> : <><Flag className="w-3 h-3 inline mr-1" />Set End</>}
                  </button>
                </div>
                <p className="text-[10px] text-gray-400 mb-1">
                  {hikeActivePoint === 'start' ? 'Click map to place start point' : 'Click map to place end point'}
                </p>
                <div style={{ height: '240px' }} className="rounded-lg overflow-hidden border border-white/10">
                  <MapContainer
                    center={hikeStartPoint ? [hikeStartPoint.lat, hikeStartPoint.lng] : [27.7172, 85.324]}
                    zoom={hikeStartPoint || hikeEndPoint ? 12 : 8}
                    style={{ height: '100%', width: '100%' }}
                  >
                    <TileLayer
                      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    <AdminLocationPicker
                      onSelect={(lat, lng) => {
                        if (hikeActivePoint === 'start') setHikeStartPoint({ lat, lng });
                        else setHikeEndPoint({ lat, lng });
                      }}
                    />
                    {hikeStartPoint && <Marker position={[hikeStartPoint.lat, hikeStartPoint.lng]} icon={adminStartIcon} />}
                    {hikeEndPoint && <Marker position={[hikeEndPoint.lat, hikeEndPoint.lng]} icon={adminEndIcon} />}
                  </MapContainer>
                </div>
                <div className="flex gap-3 mt-1 text-[10px] text-gray-400">
                  <span className="flex items-center gap-1"><span className="inline-block w-2.5 h-2.5 rounded-full bg-green-500" /> Start</span>
                  <span className="flex items-center gap-1"><span className="inline-block w-2.5 h-2.5 rounded-full bg-red-500" /> End</span>
                </div>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setHikeModal(false)} className="flex-1 py-2 rounded-lg glass-button text-sm text-glass-dim">Cancel</button>
              <button onClick={saveHike} disabled={hikeSaving}
                className="flex-1 py-2 rounded-lg glass-button-dark text-white text-sm font-medium transition-all disabled:opacity-50">
                {hikeSaving ? "Saving..." : editingHike ? "Update Hike" : "Create Hike"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* -- Hotel Detail Modal -- */}
      {viewHotel && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="glass-card rounded-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 glass-nav px-6 py-4 flex items-center justify-between rounded-t-2xl">
              <div className="flex items-center gap-2">
                <Hotel className="w-5 h-5 text-emerald-400" />
                <h2 className="text-lg font-semibold text-glass-light">Hotel Details</h2>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => { setViewHotel(null); openEditHotel(viewHotel); }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg glass-button-dark text-white text-xs font-medium">
                  <Pencil className="w-3.5 h-3.5" /> Edit
                </button>
                <button onClick={() => setViewHotel(null)} className="p-1.5 glass-button rounded-lg">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {viewHotel.imageUrl && (
              <div className="h-48 overflow-hidden">
                <img src={viewHotel.imageUrl} alt={viewHotel.name} className="w-full h-full object-cover" />
              </div>
            )}

            <div className="p-6 space-y-4">
              <div className="flex items-start justify-between gap-3">
                <h3 className="text-xl font-bold text-white">{viewHotel.name}</h3>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <Star className="w-4 h-4 text-yellow-400" />
                  <span className="text-sm font-semibold text-yellow-300">{viewHotel.rating}</span>
                  <span className="text-xs text-glass-dim ml-1">({viewHotel.reviewCount} reviews)</span>
                </div>
              </div>

              <div className="flex items-center gap-2 text-sm text-gray-300">
                <MapPin className="w-4 h-4 text-emerald-400" />
                <span>{viewHotel.location}</span>
              </div>

              {viewHotel.description && (
                <p className="text-sm text-glass-dim leading-relaxed">{viewHotel.description}</p>
              )}

              <div className="grid grid-cols-1 gap-2 text-xs">
                {viewHotel.contactPhone && (
                  <div className="flex items-center gap-2 text-glass-dim">
                    <Phone className="w-3.5 h-3.5 text-emerald-400" /> {viewHotel.contactPhone}
                  </div>
                )}
                {viewHotel.email && (
                  <div className="flex items-center gap-2 text-glass-dim">
                    <Mail className="w-3.5 h-3.5 text-emerald-400" /> {viewHotel.email}
                  </div>
                )}
                {viewHotel.website && (
                  <div className="flex items-center gap-2 text-glass-dim">
                    <Globe className="w-3.5 h-3.5 text-emerald-400" />
                    <a href={viewHotel.website} target="_blank" rel="noopener noreferrer" className="hover:text-emerald-300 truncate">{viewHotel.website}</a>
                  </div>
                )}
              </div>

              {viewHotel.amenities.length > 0 && (
                <div>
                  <p className="text-xs text-gray-400 mb-2 uppercase tracking-wide">Amenities</p>
                  <div className="flex flex-wrap gap-1.5">
                    {viewHotel.amenities.map(a => (
                      <span key={a} className="px-2 py-0.5 rounded-full text-xs bg-emerald-500/15 text-emerald-300 border border-emerald-500/20">{a}</span>
                    ))}
                  </div>
                </div>
              )}

              {/* Packages */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs text-gray-400 uppercase tracking-wide">Packages ({viewHotelPackages.length})</p>
                  <button onClick={() => openAddPackage(viewHotel._id)}
                    className="flex items-center gap-1 text-xs text-emerald-400 hover:text-emerald-300 transition-colors">
                    <Plus className="w-3 h-3" /> Add Package
                  </button>
                </div>
                {viewHotelLoading ? (
                  <p className="text-xs text-glass-dim">Loading packages...</p>
                ) : viewHotelPackages.length > 0 ? (
                  <div className="space-y-2">
                    {viewHotelPackages.map(pkg => (
                      <div key={pkg._id} className="glass rounded-xl p-3">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="text-sm font-medium text-glass-light">{pkg.name}</p>
                            <div className="flex items-center gap-3 mt-0.5 text-xs text-glass-dim flex-wrap">
                              <span className="capitalize">{pkg.roomType}</span>
                              <span className="font-semibold text-glass">NPR {pkg.pricePerNight?.toLocaleString()}/night</span>
                              <span>{pkg.capacity} guests</span>
                              <span>{pkg.availableRooms} rooms</span>
                              <span className={`px-1.5 py-0.5 rounded text-[10px] ${
                                pkg.cancellationPolicy === "free" ? "bg-emerald-500/20 text-emerald-300"
                                : pkg.cancellationPolicy === "partial" ? "bg-amber-500/20 text-amber-300"
                                : "bg-red-500/20 text-red-300"
                              }`}>{pkg.cancellationPolicy}</span>
                            </div>
                            {pkg.amenities.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-1.5">
                                {pkg.amenities.map(a => (
                                  <span key={a} className="px-1.5 py-0.5 rounded text-[10px] bg-white/10 text-glass-dim">{a}</span>
                                ))}
                              </div>
                            )}
                          </div>
                          <div className="flex items-center gap-1 flex-shrink-0">
                            <button onClick={() => openEditPackage(pkg, viewHotel._id)}
                              className="p-1.5 rounded-lg text-blue-400 hover:bg-blue-500/20 transition-colors">
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button onClick={() => handleDeletePackage(pkg._id)}
                              className="p-1.5 rounded-lg text-red-400 hover:bg-red-500/20 transition-colors">
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-glass-dim italic">No packages yet.</p>
                )}
              </div>

              <button onClick={() => { setViewHotel(null); handleDeleteHotel(viewHotel._id, viewHotel.name); }}
                className="w-full flex items-center justify-center gap-2 py-2 rounded-lg text-red-400 hover:bg-red-500/20 border border-red-500/30 text-sm transition-colors">
                <Trash2 className="w-4 h-4" /> Delete Hotel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* -- Hotel Form Modal -- */}
      {hotelModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="glass-card rounded-2xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-semibold text-glass-light">{editingHotel ? "Edit Hotel" : "Add New Hotel"}</h2>
              <button onClick={() => setHotelModal(false)} className="p-1.5 glass-button rounded-lg"><X className="w-4 h-4" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-xs text-glass-dim mb-1">Name *</label>
                <input type="text" value={hotelForm.name} onChange={e => setHotelForm({ ...hotelForm, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg glass-input text-sm" placeholder="Hotel name" />
              </div>
              <div>
                <label className="block text-xs text-glass-dim mb-1">Location *</label>
                <input type="text" value={hotelForm.location} onChange={e => setHotelForm({ ...hotelForm, location: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg glass-input text-sm" placeholder="City/Region" />
              </div>
              <div>
                <label className="block text-xs text-glass-dim mb-1">Description</label>
                <textarea rows={3} value={hotelForm.description} onChange={e => setHotelForm({ ...hotelForm, description: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg glass-input text-sm resize-none" placeholder="Hotel description..." />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-glass-dim mb-1">Phone</label>
                  <input type="text" value={hotelForm.contactPhone} onChange={e => setHotelForm({ ...hotelForm, contactPhone: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg glass-input text-sm" placeholder="+977-..." />
                </div>
                <div>
                  <label className="block text-xs text-glass-dim mb-1">Email</label>
                  <input type="email" value={hotelForm.email} onChange={e => setHotelForm({ ...hotelForm, email: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg glass-input text-sm" placeholder="hotel@example.com" />
                </div>
              </div>
              <div>
                <label className="block text-xs text-glass-dim mb-1">Website</label>
                <input type="url" value={hotelForm.website} onChange={e => setHotelForm({ ...hotelForm, website: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg glass-input text-sm" placeholder="https://..." />
              </div>
              <div>
                <label className="block text-xs text-glass-dim mb-1">Image URL</label>
                <input type="url" value={hotelForm.imageUrl} onChange={e => setHotelForm({ ...hotelForm, imageUrl: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg glass-input text-sm" placeholder="https://..." />
              </div>
              <div>
                <label className="block text-xs text-glass-dim mb-1">Rating (0?5)</label>
                <input type="number" min="0" max="5" step="0.1" value={hotelForm.rating}
                  onChange={e => setHotelForm({ ...hotelForm, rating: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg glass-input text-sm" />
              </div>
              <div>
                <label className="block text-xs text-glass-dim mb-1">Amenities <span className="opacity-60">(comma-separated)</span></label>
                <input type="text" value={hotelForm.amenities} onChange={e => setHotelForm({ ...hotelForm, amenities: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg glass-input text-sm" placeholder="WiFi, Pool, Restaurant, Spa" />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setHotelModal(false)} className="flex-1 py-2 rounded-lg glass-button text-sm text-glass-dim">Cancel</button>
              <button onClick={saveHotel} disabled={hotelSaving}
                className="flex-1 py-2 rounded-lg glass-button-dark text-white text-sm font-medium transition-all disabled:opacity-50">
                {hotelSaving ? "Saving..." : editingHotel ? "Update Hotel" : "Create Hotel"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* -- Packages Tab -- */}
      {activeTab === "packages" && (
        <div className="glass-card rounded-xl p-5">
          <div className="flex items-center gap-3 mb-4 flex-wrap">
            <div className="relative flex-1 min-w-[160px]">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-glass-dim" />
              <input
                type="text"
                placeholder="Search packages..."
                value={pkgTabSearch}
                onChange={(e) => { setPkgTabSearch(e.target.value); setPkgTabPage(1); }}
                className="w-full pl-9 pr-4 py-2 rounded-lg glass-input text-sm"
              />
            </div>
            <select
              value={pkgTabHotelFilter}
              onChange={(e) => { setPkgTabHotelFilter(e.target.value); setPkgTabPage(1); }}
              className="px-3 py-2 rounded-lg glass-input text-sm [color-scheme:dark]"
            >
              <option value="" className="bg-gray-900 text-white">All Hotels</option>
              {hotels.map((h) => (
                <option key={h._id} value={h._id} className="bg-gray-900 text-white">{h.name}</option>
              ))}
            </select>
            <button onClick={fetchAllPackages} className="glass-button p-2 rounded-lg" title="Refresh">
              <RefreshCw className="w-4 h-4" />
            </button>
            <span className="text-sm text-glass-dim">{pkgTabTotal} total</span>
          </div>

          {pkgTabLoading ? (
            <p className="text-glass-dim text-center py-8">Loading...</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-white/10 text-glass-dim uppercase tracking-wide text-[10px]">
                    <th className="text-left py-2 pr-3">Package</th>
                    <th className="text-left py-2 pr-3">Hotel</th>
                    <th className="text-left py-2 pr-3">Room Type</th>
                    <th className="text-left py-2 pr-3">Price/Night</th>
                    <th className="text-left py-2 pr-3">Capacity</th>
                    <th className="text-left py-2 pr-3">Rooms</th>
                    <th className="text-left py-2 pr-3">Min Stay</th>
                    <th className="text-left py-2 pr-3">Policy</th>
                    <th className="text-right py-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {allPackages.map((pkg) => (
                    <tr key={pkg._id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                      <td className="py-2.5 pr-3">
                        <div className="font-medium text-glass-light">{pkg.name}</div>
                        {pkg.amenities.length > 0 && (
                          <div className="text-[10px] text-glass-dim mt-0.5">
                            {pkg.amenities.slice(0, 3).join(", ")}{pkg.amenities.length > 3 ? ` +${pkg.amenities.length - 3}` : ""}
                          </div>
                        )}
                      </td>
                      <td className="py-2.5 pr-3 text-glass-dim">
                        <div>{pkg.hotelId?.name || "..."}</div>
                        <div className="text-[10px] text-glass-dim">{pkg.hotelId?.location || ""}</div>
                      </td>
                      <td className="py-2.5 pr-3">
                        <span className="px-1.5 py-0.5 rounded bg-white/10 text-glass-dim capitalize">{pkg.roomType}</span>
                      </td>
                      <td className="py-2.5 pr-3 text-emerald-400 font-medium">NPR {pkg.pricePerNight?.toLocaleString()}</td>
                      <td className="py-2.5 pr-3 text-glass-dim">{pkg.capacity} guests</td>
                      <td className="py-2.5 pr-3 text-glass-dim">{pkg.availableRooms}</td>
                      <td className="py-2.5 pr-3 text-glass-dim">
                        {pkg.minStayNights}n{pkg.maxStayNights ? `—${pkg.maxStayNights}n` : "+"}
                      </td>
                      <td className="py-2.5 pr-3">
                        <span className={`px-1.5 py-0.5 rounded text-[10px] ${
                          pkg.cancellationPolicy === "free"
                            ? "bg-emerald-500/20 text-emerald-300"
                            : pkg.cancellationPolicy === "partial"
                            ? "bg-amber-500/20 text-amber-300"
                            : "bg-red-500/20 text-red-300"
                        }`}>
                          {pkg.cancellationPolicy}
                        </span>
                      </td>
                      <td className="py-2.5 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => openEditPackage(pkg, pkg.hotelId?._id || "")}
                            className="p-1.5 rounded-lg text-blue-400 hover:bg-blue-500/20 transition-colors"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeletePackage(pkg._id)}
                            className="p-1.5 rounded-lg text-red-400 hover:bg-red-500/20 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {allPackages.length === 0 && (
                    <tr>
                      <td colSpan={9} className="py-8 text-center text-glass-dim text-sm">No packages found.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {pkgTabPages > 1 && (
            <div className="flex items-center justify-end gap-2 mt-4">
              <button
                onClick={() => setPkgTabPage((p) => Math.max(1, p - 1))}
                disabled={pkgTabPage === 1}
                className="glass-button p-1.5 rounded-lg disabled:opacity-40"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-sm text-glass-dim">{pkgTabPage} / {pkgTabPages}</span>
              <button
                onClick={() => setPkgTabPage((p) => Math.min(pkgTabPages, p + 1))}
                disabled={pkgTabPage === pkgTabPages}
                className="glass-button p-1.5 rounded-lg disabled:opacity-40"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      )}

      {/* -- Package Form Modal -- */}
      {pkgModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="glass-card rounded-2xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-semibold text-glass-light">{editingPkg ? "Edit Package" : "Add Package"}</h2>
              <button onClick={() => setPkgModal(false)} className="p-1.5 glass-button rounded-lg"><X className="w-4 h-4" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-xs text-glass-dim mb-1">Package Name *</label>
                <input type="text" value={pkgForm.name} onChange={e => setPkgForm({ ...pkgForm, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg glass-input text-sm" placeholder="e.g. Deluxe Suite" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-glass-dim mb-1">Room Type *</label>
                  <select value={pkgForm.roomType} onChange={e => setPkgForm({ ...pkgForm, roomType: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg glass-input text-sm [color-scheme:dark]">
                    {["single","double","twin","suite","deluxe"].map(t => (
                      <option key={t} value={t} className="bg-gray-900 text-white capitalize">{t}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-glass-dim mb-1">Price/Night (NPR) *</label>
                  <input type="number" min="0" value={pkgForm.pricePerNight} onChange={e => setPkgForm({ ...pkgForm, pricePerNight: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg glass-input text-sm" placeholder="2500" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-glass-dim mb-1">Capacity (guests)</label>
                  <input type="number" min="1" value={pkgForm.capacity} onChange={e => setPkgForm({ ...pkgForm, capacity: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg glass-input text-sm" />
                </div>
                <div>
                  <label className="block text-xs text-glass-dim mb-1">Available Rooms</label>
                  <input type="number" min="0" value={pkgForm.availableRooms} onChange={e => setPkgForm({ ...pkgForm, availableRooms: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg glass-input text-sm" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-glass-dim mb-1">Min Stay (nights)</label>
                  <input type="number" min="1" value={pkgForm.minStayNights} onChange={e => setPkgForm({ ...pkgForm, minStayNights: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg glass-input text-sm" />
                </div>
                <div>
                  <label className="block text-xs text-glass-dim mb-1">Max Stay (nights)</label>
                  <input type="number" min="1" value={pkgForm.maxStayNights} onChange={e => setPkgForm({ ...pkgForm, maxStayNights: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg glass-input text-sm" placeholder="Optional" />
                </div>
              </div>
              <div>
                <label className="block text-xs text-glass-dim mb-1">Cancellation Policy</label>
                <select value={pkgForm.cancellationPolicy} onChange={e => setPkgForm({ ...pkgForm, cancellationPolicy: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg glass-input text-sm [color-scheme:dark]">
                  <option value="free" className="bg-gray-900 text-white">Free Cancellation</option>
                  <option value="partial" className="bg-gray-900 text-white">Partial Refund</option>
                  <option value="non-refundable" className="bg-gray-900 text-white">Non-refundable</option>
                </select>
              </div>
              <div>
                <label className="block text-xs text-glass-dim mb-1">Amenities <span className="opacity-60">(comma-separated)</span></label>
                <input type="text" value={pkgForm.amenities} onChange={e => setPkgForm({ ...pkgForm, amenities: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg glass-input text-sm" placeholder="WiFi, TV, Hot Water, AC" />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setPkgModal(false)} className="flex-1 py-2 rounded-lg glass-button text-sm text-glass-dim">Cancel</button>
              <button onClick={savePackage} disabled={pkgSaving}
                className="flex-1 py-2 rounded-lg glass-button-dark text-white text-sm font-medium transition-all disabled:opacity-50">
                {pkgSaving ? "Saving..." : editingPkg ? "Update Package" : "Add Package"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Product Form Modal */}
      {productModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="glass-card rounded-2xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-semibold text-glass-light">{editingProduct ? "Edit Product" : "Add New Product"}</h2>
              <button onClick={() => setProductModal(false)} className="p-1.5 glass-button rounded-lg"><X className="w-4 h-4" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-xs text-glass-dim mb-1">Name *</label>
                <input type="text" value={productForm.name} onChange={e => setProductForm({ ...productForm, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg glass-input text-sm" placeholder="Product name" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-glass-dim mb-1">Category *</label>
                  <select value={productForm.category} onChange={e => setProductForm({ ...productForm, category: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg glass-input text-sm [color-scheme:dark]">
                    {PRODUCT_CATEGORIES.map(c => <option key={c} value={c} className="bg-gray-900 text-white">{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-glass-dim mb-1">Price (NPR) *</label>
                  <input type="number" min="0" value={productForm.price as string}
                    onChange={e => setProductForm({ ...productForm, price: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg glass-input text-sm" placeholder="5000" />
                </div>
              </div>
              <div>
                <label className="block text-xs text-glass-dim mb-1">Description</label>
                <textarea rows={3} value={productForm.description as string}
                  onChange={e => setProductForm({ ...productForm, description: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg glass-input text-sm resize-none" placeholder="Product description..." />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-glass-dim mb-1">Badge</label>
                  <input type="text" value={productForm.badge as string}
                    onChange={e => setProductForm({ ...productForm, badge: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg glass-input text-sm" placeholder="Best Seller, New..." />
                </div>
                <div className="flex flex-col gap-2 justify-end pb-1">
                  <label className="flex items-center gap-2 cursor-pointer text-sm text-glass-dim">
                    <input type="checkbox" checked={productForm.inStock as boolean}
                      onChange={e => setProductForm({ ...productForm, inStock: e.target.checked })}
                      className="w-4 h-4 accent-emerald-500" />
                    In Stock
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer text-sm text-glass-dim">
                    <input type="checkbox" checked={productForm.featured as boolean}
                      onChange={e => setProductForm({ ...productForm, featured: e.target.checked })}
                      className="w-4 h-4 accent-amber-500" />
                    Featured
                  </label>
                </div>
              </div>
              <div>
                <label className="block text-xs text-glass-dim mb-1">Primary Image URL</label>
                <input type="url" value={productForm.img as string}
                  onChange={e => setProductForm({ ...productForm, img: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg glass-input text-sm" placeholder="https://..." />
              </div>
              <div>
                <label className="block text-xs text-glass-dim mb-1">Gallery Images (comma-separated URLs)</label>
                <textarea rows={2} value={productForm.images as string}
                  onChange={e => setProductForm({ ...productForm, images: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg glass-input text-sm resize-none" placeholder="https://img1.jpg, https://img2.jpg" />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setProductModal(false)} className="flex-1 py-2 rounded-lg glass-button text-sm text-glass-dim">Cancel</button>
              <button onClick={saveProduct} disabled={productSaving}
                className="flex-1 py-2 rounded-lg glass-button-dark text-white text-sm font-medium transition-all disabled:opacity-50">
                {productSaving ? "Saving..." : editingProduct ? "Update Product" : "Create Product"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// #endregion Component

// #region Exports
export default Admin;
// #endregion Exports
