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
  }
};

export default authService; 