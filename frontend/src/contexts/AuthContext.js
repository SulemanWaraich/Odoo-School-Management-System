import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const API_URL = process.env.REACT_APP_BACKEND_URL;

// Configure axios defaults - NO withCredentials, use Authorization header instead
axios.defaults.withCredentials = false;

// Axios interceptor to add Authorization header to all requests
axios.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Axios interceptor to handle 401 responses
axios.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Try to refresh token
      const refreshToken = localStorage.getItem('refresh_token');
      if (refreshToken && !error.config._retry) {
        error.config._retry = true;
        try {
          const response = await axios.post(`${API_URL}/api/auth/refresh`, {
            refresh_token: refreshToken
          });
          if (response.data.access_token) {
            localStorage.setItem('access_token', response.data.access_token);
            error.config.headers.Authorization = `Bearer ${response.data.access_token}`;
            return axios(error.config);
          }
        } catch (refreshError) {
          // Refresh failed, clear tokens
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
        }
      }
    }
    return Promise.reject(error);
  }
);

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const checkAuth = useCallback(async () => {
    // CRITICAL: Skip auth check if returning from OAuth callback
    if (window.location.hash?.includes('session_id=')) {
      setLoading(false);
      return;
    }

    const token = localStorage.getItem('access_token');
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      const response = await axios.get(`${API_URL}/api/auth/me`);
      setUser(response.data);
    } catch (error) {
      // Token invalid, clear storage
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const login = async (email, password) => {
    const response = await axios.post(`${API_URL}/api/auth/login`, { email, password });
    
    // Store tokens if returned in response body
    if (response.data.access_token) {
      localStorage.setItem('access_token', response.data.access_token);
    }
    if (response.data.refresh_token) {
      localStorage.setItem('refresh_token', response.data.refresh_token);
    }
    
    setUser(response.data);
    return response.data;
  };

  const register = async (email, password, name, role) => {
    const response = await axios.post(`${API_URL}/api/auth/register`, { email, password, name, role });
    
    // Store tokens if returned in response body
    if (response.data.access_token) {
      localStorage.setItem('access_token', response.data.access_token);
    }
    if (response.data.refresh_token) {
      localStorage.setItem('refresh_token', response.data.refresh_token);
    }
    
    setUser(response.data);
    return response.data;
  };

  const logout = async () => {
    try {
      await axios.post(`${API_URL}/api/auth/logout`, {});
    } catch (error) {
      console.error('Logout error:', error);
    }
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    setUser(null);
  };

  const loginWithGoogle = () => {
    const redirectUrl = window.location.origin + '/auth/callback';
    window.location.href = `https://auth.emergentagent.com/?redirect=${encodeURIComponent(redirectUrl)}`;
  };

  const handleOAuthCallback = async (sessionId) => {
    const response = await axios.post(`${API_URL}/api/auth/session`, { session_id: sessionId });
    
    if (response.data.access_token) {
      localStorage.setItem('access_token', response.data.access_token);
    }
    if (response.data.refresh_token) {
      localStorage.setItem('refresh_token', response.data.refresh_token);
    }
    
    setUser(response.data);
    return response.data;
  };

  // Add this function inside your AuthContext provider
const setUserFromTokens = async (accessToken) => {
  const response = await axios.get('/api/auth/me', {
    headers: { Authorization: `Bearer ${accessToken}` }
  });
  setUser(response.data); // update the user state in context
  return response.data;
};

// Make sure to expose it in the context value:
// value={{ user, login, logout, setUserFromTokens, ... }}

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    loginWithGoogle,
    handleOAuthCallback,
    refreshAuth: checkAuth,
    setUserFromTokens
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
