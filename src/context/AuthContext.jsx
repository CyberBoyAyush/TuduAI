/**
 * File: AuthContext.jsx
 * Purpose: Stores and provides auth state (currentUser, login, logout)
 */
import { createContext, useState, useContext, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import authService from '../api/authService'

// Create the context
const AuthContext = createContext(null)

// Custom hook to use the auth context
export const useAuth = () => useContext(AuthContext)

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const authCheckCompleted = useRef(false)
  const navigate = useNavigate()

  // Initialize auth state from Appwrite once
  useEffect(() => {
    // Prevent multiple auth checks during development with React StrictMode
    if (authCheckCompleted.current) return;
    
    const checkAuth = async () => {
      try {
        setLoading(true);
        const user = await authService.getCurrentUser();
        if (user) {
          setCurrentUser(user);
        }
      } catch (error) {
        console.error("Auth check error:", error);
      } finally {
        setLoading(false);
        authCheckCompleted.current = true;
      }
    };

    checkAuth();
  }, []);

  // Login function
  const login = async (email, password) => {
    try {
      setLoading(true);
      await authService.login(email, password);
      const user = await authService.getCurrentUser();
      setCurrentUser(user);
      navigate('/todo');
      return { success: true };
    } catch (error) {
      console.error("Login error:", error);
      return {
        success: false,
        message: error.message || 'Invalid email or password'
      };
    } finally {
      setLoading(false);
    }
  };

  // Register function
  const register = async (name, email, password) => {
    try {
      setLoading(true);
      await authService.register(email, password, name);
      const user = await authService.getCurrentUser();
      setCurrentUser(user);
      
      // The WorkspaceContext will handle creating the default workspace
      // We don't need to explicitly create it here
      
      navigate('/todo');
      return { success: true };
    } catch (error) {
      console.error("Register error:", error);
      return {
        success: false,
        message: error.message || 'Registration failed'
      };
    } finally {
      setLoading(false);
    }
  };

  // Logout function
  const logout = async () => {
    try {
      setLoading(true);
      await authService.logout();
      setCurrentUser(null);
      navigate('/login');
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      setLoading(false);
    }
  };

  const value = {
    currentUser,
    loading,
    login,
    register,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
