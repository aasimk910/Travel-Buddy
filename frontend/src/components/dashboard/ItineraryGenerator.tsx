import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { generateItinerary } from '../../services/itinerary';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import {
  Loader2, MapPin, Calendar, Sparkles, Download, RotateCcw,
  Mountain, Utensils, Camera, Tent, Palmtree, Landmark, Wallet,
  Clock, Navigation, FileText, PenLine, LayoutList,
} from 'lucide-react';

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
  emerald: 'bg-emerald-500/20 border-emerald-400/60 text-emerald-300',
  blue:    'bg-blue-500/20 border-blue-400/60 text-blue-300',
  purple:  'bg-purple-500/20 border-purple-400/60 text-purple-300',
  orange:  'bg-orange-500/20 border-orange-400/60 text-orange-300',
  teal:    'bg-teal-500/20 border-teal-400/60 text-teal-300',
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
    const handler = (e: MouseEvent) => {
      if (
        suggestionsRef.current && !suggestionsRef.current.contains(e.target as Node) &&
        destinationInputRef.current && !destinationInputRef.current.contains(e.target as Node)
      ) setShowSuggestions(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

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

  const handleDestinationSelect = (dest: string) => {
    setFormData(prev => ({ ...prev, destination: dest }));
    setShowSuggestions(false);
    setFilteredSuggestions([]);
  };

  const handleDestinationFocus = () => {
    if (formData.destination.trim()) {
      const filtered = DESTINATION_SUGGESTIONS.filter(d =>
        d.toLowerCase().includes(formData.destination.toLowerCase())
      );
      setFilteredSuggestions(filtered);
      setShowSuggestions(filtered.length > 0);
    }
  };

  const toggleInterest = (label: string) => {
    const next = selectedInterests.includes(label)
      ? selectedInterests.filter(i => i !== label)
      : [...selectedInterests, label];
    setSelectedInterests(next);
    setFormData(prev => ({ ...prev, interests: next.join(', ') }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem('travelBuddyToken');
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
        : formData;
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

  const handleReset = () => {
    setFormData({ startingLocation:'',destination:'',startDate:'',endDate:'',budget:'',travelStyle:'balanced',interests:'',additionalNotes:'' });
    setGeneratedItinerary('');
    setSelectedInterests([]);
    setCustomPrompt('');
  };

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
      {/* Header */}
      <div className="flex items-center justify-between mb-5 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500/30 to-purple-500/30 border border-indigo-400/30 flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-indigo-300" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">AI Itinerary Generator</h2>
            <p className="text-xs text-gray-400">Powered by Gemini AI — plan your perfect trip</p>
          </div>
        </div>

        {/* Mode tabs */}
        <div className="flex items-center gap-1 p-1 rounded-xl bg-white/5 border border-white/10">
          <button type="button"
            onClick={() => setActiveTab('guided')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeTab === 'guided'
                ? 'bg-indigo-500/30 border border-indigo-400/40 text-indigo-200'
                : 'text-gray-500 hover:text-gray-300'
            }`}>
            <LayoutList className="w-3.5 h-3.5" /> Guided Form
          </button>
          <button type="button"
            onClick={() => setActiveTab('custom')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeTab === 'custom'
                ? 'bg-purple-500/30 border border-purple-400/40 text-purple-200'
                : 'text-gray-500 hover:text-gray-300'
            }`}>
            <PenLine className="w-3.5 h-3.5" /> Custom Prompt
          </button>
        </div>
      </div>

      {/* Main grid */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-[420px_1fr] gap-5 min-h-0">

        {/* ── LEFT — Form (mode-conditional) ──────────────── */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 overflow-y-auto pr-1" style={{ scrollbarWidth: 'thin' }}>

        {activeTab === 'custom' ? (
          /* ─── Custom Prompt panel ─────────────────────── */
          <>
            <div className="glass-card rounded-xl p-4 space-y-3 flex-1 flex flex-col">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-purple-300 uppercase tracking-widest">Your Prompt</p>
                <span className="text-[10px] text-gray-500">{customPrompt.length} chars</span>
              </div>
              <p className="text-xs text-gray-500 leading-relaxed">
                Describe exactly what you want — destination, duration, budget, style, special requests. The AI will follow your instructions precisely.
              </p>
              <textarea
                value={customPrompt}
                onChange={e => setCustomPrompt(e.target.value)}
                placeholder={"e.g. Plan a 5-day budget trek to Poon Hill starting from Kathmandu for 2 people. We love photography and local food. Total budget Rs 30,000. Include teahouse accommodation and sunrise viewpoints."}
                className="flex-1 min-h-[200px] w-full px-3 py-3 rounded-lg glass-input text-sm text-white placeholder-gray-600 resize-none leading-relaxed"
                autoFocus
              />
            </div>

            {/* Example prompts */}
            <div className="glass-card rounded-xl p-4 space-y-2">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest">Examples — click to use</p>
              {EXAMPLE_PROMPTS.map((ex, i) => (
                <button key={i} type="button"
                  onClick={() => setCustomPrompt(ex)}
                  className="w-full text-left px-3 py-2.5 rounded-lg border border-white/5 text-xs text-gray-400 hover:border-purple-400/30 hover:text-gray-200 hover:bg-purple-500/10 transition-all leading-relaxed">
                  {ex}
                </button>
              ))}
            </div>
          </>
        ) : (
          /* ─── Guided Form panels ──────────────────────── */
          <>

          {/* Where to */}
          <div className="glass-card rounded-xl p-4 space-y-3">
            <p className="text-xs font-semibold text-indigo-300 uppercase tracking-widest">Where to?</p>

            {/* Destination input */}
            <div>
              <label className="block text-xs text-gray-400 mb-1">Destination <span className="text-red-400">*</span></label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-indigo-400 z-10" />
                <input
                  ref={destinationInputRef}
                  type="text" name="destination"
                  value={formData.destination}
                  onChange={handleChange}
                  onFocus={handleDestinationFocus}
                  placeholder="e.g., Pokhara, Nepal"
                  className="w-full pl-9 pr-3 py-2.5 rounded-lg glass-input text-sm text-white placeholder-gray-500"
                  required autoComplete="off"
                />
                {showSuggestions && filteredSuggestions.length > 0 && (
                  <div
                    ref={suggestionsRef}
                    className="absolute z-30 w-full mt-1 rounded-xl border border-white/10 shadow-2xl max-h-52 overflow-y-auto"
                    style={{ background: 'rgba(15,23,42,0.97)', backdropFilter: 'blur(20px)' }}
                  >
                    {filteredSuggestions.map((s, i) => (
                      <button key={i} type="button" onClick={() => handleDestinationSelect(s)}
                        className="w-full px-4 py-2.5 text-left text-sm text-gray-200 hover:bg-indigo-500/20 flex items-center gap-2 border-b border-white/5 last:border-0">
                        <MapPin className="w-3.5 h-3.5 text-indigo-400 shrink-0" />{s}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Starting location */}
            <div>
              <label className="block text-xs text-gray-400 mb-1">Starting Location</label>
              <div className="relative">
                <Navigation className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input type="text" name="startingLocation" value={formData.startingLocation} onChange={handleChange}
                  placeholder="e.g., Kathmandu"
                  className="w-full pl-9 pr-3 py-2.5 rounded-lg glass-input text-sm text-white placeholder-gray-500" autoComplete="off" />
              </div>
            </div>
          </div>

          {/* When */}
          <div className="glass-card rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-indigo-300 uppercase tracking-widest">When?</p>
              {tripDays && tripDays > 0 && (
                <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-300">
                  <Clock className="w-3 h-3" />{tripDays} day{tripDays > 1 ? 's' : ''}
                </span>
              )}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-400 mb-1">Start Date <span className="text-red-400">*</span></label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <input type="date" name="startDate" value={formData.startDate} onChange={handleChange}
                    className="w-full pl-9 pr-2 py-2.5 rounded-lg glass-input text-sm text-white [color-scheme:dark]" required />
                </div>
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">End Date <span className="text-red-400">*</span></label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <input type="date" name="endDate" value={formData.endDate} onChange={handleChange}
                    min={formData.startDate}
                    className="w-full pl-9 pr-2 py-2.5 rounded-lg glass-input text-sm text-white [color-scheme:dark]" required />
                </div>
              </div>
            </div>
          </div>

          {/* Budget & Style */}
          <div className="glass-card rounded-xl p-4 space-y-3">
            <p className="text-xs font-semibold text-indigo-300 uppercase tracking-widest">Budget & Style</p>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Budget (NPR)</label>
              <div className="relative">
                <Wallet className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input type="text" name="budget" value={formData.budget} onChange={handleChange}
                  placeholder="e.g., 50000"
                  className="w-full pl-9 pr-3 py-2.5 rounded-lg glass-input text-sm text-white placeholder-gray-500" />
              </div>
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-2">Travel Style</label>
              <div className="flex flex-wrap gap-2">
                {TRAVEL_STYLES.map(s => (
                  <button key={s.value} type="button" onClick={() => setFormData(p => ({ ...p, travelStyle: s.value }))}
                    className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-all ${
                      formData.travelStyle === s.value
                        ? STYLE_COLORS[s.color]
                        : 'border-white/10 text-gray-500 hover:border-white/20 hover:text-gray-300'
                    }`}>
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Interests */}
          <div className="glass-card rounded-xl p-4 space-y-3">
            <p className="text-xs font-semibold text-indigo-300 uppercase tracking-widest">Interests</p>
            <div className="flex flex-wrap gap-2">
              {INTEREST_CHIPS.map(({ label, icon }) => (
                <button key={label} type="button" onClick={() => toggleInterest(label)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all ${
                    selectedInterests.includes(label)
                      ? 'bg-indigo-500/20 border-indigo-400/60 text-indigo-300'
                      : 'border-white/10 text-gray-500 hover:border-white/20 hover:text-gray-300'
                  }`}>
                  {icon}{label}
                </button>
              ))}
            </div>
            <input type="text" name="interests" value={formData.interests} onChange={handleChange}
              placeholder="Or type custom interests..."
              className="w-full px-3 py-2 rounded-lg glass-input text-xs text-white placeholder-gray-600" />
          </div>

          {/* Notes */}
          <div className="glass-card rounded-xl p-4 space-y-2">
            <p className="text-xs font-semibold text-indigo-300 uppercase tracking-widest">Additional Notes</p>
            <textarea name="additionalNotes" value={formData.additionalNotes} onChange={handleChange}
              placeholder="Special requirements, dietary needs, mobility restrictions..."
              rows={3}
              className="w-full px-3 py-2.5 rounded-lg glass-input text-sm text-white placeholder-gray-500 resize-none" />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pb-2">
            <button type="submit" disabled={isLoading}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-indigo-500/30 to-purple-500/30 border border-indigo-400/40 text-white font-semibold text-sm hover:from-indigo-500/40 hover:to-purple-500/40 transition-all disabled:opacity-50 disabled:cursor-not-allowed">
              {isLoading
                ? <><Loader2 className="w-4 h-4 animate-spin" /> Generating...</>
                : <><Sparkles className="w-4 h-4" /> Generate Itinerary</>}
            </button>
            <button type="button" onClick={handleReset}
              className="px-4 py-3 rounded-xl glass-button border border-white/10 text-gray-400 hover:text-white transition-all">
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>

          </>
          )} {/* end guided form else */}

          {/* ─── Shared Actions ───────────────────────────────── */}
          {activeTab === 'custom' && (
          <div className="flex gap-3 pb-2">
            <button type="submit" disabled={isLoading}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-purple-500/30 to-indigo-500/30 border border-purple-400/40 text-white font-semibold text-sm hover:from-purple-500/40 hover:to-indigo-500/40 transition-all disabled:opacity-50 disabled:cursor-not-allowed">
              {isLoading
                ? <><Loader2 className="w-4 h-4 animate-spin" /> Generating...</>
                : <><Sparkles className="w-4 h-4" /> Generate with My Prompt</>}
            </button>
            <button type="button" onClick={handleReset}
              className="px-4 py-3 rounded-xl glass-button border border-white/10 text-gray-400 hover:text-white transition-all">
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
          )}
        </form>

        {/* ── RIGHT — Output ───────────────────────────────── */}
        <div className="glass-card rounded-xl flex flex-col min-h-0 overflow-hidden">

          {/* Output header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 shrink-0">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-indigo-400" />
              <span className="font-semibold text-white text-sm">Your Itinerary</span>
              {generatedItinerary && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 font-medium">
                  Ready
                </span>
              )}
            </div>
            {generatedItinerary && (
              <button onClick={handleDownloadPDF}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 text-xs font-medium hover:bg-emerald-500/30 transition-all">
                <Download className="w-3.5 h-3.5" /> Download PDF
              </button>
            )}
          </div>

          {/* Output body */}
          <div className="flex-1 overflow-y-auto px-5 py-4" style={{ scrollbarWidth: 'thin' }}>
            {isLoading ? (
              <div className="flex flex-col items-center justify-center h-full gap-4">
                <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 border border-indigo-400/20 flex items-center justify-center">
                  <Sparkles className="w-7 h-7 text-indigo-400 animate-pulse" />
                </div>
                <div className="text-center">
                  <p className="text-white font-medium mb-1">Planning your trip...</p>
                  <p className="text-gray-400 text-sm">Gemini AI is crafting your itinerary</p>
                </div>
                <Loader2 className="w-5 h-5 text-indigo-400 animate-spin" />
              </div>
            ) : generatedItinerary ? (
              <div className="text-sm text-gray-200 whitespace-pre-wrap leading-relaxed">
                {generatedItinerary}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full gap-4 text-center px-8">
                <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
                  <Mountain className="w-8 h-8 text-gray-600" />
                </div>
                <div>
                  <p className="text-gray-400 font-medium mb-1">No itinerary yet</p>
                  <p className="text-gray-600 text-xs leading-relaxed">
                    Fill in your destination and dates on the left,<br />
                    then click <span className="text-indigo-400 font-medium">Generate Itinerary</span>
                  </p>
                </div>
                <div className="grid grid-cols-3 gap-3 w-full max-w-xs mt-2">
                  {['Destination', 'Dates', 'Budget'].map(step => (
                    <div key={step} className="glass-card rounded-lg p-2.5 text-center border border-white/5">
                      <p className="text-[10px] text-gray-500">{step}</p>
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

export default ItineraryGenerator;
