/**
 * File: ProtectedRoute.jsx
 * Purpose: Redirect unauthenticated users trying to access protected routes
 */
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { motion } from "framer-motion"; // Import motion for smooth loading animation
import EmailVerificationRequired from "./EmailVerificationRequired";

const ProtectedRoute = ({ children }) => {
  const { currentUser, loading, initializing, emailVerified } = useAuth();

  // Only show loading for authentication operations, not initial loading
  // Initial loading is handled by AuthProvider
  if (loading && !initializing) {
    return (
      <div className="flex justify-center items-center min-h-[70vh]">
        <motion.div
          className="bg-[#f2f0e3] dark:bg-[#202020] p-8 rounded-md shadow-md border border-[#d8d6cf] dark:border-[#3a3a3a] flex flex-col items-center"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#f76f52] mb-4"></div>
          <p className="text-[#202020] dark:text-[#f2f0e3] font-medium">
            Authenticating...
          </p>
        </motion.div>
      </div>
    );
  }

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  // Check if user's email is verified
  if (currentUser && !currentUser.emailVerification) {
    return <EmailVerificationRequired />;
  }

  return children;
};

export default ProtectedRoute;
