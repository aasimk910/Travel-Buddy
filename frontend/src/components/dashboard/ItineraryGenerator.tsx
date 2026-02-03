import React, { useState } from 'react';
import { generateItinerary } from '../../services/itinerary';
import { useToast } from '../../context/ToastContext';
import { Loader2, MapPin, Calendar, DollarSign, Sparkles } from 'lucide-react';

const ItineraryGenerator: React.FC = () => {
  const { showSuccess, showError } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [generatedItinerary, setGeneratedItinerary] = useState<string>('');
  
  const [formData, setFormData] = useState({
    destination: '',
    startDate: '',
    endDate: '',
    budget: '',
    travelStyle: 'balanced',
    interests: '',
    additionalNotes: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
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
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  name="destination"
                  value={formData.destination}
                  onChange={handleChange}
                  placeholder="e.g., Pokhara, Nepal"
                  className="w-full pl-10 pr-3 py-2 rounded-lg glass-input text-white placeholder:text-gray-400"
                  required
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
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
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
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
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
                Budget
              </label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  name="budget"
                  value={formData.budget}
                  onChange={handleChange}
                  placeholder="e.g., $500-1000"
                  className="w-full pl-10 pr-3 py-2 rounded-lg glass-input text-white placeholder:text-gray-400"
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
                className="w-full px-3 py-2 rounded-lg glass-input text-white placeholder:text-gray-400"
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
                className="w-full px-3 py-2 rounded-lg glass-input text-white placeholder:text-gray-400 resize-none"
              />
            </div>

            {/* Buttons */}
            <div className="flex gap-3 pt-2 sticky bottom-0 bg-inherit">
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
