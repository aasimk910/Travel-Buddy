import React, { useState, useRef, useEffect } from 'react';
import { generateItinerary } from '../../services/itinerary';
import { useToast } from '../../context/ToastContext';
import { Loader2, MapPin, Calendar, IndianRupee, Sparkles, Download } from 'lucide-react';

// Popular Nepal hiking and trekking destinations
const DESTINATION_SUGGESTIONS = [
  "Everest Base Camp, Nepal",
  "Annapurna Base Camp, Nepal",
  "Annapurna Circuit, Nepal",
  "Manaslu Circuit, Nepal",
  "Langtang Valley, Nepal",
  "Gokyo Lakes, Nepal",
  "Upper Mustang, Nepal",
  "Makalu Base Camp, Nepal",
  "Kanchenjunga Base Camp, Nepal",
  "Dhaulagiri Circuit, Nepal",
  "Poon Hill, Nepal",
  "Mardi Himal, Nepal",
  "Ghandruk, Nepal",
  "Ghorepani, Nepal",
  "Khopra Danda, Nepal",
  "Mohare Danda, Nepal",
  "Tilicho Lake, Nepal",
  "Gosaikunda Lake, Nepal",
  "Helambu Circuit, Nepal",
  "Tamang Heritage Trail, Nepal",
  "Nar Phu Valley, Nepal",
  "Tsum Valley, Nepal",
  "Dolpo Region, Nepal",
  "Rara Lake, Nepal",
  "Khaptad National Park, Nepal",
  "Pikey Peak, Nepal",
  "Numbur Cheese Circuit, Nepal",
  "Everest View Trek, Nepal",
  "Three Passes Trek, Nepal",
  "Khumai Dada, Nepal",
  "Nagarkot, Nepal",
  "Chisapani, Nepal",
  "Shivapuri National Park, Nepal",
  "Champadevi Hill, Nepal",
  "Phulchoki Hill, Nepal",
  "Kakani, Nepal",
  "Daman, Nepal",
  "Chandragiri Hills, Nepal",
  "Australian Base Camp, Nepal",
  "Khayer Lake, Nepal",
  "Panch Pokhari, Nepal",
  "Surya Peak, Nepal",
  "Jomsom, Nepal",
  "Muktinath, Nepal",
  "Kagbeni, Nepal",
  "Lomanthang, Nepal",
  "Syabrubesi, Nepal",
  "Kyanjin Gompa, Nepal",
  "Tsho Rolpa Lake, Nepal",
  "Dudh Kunda, Nepal",
  "Rolwaling Valley, Nepal",
  "Solu Trek, Nepal",
  "Pokhara, Nepal",
  "Kathmandu, Nepal",
  "Chitwan, Nepal",
  "Lumbini, Nepal",
  "Bandipur, Nepal",
  "Bhaktapur, Nepal",
  "Patan, Nepal",
  "Ilam, Nepal",
];

const ItineraryGenerator: React.FC = () => {
  const { showSuccess, showError } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [generatedItinerary, setGeneratedItinerary] = useState<string>('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [filteredSuggestions, setFilteredSuggestions] = useState<string[]>([]);
  const destinationInputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  
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

  // Handle click outside to close suggestions
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target as Node) &&
        destinationInputRef.current &&
        !destinationInputRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });

    // Filter destinations when typing in destination field
    if (name === 'destination') {
      if (value.trim() === '') {
        setFilteredSuggestions([]);
        setShowSuggestions(false);
      } else {
        const filtered = DESTINATION_SUGGESTIONS.filter((dest) =>
          dest.toLowerCase().includes(value.toLowerCase())
        );
        setFilteredSuggestions(filtered);
        setShowSuggestions(true);
      }
    }
  };

  const handleDestinationSelect = (destination: string) => {
    setFormData({
      ...formData,
      destination,
    });
    setShowSuggestions(false);
    setFilteredSuggestions([]);
  };

  const handleDestinationFocus = () => {
    if (formData.destination.trim() !== '') {
      const filtered = DESTINATION_SUGGESTIONS.filter((dest) =>
        dest.toLowerCase().includes(formData.destination.toLowerCase())
      );
      setFilteredSuggestions(filtered);
      setShowSuggestions(true);
    }
  };

  const handleDownloadPDF = async () => {
    if (!generatedItinerary) {
      showError('No itinerary to download');
      return;
    }

    try {
      // Dynamically import jsPDF
      const { jsPDF } = await import('jspdf');
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });
      
      // Set up document dimensions with consistent margins
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const marginLeft = 18;
      const marginRight = 18;
      const marginTop = 18;
      const marginBottom = 25;
      const contentWidth = pageWidth - marginLeft - marginRight;
      let yPosition = marginTop;

      // Helper function to add new page when needed
      const checkAndAddPage = (requiredSpace: number = 10) => {
        if (yPosition + requiredSpace > pageHeight - marginBottom) {
          doc.addPage();
          yPosition = marginTop;
          return true;
        }
        return false;
      };

      // Process the itinerary text line by line
      const lines = generatedItinerary.split('\n');
      
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        
        // Skip empty lines but add minimal spacing
        if (line.trim() === '') {
          yPosition += 2;
          continue;
        }

        // Check if line is a separator
        if (line.trim() === '---') {
          yPosition += 5;
          checkAndAddPage(10);
          doc.setDrawColor(180, 180, 180);
          doc.setLineWidth(0.5);
          doc.line(marginLeft, yPosition, pageWidth - marginRight, yPosition);
          yPosition += 8;
          continue;
        }

        // Detect heading types
        const isDayHeading = /^Day \d+:/i.test(line);
        const isMainSubheading = /^(Morning|Afternoon|Evening|Practical tips?|Transportation|Food Recommendations?):/i.test(line);
        const isCostLine = /^(Estimated cost|Total cost)/i.test(line);
        const isNoteHeader = /^(NOTE|Trip Overview):/i.test(line);
        const isBullet = /^[•\-]\s/.test(line.trim());
        const isSubBullet = /^\s{2,}[•\-]\s/.test(line);

        // Calculate required space
        let requiredSpace = 10;
        if (isDayHeading) requiredSpace = 30;
        else if (isMainSubheading) requiredSpace = 20;

        // Check if we need a new page
        checkAndAddPage(requiredSpace);

        // Style based on content type
        if (isDayHeading) {
          yPosition += 8;
          doc.setFontSize(14);
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(20, 80, 200);
        } else if (isMainSubheading) {
          yPosition += 5;
          doc.setFontSize(12);
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(30, 100, 200);
        } else if (isCostLine || isNoteHeader) {
          yPosition += 4;
          doc.setFontSize(10);
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(60, 60, 60);
        } else if (isSubBullet) {
          doc.setFontSize(9);
          doc.setFont('helvetica', 'normal');
          doc.setTextColor(80, 80, 80);
        } else if (isBullet) {
          doc.setFontSize(9.5);
          doc.setFont('helvetica', 'normal');
          doc.setTextColor(50, 50, 50);
        } else {
          doc.setFontSize(10);
          doc.setFont('helvetica', 'normal');
          doc.setTextColor(30, 30, 30);
        }

        // Handle indentation
        let leftMargin = marginLeft;
        let availableWidth = contentWidth;
        
        if (isSubBullet) {
          leftMargin = marginLeft + 12;
          availableWidth = contentWidth - 12;
        } else if (isBullet) {
          leftMargin = marginLeft + 6;
          availableWidth = contentWidth - 6;
        }

        // Split long lines
        const wrappedLines = doc.splitTextToSize(line, availableWidth);
        
        for (let j = 0; j < wrappedLines.length; j++) {
          if (yPosition > pageHeight - marginBottom) {
            doc.addPage();
            yPosition = marginTop;
          }
          
          doc.text(wrappedLines[j], leftMargin, yPosition);
          yPosition += 5.5;
        }

        // Add spacing after sections
        if (isDayHeading) {
          yPosition += 3;
        } else if (isMainSubheading) {
          yPosition += 2;
        } else if (isCostLine) {
          yPosition += 1;
        }
      }

      // Add page numbers to all pages
      const totalPages = doc.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(120, 120, 120);
        doc.text(
          `Page ${i} of ${totalPages}`,
          pageWidth / 2,
          pageHeight - 12,
          { align: 'center' }
        );
      }

      // Save the PDF
      const fileName = `itinerary_${formData.destination.replace(/[^a-z0-9]/gi, '_')}_${new Date().getTime()}.pdf`;
      doc.save(fileName);
      showSuccess('PDF downloaded successfully!');
    } catch (error) {
      console.error('Error generating PDF:', error);
      showError('Failed to generate PDF');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.destination || !formData.startDate || !formData.endDate) {
      showError('Please fill in all required fields');
      return;
    }

    const token = localStorage.getItem('travelBuddyToken');
    if (!token) {
      showError('You must be logged in to generate an itinerary');
      return;
    }

    setIsLoading(true);
    setGeneratedItinerary('');

    try {
      const response = await generateItinerary(formData, token);
      setGeneratedItinerary(response.itinerary);
      showSuccess('Itinerary generated successfully!');
    } catch (error) {
      console.error('Error generating itinerary:', error);
      showError(error instanceof Error ? error.message : 'Failed to generate itinerary');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setFormData({
      startingLocation: '',
      destination: '',
      startDate: '',
      endDate: '',
      budget: '',
      travelStyle: 'balanced',
      interests: '',
      additionalNotes: '',
    });
    setGeneratedItinerary('');
  };

  return (
    <div className="glass-card rounded-lg p-6" style={{ height: 'calc(100vh - 120px)' }}>
      <div className="flex items-center gap-3 mb-4">
        <div className="glass-button-dark p-2 rounded-lg">
          <Sparkles className="w-5 h-5 text-white" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-white">AI Itinerary Generator</h2>
          <p className="text-sm text-gray-300">Let AI plan your perfect trip</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6" style={{ height: 'calc(100% - 80px)' }}>
        {/* Form Section */}
        <div className="glass-card rounded-lg p-4 h-full flex flex-col overflow-hidden">
          <form onSubmit={handleSubmit} className="space-y-3 flex-1 overflow-y-auto pr-2">
            {/* Destination */}
            <div>
              <label className="block text-sm font-medium text-white mb-1">
                Destination <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white z-10" />
                <input
                  ref={destinationInputRef}
                  type="text"
                  name="destination"
                  value={formData.destination}
                  onChange={handleChange}
                  onFocus={handleDestinationFocus}
                  placeholder="e.g., Pokhara, Nepal"
                  className="w-full pl-10 pr-3 py-2 rounded-lg glass-input text-white placeholder:text-gray-300"
                  required
                  autoComplete="off"
                />
                {/* Suggestions Dropdown */}
                {showSuggestions && filteredSuggestions.length > 0 && (
                  <div
                    ref={suggestionsRef}
                    className="absolute z-20 w-full mt-1 rounded-lg shadow-2xl max-h-60 overflow-y-auto border border-white/30 backdrop-blur-xl"
                    style={{
                      backgroundColor: 'rgba(30, 41, 59, 0.95)',
                      boxShadow: '0 10px 40px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.1)',
                    }}
                  >
                    {filteredSuggestions.map((suggestion, index) => (
                      <button
                        key={index}
                        type="button"
                        onClick={() => handleDestinationSelect(suggestion)}
                        className="w-full px-4 py-3 text-left text-white hover:bg-blue-500/30 transition-all flex items-center gap-2 border-b border-white/10 last:border-b-0 first:rounded-t-lg last:rounded-b-lg"
                      >
                        <MapPin className="w-4 h-4 text-blue-400 flex-shrink-0" />
                        <span className="text-sm font-medium">{suggestion}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Starting Location */}
            <div>
              <label className="block text-sm font-medium text-white mb-1">
                Starting Location
              </label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white z-10" />
                <input
                  type="text"
                  name="startingLocation"
                  value={formData.startingLocation}
                  onChange={handleChange}
                  placeholder="e.g., Kathmandu"
                  className="w-full pl-10 pr-3 py-2 rounded-lg glass-input text-white placeholder:text-gray-300"
                  autoComplete="off"
                />
              </div>
            </div>

            {/* Dates */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-white mb-1">
                  Start Date <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white" />
                  <input
                    type="date"
                    name="startDate"
                    value={formData.startDate}
                    onChange={handleChange}
                    className="w-full pl-10 pr-3 py-2 rounded-lg glass-input text-white"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-white mb-1">
                  End Date <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white" />
                  <input
                    type="date"
                    name="endDate"
                    value={formData.endDate}
                    onChange={handleChange}
                    className="w-full pl-10 pr-3 py-2 rounded-lg glass-input text-white"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Budget */}
            <div>
              <label className="block text-sm font-medium text-white mb-1">
                Budget (NPR)
              </label>
              <div className="relative">
                <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white" />
                <input
                  type="text"
                  name="budget"
                  value={formData.budget}
                  onChange={handleChange}
                  placeholder="e.g., Rs 50,000-100,000"
                  className="w-full pl-10 pr-3 py-2 rounded-lg glass-input text-white placeholder:text-gray-300"
                />
              </div>
            </div>

            {/* Travel Style */}
            <div>
              <label className="block text-sm font-medium text-white mb-1">
                Travel Style
              </label>
              <select
                name="travelStyle"
                value={formData.travelStyle}
                onChange={handleChange}
                className="w-full px-3 py-2 rounded-lg glass-input text-white"
              >
                <option value="budget">Budget-Friendly</option>
                <option value="balanced">Balanced</option>
                <option value="luxury">Luxury</option>
                <option value="adventure">Adventure</option>
                <option value="relaxed">Relaxed</option>
              </select>
            </div>

            {/* Interests */}
            <div>
              <label className="block text-sm font-medium text-white mb-1">
                Interests
              </label>
              <input
                type="text"
                name="interests"
                value={formData.interests}
                onChange={handleChange}
                placeholder="e.g., hiking, culture, food, photography"
                className="w-full px-3 py-2 rounded-lg glass-input text-white placeholder:text-gray-300"
              />
            </div>

            {/* Additional Notes */}
            <div>
              <label className="block text-sm font-medium text-white mb-1">
                Additional Notes
              </label>
              <textarea
                name="additionalNotes"
                value={formData.additionalNotes}
                onChange={handleChange}
                placeholder="Any special requirements or preferences..."
                rows={3}
                className="w-full px-3 py-2 rounded-lg glass-input text-white placeholder:text-gray-300 resize-none"
              />
            </div>

            {/* Buttons */}
            <div className="flex flex-col gap-2 pt-2 sticky bottom-0 bg-inherit">
              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 py-2 px-4 rounded-lg glass-button-dark text-white font-medium hover:opacity-90 transition disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      Generate Itinerary
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={handleReset}
                  className="px-4 py-2 rounded-lg glass-button text-white font-medium hover:opacity-90 transition"
                >
                  Reset
                </button>
              </div>
              {generatedItinerary && (
                <button
                  type="button"
                  onClick={handleDownloadPDF}
                  className="w-full py-2 px-4 rounded-lg bg-green-600 hover:bg-green-700 text-white font-medium transition flex items-center justify-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Download as PDF
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Result Section */}
        <div className="glass-card rounded-lg p-4 flex flex-col h-full overflow-hidden">
          <h3 className="text-lg font-semibold text-white mb-3 flex-shrink-0">Your Itinerary</h3>
          <div className="flex-1 overflow-y-scroll min-h-0 pr-2" style={{ scrollbarWidth: 'thin' }}>
            {isLoading ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-300">
                <Loader2 className="w-8 h-8 animate-spin mb-2" />
                <p>Generating your perfect itinerary...</p>
              </div>
            ) : generatedItinerary ? (
              <div className="prose prose-invert max-w-none">
                <div className="text-sm text-gray-200 whitespace-pre-wrap leading-relaxed">
                  {generatedItinerary}
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-full text-center text-gray-400">
                <p>Fill out the form and click "Generate Itinerary" to get started</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ItineraryGenerator;
