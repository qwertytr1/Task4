import { User } from './interfaces';

// utils/fetchUsers.ts

const fetchUsersData = async (userToken: string) => {
  if (!userToken) {
    throw new Error('User token is required');
  }

  try {
    const response = await fetch(
      'https://task4-server-qwertytr1s-projects.vercel.app/users',
      {
        headers: {
          Authorization: `Bearer ${userToken}`,
        },
      },
    );

    if (!response.ok) {
      throw new Error('Failed to fetch users');
    }

    const data: User[] = await response.json();
    return data; // Return the raw user data
  } catch (error) {
    console.error(error);
    throw new Error('Error fetching users. Please try again later.');
  }
};

export default fetchUsersData;
