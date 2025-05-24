/**
 * File: ResetPassword.jsx
 * Purpose: Reset password page after user clicks recovery link
 */
import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import authService from '../api/authService'
import { 
  LockClosedIcon, 
  EyeIcon, 
  EyeSlashIcon,
  CheckCircleIcon,
  ExclamationCircleIcon
} from '@heroicons/react/24/outline'

export default function ResetPassword() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  
  // Extract userId and secret from URL
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const userId = searchParams.get('userId');
  const secret = searchParams.get('secret');
  
  const navigate = useNavigate();

  // Check if required params exist
  useEffect(() => {
    if (!userId || !secret) {
      console.error('Missing required URL parameters for password reset:', { userId, secret });
      setError('Invalid password reset link. Please request a new one.');
    }
  }, [userId, secret]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!userId || !secret) {
      setError('Invalid password reset link. Please request a new one.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }

    try {
      setLoading(true);
      setError('');

      const result = await authService.resetPassword(
        userId,
        secret,
        password,
        confirmPassword
      );

      if (result.success) {
        setSuccess(true);
        setTimeout(() => {
          navigate('/login');
        }, 3000);
      } else {
        setError(result.message || 'Failed to reset password');
      }
    } catch (err) {
      console.error('Password reset error:', err);
      setError('An error occurred. Please try again.');
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
            <h2 className="text-xl font-bold text-[#202020] dark:text-[#f2f0e3] mb-2">Password Reset Successful</h2>
            <p className="text-[#3a3a3a] dark:text-[#d1cfbf]">Redirecting to login page...</p>
          </motion.div>
        ) : (
          <>
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold mb-2 text-[#202020] dark:text-[#f2f0e3]">
                Reset Your Password
              </h2>
              <p className="text-[#3a3a3a] dark:text-[#d1cfbf] text-sm">Enter a new password for your account</p>
            </div>

            {error && (
              <motion.div 
                className="mb-6 p-3 bg-[#f2f0e3] dark:bg-[#202020] text-red-500 rounded-md shadow-sm border border-red-500 flex gap-2 items-center"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ type: "spring", stiffness: 300, damping: 25 }}
              >
                <ExclamationCircleIcon className="w-5 h-5 flex-shrink-0" />
                <span>{error}</span>
              </motion.div>
            )}

            {(!userId || !secret) ? (
              <div className="text-center py-4">
                <p className="text-[#3a3a3a] dark:text-[#d1cfbf] mb-4">
                  This password reset link is invalid or has expired. Please request a new one.
                </p>
                <button
                  onClick={() => navigate('/login')}
                  className="py-2 px-4 bg-[#f76f52] text-[#f2f0e3] font-medium rounded-md shadow-sm hover:bg-[#e55e41] transition-colors"
                >
                  Return to Login
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-[#202020] dark:text-[#f2f0e3] mb-1">
                    New Password
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
                      minLength={8}
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
                  <p className="mt-1 text-xs text-[#3a3a3a] dark:text-[#d1cfbf]">
                    Password must be at least 8 characters
                  </p>
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

                <div className="pt-2">
                  <motion.button
                    type="submit"
                    className="w-full py-3 px-4 bg-[#f76f52] text-[#f2f0e3] font-medium rounded-md focus:outline-none focus:ring-1 focus:ring-[#f76f52] border border-transparent disabled:opacity-50 shadow-sm hover:bg-[#e55e41] transition-colors"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    disabled={loading}
                  >
                    {loading ? (
                      <svg className="animate-spin h-5 w-5 mx-auto text-[#f2f0e3]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    ) : (
                      'Reset Password'
                    )}
                  </motion.button>
                </div>
              </form>
            )}
          </>
        )}
      </motion.div>
    </div>
  );
}
