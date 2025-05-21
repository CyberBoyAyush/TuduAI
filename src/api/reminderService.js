import { databases, databaseId, remindersCollectionId, ID, Query } from './appwrite';

// Add caching for reminders to prevent duplicate API calls
const reminderCache = {
  // Cache structure: { userId: { data: [], timestamp: Date.now() } }
  byUser: new Map(),
  // Cache structure: { taskId: { data: [], timestamp: Date.now() } }
  byTask: new Map(),
  // Cache expiry in milliseconds (30 seconds)
  CACHE_EXPIRY: 30000
};

// Cache management functions
const cacheHelpers = {
  isCacheValid: (timestamp) => {
    return timestamp && (Date.now() - timestamp < reminderCache.CACHE_EXPIRY);
  },
  
  clearUserCache: (userId) => {
    if (userId) {
      reminderCache.byUser.delete(userId);
    }
  },
  
  clearTaskCache: (taskId) => {
    if (taskId) {
      reminderCache.byTask.delete(taskId);
    }
  },
  
  clearAllCaches: () => {
    reminderCache.byUser.clear();
    reminderCache.byTask.clear();
  }
};

export const reminderService = {
  // Get all reminders for a user or all reminders if no userId is provided
  async getReminders(userId) {
    try {
      // Check cache first if userId is provided
      if (userId) {
        const cachedData = reminderCache.byUser.get(userId);
        if (cachedData && cacheHelpers.isCacheValid(cachedData.timestamp)) {
          return cachedData.data;
        }
      }
      
      let queries = [];
      
      // Only add userId filter if provided
      if (userId) {
        queries.push(Query.equal('userId', userId));
      }
      
      const response = await databases.listDocuments(
        databaseId,
        remindersCollectionId,
        queries
      );
      
      // Update cache if userId is provided
      if (userId) {
        reminderCache.byUser.set(userId, {
          data: response.documents,
          timestamp: Date.now()
        });
      }
      
      return response.documents;
    } catch (error) {
      console.error('Error fetching reminders:', error);
      throw error;
    }
  },

  // Get reminders for a specific task
  async getTaskReminders(taskId) {
    try {
      // Check cache first
      const cachedData = reminderCache.byTask.get(taskId);
      if (cachedData && cacheHelpers.isCacheValid(cachedData.timestamp)) {
        return cachedData.data;
      }
      
      const response = await databases.listDocuments(
        databaseId,
        remindersCollectionId,
        [Query.equal('taskId', taskId)]
      );
      
      // Update cache
      reminderCache.byTask.set(taskId, {
        data: response.documents,
        timestamp: Date.now()
      });
      
      return response.documents;
    } catch (error) {
      console.error('Error fetching task reminders:', error);
      throw error;
    }
  },

  // Create a new reminder
  async createReminder(text, dueDate, taskId, taskTitle, workspaceId, userId, userEmail, userName) {
    try {
      // Generate a string ID
      const docId = crypto.randomUUID();
      
      // Ensure fields match the schema exactly
      const newReminder = await databases.createDocument(
        databaseId,
        remindersCollectionId,
        docId,
        {
          id: docId,
          text: text.substring(0, 200), // Limit to schema's 200 char max
          dueDate: dueDate || new Date().toISOString(), // Required field - default to now if not provided
          taskId: taskId,
          taskTitle: taskTitle.substring(0, 100), // Limit to schema's 100 char max
          workspaceId: workspaceId,
          userId: userId,
          userEmail: userEmail,
          userName: userName.substring(0, 100), // Limit to schema's 100 char max
          createdAt: new Date().toISOString(),
          status: 'pending' // Use valid enum value from schema
        }
      );
      
      // Clear related caches to ensure data consistency
      cacheHelpers.clearUserCache(userId);
      cacheHelpers.clearTaskCache(taskId);
      
      return newReminder;
    } catch (error) {
      console.error('Error creating reminder:', error);
      throw error;
    }
  },

  // Update reminder status
  async updateReminderStatus(id, status) {
    try {
      // Ensure status is valid according to schema enum
      const validStatus = status === 'done' ? 'done' : 'pending';
      
      // Only update the status field which is in the schema
      const updatedReminder = await databases.updateDocument(
        databaseId,
        remindersCollectionId,
        id,
        { status: validStatus }
      );
      
      // Clear all caches as we don't know which specific ones to invalidate
      cacheHelpers.clearAllCaches();
      
      return updatedReminder;
    } catch (error) {
      console.error('Error updating reminder status:', error);
      throw error;
    }
  },

  // Delete a reminder
  async deleteReminder(id) {
    try {
      const result = await databases.deleteDocument(
        databaseId,
        remindersCollectionId,
        id
      );
      
      // Clear all caches as we don't know which specific ones to invalidate
      cacheHelpers.clearAllCaches();
      
      return result;
    } catch (error) {
      console.error('Error deleting reminder:', error);
      throw error;
    }
  },

  // Delete all reminders for a task
  async deleteTaskReminders(taskId) {
    try {
      const reminders = await this.getTaskReminders(taskId);
      
      const deletionPromises = reminders.map(reminder => 
        this.deleteReminder(reminder.$id)
      );
      
      // Clear task cache specifically
      cacheHelpers.clearTaskCache(taskId);
      
      return await Promise.all(deletionPromises);
    } catch (error) {
      console.error('Error deleting task reminders:', error);
      throw error;
    }
  },
  
  // Utility method to clear all caches (can be called when needed)
  clearCaches() {
    cacheHelpers.clearAllCaches();
  }
};

export default reminderService; 