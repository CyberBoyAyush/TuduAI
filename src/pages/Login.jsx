/**
 * File: Login.jsx
 * Purpose: User login page
 */
import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast"; // Add this import
import {
  AtSymbolIcon,
  LockClosedIcon,
  ArrowRightIcon,
  CheckCircleIcon,
  ClipboardDocumentListIcon,
  CheckBadgeIcon,
  EyeIcon,
  EyeSlashIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import authService from "../api/authService";

// Portal-based Modal Component
const ModalPortal = ({ children, isOpen, onClose }) => {
  const modalRef = useRef(null);

  // Handle click outside the modal content
  const handleBackdropClick = (e) => {
    if (modalRef.current && !modalRef.current.contains(e.target)) {
      onClose();
    }
  };

  // Handle ESC key press
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === "Escape") onClose();
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      // Prevent scrolling on body when modal is open
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "auto";
    };
  }, [isOpen, onClose]);

  // Focus trap
  useEffect(() => {
    if (!isOpen) return;

    const modal = modalRef.current;
    if (!modal) return;

    // Find all focusable elements in the modal
    const focusableElements = modal.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    // Set initial focus
    firstElement?.focus();

    // Handle tab navigation to keep focus inside modal
    const handleTabKey = (e) => {
      if (e.key === "Tab") {
        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            lastElement?.focus();
            e.preventDefault();
          }
        } else {
          if (document.activeElement === lastElement) {
            firstElement?.focus();
            e.preventDefault();
          }
        }
      }
    };

    document.addEventListener("keydown", handleTabKey);
    return () => document.removeEventListener("keydown", handleTabKey);
  }, [isOpen]);

  if (!isOpen) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto"
      onClick={handleBackdropClick}
      aria-modal="true"
      role="dialog"
      aria-labelledby="modal-title"
    >
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm"
        aria-hidden="true"
      />
      <div ref={modalRef} className="relative z-[101] w-full max-w-md mx-auto">
        {children}
      </div>
    </div>,
    document.body
  );
};

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  // Forgot password state
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [recoveryEmail, setRecoveryEmail] = useState("");
  const [recoveryEmailSent, setRecoveryEmailSent] = useState(false);
  const [recoveryLoading, setRecoveryLoading] = useState(false);
  const [recoveryError, setRecoveryError] = useState("");

  const { login, loginWithGoogle, currentUser } = useAuth();
  const navigate = useNavigate();

  // // Redirect if already logged in
  // useEffect(() => {
  //   if (currentUser) {
  //     navigate("/todo");
  //   }
  // }, [currentUser, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate form
    if (!email || !password) {
      setError("Please fill in all fields");
      return;
    }

    try {
      setError("");
      setLoading(true);

      // Show loading toast that persists during login
      const toastId = toast.loading("Signing in...", {
        style: {
          background: document.documentElement.classList.contains("dark")
            ? "#202020"
            : "#f2f0e3",
          color: document.documentElement.classList.contains("dark")
            ? "#f2f0e3"
            : "#202020",
          border: document.documentElement.classList.contains("dark")
            ? "1px solid #3a3a3a"
            : "1px solid #d8d6cf",
        },
        iconTheme: {
          primary: "#f76f52",
          secondary: document.documentElement.classList.contains("dark")
            ? "#202020"
            : "#f2f0e3",
        },
        duration: Infinity, // Make toast persist until explicitly dismissed
      });

      // Call the login function from AuthContext
      const result = await login(email, password, toastId);

      if (result.success) {
        // Show success animation locally
        setSuccess(true);

        // If email verification is required, navigate to todo which will show verification UI
        // Otherwise, navigation happens in AuthContext.jsx
        if (result.emailVerificationRequired) {
          setTimeout(() => navigate("/todo"), 800); // This will show the verification UI via ProtectedRoute
        }
      } else {
        // Dismiss the loading toast
        toast.dismiss(toastId);
        setError(result.message || "Failed to log in");
      }
    } catch (err) {
      console.error("Login error:", err);
      setError("Failed to log in. Please try again.");

      // Show error toast
      toast.error("Authentication failed", {
        style: {
          background: document.documentElement.classList.contains("dark")
            ? "#202020"
            : "#f2f0e3",
          color: document.documentElement.classList.contains("dark")
            ? "#f2f0e3"
            : "#202020",
          border: document.documentElement.classList.contains("dark")
            ? "1px solid #3a3a3a"
            : "1px solid #d8d6cf",
        },
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle Google OAuth login
  const handleGoogleLogin = async () => {
    try {
      setError("");
      setLoading(true);

      await loginWithGoogle();
      // User will be redirected to Google OAuth page
      // Completion will be handled in the callback
    } catch (err) {
      console.error("Google login error:", err);
      setError("Failed to authenticate with Google. Please try again.");
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();

    if (!recoveryEmail) {
      setRecoveryError("Please enter your email address");
      return;
    }

    try {
      setRecoveryError("");
      setRecoveryLoading(true);

      const result = await authService.forgotPassword(recoveryEmail);

      if (result.success) {
        setRecoveryEmailSent(true);
      } else {
        setRecoveryError(result.message);
      }
    } catch (err) {
      setRecoveryError("Failed to send recovery email. Please try again.");
      console.error(err);
    } finally {
      setRecoveryLoading(false);
    }
  };

  // Reset modal state when closing
  const handleCloseModal = () => {
    if (recoveryLoading) return;

    // Only reset email and error if we haven't sent the recovery email yet
    if (!recoveryEmailSent) {
      setRecoveryEmail("");
      setRecoveryError("");
    }

    setShowForgotPassword(false);
  };

  return (
    <div className="max-w-md mx-auto px-4 py-8 h-full flex items-center font-sans">
      <motion.div
        className="bg-[#f2f0e3] dark:bg-[#202020] backdrop-blur-sm rounded-md shadow-lg overflow-hidden p-8 my-8 border border-[#d8d6cf] dark:border-[#2a2a2a] w-full"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
      >
        <>
          <div className="text-center mb-8">
            <motion.div
              className="w-16 h-16 mx-auto mb-4 bg-[#f76f52] rounded-md flex items-center justify-center text-[#f2f0e3] dark:text-[#202020] relative"
              whileHover={{ scale: 1.05, rotate: 5 }}
              transition={{ type: "spring", stiffness: 400, damping: 10 }}
            >
              <span className="text-3xl font-bold">T</span>

              <motion.div
                className="absolute -top-2 -right-2 bg-[#f2f0e3] dark:bg-[#202020] rounded-full p-1 border-2 border-[#f76f52] shadow-sm"
                initial={{ scale: 0, rotate: -20 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ delay: 0.5, duration: 0.5, type: "spring" }}
              >
                <ClipboardDocumentListIcon className="w-4 h-4 text-[#f76f52]" />
              </motion.div>

              <motion.div
                className="absolute -bottom-2 -left-2 bg-[#f2f0e3] dark:bg-[#202020] rounded-full p-1 border-2 border-[#f76f52] shadow-sm"
                initial={{ scale: 0, rotate: 20 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ delay: 0.7, duration: 0.5, type: "spring" }}
              >
                <CheckBadgeIcon className="w-4 h-4 text-[#f76f52]" />
              </motion.div>
            </motion.div>
            <h2 className="text-2xl font-bold mb-1 text-[#202020] dark:text-[#f2f0e3]">
              Welcome to TuduAI
            </h2>
            <p className="text-[#3a3a3a] dark:text-[#d1cfbf] text-sm">
              Sign in to manage your tasks
            </p>
          </div>

          {/* {error && (
              <motion.div
                className="mb-6 p-3 bg-[#f2f0e3] dark:bg-[#202020] text-red-500 rounded-md shadow-sm border border-red-500"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ type: "spring", stiffness: 300, damping: 25 }}
              >
                {error}
              </motion.div>
            )} */}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-[#202020] dark:text-[#f2f0e3] mb-1">
                Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <AtSymbolIcon className="h-5 w-5 text-[#3a3a3a] dark:text-[#d1cfbf]" />
                </div>
                <motion.input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full py-3 pl-10 pr-3 border border-[#d8d6cf] dark:border-[#3a3a3a] rounded-md bg-[#f2f0e3] dark:bg-[#202020] text-[#202020] dark:text-[#f2f0e3] placeholder-[#3a3a3a]/60 dark:placeholder-[#d1cfbf]/60 focus:outline-none focus:ring-1 focus:ring-[#f76f52] focus:border-transparent shadow-sm"
                  placeholder="you@example.com"
                  required
                  whileFocus={{ scale: 1.01 }}
                  transition={{ duration: 0.2 }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between mb-1">
                <label className="block text-sm font-medium text-[#202020] dark:text-[#f2f0e3]">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => setShowForgotPassword(true)}
                  className="text-xs text-[#f76f52] hover:underline"
                >
                  Forgot Password?
                </button>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <LockClosedIcon className="h-5 w-5 text-[#3a3a3a] dark:text-[#d1cfbf]" />
                </div>
                <motion.input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full py-3 pl-10 pr-12 border border-[#d8d6cf] dark:border-[#3a3a3a] rounded-md bg-[#f2f0e3] dark:bg-[#202020] text-[#202020] dark:text-[#f2f0e3] placeholder-[#3a3a3a]/60 dark:placeholder-[#d1cfbf]/60 focus:outline-none focus:ring-1 focus:ring-[#f76f52] focus:border-transparent shadow-sm"
                  placeholder="••••••••"
                  required
                  whileFocus={{ scale: 1.01 }}
                  transition={{ duration: 0.2 }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-[#3a3a3a] dark:text-[#d1cfbf] hover:text-[#202020] dark:hover:text-[#f2f0e3] transition-colors"
                >
                  {showPassword ? (
                    <EyeSlashIcon className="h-5 w-5" />
                  ) : (
                    <EyeIcon className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>

            <div>
              <motion.button
                type="submit"
                className="w-full py-3 px-4 bg-[#f76f52] text-[#f2f0e3] font-medium rounded-md focus:outline-none focus:ring-1 focus:ring-[#f76f52] border border-transparent disabled:opacity-50 shadow-sm hover:bg-[#e55e41] transition-colors"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                disabled={loading}
              >
                <ArrowRightIcon className="w-5 h-5 mr-2 inline-block" />
                Sign In
              </motion.button>
            </div>
          </form>

          {/* Divider */}
          <div className="mt-6 mb-6 flex items-center">
            <div className="flex-1 border-t border-[#d8d6cf] dark:border-[#3a3a3a]"></div>
            <span className="px-3 text-sm text-[#3a3a3a] dark:text-[#d1cfbf]">or</span>
            <div className="flex-1 border-t border-[#d8d6cf] dark:border-[#3a3a3a]"></div>
          </div>

          {/* Google OAuth Button */}
          <motion.button
            type="button"
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full py-3 px-4 bg-white dark:bg-[#2a2a2a] text-[#202020] dark:text-[#f2f0e3] font-medium rounded-md border border-[#d8d6cf] dark:border-[#3a3a3a] focus:outline-none focus:ring-1 focus:ring-[#f76f52] disabled:opacity-50 shadow-sm hover:bg-[#f5f5f5] dark:hover:bg-[#3a3a3a] transition-colors flex items-center justify-center"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            {/* Google Icon SVG */}
            <svg 
              className="w-5 h-5 mr-3" 
              viewBox="0 0 24 24"
            >
              <path 
                fill="#4285F4" 
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path 
                fill="#34A853" 
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path 
                fill="#FBBC05" 
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path 
                fill="#EA4335" 
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Continue with Google
          </motion.button>

          <div className="mt-6 text-center text-sm">
            <span className="text-[#3a3a3a] dark:text-[#d1cfbf]">
              Don't have an account?{" "}
            </span>
            <Link
              to="/register"
              className="text-[#f76f52] hover:underline font-medium"
            >
              Create one now
            </Link>
          </div>
        </>

        {/* Forgot Password Modal using Portal */}
        <ModalPortal isOpen={showForgotPassword} onClose={handleCloseModal}>
          <motion.div
            className="bg-[#f2f0e3] dark:bg-[#202020] rounded-xl shadow-2xl p-6 m-4"
            initial={{ opacity: 0, scale: 0.9, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{
              type: "spring",
              stiffness: 300,
              damping: 30,
            }}
          >
            <div className="flex justify-between items-center mb-5">
              <h3
                id="modal-title"
                className="text-xl font-semibold text-[#202020] dark:text-[#f2f0e3] flex items-center"
              >
                <span className="bg-[#f76f52] text-[#f2f0e3] w-8 h-8 rounded-md flex items-center justify-center mr-3">
                  <LockClosedIcon className="w-4 h-4" />
                </span>
                Reset Your Password
              </h3>
              <button
                type="button"
                onClick={handleCloseModal}
                className="text-[#3a3a3a] dark:text-[#d1cfbf] hover:text-[#202020] dark:hover:text-[#f2f0e3] p-1.5 rounded-md hover:bg-[#e8e6d9] dark:hover:bg-[#2a2a2a] transition-colors"
                disabled={recoveryLoading}
                aria-label="Close modal"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>

            {recoveryEmailSent ? (
              <motion.div
                className="text-center py-8"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5 }}
              >
                <motion.div
                  className="w-20 h-20 bg-[#e8e6d9] dark:bg-[#2a2a2a] rounded-full mx-auto flex items-center justify-center mb-6 border border-[#d8d6cf] dark:border-[#3a3a3a]"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                >
                  {/* Separate the rotation animation from the scale animation */}
                  <motion.div
                    initial={{ rotate: 0 }}
                    animate={{ rotate: 10 }}
                    transition={{
                      delay: 0.5,
                      duration: 0.5,
                      type: "tween", // Use tween instead of spring for multi-keyframe animation
                      repeat: 1,
                      repeatType: "reverse",
                    }}
                  >
                    <CheckCircleIcon className="w-12 h-12 text-[#f76f52]" />
                  </motion.div>
                </motion.div>

                <motion.h3
                  className="text-xl font-semibold text-[#202020] dark:text-[#f2f0e3] mb-3"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  Email Sent Successfully!
                </motion.h3>
                <motion.p
                  className="text-[#3a3a3a] dark:text-[#d1cfbf] mb-6 max-w-sm mx-auto"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                >
                  Check your inbox for instructions on how to reset your
                  password. The link will expire in 1 hour.
                </motion.p>
                <motion.button
                  type="button"
                  onClick={handleCloseModal}
                  className="py-2.5 px-6 bg-[#f76f52] text-[#f2f0e3] font-medium rounded-md shadow-sm hover:bg-[#e55e41] transition-colors"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Return to Login
                </motion.button>
              </motion.div>
            ) : (
              <form onSubmit={handleForgotPassword} className="space-y-5">
                <p className="text-[#3a3a3a] dark:text-[#d1cfbf] text-sm mb-4 border-l-2 border-[#f76f52] pl-3">
                  Enter your email address and we'll send you instructions to
                  reset your password.
                </p>

                {recoveryError && (
                  <motion.div
                    className="p-3 bg-red-50 dark:bg-red-900/20 text-red-500 dark:text-red-400 rounded-md shadow-sm border border-red-200 dark:border-red-800/50 text-sm flex items-start gap-2"
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ type: "spring", stiffness: 300, damping: 25 }}
                  >
                    <span className="mt-0.5">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-4 w-4"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </span>
                    {recoveryError}
                  </motion.div>
                )}

                <div>
                  <label className="block text-sm font-medium text-[#202020] dark:text-[#f2f0e3] mb-1.5">
                    Email Address
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <AtSymbolIcon className="h-5 w-5 text-[#3a3a3a] dark:text-[#d1cfbf]" />
                    </div>
                    <motion.input
                      type="email"
                      value={recoveryEmail}
                      onChange={(e) => setRecoveryEmail(e.target.value)}
                      className="w-full py-3 pl-10 pr-3 border border-[#d8d6cf] dark:border-[#3a3a3a] rounded-md bg-[#f2f0e3] dark:bg-[#202020] text-[#202020] dark:text-[#f2f0e3] placeholder-[#3a3a3a]/60 dark:placeholder-[#d1cfbf]/60 focus:outline-none focus:ring-1 focus:ring-[#f76f52] focus:border-transparent shadow-sm"
                      placeholder="you@example.com"
                      required
                      disabled={recoveryLoading}
                      autoComplete="email"
                      autoFocus
                      whileFocus={{ scale: 1.01 }}
                      transition={{ duration: 0.2 }}
                    />
                  </div>
                </div>

                <div className="flex gap-3 pt-3">
                  <motion.button
                    type="button"
                    onClick={handleCloseModal}
                    className="flex-1 py-2.5 px-4 border border-[#d8d6cf] dark:border-[#3a3a3a] text-[#3a3a3a] dark:text-[#d1cfbf] font-medium rounded-md shadow-sm hover:bg-[#e8e6d9] dark:hover:bg-[#2a2a2a] transition-colors"
                    disabled={recoveryLoading}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    Cancel
                  </motion.button>
                  <motion.button
                    type="submit"
                    className="flex-1 py-2.5 px-4 bg-[#f76f52] text-[#f2f0e3] font-medium rounded-md shadow-sm hover:bg-[#e55e41] transition-colors disabled:opacity-50 flex items-center justify-center"
                    disabled={recoveryLoading}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    {recoveryLoading ? (
                      <svg
                        className="animate-spin h-5 w-5 text-[#f2f0e3]"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                    ) : (
                      "Send Instructions"
                    )}
                  </motion.button>
                </div>
              </form>
            )}
          </motion.div>
        </ModalPortal>
      </motion.div>
    </div>
  );
}
