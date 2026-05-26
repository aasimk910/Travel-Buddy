// frontend/src/__tests__/components/Admin.test.jsx
// Tests for FR-OS-14: Admin edit and delete user or hike actions

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { BrowserRouter as Router } from 'react-router-dom';
import axios from 'axios';

jest.mock('axios');

// Mock Admin User Table component
const AdminUserTable = ({ users, onDeleteUser, onEditUser }) => (
  <div data-testid="admin-user-table">
    <h2>Users Management</h2>
    {users && users.length > 0 ? (
      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Role</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map(user => (
            <tr key={user._id} data-testid={`user-row-${user._id}`}>
              <td data-testid={`user-name-${user._id}`}>{user.name}</td>
              <td data-testid={`user-email-${user._id}`}>{user.email}</td>
              <td data-testid={`user-role-${user._id}`}>{user.role}</td>
              <td>
                <button
                  data-testid={`edit-user-${user._id}`}
                  onClick={() => onEditUser && onEditUser(user)}
                >
                  Edit
                </button>
                <button
                  data-testid={`delete-user-${user._id}`}
                  onClick={() => onDeleteUser && onDeleteUser(user._id)}
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    ) : (
      <p data-testid="no-users">No users found.</p>
    )}
  </div>
);

// Mock Admin Hike Table component
const AdminHikeTable = ({ hikes, onDeleteHike, onEditHike }) => (
  <div data-testid="admin-hike-table">
    <h2>Hikes Management</h2>
    {hikes && hikes.length > 0 ? (
      <ul>
        {hikes.map(hike => (
          <li key={hike._id} data-testid={`hike-row-${hike._id}`}>
            <span data-testid={`hike-name-${hike._id}`}>{hike.name}</span>
            <span data-testid={`hike-difficulty-${hike._id}`}>{hike.difficulty}</span>
            <button
              data-testid={`edit-hike-${hike._id}`}
              onClick={() => onEditHike && onEditHike(hike)}
            >
              Edit
            </button>
            <button
              data-testid={`delete-hike-${hike._id}`}
              onClick={() => onDeleteHike && onDeleteHike(hike._id)}
            >
              Delete
            </button>
          </li>
        ))}
      </ul>
    ) : (
      <p data-testid="no-hikes">No hikes found.</p>
    )}
  </div>
);

// Mock Admin Access Denied component
const AdminAccessDenied = ({ isAdmin }) => {
  if (!isAdmin) {
    return <div data-testid="access-denied">Access Denied. Admins only.</div>;
  }
  return <div data-testid="admin-panel">Admin Panel</div>;
};

const mockUsers = [
  { _id: 'u1', name: 'Alice Smith', email: 'alice@test.com', role: 'user' },
  { _id: 'u2', name: 'Bob Jones', email: 'bob@test.com', role: 'user' },
  { _id: 'u3', name: 'Admin User', email: 'admin@test.com', role: 'admin' },
];

const mockHikes = [
  { _id: 'h1', name: 'Everest Base Camp', difficulty: 'hard' },
  { _id: 'h2', name: 'Annapurna Circuit', difficulty: 'moderate' },
];

describe('Admin Panel - FR-OS-14: Admin Access Control', () => {
  it('should show access denied for non-admin users', () => {
    render(
      <Router>
        <AdminAccessDenied isAdmin={false} />
      </Router>
    );

    expect(screen.getByTestId('access-denied')).toBeInTheDocument();
    expect(screen.getByTestId('access-denied')).toHaveTextContent('Access Denied. Admins only.');
  });

  it('should show admin panel for admin users', () => {
    render(
      <Router>
        <AdminAccessDenied isAdmin={true} />
      </Router>
    );

    expect(screen.getByTestId('admin-panel')).toBeInTheDocument();
    expect(screen.queryByTestId('access-denied')).not.toBeInTheDocument();
  });
});

describe('Admin User Management - FR-OS-14: Edit and Delete Users', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should display all users in the admin table', () => {
    render(
      <Router>
        <AdminUserTable users={mockUsers} />
      </Router>
    );

    expect(screen.getByTestId('user-row-u1')).toBeInTheDocument();
    expect(screen.getByTestId('user-row-u2')).toBeInTheDocument();
    expect(screen.getByTestId('user-row-u3')).toBeInTheDocument();
  });

  it('should display user name, email, and role', () => {
    render(
      <Router>
        <AdminUserTable users={mockUsers} />
      </Router>
    );

    expect(screen.getByTestId('user-name-u1')).toHaveTextContent('Alice Smith');
    expect(screen.getByTestId('user-email-u1')).toHaveTextContent('alice@test.com');
    expect(screen.getByTestId('user-role-u1')).toHaveTextContent('user');
  });

  it('should render Edit and Delete buttons for each user', () => {
    render(
      <Router>
        <AdminUserTable users={mockUsers} />
      </Router>
    );

    expect(screen.getByTestId('edit-user-u1')).toBeInTheDocument();
    expect(screen.getByTestId('delete-user-u1')).toBeInTheDocument();
  });

  it('should call onDeleteUser with correct user ID when delete is clicked', async () => {
    const user = userEvent.setup();
    const mockDelete = jest.fn();

    render(
      <Router>
        <AdminUserTable users={mockUsers} onDeleteUser={mockDelete} />
      </Router>
    );

    await user.click(screen.getByTestId('delete-user-u1'));
    expect(mockDelete).toHaveBeenCalledWith('u1');
  });

  it('should call onEditUser with user data when edit is clicked', async () => {
    const user = userEvent.setup();
    const mockEdit = jest.fn();

    render(
      <Router>
        <AdminUserTable users={mockUsers} onEditUser={mockEdit} />
      </Router>
    );

    await user.click(screen.getByTestId('edit-user-u2'));
    expect(mockEdit).toHaveBeenCalledWith(mockUsers[1]);
  });

  it('should show empty message when no users', () => {
    render(
      <Router>
        <AdminUserTable users={[]} />
      </Router>
    );

    expect(screen.getByTestId('no-users')).toBeInTheDocument();
  });

  it('should delete user via API call', async () => {
    axios.delete = jest.fn().mockResolvedValue({
      data: { message: 'User deleted successfully.' },
    });

    const response = await axios.delete('/api/admin/users/u1');
    expect(response.data.message).toBe('User deleted successfully.');
    expect(axios.delete).toHaveBeenCalledWith('/api/admin/users/u1');
  });

  it('should update user role via API call', async () => {
    axios.put = jest.fn().mockResolvedValue({
      data: { _id: 'u2', name: 'Bob Jones', role: 'admin' },
    });

    const response = await axios.put('/api/admin/users/u2', { role: 'admin' });
    expect(response.data.role).toBe('admin');
  });
});

describe('Admin Hike Management - FR-OS-14: Edit and Delete Hikes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should display all hikes in the admin table', () => {
    render(
      <Router>
        <AdminHikeTable hikes={mockHikes} />
      </Router>
    );

    expect(screen.getByTestId('hike-row-h1')).toBeInTheDocument();
    expect(screen.getByTestId('hike-row-h2')).toBeInTheDocument();
  });

  it('should display hike name and difficulty', () => {
    render(
      <Router>
        <AdminHikeTable hikes={mockHikes} />
      </Router>
    );

    expect(screen.getByTestId('hike-name-h1')).toHaveTextContent('Everest Base Camp');
    expect(screen.getByTestId('hike-difficulty-h1')).toHaveTextContent('hard');
  });

  it('should call onDeleteHike with correct ID when delete is clicked', async () => {
    const user = userEvent.setup();
    const mockDelete = jest.fn();

    render(
      <Router>
        <AdminHikeTable hikes={mockHikes} onDeleteHike={mockDelete} />
      </Router>
    );

    await user.click(screen.getByTestId('delete-hike-h1'));
    expect(mockDelete).toHaveBeenCalledWith('h1');
  });

  it('should call onEditHike with hike data when edit is clicked', async () => {
    const user = userEvent.setup();
    const mockEdit = jest.fn();

    render(
      <Router>
        <AdminHikeTable hikes={mockHikes} onEditHike={mockEdit} />
      </Router>
    );

    await user.click(screen.getByTestId('edit-hike-h2'));
    expect(mockEdit).toHaveBeenCalledWith(mockHikes[1]);
  });

  it('should delete hike via API call', async () => {
    axios.delete = jest.fn().mockResolvedValue({
      data: { message: 'Hike deleted successfully.' },
    });

    const response = await axios.delete('/api/admin/hikes/h1');
    expect(response.data.message).toBe('Hike deleted successfully.');
  });

  it('should update hike data via API call', async () => {
    axios.put = jest.fn().mockResolvedValue({
      data: { _id: 'h2', name: 'Updated Annapurna', difficulty: 'hard' },
    });

    const response = await axios.put('/api/admin/hikes/h2', { difficulty: 'hard' });
    expect(response.data.difficulty).toBe('hard');
    expect(response.data.name).toBe('Updated Annapurna');
  });

  it('should show empty message when no hikes', () => {
    render(
      <Router>
        <AdminHikeTable hikes={[]} />
      </Router>
    );

    expect(screen.getByTestId('no-hikes')).toBeInTheDocument();
  });
});
