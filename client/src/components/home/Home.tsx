import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import fetchUsersData from '../../utils/fetchUsers';
import { User } from '../../utils/interfaces';
import { useAuth } from '../AuthProvider/AuthProvider';
import './index.css';

const Home: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [selectAll, setSelectAll] = useState(false);
  const [selectedUsersData, setSelectedUsersData] = useState<User[]>([]); // Состояние для выбранных пользователей
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [userToken, setUserToken] = useState<string | null>(null);
  const [dataUser, setDataUser] = useState<User | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('authToken');
    const userData = localStorage.getItem('userData');
    if (token) {
      setUserToken(token);
    }
    if (userData) {
      setDataUser(JSON.parse(userData));
    }
  }, []);

  const fetchUsers = useCallback(async () => {
    if (!userToken) return;

    try {
      const data = await fetchUsersData(userToken);

      const formattedData = data.map((user: any) => {
        let lastLogin = 'Never';
        if (user.lastLogin) {
          const date = new Date(user.lastLogin);
          if (!Number.isNaN(date.getTime())) {
            lastLogin = date.toLocaleString();
          }
        }

        return { ...user, lastLogin };
      });

      setUsers(formattedData);
    } catch (error) {
      console.error(error);
    }
  }, [userToken]);

  useEffect(() => {
    if (userToken) {
      fetchUsers();
    }
  }, [fetchUsers, userToken]);

  const handleLogout = useCallback(() => {
    logout();
    localStorage.removeItem('userData');
    navigate('/login');
  }, [logout, navigate]);

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

      const updatedSelectedUsersData = updatedSelectedIds
        .map((userId) => users.find((user) => user.id === userId))
        .filter((user): user is User => user !== undefined);

      setSelectedUsersData(updatedSelectedUsersData);
    },
    [selectedIds, users],
  );

  const handleBlockUsers = useCallback(async () => {
    const userEmail = dataUser?.email;

    if (!userEmail) {
      return;
    }

    try {
      const emailsToBlock = selectedUsersData.map((user) => user.email);

      if (emailsToBlock.includes(userEmail)) {
        const response = await fetch(
          'https://task4-server-me06ks0dh-qwertytr1s-projects.vercel.app/block',
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${userToken}`,
            },
            body: JSON.stringify({ emails: emailsToBlock }),
          },
        );

        if (!response.ok) {
          throw new Error('Failed to block users');
        }

        const result = await response.json();
        alert(result.message);
        setUsers((prevUsers) =>
          prevUsers.map((user) =>
            emailsToBlock.includes(user.email)
              ? { ...user, status: 'blocked' }
              : user,
          ),
        );

        navigate('/login');
      } else {
        const response = await fetch(
          'https://task4-server-me06ks0dh-qwertytr1s-projects.vercel.app/block',
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${userToken}`,
            },
            body: JSON.stringify({ emails: emailsToBlock }),
          },
        );

        if (!response.ok) {
          throw new Error('Failed to block users');
        }

        const result = await response.json();
        alert(result.message);

        setUsers((prevUsers) =>
          prevUsers.map((user) =>
            emailsToBlock.includes(user.email)
              ? { ...user, status: 'blocked' }
              : user,
          ),
        );
      }
    } catch (error) {
      console.error('Error while blocking users:', error);
    }
  }, [selectedUsersData, navigate, dataUser, userToken]);

  const handleUnblockUsers = async () => {
    try {
      const response = await fetch(
        'https://task4-server-me06ks0dh-qwertytr1s-projects.vercel.app/unblock',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${userToken}`,
          },
          body: JSON.stringify({ ids: selectedIds }),
        },
      );

      if (!response.ok) {
        throw new Error('Failed to unblock users.');
      }

      setUsers((prevUsers) =>
        prevUsers.map((user) =>
          selectedIds.includes(user.id) ? { ...user, status: 'active' } : user,
        ),
      );

      fetchUsers();
    } catch (error) {
      alert('Failed to unblock users. Please try again.');
    }
  };

  const handleDelete = useCallback(async () => {
    const userEmail = dataUser?.email;
    const selectedUsersEmails = selectedIds
      .map((id) => users.find((user) => user.id === id)?.email)
      .filter((email): email is string => email !== undefined);

    const isCurrentUserDeleting = selectedUsersEmails.includes(userEmail || '');

    try {
      const response = await fetch(
        'https://task4-server-me06ks0dh-qwertytr1s-projects.vercel.app/delete',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${userToken}`,
          },
          body: JSON.stringify({ ids: selectedIds }),
        },
      );

      if (!response.ok) {
        throw new Error('Failed to delete users.');
      }

      const result = await response.json();
      alert(result.message);

      setUsers(result.users);
      setSelectedIds([]);
      setSelectAll(false);

      if (isCurrentUserDeleting) {
        handleLogout();
      }
    } catch (error) {
      console.error('Error while deleting users:', error);
    }
  }, [selectedIds, users, dataUser, userToken, handleLogout]);

  const sortUsers = (
    usersList: User[],
    criteria: 'lastLogin',
    ascending = true,
  ): User[] => {
    const parseDate = (value: string | null | 'Never'): number => {
      if (value === 'Never' || value === null) {
        return 0;
      }
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
          className="btn btn-outline-primary me-3"
          onClick={handleUnblockUsers}
          title="Unblock Users"
          aria-label="Unblock"
        >
          <i className="bi bi-unlock" />
        </button>
        <button
          type="button"
          className="btn btn-outline-danger"
          onClick={handleDelete}
          title="Delete Users"
          aria-label="Delete"
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
    </div>
  );
};

export default Home;
