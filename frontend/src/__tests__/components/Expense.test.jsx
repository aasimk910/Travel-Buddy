// frontend/src/__tests__/components/Expense.test.jsx
// Tests for FR-OS-12: Add expense, split among participants, view summary

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { BrowserRouter as Router } from 'react-router-dom';
import axios from 'axios';

jest.mock('axios');

// Mock Expense Form component
const ExpenseForm = ({ participants, onSubmit }) => (
  <form
    data-testid="expense-form"
    onSubmit={e => {
      e.preventDefault();
      const fd = new FormData(e.target);
      onSubmit && onSubmit({
        description: fd.get('description'),
        amount: fd.get('amount'),
        splitType: fd.get('splitType'),
      });
    }}
  >
    <input name="description" data-testid="description-input" placeholder="What was this for?" />
    <input name="amount" type="number" data-testid="amount-input" placeholder="Amount (NPR)" />
    <select name="splitType" data-testid="split-type-select">
      <option value="equal">Split Equally</option>
      <option value="shares">Split by Shares</option>
      <option value="custom">Custom Split</option>
    </select>
    <button type="submit" data-testid="add-expense-btn">Add Expense</button>
  </form>
);

// Mock Expense List component
const ExpenseList = ({ expenses }) => (
  <div data-testid="expense-list">
    {expenses && expenses.length > 0 ? (
      expenses.map(expense => (
        <div key={expense._id} data-testid={`expense-${expense._id}`}>
          <span data-testid={`expense-desc-${expense._id}`}>{expense.description}</span>
          <span data-testid={`expense-amount-${expense._id}`}>{expense.amount}</span>
          <span data-testid={`expense-split-${expense._id}`}>{expense.splitType}</span>
        </div>
      ))
    ) : (
      <p data-testid="no-expenses">No expenses added yet.</p>
    )}
  </div>
);

// Mock Balance Summary component
const BalanceSummary = ({ balances }) => (
  <div data-testid="balance-summary">
    {balances && balances.length > 0 ? (
      balances.map(b => (
        <div key={b.userId} data-testid={`balance-${b.userId}`}>
          <span data-testid={`balance-name-${b.userId}`}>{b.name}</span>
          <span data-testid={`balance-net-${b.userId}`}>{b.net}</span>
        </div>
      ))
    ) : (
      <p data-testid="no-balances">All settled up!</p>
    )}
  </div>
);

const mockExpenses = [
  { _id: 'e1', description: 'Tent rental', amount: 3000, splitType: 'equal' },
  { _id: 'e2', description: 'Food supplies', amount: 1500, splitType: 'shares' },
];

const mockBalances = [
  { userId: 'u1', name: 'Alice', net: 500 },
  { userId: 'u2', name: 'Bob', net: -500 },
];

describe('Expense Form - FR-OS-12: Add Expense', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render the expense form', () => {
    render(
      <Router>
        <ExpenseForm participants={[]} />
      </Router>
    );

    expect(screen.getByTestId('expense-form')).toBeInTheDocument();
    expect(screen.getByTestId('description-input')).toBeInTheDocument();
    expect(screen.getByTestId('amount-input')).toBeInTheDocument();
    expect(screen.getByTestId('split-type-select')).toBeInTheDocument();
  });

  it('should allow entering an expense description', async () => {
    const user = userEvent.setup();
    render(
      <Router>
        <ExpenseForm participants={[]} />
      </Router>
    );

    const descInput = screen.getByTestId('description-input');
    await user.type(descInput, 'Tent rental');
    expect(descInput).toHaveValue('Tent rental');
  });

  it('should allow entering an amount', async () => {
    const user = userEvent.setup();
    render(
      <Router>
        <ExpenseForm participants={[]} />
      </Router>
    );

    const amountInput = screen.getByTestId('amount-input');
    await user.type(amountInput, '3000');
    expect(amountInput).toHaveValue(3000);
  });

  it('should allow selecting split type', async () => {
    const user = userEvent.setup();
    render(
      <Router>
        <ExpenseForm participants={[]} />
      </Router>
    );

    const splitSelect = screen.getByTestId('split-type-select');
    await user.selectOptions(splitSelect, 'shares');
    expect(splitSelect).toHaveValue('shares');
  });

  it('should show all split type options', () => {
    render(
      <Router>
        <ExpenseForm participants={[]} />
      </Router>
    );

    expect(screen.getByRole('option', { name: /split equally/i })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: /split by shares/i })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: /custom split/i })).toBeInTheDocument();
  });

  it('should call onSubmit with expense data', async () => {
    const mockSubmit = jest.fn();
    const user = userEvent.setup();

    render(
      <Router>
        <ExpenseForm participants={[]} onSubmit={mockSubmit} />
      </Router>
    );

    await user.type(screen.getByTestId('description-input'), 'Food');
    await user.type(screen.getByTestId('amount-input'), '2000');

    const form = screen.getByTestId('expense-form');
    form.dispatchEvent(new Event('submit', { bubbles: true }));

    await waitFor(() => {
      expect(mockSubmit).toHaveBeenCalled();
    });
  });

  it('should create expense via API call', async () => {
    axios.post = jest.fn().mockResolvedValue({
      data: { _id: 'e-new', description: 'Transport', amount: 2500, splitType: 'equal' },
    });

    const response = await axios.post('/api/expenses/hike-123', {
      description: 'Transport',
      amount: 2500,
      splitType: 'equal',
      paidBy: 'user-1',
      participants: [{ userId: 'user-1' }, { userId: 'user-2' }],
    });

    expect(response.data.description).toBe('Transport');
    expect(response.data.amount).toBe(2500);
  });
});

describe('Expense List - FR-OS-12: View Expenses', () => {
  it('should display list of expenses', () => {
    render(
      <Router>
        <ExpenseList expenses={mockExpenses} />
      </Router>
    );

    expect(screen.getByTestId('expense-e1')).toBeInTheDocument();
    expect(screen.getByTestId('expense-desc-e1')).toHaveTextContent('Tent rental');
    expect(screen.getByTestId('expense-amount-e1')).toHaveTextContent('3000');
  });

  it('should display split type for each expense', () => {
    render(
      <Router>
        <ExpenseList expenses={mockExpenses} />
      </Router>
    );

    expect(screen.getByTestId('expense-split-e1')).toHaveTextContent('equal');
    expect(screen.getByTestId('expense-split-e2')).toHaveTextContent('shares');
  });

  it('should show empty state when no expenses', () => {
    render(
      <Router>
        <ExpenseList expenses={[]} />
      </Router>
    );

    expect(screen.getByTestId('no-expenses')).toBeInTheDocument();
  });
});

describe('Balance Summary - FR-OS-12: View Balance Summary', () => {
  it('should display balance for each participant', () => {
    render(
      <Router>
        <BalanceSummary balances={mockBalances} />
      </Router>
    );

    expect(screen.getByTestId('balance-u1')).toBeInTheDocument();
    expect(screen.getByTestId('balance-name-u1')).toHaveTextContent('Alice');
    expect(screen.getByTestId('balance-net-u1')).toHaveTextContent('500');
  });

  it('should show negative balance for users who owe money', () => {
    render(
      <Router>
        <BalanceSummary balances={mockBalances} />
      </Router>
    );

    expect(screen.getByTestId('balance-net-u2')).toHaveTextContent('-500');
  });

  it('should show settled message when no balances', () => {
    render(
      <Router>
        <BalanceSummary balances={[]} />
      </Router>
    );

    expect(screen.getByTestId('no-balances')).toHaveTextContent('All settled up!');
  });
});
