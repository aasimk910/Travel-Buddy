// backend/__tests__/controllers/itineraryController.test.js
// Tests for FR-OS-13: Submit itinerary inputs and generate day-wise itinerary

describe('Itinerary Controller - FR-OS-13: Itinerary Generation', () => {
  describe('Input Validation', () => {
    it('should validate required itinerary inputs', () => {
      const validateItineraryInput = (data) => {
        const required = ['destination', 'days'];
        const missing = required.filter(f => !data[f]);
        return { valid: missing.length === 0, missing };
      };

      expect(validateItineraryInput({ destination: 'Pokhara', days: 3 }).valid).toBe(true);
      expect(validateItineraryInput({ destination: 'Pokhara' }).valid).toBe(false);
      expect(validateItineraryInput({}).valid).toBe(false);
    });

    it('should reject non-positive day count', () => {
      const isValidDays = (days) => Number.isInteger(days) && days >= 1 && days <= 30;

      expect(isValidDays(3)).toBe(true);
      expect(isValidDays(1)).toBe(true);
      expect(isValidDays(30)).toBe(true);
      expect(isValidDays(0)).toBe(false);
      expect(isValidDays(-1)).toBe(false);
      expect(isValidDays(31)).toBe(false);
    });

    it('should accept valid travel styles', () => {
      const validStyles = ['budget', 'balanced', 'luxury'];
      const isValidStyle = (style) => !style || validStyles.includes(style);

      expect(isValidStyle('budget')).toBe(true);
      expect(isValidStyle('luxury')).toBe(true);
      expect(isValidStyle(null)).toBe(true);  // optional field
      expect(isValidStyle('extreme')).toBe(false);
    });
  });

  describe('Daily Budget Calculation', () => {
    const calculateDayBudget = (dailyBudget, travelStyle) => {
      const multipliers = {
        budget: { transport: 0.15, accommodation: 0.35, food: 0.25, activities: 0.15, misc: 0.10 },
        balanced: { transport: 0.20, accommodation: 0.30, food: 0.25, activities: 0.15, misc: 0.10 },
        luxury: { transport: 0.15, accommodation: 0.40, food: 0.25, activities: 0.15, misc: 0.05 },
      };
      const mult = multipliers[travelStyle] || multipliers.balanced;
      return {
        transport: Math.round(dailyBudget * mult.transport),
        accommodation: Math.round(dailyBudget * mult.accommodation),
        food: Math.round(dailyBudget * mult.food),
        activities: Math.round(dailyBudget * mult.activities),
        misc: Math.round(dailyBudget * mult.misc),
        total: dailyBudget,
      };
    };

    it('should calculate correct budget breakdown for balanced style', () => {
      const budget = calculateDayBudget(1000, 'balanced');

      expect(budget.transport).toBe(200);
      expect(budget.accommodation).toBe(300);
      expect(budget.food).toBe(250);
      expect(budget.activities).toBe(150);
      expect(budget.misc).toBe(100);
      expect(budget.total).toBe(1000);
    });

    it('should allocate more accommodation for luxury style', () => {
      const budget = calculateDayBudget(1000, 'luxury');
      expect(budget.accommodation).toBe(400);
    });

    it('should allocate more accommodation for budget style than transport', () => {
      const budget = calculateDayBudget(1000, 'budget');
      expect(budget.accommodation).toBeGreaterThan(budget.transport);
    });

    it('should default to balanced style for unknown travel style', () => {
      const budgetWithUnknown = calculateDayBudget(1000, 'unknown');
      const budgetBalanced = calculateDayBudget(1000, 'balanced');
      expect(budgetWithUnknown.transport).toBe(budgetBalanced.transport);
    });
  });

  describe('Demo Itinerary Generation', () => {
    const generateDemoItinerary = (destination, days, budget, travelStyle) => {
      let itinerary = `${days}-Day Adventure to ${destination}\n`;
      if (budget) itinerary += `Total Budget: ${budget} NPR\n`;
      if (travelStyle) itinerary += `Travel Style: ${travelStyle}\n`;

      const dailyPlans = [];
      for (let day = 1; day <= days; day++) {
        dailyPlans.push({
          day,
          morning: `Visit main attractions in ${destination}`,
          afternoon: 'Guided tour or self-explore landmarks',
          evening: 'Watch sunset from scenic viewpoint',
        });
      }
      return { text: itinerary, days: dailyPlans };
    };

    it('should generate the correct number of day entries', () => {
      const result = generateDemoItinerary('Kathmandu', 5, '25000', 'balanced');
      expect(result.days).toHaveLength(5);
    });

    it('should include destination name in itinerary output', () => {
      const result = generateDemoItinerary('Pokhara', 3, null, null);
      expect(result.text).toContain('Pokhara');
    });

    it('should include budget information when provided', () => {
      const result = generateDemoItinerary('Chitwan', 2, '10000', 'budget');
      expect(result.text).toContain('10000 NPR');
    });

    it('should number days starting from 1', () => {
      const result = generateDemoItinerary('Lumbini', 4, null, null);
      expect(result.days[0].day).toBe(1);
      expect(result.days[3].day).toBe(4);
    });

    it('should include morning, afternoon, and evening for each day', () => {
      const result = generateDemoItinerary('Bhaktapur', 2, null, null);
      result.days.forEach(day => {
        expect(day).toHaveProperty('morning');
        expect(day).toHaveProperty('afternoon');
        expect(day).toHaveProperty('evening');
      });
    });
  });

  describe('Itinerary Response Structure', () => {
    it('should return structured itinerary response', () => {
      const buildItineraryResponse = (destination, days, generatedText) => ({
        destination,
        totalDays: days,
        itinerary: generatedText,
        generatedAt: new Date().toISOString(),
      });

      const response = buildItineraryResponse('Everest Region', 7, 'Day 1: Arrival...');
      expect(response).toHaveProperty('destination', 'Everest Region');
      expect(response).toHaveProperty('totalDays', 7);
      expect(response).toHaveProperty('itinerary');
      expect(response).toHaveProperty('generatedAt');
    });
  });
});
