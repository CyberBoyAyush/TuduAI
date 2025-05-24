import { account, ID } from './appwrite';

// Add a cache for the current user to prevent multiple API calls
let cachedUser = null;
let lastFetchTime = 0;
const CACHE_EXPIRY = 30000; // 30 seconds

export const authService = {
  // Register a new user
  async register(email, password, name) {
    try {
      // Create user account with a string ID
      const userId = crypto.randomUUID();
      
      const response = await account.create(
        userId,
        email,
        password,
        name
      );
      
      if (response) {
        // Login after successful registration
        return await this.login(email, password);
      }
      
      return response;
    } catch (error) {
      console.error("Error creating user:", error);
      throw error;
    }
  },

  // Login user
  async login(email, password) {
    try {
      const session = await account.createEmailPasswordSession(email, password);
      // Clear cache on login to force a refresh
      cachedUser = null;
      return session;
    } catch (error) {
      console.error("Login error:", error);
      throw error;
    }
  },

  // Logout user
  async logout() {
    try {
      // Clear cache on logout
      cachedUser = null;
      return await account.deleteSession('current');
    } catch (error) {
      throw error;
    }
  },

  // Get current user with caching to prevent duplicate calls
  async getCurrentUser() {
    try {
      const now = Date.now();
      
      // Return cached user if it exists and hasn't expired
      if (cachedUser && (now - lastFetchTime) < CACHE_EXPIRY) {
        return cachedUser;
      }
      
      // Get fresh user data
      const user = await account.get();
      
      // Update cache
      cachedUser = user;
      lastFetchTime = now;
      
      return user;
    } catch (error) {
      console.error("Error getting current user:", error);
      cachedUser = null;
      return null;
    }
  },

  // Check if user is logged in
  async isLoggedIn() {
    try {
      const user = await this.getCurrentUser();
      return !!user;
    } catch (error) {
      return false;
    }
  },

  // Request password recovery
  async forgotPassword(email) {
    try {
      // Use Appwrite's password recovery endpoint
      await account.createRecovery(
        email,
        // URL the user will be redirected to after clicking the recovery link
        `${window.location.origin}/reset-password` // Appwrite will append userId and secret as query params
      );
      
      return { 
        success: true, 
        message: 'Password recovery email sent. Please check your inbox.' 
      };
    } catch (error) {
      console.error("Password recovery error:", error);
      return { 
        success: false, 
        message: error.message || 'Failed to send recovery email. Please try again.' 
      };
    }
  },

  // Complete the password recovery process
  async resetPassword(userId, secret, password, passwordAgain) {
    try {
      if (password !== passwordAgain) {
        return { success: false, message: 'Passwords do not match' };
      }
      
      await account.updateRecovery(userId, secret, password, passwordAgain);
      return { 
        success: true, 
        message: 'Password has been reset successfully. You can now log in.' 
      };
    } catch (error) {
      console.error("Password reset error:", error);
      return { 
        success: false, 
        message: error.message || 'Failed to reset password. Please try again.' 
      };
    }
  },
};

export default authService;