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
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [userToken, setUserToken] = useState<string | null>(null);
  // Получаем данные пользователя из localStorage

  useEffect(() => {
    const token = localStorage.getItem('authToken');
    setUserToken(token); // Set token state
  }, []);

  const fetchUsers = useCallback(async () => {
    if (!userToken) return; // Prevent fetch if no token

    try {
      const response = await fetch('http://localhost:8081/users', {
        headers: {
          Authorization: `Bearer ${userToken}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch users');
      }

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
      console.error(error);
      alert('Error fetching users. Please try again later.');
    }
  }, [userToken]); // Only recreate fetchUsers when userToken changes

  useEffect(() => {
    fetchUsers(); // Call fetchUsers when component mounts or userToken changes
  }, [fetchUsers]); // Dependency array to call it when fetchUsers changes

  const handleLogout = useCallback(() => {
    logout();
    localStorage.removeItem('userData'); // Удаляем данные пользователя из localStorage
    navigate('/login');
  }, [logout, navigate]);

  const handleUnblockUsers = async () => {
    try {
      const response = await fetch('http://localhost:8081/users/unblock', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${userToken}`,
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

  const handleDelete = useCallback(async () => {
    const usersData = JSON.parse(localStorage.getItem('usersData') || '[]');
    try {
      const response = await fetch('http://localhost:8081/users/delete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${userToken}`,
        },
        body: JSON.stringify({ ids: selectedIds }),
      });

      if (!response.ok) {
        throw new Error('Failed to delete users');
      }

      const result = await response.json();
      alert(result.message);

      const updatedUsers = usersData.filter(
        (user: any) => !selectedIds.includes(user.id),
      );
      localStorage.setItem('usersData', JSON.stringify(updatedUsers));
      setUsers(updatedUsers);
      setSelectedIds([]);
    } catch (error) {
      console.error(error);
      alert('Failed to delete users. Please try again.');
    }
  }, [selectedIds, userToken]);

  const openDeleteModal = useCallback(() => {
    if (selectedIds.length === 0) {
      alert('No users selected for deletion.');
      return;
    }
    setDeletingIds(selectedIds);
    setShowModal(true);
  }, [selectedIds]);

  const closeModal = useCallback(() => {
    setShowModal(false);
    setDeletingIds([]);
  }, []);

  const handleBlockUsers = useCallback(async () => {
    const usersData = JSON.parse(localStorage.getItem('usersData') || '[]');

    // Collect tokens of the selected users
    const selectedUserTokens = selectedIds.map(
      (id) => usersData.find((user: any) => user.id === id)?.token,
    );

    try {
      const response = await fetch('http://localhost:8081/users/block', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${userToken}`,
        },
        body: JSON.stringify({ ids: selectedIds, tokens: selectedUserTokens }),
      });

      if (!response.ok) {
        throw new Error('Failed to block users');
      }

      const result = await response.json();
      alert(result.message);

      // Update the users list with the one returned from the backend
      const updatedUsers = result.users; // Use the updated list from the backend response

      // Store the updated user data
      localStorage.setItem('usersData', JSON.stringify(updatedUsers));

      // Update the state with the updated user list
      setUsers(updatedUsers);
      setSelectedIds([]); // Clear the selected users
    } catch (error) {
      console.error(error);
      alert('Failed to block users. Please try again.');
    }
  }, [selectedIds, userToken]);

  const handleSelectAll = useCallback(() => {
    if (selectAll) {
      setSelectedIds([]);
    } else {
      setSelectedIds(users.map((u) => u.id));
    }
    setSelectAll(!selectAll);
  }, [selectAll, users]);

  const handleCheckboxChange = useCallback(
    (id: number) => {
      const updatedSelectedIds = selectedIds.includes(id)
        ? selectedIds.filter((userId) => userId !== id)
        : [...selectedIds, id];
      setSelectedIds(updatedSelectedIds);
      setSelectAll(updatedSelectedIds.length === users.length);
    },
    [selectedIds, users.length],
  );

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
        >
          Unblock
        </button>
        <button
          type="button"
          className="btn btn-outline-danger"
          onClick={openDeleteModal}
        >
          Delete
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
                aria-label="Select user with ID"
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
          {users.map((user) => (
            <tr
              key={user.id}
              style={
                {
                  // backgroundColor: user.id ===  ? '#f0f8ff' : '',
                }
              }
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
              <td>{user.lastLogin || 'N/A'}</td>
              <td>{user.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {showModal && (
        <div className="modal d-block" tabIndex={-1} aria-hidden="true">
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Delete User(s)</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={closeModal}
                  aria-label="Close"
                />
              </div>
              <div className="modal-body">
                <p>Are you sure you want to delete the selected users?</p>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={closeModal}
                >
                  Close
                </button>
                <button
                  type="button"
                  className="btn btn-danger"
                  onClick={handleDelete}
                >
                  Delete
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
