import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { MapContainer, TileLayer, Marker, Polyline, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import {
  Users, Mountain, ShieldCheck, Trash2, ChevronLeft, ChevronRight,
  Search, RefreshCw, Plus, Pencil, X, LogOut, MapPin, CalendarDays,
  Navigation, Eye,
} from "lucide-react";
import { API_BASE_URL } from "../config/env";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";

// ── Leaflet helpers ─────────────────────────────────────────────────────
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

interface Stats { totalUsers: number; totalAdmins: number; totalHikes: number; }
type Tab = "users" | "hikes";

const defaultUserForm = { name: "", email: "", password: "", role: "user" as "user" | "admin", country: "", travelStyle: "", budgetRange: "", interests: "", avatarUrl: "" };
const defaultHikeForm = { title: "", location: "", date: "", difficulty: "1", spotsLeft: "0", description: "", imageUrl: "", lat: "", lng: "" };

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

  const authHeader = () => ({ Authorization: `Bearer ${localStorage.getItem("travelBuddyToken")}` });

  const handleAuthError = useCallback((err: any) => {
    if (err?.message === "AUTH_EXPIRED") { logout(); navigate("/login"); }
    else showError(err?.message || "An error occurred");
  }, [logout, navigate, showError]);

  // â”€â”€â”€ Fetch â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/stats`, { headers: authHeader() });
      if (!res.ok) throw new Error((await res.json()).message);
      setStats(await res.json());
    } catch (err: any) { handleAuthError(err); }
  }, [handleAuthError]);

  const fetchUsers = useCallback(async () => {
    setUsersLoading(true);
    try {
      const params = new URLSearchParams({ page: String(userPage), limit: "10", search: userSearch });
      const res = await fetch(`${API_BASE_URL}/api/admin/users?${params}`, { headers: authHeader() });
      if (!res.ok) throw new Error((await res.json()).message);
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
      if (!res.ok) throw new Error((await res.json()).message);
      const data = await res.json();
      setHikes(data.hikes); setHikePages(data.pagination.pages); setHikeTotal(data.pagination.total);
    } catch (err: any) { handleAuthError(err); }
    finally { setHikesLoading(false); }
  }, [hikePage, hikeSearch, handleAuthError]);

  useEffect(() => { fetchStats(); }, [fetchStats]);
  useEffect(() => { fetchUsers(); }, [fetchUsers]);
  useEffect(() => { fetchHikes(); }, [fetchHikes]);

  // â”€â”€â”€ User CRUD â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  const openCreateUser = () => { setEditingUser(null); setUserForm(defaultUserForm); setUserModal(true); };

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
      if (!res.ok) throw new Error((await res.json()).message);
      showSuccess(isEdit ? "User updated." : "User created.");
      setUserModal(false);
      fetchUsers(); fetchStats();
    } catch (err: any) { showError(err.message || "Failed to save user."); }
    finally { setUserSaving(false); }
  };

  const handleRoleChange = async (userId: string, role: "user" | "admin") => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/users/${userId}/role`, {
        method: "PATCH",
        headers: { ...authHeader(), "Content-Type": "application/json" },
        body: JSON.stringify({ role }),
      });
      if (!res.ok) throw new Error((await res.json()).message);
      showSuccess(`Role updated to '${role}'.`);
      fetchUsers(); fetchStats();
    } catch (err: any) { showError(err.message || "Failed to update role."); }
  };

  const handleDeleteUser = async (userId: string, name: string) => {
    if (!confirm(`Delete user "${name}"? This cannot be undone.`)) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/users/${userId}`, { method: "DELETE", headers: authHeader() });
      if (!res.ok) throw new Error((await res.json()).message);
      showSuccess("User deleted."); fetchUsers(); fetchStats();
    } catch (err: any) { showError(err.message || "Failed to delete user."); }
  };

  // â”€â”€â”€ Hike CRUD â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

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

  const openCreateHike = () => { setEditingHike(null); setHikeForm(defaultHikeForm); setHikeStartPoint(null); setHikeEndPoint(null); setHikeActivePoint('start'); setHikeModal(true); };

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
      if (!res.ok) throw new Error((await res.json()).message);
      showSuccess(isEdit ? "Hike updated." : "Hike created.");
      setHikeModal(false); fetchHikes(); fetchStats();
    } catch (err: any) { showError(err.message || "Failed to save hike."); }
    finally { setHikeSaving(false); }
  };

  const handleDeleteHike = async (hikeId: string, title: string) => {
    if (!confirm(`Delete hike "${title}"? This cannot be undone.`)) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/hikes/${hikeId}`, { method: "DELETE", headers: authHeader() });
      if (!res.ok) throw new Error((await res.json()).message);
      showSuccess("Hike deleted."); fetchHikes(); fetchStats();
    } catch (err: any) { showError(err.message || "Failed to delete hike."); }
  };

  // â”€â”€â”€ UI â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

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
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            { label: "Total Users", value: stats.totalUsers, icon: <Users className="w-5 h-5" /> },
            { label: "Total Admins", value: stats.totalAdmins, icon: <ShieldCheck className="w-5 h-5" /> },
            { label: "Total Hikes", value: stats.totalHikes, icon: <Mountain className="w-5 h-5" /> },
          ].map((s) => (
            <div key={s.label} className="glass-card rounded-xl p-5 flex items-center gap-4">
              <div className="text-emerald-400">{s.icon}</div>
              <div>
                <div className="text-2xl font-bold text-glass-light">{s.value}</div>
                <div className="text-sm text-glass-dim">{s.label}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        {(["users", "hikes"] as Tab[]).map((tab) => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`px-5 py-2 rounded-lg capitalize font-medium transition-all ${
              activeTab === tab ? "bg-emerald-500/30 text-emerald-300 border border-emerald-500/50" : "glass-button text-glass-dim"
            }`}
          >{tab}</button>
        ))}
      </div>

      {/* â”€â”€ Users Tab â”€â”€ */}
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
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-sm font-medium hover:bg-emerald-500/30 transition-all">
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

      {/* â”€â”€ Hikes Tab â”€â”€ */}
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
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-sm font-medium hover:bg-emerald-500/30 transition-all">
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
                      <td className="py-3 pr-4 text-glass-dim">{h.userId?.name || "â€”"}</td>
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

      {/* ── Hike Detail Modal ── */}
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
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-500/20 border border-blue-500/40 text-blue-300 text-xs font-medium hover:bg-blue-500/30 transition-all"
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
                    <p className="text-sm font-medium text-white">{viewHike.userId?.name ?? '—'}</p>
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

      {/* ── User Modal ── */}
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
                className="flex-1 py-2 rounded-lg bg-emerald-500/30 border border-emerald-500/50 text-emerald-300 text-sm font-medium hover:bg-emerald-500/40 transition-all disabled:opacity-50">
                {userSaving ? "Saving..." : editingUser ? "Update User" : "Create User"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* â”€â”€ Hike Modal â”€â”€ */}
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
                  <label className="block text-xs text-glass-dim mb-1">Difficulty (1â€“5)</label>
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
                    {hikeStartPoint ? `✅ Start (${hikeStartPoint.lat.toFixed(3)}, ${hikeStartPoint.lng.toFixed(3)})` : '📍 Set Start'}
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
                    {hikeEndPoint ? `✅ End (${hikeEndPoint.lat.toFixed(3)}, ${hikeEndPoint.lng.toFixed(3)})` : '🏁 Set End'}
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
                className="flex-1 py-2 rounded-lg bg-emerald-500/30 border border-emerald-500/50 text-emerald-300 text-sm font-medium hover:bg-emerald-500/40 transition-all disabled:opacity-50">
                {hikeSaving ? "Saving..." : editingHike ? "Update Hike" : "Create Hike"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Admin;
