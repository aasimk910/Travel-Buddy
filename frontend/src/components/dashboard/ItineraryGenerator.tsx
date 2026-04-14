// src/components/dashboard/ItineraryGenerator.tsx
// AI-powered trip itinerary generator form. Sends parameters to the backend Groq API
// and displays the generated day-by-day itinerary.
// #region Imports
import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { generateItinerary } from '../../services/itinerary';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { getToken } from "../../services/auth";
import {
  Loader2, MapPin, Calendar, Sparkles, Download, RotateCcw,
  Mountain, Utensils, Camera, Tent, Palmtree, Landmark, Wallet,
  Clock, Navigation, FileText, PenLine, LayoutList,
} from 'lucide-react';
// #endregion Imports

// #region Constants
const EXAMPLE_PROMPTS = [
  "Plan a 5-day budget trek to Poon Hill starting from Kathmandu. I love photography and local food. Total budget Rs 25,000.",
  "I want a luxury 3-day trip to Pokhara with my partner. Include boat rides, paragliding, and fine dining.",
  "Create a 7-day Annapurna Circuit itinerary for an experienced hiker. Focus on acclimatisation, teahouse stays, and cultural stops.",
];

const INTEREST_CHIPS = [
  { label: 'Hiking',       icon: <Mountain  className="w-3 h-3" /> },
  { label: 'Food',         icon: <Utensils  className="w-3 h-3" /> },
  { label: 'Photography',  icon: <Camera    className="w-3 h-3" /> },
  { label: 'Camping',      icon: <Tent      className="w-3 h-3" /> },
  { label: 'Nature',       icon: <Palmtree  className="w-3 h-3" /> },
  { label: 'Culture',      icon: <Landmark  className="w-3 h-3" /> },
];

const TRAVEL_STYLES = [
  { value: 'budget',    label: 'Budget',    color: 'emerald' },
  { value: 'balanced',  label: 'Balanced',  color: 'blue'    },
  { value: 'luxury',    label: 'Luxury',    color: 'purple'  },
  { value: 'adventure', label: 'Adventure', color: 'orange'  },
  { value: 'relaxed',   label: 'Relaxed',   color: 'teal'    },
];

const STYLE_COLORS: Record<string, string> = {
  emerald: 'bg-[#8FA68E]/15 border-[#8FA68E]/50 text-[#8FA68E]',
  blue:    'bg-[#C6A16E]/15 border-[#C6A16E]/50 text-[#C6A16E]',
  purple:  'bg-[#C6A16E]/15 border-[#C6A16E]/50 text-[#C6A16E]',
  orange:  'bg-[#C6A16E]/20 border-[#C6A16E]/60 text-[#D4AE7A]',
  teal:    'bg-[#8FA68E]/15 border-[#8FA68E]/50 text-[#8FA68E]',
};

// Popular Nepal hiking and trekking destinations
const DESTINATION_SUGGESTIONS = [
  "Everest Base Camp, Nepal","Annapurna Base Camp, Nepal","Annapurna Circuit, Nepal",
  "Manaslu Circuit, Nepal","Langtang Valley, Nepal","Gokyo Lakes, Nepal",
  "Upper Mustang, Nepal","Makalu Base Camp, Nepal","Kanchenjunga Base Camp, Nepal",
  "Dhaulagiri Circuit, Nepal","Poon Hill, Nepal","Mardi Himal, Nepal",
  "Ghandruk, Nepal","Ghorepani, Nepal","Khopra Danda, Nepal","Mohare Danda, Nepal",
  "Tilicho Lake, Nepal","Gosaikunda Lake, Nepal","Helambu Circuit, Nepal",
  "Tamang Heritage Trail, Nepal","Nar Phu Valley, Nepal","Tsum Valley, Nepal",
  "Dolpo Region, Nepal","Rara Lake, Nepal","Khaptad National Park, Nepal",
  "Pikey Peak, Nepal","Numbur Cheese Circuit, Nepal","Everest View Trek, Nepal",
  "Three Passes Trek, Nepal","Khumai Dada, Nepal","Nagarkot, Nepal",
  "Chisapani, Nepal","Shivapuri National Park, Nepal","Champadevi Hill, Nepal",
  "Phulchoki Hill, Nepal","Kakani, Nepal","Daman, Nepal","Chandragiri Hills, Nepal",
  "Australian Base Camp, Nepal","Khayer Lake, Nepal","Panch Pokhari, Nepal",
  "Surya Peak, Nepal","Jomsom, Nepal","Muktinath, Nepal","Kagbeni, Nepal",
  "Lomanthang, Nepal","Syabrubesi, Nepal","Kyanjin Gompa, Nepal",
  "Tsho Rolpa Lake, Nepal","Dudh Kunda, Nepal","Rolwaling Valley, Nepal",
  "Solu Trek, Nepal","Pokhara, Nepal","Kathmandu, Nepal","Chitwan, Nepal",
  "Lumbini, Nepal","Bandipur, Nepal","Bhaktapur, Nepal","Patan, Nepal","Ilam, Nepal",
];
// #endregion Constants

// #region Component
const ItineraryGenerator: React.FC = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const { showSuccess, showError } = useToast();

  const [isLoading, setIsLoading]               = useState(false);
  const [generatedItinerary, setGeneratedItinerary] = useState<string>('');
  const [showSuggestions, setShowSuggestions]   = useState(false);
  const [filteredSuggestions, setFilteredSuggestions] = useState<string[]>([]);
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [activeTab, setActiveTab]               = useState<'guided' | 'custom'>('guided');
  const [customPrompt, setCustomPrompt]         = useState('');

  const destinationInputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef      = useRef<HTMLDivElement>(null);

  const [formData, setFormData] = useState({
    startingLocation: '',
    destination: '',
    startDate: '',
    endDate: '',
    budget: '',
    travelStyle: 'balanced',
    interests: '',
    additionalNotes: '',
  });

  useEffect(() => {
    // Handles handler logic.
    const handler = (e: MouseEvent) => {
      if (
        suggestionsRef.current && !suggestionsRef.current.contains(e.target as Node) &&
        destinationInputRef.current && !destinationInputRef.current.contains(e.target as Node)
      ) setShowSuggestions(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Handles handleChange logic.
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (name === 'destination') {
      const filtered = value.trim()
        ? DESTINATION_SUGGESTIONS.filter(d => d.toLowerCase().includes(value.toLowerCase()))
        : [];
      setFilteredSuggestions(filtered);
      setShowSuggestions(filtered.length > 0);
    }
  };

  // Handles handleDestinationSelect logic.
  const handleDestinationSelect = (dest: string) => {
    setFormData(prev => ({ ...prev, destination: dest }));
    setShowSuggestions(false);
    setFilteredSuggestions([]);
  };

  // Handles handleDestinationFocus logic.
  const handleDestinationFocus = () => {
    if (formData.destination.trim()) {
      const filtered = DESTINATION_SUGGESTIONS.filter(d =>
        d.toLowerCase().includes(formData.destination.toLowerCase())
      );
      setFilteredSuggestions(filtered);
      setShowSuggestions(filtered.length > 0);
    }
  };

  // Handles toggleInterest logic.
  const toggleInterest = (label: string) => {
    const next = selectedInterests.includes(label)
      ? selectedInterests.filter(i => i !== label)
      : [...selectedInterests, label];
    setSelectedInterests(next);
    setFormData(prev => ({ ...prev, interests: next.join(', ') }));
  };

  // Handles handleSubmit logic.
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = getToken();
    if (!token) { showError('Please log in first'); return; }

    if (activeTab === 'custom') {
      if (!customPrompt.trim()) { showError('Please enter your prompt first'); return; }
    } else {
      if (!formData.destination || !formData.startDate || !formData.endDate) {
        showError('Please fill in Destination, Start Date and End Date');
        return;
      }
    }

    setIsLoading(true);
    setGeneratedItinerary('');
    try {
      const payload = activeTab === 'custom'
        ? { customPrompt: customPrompt.trim() }
        : { ...formData, interests: selectedInterests.join(', ') };
      const resp = await generateItinerary(payload, token);
      setGeneratedItinerary(resp.itinerary);
      showSuccess('Itinerary generated!');
    } catch (err) {
      if (err instanceof Error && err.message === 'AUTH_EXPIRED') {
        logout(); navigate('/login');
        showError('Session expired. Please log in again.');
      } else {
        showError(err instanceof Error ? err.message : 'Failed to generate itinerary');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Handles handleReset logic.
  const handleReset = () => {
    setFormData({ startingLocation:'',destination:'',startDate:'',endDate:'',budget:'',travelStyle:'balanced',interests:'',additionalNotes:'' });
    setGeneratedItinerary('');
    setSelectedInterests([]);
    setCustomPrompt('');
  };

  // Handles handleDownloadPDF logic.
  const handleDownloadPDF = async () => {
    if (!generatedItinerary) return;
    try {
      const { jsPDF } = await import('jspdf');
      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const pageWidth  = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const mL = 18, mR = 18, mT = 18, mB = 25;
      const cW = pageWidth - mL - mR;
      let y = mT;
      // Handles np logic.
      const np = (sp = 10) => { if (y + sp > pageHeight - mB) { doc.addPage(); y = mT; } };
      for (const line of generatedItinerary.split('\n')) {
        if (!line.trim()) { y += 2; continue; }
        if (line.trim() === '---') {
          y += 4; np(10);
          doc.setDrawColor(180,180,180); doc.setLineWidth(0.4);
          doc.line(mL, y, pageWidth - mR, y); y += 6; continue;
        }
        const isDay   = /^Day \d+:/i.test(line);
        const isSub   = /^(Morning|Afternoon|Evening|Practical tips?|Transportation|Food):/i.test(line);
        const isCost  = /^(Estimated cost|Total cost)/i.test(line);
        const isBullet= /^[•\-]\s/.test(line.trim());
        np(isDay ? 28 : isSub ? 18 : 10);
        if (isDay)       { y+=6; doc.setFontSize(13); doc.setFont('helvetica','bold'); doc.setTextColor(20,80,200); }
        else if (isSub)  { y+=4; doc.setFontSize(11); doc.setFont('helvetica','bold'); doc.setTextColor(30,100,200); }
        else if (isCost) { y+=3; doc.setFontSize(10); doc.setFont('helvetica','bold'); doc.setTextColor(60,60,60); }
        else if (isBullet){ doc.setFontSize(9.5); doc.setFont('helvetica','normal'); doc.setTextColor(50,50,50); }
        else             { doc.setFontSize(10);  doc.setFont('helvetica','normal'); doc.setTextColor(30,30,30); }
        const lM = isBullet ? mL+6 : mL;
        const aW = isBullet ? cW-6 : cW;
        for (const wl of doc.splitTextToSize(line, aW)) {
          if (y > pageHeight - mB) { doc.addPage(); y = mT; }
          doc.text(wl, lM, y); y += 5.5;
        }
        if (isDay) y += 2;
      }
      const total = doc.getNumberOfPages();
      for (let i = 1; i <= total; i++) {
        doc.setPage(i); doc.setFontSize(9); doc.setFont('helvetica','normal'); doc.setTextColor(130,130,130);
        doc.text(`Page ${i} of ${total}`, pageWidth/2, pageHeight-10, { align: 'center' });
      }
      doc.save(`itinerary_${formData.destination.replace(/[^a-z0-9]/gi,'_')}.pdf`);
      showSuccess('PDF downloaded!');
    } catch { showError('PDF generation failed'); }
  };

  const tripDays = formData.startDate && formData.endDate
    ? Math.ceil((new Date(formData.endDate).getTime() - new Date(formData.startDate).getTime()) / 86400000) + 1
    : null;

  return (
    <div className="h-full flex flex-col">

      {/* ══ HEADER ═══════════════════════════════════════════════════ */}
      <div className="relative overflow-hidden rounded-2xl mb-5 shrink-0">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: "url('https://images.pexels.com/photos/2258536/pexels-photo-2258536.jpeg?auto=compress&cs=tinysrgb&w=1200')" }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0B0F0C]/96 via-[#0B0F0C]/80 to-[#0B0F0C]/40" />

        <div className="relative flex items-center justify-between px-6 py-4 gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#C6A16E]/15 border border-[#C6A16E]/30 flex items-center justify-center shrink-0">
              <Sparkles className="w-5 h-5 text-[#C6A16E]" />
            </div>
            <div>
              <p className="section-label mb-0.5">Powered by Groq AI</p>
              <h2 className="text-lg font-bold text-[#F5F3EE] font-heading leading-tight">AI Itinerary Generator</h2>
            </div>
          </div>

          {/* Mode tabs */}
          <div className="flex items-center gap-1 p-1 rounded-xl bg-[#0B0F0C]/60 border border-white/10">
            <button type="button"
              onClick={() => setActiveTab('guided')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeTab === 'guided'
                  ? 'bg-[#C6A16E]/15 border border-[#C6A16E]/35 text-[#C6A16E]'
                  : 'text-[#8E8A81] hover:text-[#F5F3EE]'
              }`}>
              <LayoutList className="w-3.5 h-3.5" /> Guided Form
            </button>
            <button type="button"
              onClick={() => setActiveTab('custom')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeTab === 'custom'
                  ? 'bg-[#8FA68E]/15 border border-[#8FA68E]/35 text-[#8FA68E]'
                  : 'text-[#8E8A81] hover:text-[#F5F3EE]'
              }`}>
              <PenLine className="w-3.5 h-3.5" /> Custom Prompt
            </button>
          </div>
        </div>
      </div>

      {/* ══ MAIN GRID ════════════════════════════════════════════════ */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-[400px_1fr] gap-4 min-h-0 overflow-hidden">

        {/* ── LEFT: Form ─────────────────────────────────────────── */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-3 overflow-y-auto min-h-0 pr-0.5">

          {activeTab === 'custom' ? (
            <>
              <div className="site-card rounded-xl p-4 space-y-3 flex-1 flex flex-col">
                <div className="flex items-center justify-between">
                  <p className="section-label">Your Prompt</p>
                  <span className="text-[10px] text-[#8E8A81]">{customPrompt.length} chars</span>
                </div>
                <p className="text-xs text-[#8E8A81] leading-relaxed">
                  Describe exactly what you want — destination, duration, budget, style, special requests.
                </p>
                <textarea
                  value={customPrompt}
                  onChange={e => setCustomPrompt(e.target.value)}
                  placeholder="e.g. Plan a 5-day budget trek to Poon Hill starting from Kathmandu for 2 people. We love photography and local food. Total budget Rs 30,000. Include teahouse accommodation and sunrise viewpoints."
                  className="flex-1 min-h-[180px] w-full site-input px-3 py-3 rounded-lg text-sm resize-none leading-relaxed"
                  autoFocus
                />
              </div>

              <div className="site-card rounded-xl p-4 space-y-2">
                <p className="section-label mb-2">Examples — click to use</p>
                {EXAMPLE_PROMPTS.map((ex, i) => (
                  <button key={i} type="button" onClick={() => setCustomPrompt(ex)}
                    className="w-full text-left px-3 py-2.5 rounded-lg border border-white/8 text-xs text-[#B8B4AA] hover:border-[#C6A16E]/25 hover:text-[#F5F3EE] hover:bg-[#C6A16E]/5 transition-all leading-relaxed">
                    {ex}
                  </button>
                ))}
              </div>

              <div className="flex gap-3 pb-1">
                <button type="submit" disabled={isLoading}
                  className="btn-primary flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm disabled:opacity-50">
                  {isLoading
                    ? <><Loader2 className="w-4 h-4 animate-spin" /> Generating…</>
                    : <><Sparkles className="w-4 h-4" /> Generate with My Prompt</>}
                </button>
                <button type="button" onClick={handleReset}
                  className="btn-outline px-4 py-3 rounded-xl">
                  <RotateCcw className="w-4 h-4" />
                </button>
              </div>
            </>
          ) : (
            <>
              {/* Where to */}
              <div className="site-card rounded-xl p-4 space-y-3">
                <p className="section-label">Where to?</p>
                <div>
                  <label className="block text-xs text-[#8E8A81] mb-1">Destination <span className="text-red-400">*</span></label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#C6A16E] z-10" />
                    <input
                      ref={destinationInputRef}
                      type="text" name="destination"
                      value={formData.destination}
                      onChange={handleChange}
                      onFocus={handleDestinationFocus}
                      placeholder="e.g., Pokhara, Nepal"
                      className="w-full pl-9 pr-3 py-2.5 site-input rounded-lg text-sm"
                      required autoComplete="off"
                    />
                    {showSuggestions && filteredSuggestions.length > 0 && (
                      <div ref={suggestionsRef}
                        className="absolute z-30 w-full mt-1 rounded-xl bg-[#161D19] border border-white/10 shadow-2xl max-h-48 overflow-y-auto">
                        {filteredSuggestions.map((s, i) => (
                          <button key={i} type="button" onClick={() => handleDestinationSelect(s)}
                            className="w-full px-4 py-2.5 text-left text-sm text-[#B8B4AA] hover:bg-[#C6A16E]/[0.08] hover:text-[#F5F3EE] flex items-center gap-2 border-b border-white/5 last:border-0 transition-colors">
                            <MapPin className="w-3.5 h-3.5 text-[#C6A16E] shrink-0" />{s}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-[#8E8A81] mb-1">Starting Location</label>
                  <div className="relative">
                    <Navigation className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8E8A81]" />
                    <input type="text" name="startingLocation" value={formData.startingLocation} onChange={handleChange}
                      placeholder="e.g., Kathmandu"
                      className="w-full pl-9 pr-3 py-2.5 site-input rounded-lg text-sm" autoComplete="off" />
                  </div>
                </div>
              </div>

              {/* When */}
              <div className="site-card rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <p className="section-label">When?</p>
                  {tripDays && tripDays > 0 && (
                    <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-[#C6A16E]/10 border border-[#C6A16E]/25 text-[#C6A16E]">
                      <Clock className="w-3 h-3" />{tripDays} day{tripDays > 1 ? 's' : ''}
                    </span>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-[#8E8A81] mb-1">Start Date <span className="text-red-400">*</span></label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8E8A81]" />
                      <input type="date" name="startDate" value={formData.startDate} onChange={handleChange}
                        className="w-full pl-9 pr-2 py-2.5 site-input rounded-lg text-sm [color-scheme:dark]" required />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs text-[#8E8A81] mb-1">End Date <span className="text-red-400">*</span></label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8E8A81]" />
                      <input type="date" name="endDate" value={formData.endDate} onChange={handleChange}
                        min={formData.startDate}
                        className="w-full pl-9 pr-2 py-2.5 site-input rounded-lg text-sm [color-scheme:dark]" required />
                    </div>
                  </div>
                </div>
              </div>

              {/* Budget & Style */}
              <div className="site-card rounded-xl p-4 space-y-3">
                <p className="section-label">Budget & Style</p>
                <div>
                  <label className="block text-xs text-[#8E8A81] mb-1">Budget (NPR)</label>
                  <div className="relative">
                    <Wallet className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8E8A81]" />
                    <input type="text" name="budget" value={formData.budget} onChange={handleChange}
                      placeholder="e.g., 50000"
                      className="w-full pl-9 pr-3 py-2.5 site-input rounded-lg text-sm" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-[#8E8A81] mb-2">Travel Style</label>
                  <div className="flex flex-wrap gap-2">
                    {TRAVEL_STYLES.map(s => (
                      <button key={s.value} type="button" onClick={() => setFormData(p => ({ ...p, travelStyle: s.value }))}
                        className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-all ${
                          formData.travelStyle === s.value
                            ? STYLE_COLORS[s.color]
                            : 'border-white/10 text-[#8E8A81] hover:border-white/25 hover:text-[#F5F3EE]'
                        }`}>
                        {s.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Interests */}
              <div className="site-card rounded-xl p-4 space-y-3">
                <p className="section-label">Interests</p>
                <div className="flex flex-wrap gap-2">
                  {INTEREST_CHIPS.map(({ label, icon }) => (
                    <button key={label} type="button" onClick={() => toggleInterest(label)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all ${
                        selectedInterests.includes(label)
                          ? 'bg-[#C6A16E]/[0.12] border-[#C6A16E]/40 text-[#C6A16E]'
                          : 'border-white/10 text-[#8E8A81] hover:border-white/25 hover:text-[#F5F3EE]'
                      }`}>
                      {icon}{label}
                    </button>
                  ))}
                </div>
                <input type="text" name="interests" value={formData.interests} onChange={handleChange}
                  placeholder="Or type custom interests…"
                  className="w-full px-3 py-2 site-input rounded-lg text-xs" />
              </div>

              {/* Notes */}
              <div className="site-card rounded-xl p-4 space-y-2">
                <p className="section-label">Additional Notes</p>
                <textarea name="additionalNotes" value={formData.additionalNotes} onChange={handleChange}
                  placeholder="Special requirements, dietary needs, mobility restrictions…"
                  rows={3}
                  className="w-full px-3 py-2.5 site-input rounded-lg text-sm resize-none" />
              </div>

              <div className="flex gap-3 pb-1">
                <button type="submit" disabled={isLoading}
                  className="btn-primary flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm disabled:opacity-50">
                  {isLoading
                    ? <><Loader2 className="w-4 h-4 animate-spin" /> Generating…</>
                    : <><Sparkles className="w-4 h-4" /> Generate Itinerary</>}
                </button>
                <button type="button" onClick={handleReset}
                  className="btn-outline px-4 py-3 rounded-xl">
                  <RotateCcw className="w-4 h-4" />
                </button>
              </div>
            </>
          )}
        </form>

        {/* ── RIGHT: Output ──────────────────────────────────────── */}
        <div className="site-card rounded-xl flex flex-col overflow-hidden">
          {/* Output header */}
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/8 shrink-0">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-[#C6A16E]" />
              <span className="font-semibold text-[#F5F3EE] text-sm font-heading">Your Itinerary</span>
              {generatedItinerary && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#8FA68E]/15 border border-[#8FA68E]/30 text-[#8FA68E] font-medium">
                  Ready
                </span>
              )}
            </div>
            {generatedItinerary && (
              <button onClick={handleDownloadPDF}
                className="btn-outline flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium">
                <Download className="w-3.5 h-3.5" /> Download PDF
              </button>
            )}
          </div>

          {/* Output body */}
          <div className="flex-1 overflow-y-auto px-5 py-4">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center h-full gap-5 text-center">
                <div className="relative">
                  <div className="w-16 h-16 rounded-2xl bg-[#C6A16E]/10 border border-[#C6A16E]/25 flex items-center justify-center">
                    <Sparkles className="w-7 h-7 text-[#C6A16E] animate-pulse" />
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-2 border-[#C6A16E] border-t-transparent animate-spin bg-[#0B0F0C]" />
                </div>
                <div>
                  <p className="text-[#F5F3EE] font-semibold font-heading mb-1">Planning your adventure…</p>
                  <p className="text-[#8E8A81] text-sm">Groq AI is crafting your day-by-day itinerary</p>
                </div>
              </div>
            ) : generatedItinerary ? (
              <div className="text-sm text-[#B8B4AA] whitespace-pre-wrap leading-relaxed">
                {generatedItinerary}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full gap-5 text-center px-8">
                {/* Cinematic background image in the empty state */}
                <div className="relative w-32 h-20 rounded-xl overflow-hidden mb-2">
                  <div
                    className="absolute inset-0 bg-cover bg-center"
                    style={{ backgroundImage: "url('https://images.pexels.com/photos/618833/pexels-photo-618833.jpeg?auto=compress&cs=tinysrgb&w=300')" }}
                  />
                  <div className="absolute inset-0 bg-[#0B0F0C]/55" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Mountain className="w-8 h-8 text-[#C6A16E]/70" />
                  </div>
                </div>
                <div>
                  <p className="text-[#F5F3EE] font-semibold font-heading mb-1">Ready to plan your trek?</p>
                  <p className="text-[#8E8A81] text-xs leading-relaxed">
                    Fill in your destination and dates,<br />
                    then click <span className="text-[#C6A16E] font-medium">Generate Itinerary</span>
                  </p>
                </div>
                <div className="grid grid-cols-3 gap-2 w-full max-w-xs">
                  {[
                    { step: '1', text: 'Destination' },
                    { step: '2', text: 'Dates' },
                    { step: '3', text: 'Generate' },
                  ].map(({ step, text }) => (
                    <div key={step} className="bg-[#111714] border border-white/8 rounded-lg p-2.5 text-center">
                      <p className="text-[10px] font-bold text-[#C6A16E] mb-0.5">{step}</p>
                      <p className="text-[10px] text-[#8E8A81]">{text}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// #endregion Component

// #region Exports
export default ItineraryGenerator;
// #endregion Exports
