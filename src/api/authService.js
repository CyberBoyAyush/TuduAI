import { account, ID } from './appwrite';

export const authService = {
  // Register a new user
  async register(email, password, name) {
    try {
      // Create user account with a string ID
      const userId = crypto.randomUUID();
      
      console.log("Creating user with ID:", userId);
      
      const response = await account.create(
        userId,
        email,
        password,
        name
      );
      
      console.log("User created successfully:", response);
      
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
      console.log("Attempting login for:", email);
      const session = await account.createEmailPasswordSession(email, password);
      console.log("Login successful:", session);
      return session;
    } catch (error) {
      console.error("Login error:", error);
      throw error;
    }
  },

  // Logout user
  async logout() {
    try {
      return await account.deleteSession('current');
    } catch (error) {
      throw error;
    }
  },

  // Get current user
  async getCurrentUser() {
    try {
      const user = await account.get();
      console.log("Current user:", user);
      return user;
    } catch (error) {
      console.error("Error getting current user:", error);
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