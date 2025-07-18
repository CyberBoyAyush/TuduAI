/**
 * File: Register.jsx
 * Purpose: New user registration page
 */
import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";
import {
  UserIcon,
  AtSymbolIcon,
  LockClosedIcon,
  ArrowRightIcon,
  CheckCircleIcon,
  ClipboardDocumentListIcon,
  CheckBadgeIcon,
  EyeIcon,
  EyeSlashIcon,
} from "@heroicons/react/24/outline";

export default function Register() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const { register, loginWithGoogle, currentUser } = useAuth();
  const navigate = useNavigate();

  // Redirect if already logged in
  useEffect(() => {
    if (currentUser) {
      navigate("/todo");
    }
  }, [currentUser, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate form
    if (!name || !email || !password || !confirmPassword) {
      setError("Please fill in all fields");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    try {
      setError("");
      setLoading(true);

      const result = await register(name, email, password);

      if (!result.success) {
        setError(result.message || "Failed to create account");
      } else {
        // Show success animation
        setSuccess(true);

        // If email verification is required, don't redirect to todo
        // The ProtectedRoute will handle showing the verification UI
        if (result.emailVerificationRequired) {
          setTimeout(() => navigate("/todo"), 800); // This will show the verification UI
        } else {
          setTimeout(() => navigate("/todo"), 800);
        }
      }
    } catch (err) {
      setError("Failed to create account. Please try again.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Handle Google OAuth signup
  const handleGoogleSignup = async () => {
    try {
      setError("");
      setLoading(true);

      await loginWithGoogle();
      // User will be redirected to Google OAuth page
      // Completion will be handled in the callback
    } catch (err) {
      console.error("Google signup error:", err);
      setError("Failed to authenticate with Google. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-8 h-full flex items-center font-sans">
      <motion.div
        className="bg-[#f2f0e3] dark:bg-[#202020] backdrop-blur-sm rounded-md shadow-lg overflow-hidden p-8 my-8 border border-[#d8d6cf] dark:border-[#2a2a2a] w-full"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
      >
        {success ? (
          <motion.div
            className="text-center py-8"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
          >
            <motion.div
              className="w-16 h-16 bg-[#e8e6d9] dark:bg-[#2a2a2a] rounded-md mx-auto flex items-center justify-center mb-4 border border-[#d8d6cf] dark:border-[#3a3a3a]"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            >
              <CheckCircleIcon className="w-10 h-10 text-[#f76f52]" />
            </motion.div>
            <h2 className="text-xl font-bold text-[#202020] dark:text-[#f2f0e3] mb-2">
              Registration Successful
            </h2>
            <p className="text-[#3a3a3a] dark:text-[#d1cfbf]">
              Please check your email to verify your account...
            </p>
          </motion.div>
        ) : (
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
                Join TuduAI
              </h2>
              <p className="text-[#3a3a3a] dark:text-[#d1cfbf] text-sm">
                Create an account to manage your tasks
              </p>
            </div>

            {error && (
              <motion.div
                className="mb-6 p-3 bg-[#f2f0e3] dark:bg-[#202020] text-red-500 rounded-md shadow-sm border border-red-500"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ type: "spring", stiffness: 300, damping: 25 }}
              >
                {error}
              </motion.div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-[#202020] dark:text-[#f2f0e3] mb-1">
                  Full Name
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <UserIcon className="h-5 w-5 text-[#3a3a3a] dark:text-[#d1cfbf]" />
                  </div>
                  <motion.input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full py-3 pl-10 pr-3 border border-[#d8d6cf] dark:border-[#3a3a3a] rounded-md bg-[#f2f0e3] dark:bg-[#202020] text-[#202020] dark:text-[#f2f0e3] placeholder-[#3a3a3a]/60 dark:placeholder-[#d1cfbf]/60 focus:outline-none focus:ring-1 focus:ring-[#f76f52] focus:border-transparent shadow-sm"
                    placeholder="John Doe"
                    required
                    whileFocus={{ scale: 1.01 }}
                    transition={{ duration: 0.2 }}
                  />
                </div>
              </div>

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
                <label className="block text-sm font-medium text-[#202020] dark:text-[#f2f0e3] mb-1">
                  Password
                </label>
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
                    minLength={6}
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
                <label className="block text-sm font-medium text-[#202020] dark:text-[#f2f0e3] mb-1">
                  Confirm Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <LockClosedIcon className="h-5 w-5 text-[#3a3a3a] dark:text-[#d1cfbf]" />
                  </div>
                  <motion.input
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full py-3 pl-10 pr-12 border border-[#d8d6cf] dark:border-[#3a3a3a] rounded-md bg-[#f2f0e3] dark:bg-[#202020] text-[#202020] dark:text-[#f2f0e3] placeholder-[#3a3a3a]/60 dark:placeholder-[#d1cfbf]/60 focus:outline-none focus:ring-1 focus:ring-[#f76f52] focus:border-transparent shadow-sm"
                    placeholder="••••••••"
                    required
                    minLength={6}
                    whileFocus={{ scale: 1.01 }}
                    transition={{ duration: 0.2 }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-[#3a3a3a] dark:text-[#d1cfbf] hover:text-[#202020] dark:hover:text-[#f2f0e3] transition-colors"
                  >
                    {showConfirmPassword ? (
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
                  {loading ? (
                    <svg
                      className="animate-spin -ml-1 mr-2 h-4 w-4 text-[#f2f0e3] inline-block"
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
                    <ArrowRightIcon className="w-5 h-5 mr-2 inline-block" />
                  )}
                  {loading ? "Creating Account..." : "Create Account"}
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
              onClick={handleGoogleSignup}
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
                Already have an account?{" "}
              </span>
              <Link
                to="/login"
                className="text-[#f76f52] hover:underline font-medium"
              >
                Sign in
              </Link>
            </div>
          </>
        )}
      </motion.div>
    </div>
  );
}
