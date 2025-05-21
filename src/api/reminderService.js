import { databases, databaseId, remindersCollectionId, ID, Query } from './appwrite';

export const reminderService = {
  // Get all reminders for a user or all reminders if no userId is provided
  async getReminders(userId) {
    try {
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
      return response.documents;
    } catch (error) {
      console.error('Error fetching reminders:', error);
      throw error;
    }
  },

  // Get reminders for a specific task
  async getTaskReminders(taskId) {
    try {
      const response = await databases.listDocuments(
        databaseId,
        remindersCollectionId,
        [Query.equal('taskId', taskId)]
      );
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
      return await databases.createDocument(
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
      return await databases.updateDocument(
        databaseId,
        remindersCollectionId,
        id,
        { status: validStatus }
      );
    } catch (error) {
      console.error('Error updating reminder status:', error);
      throw error;
    }
  },

  // Delete a reminder
  async deleteReminder(id) {
    try {
      return await databases.deleteDocument(
        databaseId,
        remindersCollectionId,
        id
      );
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
      
      return await Promise.all(deletionPromises);
    } catch (error) {
      console.error('Error deleting task reminders:', error);
      throw error;
    }
  }
};

export default reminderService; 