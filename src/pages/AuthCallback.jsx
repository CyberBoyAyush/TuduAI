/**
 * File: AuthCallback.jsx
 * Purpose: Handle OAuth callback after Google authentication
 */
import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "../context/AuthContext";

export default function AuthCallback() {
  const { handleOAuthCallback } = useAuth();
  const navigate = useNavigate();
  const hasProcessed = useRef(false);

  useEffect(() => {
    // Prevent multiple calls
    if (hasProcessed.current) {
      console.log("AuthCallback: Already processed, skipping...");
      return;
    }

    const processCallback = async () => {
      try {
        hasProcessed.current = true;
        console.log("AuthCallback: Processing OAuth callback...");
        
        // Add a small delay to ensure proper state management
        await new Promise(resolve => setTimeout(resolve, 500));
        
        const result = await handleOAuthCallback();
        if (result.success) {
          console.log("AuthCallback: Success, redirecting to todo page");
          // Add another small delay before redirect to ensure toast is shown
          setTimeout(() => {
            navigate("/todo", { replace: true });
          }, 1000);
        } else {
          console.log("AuthCallback: Failed, redirecting to login page");
          navigate("/login", { replace: true });
        }
      } catch (error) {
        console.error("OAuth callback processing failed:", error);
        hasProcessed.current = false; // Reset on error to allow retry
        navigate("/login", { replace: true });
      }
    };

    // Set a timeout to prevent getting stuck on this page
    const timeoutId = setTimeout(() => {
      if (!hasProcessed.current) {
        console.warn("OAuth callback timed out, redirecting to login");
        navigate("/login", { replace: true });
      }
    }, 15000); // Increased to 15 seconds to account for delays

    processCallback();

    // Cleanup timeout
    return () => clearTimeout(timeoutId);
  }, []); // Empty dependency array to prevent re-runs

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f2f0e3] to-[#d8d6cf] dark:from-[#202020] dark:to-[#1a1a1a] flex items-center justify-center">
      <div className="text-center">
        <motion.div
          className="inline-block"
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
        >
          <div className="w-12 h-12 border-4 border-[#f76f52] border-t-transparent rounded-full"></div>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-6"
        >
          <h2 className="text-2xl font-bold text-[#202020] dark:text-[#f2f0e3] mb-2">
            Completing Sign In
          </h2>
          <p className="text-[#3a3a3a] dark:text-[#d1cfbf]">
            Please wait while we finish setting up your account...
          </p>
        </motion.div>
      </div>
    </div>
  );
}
