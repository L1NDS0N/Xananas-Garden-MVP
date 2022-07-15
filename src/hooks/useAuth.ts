import { useState, useEffect, useCallback } from 'react';
import { jwtDecode } from 'jwt-decode';

interface User {
  id: string;
  name: string;
  username: string;
  email: string;
  phone?: string;
  whatsapp?: string;
  avatar?: string;
  admin: boolean;
  role?: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

const AUTH_TOKEN_KEY = 'xananas_auth_token';

function readToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(AUTH_TOKEN_KEY);
}

function saveToken(token: string) {
  localStorage.setItem(AUTH_TOKEN_KEY, token);
}

function removeToken() {
  localStorage.removeItem(AUTH_TOKEN_KEY);
}

function decodeUserFromToken(token: string): User | null {
  try {
    const decoded = jwtDecode<Record<string, any>>(token);
    if (decoded.exp && decoded.exp * 1000 < Date.now()) {
      removeToken();
      return null;
    }
    return {
      id: decoded.id,
      name: decoded.name || '',
      username: decoded.username,
      email: decoded.email || '',
      phone: decoded.phone || '',
      whatsapp: decoded.whatsapp || '',
      avatar: decoded.avatar || '',
      admin: decoded.admin,
      role: decoded.role || (decoded.admin ? 'admin' : 'viewer'),
    };
  } catch {
    removeToken();
    return null;
  }
}

export function useAuth() {
  const [state, setState] = useState<AuthState>({
    user: null,
    token: null,
    isLoading: true,
    isAuthenticated: false,
  });

  useEffect(() => {
    const token = readToken();
    if (token) {
      const user = decodeUserFromToken(token);
      if (user) {
        setState({
          user,
          token,
          isLoading: false,
          isAuthenticated: true,
        });
        return;
      }
    }
    setState({ user: null, token: null, isLoading: false, isAuthenticated: false });
  }, []);

  const login = useCallback(async (username: string, password: string) => {
    const response = await fetch('/api/v1/users/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Login failed');
    }

    // Save to localStorage (reliable across navigations)
    saveToken(data.token);

    setState({
      user: data.user,
      token: data.token,
      isLoading: false,
      isAuthenticated: true,
    });

    return data.user;
  }, []);

  const logout = useCallback(() => {
    removeToken();
    setState({ user: null, token: null, isLoading: false, isAuthenticated: false });
    window.location.href = '/catalogo';
  }, []);

  return { ...state, login, logout };
}
