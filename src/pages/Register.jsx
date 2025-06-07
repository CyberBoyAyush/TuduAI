/**
 * File: Register.jsx
 * Purpose: New user registration page
 */
import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "../context/AuthContext";
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

  const { register, currentUser } = useAuth();
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
        // Show success animation before redirecting
        setSuccess(true);
        setTimeout(() => navigate("/todo"), 800);
      }
    } catch (err) {
      setError("Failed to create account. Please try again.");
      console.error(err);
    } finally {
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
              Redirecting to your tasks...
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
