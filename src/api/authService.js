import { account, ID, OAuthProvider } from './appwrite';

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
      
      // First check if we have a valid session before trying to get user data
      try {
        // This will throw an error if there's no valid session
        const session = await account.getSession('current');
        
        if (session) {
          // Only try to get user if we have a valid session
          const user = await account.get();
          
          // Update cache
          cachedUser = user;
          lastFetchTime = now;
          
          return user;
        }
      } catch (sessionError) {
        // If there's no current session, return null without showing an error
        cachedUser = null;
        return null;
      }
      
      return null;
    } catch (error) {
      // This will only catch errors other than missing session
      console.error("Error getting current user:", error);
      cachedUser = null;
      return null;
    }
  },

  // Check if user is logged in
  async isLoggedIn() {
    try {
      // Try to get the current session first
      try {
        const session = await account.getSession('current');
        // If we get here, we have a valid session
        const user = await this.getCurrentUser();
        return !!user;
      } catch (sessionError) {
        // No valid session
        return false;
      }
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

  // Create OAuth2 session with Google
  async loginWithGoogle() {
    try {
      // Create OAuth2 session with Google
      // This will redirect the user to Google's OAuth page
      await account.createOAuth2Session(
        OAuthProvider.Google,
        `${window.location.origin}/auth/callback`, // Success redirect URL
        `${window.location.origin}/login`, // Failure redirect URL
        ['openid', 'email', 'profile'] // Scopes
      );
    } catch (error) {
      console.error("Google OAuth error:", error);
      throw error;
    }
  },

  // Handle OAuth callback (extract user info after redirect)
  async handleOAuthCallback() {
    try {
      // After OAuth redirect, get the current user
      const user = await account.get();

      // Update cache
      cachedUser = user;
      lastFetchTime = Date.now();

      return user;
    } catch (error) {
      console.error("OAuth callback error:", error);
      throw error;
    }
  },

  // Send email verification
  async sendEmailVerification() {
    try {
      await account.createVerification(
        `${window.location.origin}/verify-email` // URL the user will be redirected to after clicking the verification link
      );

      return {
        success: true,
        message: 'Verification email sent. Please check your inbox.'
      };
    } catch (error) {
      console.error("Email verification error:", error);
      return {
        success: false,
        message: error.message || 'Failed to send verification email. Please try again.'
      };
    }
  },

  // Verify email with userId and secret from URL
  async verifyEmail(userId, secret) {
    try {
      await account.updateVerification(userId, secret);

      // Clear cache to force refresh of user data
      cachedUser = null;

      return {
        success: true,
        message: 'Email verified successfully!'
      };
    } catch (error) {
      console.error("Email verification confirmation error:", error);
      return {
        success: false,
        message: error.message || 'Failed to verify email. The link may be expired or invalid.'
      };
    }
  },

  // Resend email verification
  async resendEmailVerification() {
    try {
      // Same as sendEmailVerification but with different messaging
      await account.createVerification(
        `${window.location.origin}/verify-email`
      );

      return {
        success: true,
        message: 'Verification email resent. Please check your inbox.'
      };
    } catch (error) {
      console.error("Resend verification error:", error);
      return {
        success: false,
        message: error.message || 'Failed to resend verification email. Please try again.'
      };
    }
  },

  // Check if current user's email is verified
  async isEmailVerified() {
    try {
      const user = await this.getCurrentUser();
      return user ? user.emailVerification : false;
    } catch (error) {
      console.error("Email verification check error:", error);
      return false;
    }
  },
};

export default authService;