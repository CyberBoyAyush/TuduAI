/**
 * File: App.jsx
 * Purpose: Root layout with Navbar and <Routes />
 */
import { useState, useEffect } from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import Navbar from "./components/Navbar";
import ReminderService from "./components/ReminderService";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ResetPassword from "./pages/ResetPassword";
import AuthCallback from "./pages/AuthCallback";
import EmailVerification from "./pages/EmailVerification";
import Todo from "./pages/Todo";
import WeeklyInsights from "./pages/WeeklyInsights";
import WorkspaceSettings from "./pages/WorkspaceSettings";
import { AuthProvider } from "./context/AuthContext";
import { WorkspaceProvider } from "./context/WorkspaceContext";
import { TaskProvider } from "./context/TaskContext";
import { ReminderProvider } from "./context/ReminderContext";
import ProtectedRoute from "./components/ProtectedRoute";
import { Toaster } from "react-hot-toast";

function App() {
  const location = useLocation();
  const [theme, setTheme] = useState(() => {
    // Check if theme is stored in localStorage
    const savedTheme = localStorage.getItem("theme");
    // Check if OS prefers dark mode
    const prefersDark = window.matchMedia(
      "(prefers-color-scheme: dark)"
    ).matches;

    return savedTheme || (prefersDark ? "dark" : "light");
  });
  const [showCompletedTasks, setShowCompletedTasks] = useState(false);

  // Apply the theme when it changes
  useEffect(() => {
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    localStorage.setItem("theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prevTheme) => (prevTheme === "dark" ? "light" : "dark"));
  };

  const toggleShowCompletedTasks = () => {
    setShowCompletedTasks((prevState) => !prevState);
  };

  return (
    <AuthProvider>
      {/* Show app content */}
      <WorkspaceProvider>
        <TaskProvider>
          <ReminderProvider>
            <div className="min-h-screen flex flex-col">
              <Navbar
                toggleTheme={toggleTheme}
                theme={theme}
                showCompletedTasks={showCompletedTasks}
                toggleShowCompletedTasks={toggleShowCompletedTasks}
              />
              <ReminderService />
              <Toaster
                position="top-right"
                toastOptions={{
                  // Ensure toasts are visible during transitions
                  style: {
                    zIndex: 9999,
                  },
                  // Prevent duplicate toasts
                  duration: 4000,
                  // Remove toasts when navigating
                  success: {
                    duration: 4000,
                  },
                  error: {
                    duration: 5000,
                  },
                }}
                // Only show one toast at a time for the same type
                containerStyle={{
                  top: 20,
                  right: 20,
                }}
              />
              <main className="flex-grow container mx-auto px-4 py-8">
                <AnimatePresence mode="wait">
                  <Routes location={location} key={location.pathname}>
                    <Route path="/" element={<Home />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />
                    <Route path="/reset-password" element={<ResetPassword />} />
                    <Route path="/auth/callback" element={<AuthCallback />} />
                    <Route path="/verify-email" element={<EmailVerification />} />
                    <Route
                      path="/todo"
                      element={
                        <ProtectedRoute>
                          <Todo showCompletedTasks={showCompletedTasks} />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/insights"
                      element={
                        <ProtectedRoute>
                          <WeeklyInsights />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/workspace/:workspaceId/settings"
                      element={
                        <ProtectedRoute>
                          <WorkspaceSettings />
                        </ProtectedRoute>
                      }
                    />
                    <Route path="*" element={<Navigate to="/" replace />} />
                  </Routes>
                </AnimatePresence>
              </main>
            </div>
          </ReminderProvider>
        </TaskProvider>
      </WorkspaceProvider>
    </AuthProvider>
  );
}

export default App;
