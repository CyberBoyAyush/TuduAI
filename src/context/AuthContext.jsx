/**
 * File: AuthContext.jsx
 * Purpose: Stores and provides auth state (currentUser, login, logout)
 */
import { createContext, useState, useContext, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import authService from "../api/authService";

// Create the context
const AuthContext = createContext(null);

// Toast styling to match TuduAI theme
const toastStyles = {
  success: {
    style: {
      background: "#f2f0e3",
      color: "#202020",
      border: "1px solid #d8d6cf",
      padding: "16px",
      boxShadow: "0 4px 8px rgba(0, 0, 0, 0.05)",
    },
    iconTheme: {
      primary: "#f76f52",
      secondary: "#f2f0e3",
    },
    duration: 4000,
  },
  error: {
    style: {
      background: "#f2f0e3",
      color: "#202020",
      border: "1px solid #d8d6cf",
      padding: "16px",
      boxShadow: "0 4px 8px rgba(0, 0, 0, 0.05)",
    },
    iconTheme: {
      primary: "#ef4444",
      secondary: "#f2f0e3",
    },
    duration: 5000,
  },
  // Dark mode styles
  darkSuccess: {
    style: {
      background: "#202020",
      color: "#f2f0e3",
      border: "1px solid #3a3a3a",
      padding: "16px",
      boxShadow: "0 4px 8px rgba(0, 0, 0, 0.2)",
    },
    iconTheme: {
      primary: "#f76f52",
      secondary: "#202020",
    },
    duration: 4000,
  },
  darkError: {
    style: {
      background: "#202020",
      color: "#f2f0e3",
      border: "1px solid #3a3a3a",
      padding: "16px",
      boxShadow: "0 4px 8px rgba(0, 0, 0, 0.2)",
    },
    iconTheme: {
      primary: "#ef4444",
      secondary: "#202020",
    },
    duration: 5000,
  },
};

// Function to determine if dark mode is active
const isDarkMode = () => {
  if (typeof window === "undefined") return false;
  return document.documentElement.classList.contains("dark");
};

// Custom hook to use the auth context
export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [initializing, setInitializing] = useState(true); // Add this to differentiate initial load from operations
  const authCheckCompleted = useRef(false);
  const navigate = useNavigate();

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
        setInitializing(false); // Initial authentication check is complete
        authCheckCompleted.current = true;
      }
    };

    checkAuth();
  }, []);

  // Login function
  const login = async (email, password, toastId = null) => {
    try {
      setLoading(true);
      await authService.login(email, password);
      const user = await authService.getCurrentUser();
      setCurrentUser(user);

      // Dismiss any existing loading toast if provided
      if (toastId) {
        toast.dismiss(toastId);
      }

      // Show success toast with user's name or email
      // const userName = user.name || email.split("@")[0];
      // if (isDarkMode()) {
      //   toast.success(`Welcome back, ${userName}!`, toastStyles.darkSuccess);
      // } else {
      //   toast.success(`Welcome back, ${userName}!`, toastStyles.success);
      // }

      // Wait briefly to show success animation before redirecting
      navigate("/todo");
      return { success: true };
    } catch (error) {
      console.error("Login error:", error);

      // Dismiss any existing loading toast if provided
      if (toastId) {
        toast.dismiss(toastId);
      }

      // Show error toast with helpful message
      let errorMessage = "Invalid email or password";

      if (error.message) {
        // Check common error patterns
        if (error.message.includes("password")) {
          errorMessage = "Incorrect password. Please try again.";
        } else if (error.message.includes("find")) {
          errorMessage =
            "Account not found. Please check your email or sign up.";
        } else if (
          error.message.includes("network") ||
          error.message.includes("connect")
        ) {
          errorMessage = "Network error. Please check your connection.";
        } else {
          // Use the original error message if available
          errorMessage = error.message;
        }
      }

      if (isDarkMode()) {
        toast.error(errorMessage, toastStyles.darkError);
      } else {
        toast.error(errorMessage, toastStyles.error);
      }

      return {
        success: false,
        message: errorMessage,
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

      // Show success toast
      if (isDarkMode()) {
        toast.success(
          `Welcome to TuduAI, ${name || email.split("@")[0]}!`,
          toastStyles.darkSuccess
        );
      } else {
        toast.success(
          `Welcome to TuduAI, ${name || email.split("@")[0]}!`,
          toastStyles.success
        );
      }

      navigate("/todo");
      return { success: true };
    } catch (error) {
      console.error("Register error:", error);

      // Show error toast with helpful message
      let errorMessage = "Registration failed";

      if (error.message) {
        if (
          error.message.includes("already exists") ||
          error.message.includes("duplicate")
        ) {
          errorMessage = "An account with this email already exists.";
        } else if (
          error.message.includes("password") &&
          error.message.includes("weak")
        ) {
          errorMessage = "Please use a stronger password.";
        } else if (
          error.message.includes("network") ||
          error.message.includes("connect")
        ) {
          errorMessage = "Network error. Please check your connection.";
        } else if (error.message.includes("timeout")) {
          errorMessage = "Request timed out. Please try again.";
        } else {
          // Use the original error message if available
          errorMessage = error.message;
        }
      }

      if (isDarkMode()) {
        toast.error(errorMessage, toastStyles.darkError);
      } else {
        toast.error(errorMessage, toastStyles.error);
      }

      return {
        success: false,
        message: errorMessage,
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

      // Show a subtle logout notification
      if (isDarkMode()) {
        toast("You have been logged out", {
          ...toastStyles.darkSuccess,
        });
      } else {
        toast("You have been logged out", {
          ...toastStyles.success,
        });
      }

      navigate("/login");
    } catch (error) {
      console.error("Logout error:", error);

      if (isDarkMode()) {
        toast.error(
          "Error logging out. Please try again.",
          toastStyles.darkError
        );
      } else {
        toast.error("Error logging out. Please try again.", toastStyles.error);
      }
    } finally {
      setLoading(false);
    }
  };

  const value = {
    currentUser,
    loading,
    initializing, // Expose this state to consumers
    login,
    register,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {!initializing ? children : null}
    </AuthContext.Provider>
  );
};
