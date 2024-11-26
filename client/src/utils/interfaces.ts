import { ReactNode } from 'react';

export interface User {
  tokenMatch: ReactNode;
  id: number;
  name: string;
  email: string;
  lastLogin: string | null;
  activity: number[];
  status: 'active' | 'blocked';
  token?: string;
}
export interface UserType {
  tokenMatch?: ReactNode;
  id?: number;
  name?: string;
  email?: string;
  lastLogin?: string | null;
  activity?: number[];
  status?: 'active' | 'blocked';
  token?: string;
}
export interface AuthContextType {
  isAuthenticated: boolean;
  login: (token: string) => void; // login использует token
  logout: () => void;
}

export interface AuthProviderProps {
  children: ReactNode;
}
