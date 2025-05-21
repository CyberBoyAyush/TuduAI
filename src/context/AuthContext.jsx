/**
 * File: AuthContext.jsx
 * Purpose: Stores and provides auth state (currentUser, login, logout)
 */
import { createContext, useState, useContext, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import authService from '../api/authService'
import workspaceService from '../api/workspaceService'

// Create the context
const AuthContext = createContext(null)

// Custom hook to use the auth context
export const useAuth = () => useContext(AuthContext)

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  // Initialize auth state from Appwrite
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const user = await authService.getCurrentUser();
        if (user) {
          setCurrentUser(user);
        }
      } catch (error) {
        console.error("Auth check error:", error);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  // Login function
  const login = async (email, password) => {
    try {
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
    }
  };

  // Register function
  const register = async (name, email, password) => {
    try {
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
    }
  };

  // Logout function
  const logout = async () => {
    try {
      await authService.logout();
      setCurrentUser(null);
      navigate('/login');
    } catch (error) {
      console.error("Logout error:", error);
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
