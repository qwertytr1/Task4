import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthProvider/AuthProvider';
import './index.css';

interface User {
  id: number;
  name: string;
  email: string;
  lastLogin: string | null;
  activity: number[];
  status: 'active' | 'blocked';
  token?: string;
}

const Home: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [selectAll, setSelectAll] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [deletingIds, setDeletingIds] = useState<number[]>([]);
  const currentUserId = 1;
  const navigate = useNavigate();
  const { logout } = useAuth();

  const fetchUsers = useCallback(async () => {
    const token = localStorage.getItem('authToken');
    try {
      const response = await fetch('http://localhost:8081/users', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) {
        if (response.status === 401) {
          alert('Unauthorized. Please log in again.');
          navigate('/login');
          return;
        }
        throw new Error(`Error: ${response.status}`);
      }
      const data = await response.json();
      setUsers(data);
    } catch (error) {
      console.error('Fetch error:', error);
      alert('Error fetching users. Please try again later.');
    }
  }, [navigate]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const sortUsers = (
    usersList: User[],
    criteria: 'lastLogin',
    ascending = true,
  ): User[] => {
    const parseDate = (value: string | null | 'Never'): number => {
      if (value === 'Never' || value === null) return 0;
      const date = new Date(value);
      return Number.isNaN(date.getTime()) ? 0 : date.getTime();
    };

    return [...usersList].sort((a, b) => {
      const valueA = parseDate(a[criteria]);
      const valueB = parseDate(b[criteria]);
      if (valueA < valueB) return ascending ? -1 : 1;
      if (valueA > valueB) return ascending ? 1 : -1;
      return 0;
    });
  };

  const handleDelete = async () => {
    try {
      const response = await fetch('http://localhost:8081/users/delete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('authToken')}`,
        },
        body: JSON.stringify({ ids: deletingIds }),
      });

      if (!response.ok) {
        const { status } = response;
        if (status === 401) {
          alert('Unauthorized. Please log in again.');
          handleLogout();
        } else if (status === 403) {
          alert('You are not authorized to perform this action.');
        } else {
          throw new Error('Failed to delete users.');
        }
        return;
      }

      const responseData = await response.json();
      if (
        responseData.message &&
        responseData.message === 'Your account has been deleted.'
      ) {
        alert('Your account has been deleted. Redirecting to login...');
        handleLogout();
        return;
      }

      const updatedUsers = users.filter(
        (user) => !deletingIds.includes(user.id),
      );
      setUsers(updatedUsers);
      setSelectedIds([]);
      setSelectAll(false);
      setShowModal(false);
      alert(responseData.message || 'Selected users have been deleted.');
    } catch (error) {
      alert('Failed to delete users. Please try again.');
    }
  };

  const openDeleteModal = () => {
    if (selectedIds.length === 0) {
      alert('No users selected for deletion.');
      return;
    }
    setDeletingIds(selectedIds);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setDeletingIds([]);
  };

  const handleBlockUsers = async () => {
    const authToken = localStorage.getItem('authToken');
    if (!authToken) {
      alert('You must be logged in to block users.');
      navigate('/login');
      return;
    }

    try {
      const response = await fetch('http://localhost:8081/users/block', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ids: selectedIds,
          token: authToken,
        }),
      });

      const result = await response.json();

      if (
        result.message.includes('You have been blocked') ||
        result.message.includes('You cannot block your own account')
      ) {
        alert(result.message);
        localStorage.removeItem('authToken');
        navigate('/login');
        return;
      }

      setUsers((prevUsers) => {
        const updatedUsers = prevUsers.map((user) => {
          if (selectedIds.includes(user.id)) {
            return { ...user, status: 'blocked' as const };
          }
          return user;
        });
        return updatedUsers;
      });

      setSelectedIds([]);
      alert('Selected users have been blocked.');
    } catch (error) {
      alert('Failed to block users. Please try again.');
    }
  };

  const handleUnblockUsers = async () => {
    try {
      const response = await fetch('http://localhost:8081/users/unblock', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ids: selectedIds }),
      });

      if (!response.ok) throw new Error('Failed to unblock users.');

      alert('Selected users have been unblocked.');
      fetchUsers();
    } catch (error) {
      alert('Failed to unblock users. Please try again.');
    }
  };

  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedIds([]);
    } else {
      setSelectedIds(users.map((u) => u.id));
    }
    setSelectAll(!selectAll);
  };

  const handleCheckboxChange = (id: number) => {
    const updatedSelectedIds = selectedIds.includes(id)
      ? selectedIds.filter((userId) => userId !== id)
      : [...selectedIds, id];
    setSelectedIds(updatedSelectedIds);
    setSelectAll(updatedSelectedIds.length === users.length);
  };

  const sortedUsers = sortUsers(users, 'lastLogin', false);

  return (
    <div className="container mt-4">
      <h1>User Table</h1>

      <div className="logout-container">
        <button type="button" onClick={handleLogout}>
          Logout
        </button>
      </div>

      <div className="toolbar mb-4">
        <button
          type="button"
          className="btn btn-primary me-3"
          onClick={handleBlockUsers}
        >
          Block
        </button>
        <button
          type="button"
          className="btn btn-outline-secondary me-3"
          onClick={handleUnblockUsers}
          aria-label="Select all users"
        >
          <i className="bi bi-unlock" />
        </button>
        <button
          type="button"
          className="btn btn-outline-danger"
          onClick={openDeleteModal}
          aria-label="Select all users"
        >
          <i className="bi bi-trash" />
        </button>
      </div>

      <table className="table table-striped table-bordered">
        <thead>
          <tr>
            <th>
              <input
                type="checkbox"
                checked={selectAll}
                onChange={handleSelectAll}
                aria-label="Select all users"
              />
            </th>
            <th>ID</th>
            <th>Name</th>
            <th>Email</th>
            <th>Last Login</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {sortedUsers.map((user) => (
            <tr
              key={user.id}
              style={{
                backgroundColor: user.id === currentUserId ? '#f0f8ff' : '',
              }}
            >
              <td>
                <input
                  type="checkbox"
                  checked={selectedIds.includes(user.id)}
                  onChange={() => handleCheckboxChange(user.id)}
                  aria-label={`Select user with ID ${user.id}`}
                />
              </td>
              <td>{user.id}</td>
              <td>{user.name}</td>
              <td>{user.email}</td>
              <td>{user.lastLogin}</td>
              <td>{user.status === 'active' ? 'Active' : 'Blocked'}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {showModal && (
        <div className="modal show d-block" tabIndex={-1} role="dialog">
          <div className="modal-dialog" role="document">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Confirm Deletion</h5>
              </div>
              <div className="modal-body">
                <p>
                  Are you sure you want to delete{' '}
                  <strong>{deletingIds.length}</strong> users?
                </p>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={closeModal}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-danger"
                  onClick={handleDelete}
                >
                  Confirm
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Home;
