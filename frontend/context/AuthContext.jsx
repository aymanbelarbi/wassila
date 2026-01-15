import React, { createContext, useContext, useState, useEffect } from "react";
import { api } from "../services/api";
import { STORAGE_KEYS } from "../constants";

const AuthContext = createContext(undefined);

export function AuthProvider({ children }) {
  const [state, setState] = useState({
    user: null,
    isAuthenticated: false,
    isLoading: true,
  });

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem(STORAGE_KEYS.TOKEN);
      if (token) {
        try {
          const user = await api.get('/me');
          setState({
            user,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch (error) {
          localStorage.removeItem(STORAGE_KEYS.TOKEN);
          localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
          setState({ user: null, isAuthenticated: false, isLoading: false });
        }
      } else {
        setState({ user: null, isAuthenticated: false, isLoading: false });
      }
    };
    checkAuth();
  }, []);

  const login = async (email, password) => {
    const data = await api.post('/login', { email, password });
    localStorage.setItem(STORAGE_KEYS.TOKEN, data.access_token);
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(data.user));
    setState({
      user: data.user,
      isAuthenticated: true,
      isLoading: false,
    });
    return data;
  };

  const register = async (username, email, password) => {
    const data = await api.post('/register', { username, email, password });
    localStorage.setItem(STORAGE_KEYS.TOKEN, data.access_token);
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(data.user));
    setState({
      user: data.user,
      isAuthenticated: true,
      isLoading: false,
    });
    return data;
  };

  const logout = async () => {
    try {
      await api.post('/logout');
    } catch (e) {
      // Ignore logout errors
    } finally {
      localStorage.removeItem(STORAGE_KEYS.TOKEN);
      localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
      setState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
      });
    }
  };

  const updateProfile = async (profileData) => {
    const data = await api.put('/profile', profileData);
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(data.user));
    setState(prev => ({ ...prev, user: data.user }));
    return data;
  };

  const deleteAccount = async () => {
    await api.delete('/profile');
    localStorage.removeItem(STORAGE_KEYS.TOKEN);
    localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
    setState({
      user: null,
      isAuthenticated: false,
      isLoading: false,
    });
  };

  return (
    <AuthContext.Provider value={{ ...state, login, register, logout, updateProfile, deleteAccount }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
