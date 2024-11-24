import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './index.css';

type User = {
  id: number;
  name: string;
  email: string;
  status: 'active' | 'blocked';
  lastLogin: string | null | 'Never';
  activity: number[];
};

const Home: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [selectAll, setSelectAll] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [deletingIds, setDeletingIds] = useState<number[]>([]);
  const currentUserId = 1;
  const navigate = useNavigate();

  const fetchUsers = async () => {
    try {
      const response = await fetch('http://localhost:8081/users');
      const data: User[] = await response.json();

      const formattedData = data.map((user) => {
        let lastLogin = 'Never';
        if (user.lastLogin) {
          const date = new Date(user.lastLogin);
          if (!Number.isNaN(date.getTime())) {
            lastLogin = date.toLocaleString();
          }
        }

        return {
          ...user,
          lastLogin,
        };
      });

      setUsers(formattedData);
    } catch (error) {
      alert('Error fetching users. Please try again later.');
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const sortUsers = (
    usersList: User[],
    criteria: 'lastLogin',
    ascending = true,
  ): User[] => {
    const parseDate = (value: string | null | 'Never'): number => {
      if (value === 'Never' || value === null) {
        return 0; // Если 'Never' или null, считаем их минимальными
      }
      const date = new Date(value);
      return Number.isNaN(date.getTime()) ? 0 : date.getTime(); // Используем Number.isNaN
    };

    return [...usersList].sort((a, b) => {
      const valueA = parseDate(a[criteria]);
      const valueB = parseDate(b[criteria]);

      // Сравниваем значения
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
        },
        body: JSON.stringify({ ids: deletingIds }),
      });

      if (!response.ok) {
        throw new Error('Failed to delete users.');
      }

      if (deletingIds.includes(currentUserId)) {
        alert('Your account has been deleted. Redirecting to login...');
        localStorage.removeItem('authToken');
        navigate('/login');
        return;
      }

      const updatedUsers = users.filter(
        (user) => !deletingIds.includes(user.id),
      );
      setUsers(updatedUsers);

      setSelectedIds([]);
      setSelectAll(false);
      setShowModal(false);

      alert('Selected users have been deleted.');
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
    const isCurrentUserSelected = selectedIds.includes(currentUserId);
    if (isCurrentUserSelected) {
      alert('You cannot block your own account. You will be logged out.');
      setSelectedIds(selectedIds.filter((id) => id !== currentUserId));
      localStorage.removeItem('authToken');
      navigate('/login');
      return;
    }

    try {
      const response = await fetch('http://localhost:8081/users/block', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ids: selectedIds }),
      });

      if (!response.ok) {
        throw new Error('Failed to block users.');
      }

      const updatedUsers = users.map((user) =>
        selectedIds.includes(user.id)
          ? { ...user, status: 'blocked' as const }
          : user,
      );
      setUsers(updatedUsers);

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

      if (!response.ok) {
        throw new Error('Failed to unblock users.');
      }

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

      {/* Toolbar */}
      <div className="toolbar mb-4">
        <div className="d-flex justify-content-start mb-3">
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
            aria-label="Unblock users"
          >
            <i className="bi bi-unlock" />
          </button>
          <button
            type="button"
            className="btn btn-outline-danger"
            onClick={openDeleteModal}
            aria-label="Delete users"
          >
            <i className="bi bi-trash" />
          </button>
        </div>
      </div>

      {/* Table */}
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
            <tr key={user.id}>
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

      {/* Modal */}
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
