import React, { createContext, useState, useEffect, useContext } from 'react';
import { authAPI, storeAuthToken, getAuthToken, clearAuthToken } from '../api/api';

// Create the Auth Context
const AuthContext = createContext(null);

// Auth Provider component
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Check for existing session on app start
  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        setLoading(true);
        const userData = await authAPI.getCurrentUser();
        if (userData && userData.id) {
          setUser(userData);
        }
      } catch (error) {
        console.log('Not authenticated:', error.message);
        // Not setting error here as this is just a session check
      } finally {
        setLoading(false);
      }
    };

    checkAuthStatus();
  }, []);

  // Login function
  const login = async (username, password) => {
    try {
      setLoading(true);
      setError(null);
      
      const userData = await authAPI.login(username, password);
      
      if (userData && userData.id) {
        setUser(userData);
        return true;
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (error) {
      setError(error.message || 'Login failed');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Register function
  const register = async (registerData) => {
    try {
      setLoading(true);
      setError(null);
      
      const userData = await authAPI.register(registerData);
      
      if (userData && userData.id) {
        setUser(userData);
        return true;
      } else {
        throw new Error('Registration failed');
      }
    } catch (error) {
      setError(error.message || 'Registration failed');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Logout function
  const logout = async () => {
    try {
      setLoading(true);
      await authAPI.logout();
      await clearAuthToken();
      setUser(null);
      return true;
    } catch (error) {
      setError(error.message || 'Logout failed');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Context value
  const value = {
    user,
    loading,
    error,
    login,
    logout,
    register,
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// Custom hook to use the auth context
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === null) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}