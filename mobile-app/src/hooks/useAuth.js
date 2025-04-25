import React, { createContext, useState, useContext, useEffect } from 'react';
import { Alert } from 'react-native';
import { authAPI } from '../api/api';

// Create an authentication context
const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load user on app start
  useEffect(() => {
    async function loadUser() {
      try {
        setLoading(true);
        const userData = await authAPI.getCurrentUser();
        setUser(userData);
      } catch (err) {
        // This might be normal if user is not logged in
        console.log('Not logged in:', err.message);
      } finally {
        setLoading(false);
      }
    }

    loadUser();
  }, []);

  // Login function
  const login = async (username, password) => {
    try {
      setLoading(true);
      setError(null);
      
      const userData = await authAPI.login({ username, password });
      setUser(userData);
      
      return userData;
    } catch (err) {
      setError(err.message);
      Alert.alert('Login Failed', err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Register function
  const register = async (userData) => {
    try {
      setLoading(true);
      setError(null);
      
      const newUser = await authAPI.register(userData);
      setUser(newUser);
      
      return newUser;
    } catch (err) {
      setError(err.message);
      Alert.alert('Registration Failed', err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Logout function
  const logout = async () => {
    try {
      setLoading(true);
      await authAPI.logout();
      setUser(null);
    } catch (err) {
      console.error('Logout error:', err);
      // Still clear user even if API fails
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  // Update user profile
  const updateProfile = async (profileData) => {
    try {
      setLoading(true);
      setError(null);
      
      // Assuming updateProfile endpoint exists
      const updatedUser = await authAPI.updateProfile(profileData);
      setUser(updatedUser);
      
      return updatedUser;
    } catch (err) {
      setError(err.message);
      Alert.alert('Update Failed', err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Provide auth context
  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        error,
        login,
        register,
        logout,
        updateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// Custom hook to use the auth context
export function useAuth() {
  const context = useContext(AuthContext);
  
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
}