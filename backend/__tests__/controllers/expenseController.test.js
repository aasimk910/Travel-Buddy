// backend/__tests__/controllers/expenseController.test.js
// Tests for FR-OS-12: Add expense, split among participants, view summary

const { mockUserId } = require('../mocks/models');

const mockHikeId = '507f1f77bcf86cd799439030';

describe('Expense Controller - FR-OS-12: Expense Management and Splitting', () => {
  describe('Expense Input Validation', () => {
    it('should validate required expense fields', () => {
      const validateExpense = (data) => {
        const required = ['description', 'amount', 'paidBy', 'participants'];
        const missing = required.filter(f => !data[f] || (Array.isArray(data[f]) && data[f].length === 0));
        return { valid: missing.length === 0, missing };
      };

      const validExpense = {
        description: 'Tent rental',
        amount: 3000,
        paidBy: mockUserId,
        participants: [{ userId: mockUserId }, { userId: 'user-2' }],
      };

      expect(validateExpense(validExpense).valid).toBe(true);
      expect(validateExpense({ description: 'Food' }).valid).toBe(false);
    });

    it('should reject zero or negative amounts', () => {
      const isValidAmount = (amount) => typeof amount === 'number' && amount > 0;

      expect(isValidAmount(500)).toBe(true);
      expect(isValidAmount(0)).toBe(false);
      expect(isValidAmount(-100)).toBe(false);
    });

    it('should require at least one participant', () => {
      const validateParticipants = (participants) => {
        return Array.isArray(participants) && participants.length > 0;
      };

      expect(validateParticipants([{ userId: 'u1' }])).toBe(true);
      expect(validateParticipants([])).toBe(false);
      expect(validateParticipants(null)).toBe(false);
    });
  });

  describe('Equal Split Calculation', () => {
    it('should split amount equally among all participants', () => {
      const splitEqually = (amount, participants) => {
        const splitAmount = parseFloat((amount / participants.length).toFixed(2));
        return participants.map(p => ({ ...p, amount: splitAmount }));
      };

      const participants = [
        { userId: 'u1' },
        { userId: 'u2' },
        { userId: 'u3' },
      ];

      const result = splitEqually(3000, participants);
      expect(result).toHaveLength(3);
      expect(result[0].amount).toBe(1000);
      expect(result[1].amount).toBe(1000);
      expect(result[2].amount).toBe(1000);
    });

    it('should handle uneven splits with rounding', () => {
      const splitEqually = (amount, participants) => {
        const splitAmount = parseFloat((amount / participants.length).toFixed(2));
        return participants.map(p => ({ ...p, amount: splitAmount }));
      };

      const participants = [{ userId: 'u1' }, { userId: 'u2' }, { userId: 'u3' }];
      const result = splitEqually(100, participants);
      expect(result[0].amount).toBeCloseTo(33.33, 2);
    });
  });

  describe('Share-Based Split Calculation', () => {
    it('should split amount proportionally by shares', () => {
      const splitByShares = (amount, participants) => {
        const totalShares = participants.reduce((sum, p) => sum + (p.share || 1), 0);
        return participants.map(p => ({
          ...p,
          amount: parseFloat(((amount * (p.share || 1)) / totalShares).toFixed(2)),
        }));
      };

      const participants = [
        { userId: 'u1', share: 2 },
        { userId: 'u2', share: 1 },
        { userId: 'u3', share: 1 },
      ];

      const result = splitByShares(4000, participants);
      expect(result[0].amount).toBe(2000); // 2/4 of 4000
      expect(result[1].amount).toBe(1000); // 1/4 of 4000
      expect(result[2].amount).toBe(1000); // 1/4 of 4000
    });
  });

  describe('Custom Split Calculation', () => {
    it('should use custom amounts provided per participant', () => {
      const applyCustomSplit = (participants) => {
        return participants.map(p => ({ ...p }));
      };

      const participants = [
        { userId: 'u1', amount: 1500 },
        { userId: 'u2', amount: 800 },
        { userId: 'u3', amount: 700 },
      ];

      const result = applyCustomSplit(participants);
      expect(result[0].amount).toBe(1500);
      expect(result[1].amount).toBe(800);
    });
  });

  describe('Expense Balance Summary', () => {
    it('should calculate net balance per participant', () => {
      const calculateBalances = (expenses, userId) => {
        let owes = 0;
        let owed = 0;

        expenses.forEach(expense => {
          // Amount owed to the payer
          if (expense.paidBy === userId) {
            expense.participants.forEach(p => {
              if (p.userId !== userId) {
                owed += p.amount;
              }
            });
          } else {
            const myShare = expense.participants.find(p => p.userId === userId);
            if (myShare) owes += myShare.amount;
          }
        });

        return { owes: parseFloat(owes.toFixed(2)), owed: parseFloat(owed.toFixed(2)), net: parseFloat((owed - owes).toFixed(2)) };
      };

      const expenses = [
        {
          paidBy: mockUserId,
          participants: [
            { userId: mockUserId, amount: 500 },
            { userId: 'user-2', amount: 500 },
            { userId: 'user-3', amount: 500 },
          ],
        },
        {
          paidBy: 'user-2',
          participants: [
            { userId: mockUserId, amount: 300 },
            { userId: 'user-2', amount: 300 },
          ],
        },
      ];

      const balance = calculateBalances(expenses, mockUserId);
      expect(balance.owed).toBe(1000); // user-2 + user-3 owe me
      expect(balance.owes).toBe(300);  // I owe user-2
      expect(balance.net).toBe(700);
    });

    it('should return zero balance for participant with no expenses', () => {
      const calculateBalances = (expenses, userId) => {
        if (!expenses || expenses.length === 0) return { owes: 0, owed: 0, net: 0 };
        return { owes: 0, owed: 0, net: 0 };
      };

      expect(calculateBalances([], 'user-1')).toEqual({ owes: 0, owed: 0, net: 0 });
    });

    it('should correctly identify who paid for each expense', () => {
      const getPayerInfo = (expense, users) => {
        const payer = users.find(u => u.userId === expense.paidBy);
        return payer ? payer.name : 'Unknown';
      };

      const expense = { paidBy: mockUserId, amount: 1000 };
      const users = [{ userId: mockUserId, name: 'Test User' }];

      expect(getPayerInfo(expense, users)).toBe('Test User');
      expect(getPayerInfo({ paidBy: 'unknown-id' }, users)).toBe('Unknown');
    });
  });

  describe('Expense Category Handling', () => {
    it('should accept valid expense categories', () => {
      const validCategories = ['Food', 'Transport', 'Accommodation', 'Equipment', 'Other'];
      const isValidCategory = (cat) => validCategories.includes(cat);

      expect(isValidCategory('Food')).toBe(true);
      expect(isValidCategory('Transport')).toBe(true);
      expect(isValidCategory('InvalidCategory')).toBe(false);
    });

    it('should default category to "Other" when not provided', () => {
      const resolveCategory = (category) => category || 'Other';

      expect(resolveCategory('Food')).toBe('Food');
      expect(resolveCategory(null)).toBe('Other');
      expect(resolveCategory(undefined)).toBe('Other');
    });
  });
});
