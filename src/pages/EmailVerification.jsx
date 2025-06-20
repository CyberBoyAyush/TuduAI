/**
 * File: EmailVerification.jsx
 * Purpose: Handle email verification callback and show verification status
 */
import { useState, useEffect } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import authService from "../api/authService";
import toast from "react-hot-toast";
import {
  CheckCircleIcon,
  XCircleIcon,
  ArrowPathIcon,
  HomeIcon,
} from "@heroicons/react/24/outline";

const EmailVerification = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [verificationStatus, setVerificationStatus] = useState('loading'); // 'loading', 'success', 'error'
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const verifyEmail = async () => {
      const userId = searchParams.get('userId');
      const secret = searchParams.get('secret');

      if (!userId || !secret) {
        setVerificationStatus('error');
        setMessage('Invalid verification link. Please request a new verification email.');
        setLoading(false);
        return;
      }

      try {
        const result = await authService.verifyEmail(userId, secret);
        
        if (result.success) {
          setVerificationStatus('success');
          setMessage(result.message);
          
          // Show success toast
          toast.success('Email verified successfully! Redirecting...', {
            duration: 3000,
            position: 'top-center',
          });

          // Redirect to todo page after 3 seconds
          setTimeout(() => {
            navigate('/todo');
          }, 3000);
        } else {
          setVerificationStatus('error');
          setMessage(result.message);
          
          toast.error(result.message, {
            duration: 4000,
            position: 'top-center',
          });
        }
      } catch (error) {
        console.error('Email verification error:', error);
        setVerificationStatus('error');
        setMessage('An unexpected error occurred. Please try again.');
        
        toast.error('Verification failed. Please try again.', {
          duration: 4000,
          position: 'top-center',
        });
      } finally {
        setLoading(false);
      }
    };

    verifyEmail();
  }, [searchParams, navigate]);

  const handleResendVerification = async () => {
    try {
      setLoading(true);
      const result = await authService.resendEmailVerification();
      
      if (result.success) {
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

  const renderContent = () => {
    if (verificationStatus === 'loading') {
      return (
        <>
          <motion.div
            className="w-16 h-16 mx-auto mb-4 bg-[#f76f52] rounded-md flex items-center justify-center"
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          >
            <ArrowPathIcon className="w-8 h-8 text-white" />
          </motion.div>
          <h1 className="text-2xl font-bold text-[#202020] dark:text-[#f2f0e3] mb-2">
            Verifying Your Email
          </h1>
          <p className="text-[#3a3a3a] dark:text-[#d1cfbf] text-sm">
            Please wait while we verify your email address...
          </p>
        </>
      );
    }

    if (verificationStatus === 'success') {
      return (
        <>
          <motion.div
            className="w-16 h-16 mx-auto mb-4 bg-green-500 rounded-md flex items-center justify-center"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 400, damping: 10 }}
          >
            <CheckCircleIcon className="w-8 h-8 text-white" />
          </motion.div>
          <h1 className="text-2xl font-bold text-[#202020] dark:text-[#f2f0e3] mb-2">
            Email Verified!
          </h1>
          <p className="text-[#3a3a3a] dark:text-[#d1cfbf] text-sm mb-6">
            {message}
          </p>
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md p-4 mb-6">
            <p className="text-sm text-green-800 dark:text-green-200">
              🎉 Welcome to TuduAI! You can now access all features. Redirecting you to your dashboard...
            </p>
          </div>
        </>
      );
    }

    if (verificationStatus === 'error') {
      return (
        <>
          <motion.div
            className="w-16 h-16 mx-auto mb-4 bg-red-500 rounded-md flex items-center justify-center"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 400, damping: 10 }}
          >
            <XCircleIcon className="w-8 h-8 text-white" />
          </motion.div>
          <h1 className="text-2xl font-bold text-[#202020] dark:text-[#f2f0e3] mb-2">
            Verification Failed
          </h1>
          <p className="text-[#3a3a3a] dark:text-[#d1cfbf] text-sm mb-6">
            {message}
          </p>
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-4 mb-6">
            <p className="text-sm text-red-800 dark:text-red-200">
              The verification link may have expired or been used already. Please request a new verification email.
            </p>
          </div>
        </>
      );
    }
  };

  const renderActions = () => {
    if (verificationStatus === 'success') {
      return (
        <div className="space-y-3">
          <motion.div
            className="text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
          >
            <Link
              to="/todo"
              className="inline-flex items-center space-x-2 bg-[#f76f52] hover:bg-[#e55a3d] text-white font-medium py-3 px-6 rounded-md transition-colors duration-200"
            >
              <HomeIcon className="w-5 h-5" />
              <span>Go to Dashboard</span>
            </Link>
          </motion.div>
        </div>
      );
    }

    if (verificationStatus === 'error') {
      return (
        <div className="space-y-3">
          <motion.button
            onClick={handleResendVerification}
            disabled={loading}
            className="w-full bg-[#f76f52] hover:bg-[#e55a3d] disabled:bg-[#ccc] disabled:cursor-not-allowed text-white font-medium py-3 px-4 rounded-md transition-colors duration-200 flex items-center justify-center space-x-2"
            whileHover={{ scale: loading ? 1 : 1.02 }}
            whileTap={{ scale: loading ? 1 : 0.98 }}
          >
            {loading ? (
              <ArrowPathIcon className="w-5 h-5 animate-spin" />
            ) : (
              <CheckCircleIcon className="w-5 h-5" />
            )}
            <span>{loading ? "Sending..." : "Send New Verification Email"}</span>
          </motion.button>

          <Link
            to="/login"
            className="block w-full text-center bg-[#dbd9cc] dark:bg-[#333333] hover:bg-[#d8d6cf] dark:hover:bg-[#3a3a3a] text-[#202020] dark:text-[#f2f0e3] font-medium py-3 px-4 rounded-md transition-colors duration-200"
          >
            Back to Login
          </Link>
        </div>
      );
    }

    return null;
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#f2f0e3] dark:bg-[#202020] px-4 py-8">
      <motion.div
        className="max-w-md w-full bg-[#e8e6d9] dark:bg-[#2a2a2a] rounded-md shadow-lg p-6 sm:p-8 border border-[#d8d6cf] dark:border-[#3a3a3a] mx-auto"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
      >
        <div className="text-center mb-6">
          {renderContent()}
        </div>

        {renderActions()}

        {/* Help Text */}
        <div className="mt-6 pt-6 border-t border-[#d8d6cf] dark:border-[#2a2a2a]">
          <p className="text-xs text-[#3a3a3a] dark:text-[#d1cfbf] text-center">
            Having trouble? Contact our support team for assistance.
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default EmailVerification;
