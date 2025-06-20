/**
 * File: EmailVerificationRequired.jsx
 * Purpose: Component that blocks access for unverified users and provides verification UI
 */
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useAuth } from "../context/AuthContext";
import authService from "../api/authService";
import toast from "react-hot-toast";
import {
  EnvelopeIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ArrowPathIcon,
} from "@heroicons/react/24/outline";

const EmailVerificationRequired = () => {
  const { currentUser, logout } = useAuth();
  const [loading, setLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [verificationSent, setVerificationSent] = useState(false);

  // Cooldown timer for resend button
  useEffect(() => {
    let interval;
    if (resendCooldown > 0) {
      interval = setInterval(() => {
        setResendCooldown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [resendCooldown]);

  const handleResendVerification = async () => {
    if (resendCooldown > 0) return;

    try {
      setLoading(true);
      const result = await authService.resendEmailVerification();
      
      if (result.success) {
        setVerificationSent(true);
        setResendCooldown(60); // 60 second cooldown
        toast.success(result.message, {
          duration: 4000,
          position: 'top-center',
        });
      } else {
        toast.error(result.message, {
          duration: 4000,
          position: 'top-center',
        });
      }
    } catch (error) {
      console.error("Resend verification error:", error);
      toast.error("Failed to resend verification email. Please try again.", {
        duration: 4000,
        position: 'top-center',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const handleRefreshStatus = async () => {
    try {
      setLoading(true);
      // Force refresh user data by clearing cache and getting current user
      const user = await authService.getCurrentUser();
      if (user && user.emailVerification) {
        // User is now verified, the AuthContext will handle the redirect
        toast.success("Email verified successfully!", {
          duration: 4000,
          position: 'top-center',
        });
        // Force a page refresh to update the auth state
        window.location.reload();
      } else {
        toast.error("Email is still not verified. Please check your inbox.", {
          duration: 4000,
          position: 'top-center',
        });
      }
    } catch (error) {
      console.error("Refresh status error:", error);
      toast.error("Failed to check verification status.", {
        duration: 4000,
        position: 'top-center',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#f2f0e3] dark:bg-[#202020] px-4 py-8">
      <motion.div
        className="max-w-md w-full bg-[#e8e6d9] dark:bg-[#2a2a2a] rounded-md shadow-lg p-6 sm:p-8 border border-[#d8d6cf] dark:border-[#3a3a3a] mx-auto"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
      >
        {/* Header */}
        <div className="text-center mb-6">
          <motion.div
            className="w-16 h-16 mx-auto mb-4 bg-[#f76f52] rounded-md flex items-center justify-center"
            whileHover={{ scale: 1.05 }}
            transition={{ type: "spring", stiffness: 400, damping: 10 }}
          >
            <EnvelopeIcon className="w-8 h-8 text-white" />
          </motion.div>
          <h1 className="text-2xl font-bold text-[#202020] dark:text-[#f2f0e3] mb-2">
            Verify Your Email
          </h1>
          <p className="text-[#3a3a3a] dark:text-[#d1cfbf] text-sm">
            Please verify your email address to continue using TuduAI
          </p>
        </div>

        {/* User Info */}
        <div className="bg-[#dbd9cc] dark:bg-[#333333] rounded-md p-4 mb-6">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-[#f76f52] rounded-md flex items-center justify-center">
              <span className="text-white font-semibold text-sm">
                {currentUser?.name?.charAt(0)?.toUpperCase() ||
                 currentUser?.email?.charAt(0)?.toUpperCase() || 'U'}
              </span>
            </div>
            <div>
              <p className="font-medium text-[#202020] dark:text-[#f2f0e3]">
                {currentUser?.name || 'User'}
              </p>
              <p className="text-sm text-[#3a3a3a] dark:text-[#d1cfbf]">
                {currentUser?.email}
              </p>
            </div>
          </div>
        </div>

        {/* Warning Message */}
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md p-4 mb-6">
          <div className="flex items-start space-x-3">
            <ExclamationTriangleIcon className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm text-yellow-800 dark:text-yellow-200 font-medium mb-1">
                Email Verification Required
              </p>
              <p className="text-sm text-yellow-700 dark:text-yellow-300">
                You need to verify your email address before you can access your tasks and workspaces.
              </p>
            </div>
          </div>
        </div>

        {/* Verification Status */}
        {verificationSent && (
          <motion.div
            className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md p-4 mb-6"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
          >
            <div className="flex items-start space-x-3">
              <CheckCircleIcon className="w-5 h-5 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm text-green-800 dark:text-green-200 font-medium mb-1">
                  Verification Email Sent
                </p>
                <p className="text-sm text-green-700 dark:text-green-300">
                  Please check your inbox and click the verification link.
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Action Buttons */}
        <div className="space-y-3">
          <motion.button
            onClick={handleResendVerification}
            disabled={loading || resendCooldown > 0}
            className="w-full bg-[#f76f52] hover:bg-[#e55a3d] disabled:bg-[#ccc] disabled:cursor-not-allowed text-white font-medium py-3 px-4 rounded-md transition-colors duration-200 flex items-center justify-center space-x-2"
            whileHover={{ scale: loading || resendCooldown > 0 ? 1 : 1.02 }}
            whileTap={{ scale: loading || resendCooldown > 0 ? 1 : 0.98 }}
          >
            {loading ? (
              <ArrowPathIcon className="w-5 h-5 animate-spin" />
            ) : (
              <EnvelopeIcon className="w-5 h-5" />
            )}
            <span>
              {resendCooldown > 0 
                ? `Resend in ${resendCooldown}s` 
                : loading 
                  ? "Sending..." 
                  : "Resend Verification Email"
              }
            </span>
          </motion.button>

          <motion.button
            onClick={handleRefreshStatus}
            disabled={loading}
            className="w-full bg-[#dbd9cc] dark:bg-[#333333] hover:bg-[#d8d6cf] dark:hover:bg-[#3a3a3a] disabled:opacity-50 disabled:cursor-not-allowed text-[#202020] dark:text-[#f2f0e3] font-medium py-3 px-4 rounded-md transition-colors duration-200 flex items-center justify-center space-x-2"
            whileHover={{ scale: loading ? 1 : 1.02 }}
            whileTap={{ scale: loading ? 1 : 0.98 }}
          >
            <ArrowPathIcon className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
            <span>{loading ? "Checking..." : "I've Verified My Email"}</span>
          </motion.button>

          <motion.button
            onClick={handleLogout}
            className="w-full text-[#3a3a3a] dark:text-[#d1cfbf] hover:text-[#202020] dark:hover:text-[#f2f0e3] font-medium py-2 px-4 rounded-md transition-colors duration-200"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            Sign Out
          </motion.button>
        </div>

        {/* Help Text */}
        <div className="mt-6 pt-6 border-t border-[#d8d6cf] dark:border-[#2a2a2a]">
          <p className="text-xs text-[#3a3a3a] dark:text-[#d1cfbf] text-center">
            Didn't receive the email? Check your spam folder or try resending.
            <br />
            If you continue to have issues, please contact support.
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default EmailVerificationRequired;
