import { databases, databaseId, tasksCollectionId, ID, Query } from './appwrite';

export const taskService = {
  // Get all tasks for a user and workspace
  async getTasks(userId, workspaceId) {
    try {
      const queries = [
        Query.equal('userId', userId)
      ];
      
      if (workspaceId) {
        queries.push(Query.equal('workspaceId', workspaceId));
      }
      
      const response = await databases.listDocuments(
        databaseId,
        tasksCollectionId,
        queries
      );
      
      return response.documents;
    } catch (error) {
      console.error('Error fetching tasks:', error);
      throw error;
    }
  },

  // Create a new task
  async createTask(title, dueDate, urgency, workspaceId, userId) {
    try {
      const now = new Date().toISOString();
      // Generate a string ID
      const docId = crypto.randomUUID();
      
      // Only include fields that match the schema
      return await databases.createDocument(
        databaseId,
        tasksCollectionId,
        docId,
        {
          id: docId, // Include id field as required by schema
          title: title,
          dueDate: dueDate,
          urgency: Number(urgency), // Ensure urgency is a number (Double)
          completed: false,
          createdAt: now,
          updatedAt: now,
          workspaceId: workspaceId,
          userId: userId,
          comments: [] // Optional field
        }
      );
    } catch (error) {
      console.error('Error creating task:', error);
      throw error;
    }
  },

  // Update an existing task
  async updateTask(id, updates) {
    try {
      // Filter out any fields that don't match the schema
      const validUpdates = {};
      
      if (updates.title !== undefined) validUpdates.title = updates.title;
      if (updates.dueDate !== undefined) validUpdates.dueDate = updates.dueDate;
      if (updates.urgency !== undefined) validUpdates.urgency = Number(updates.urgency);
      if (updates.completed !== undefined) validUpdates.completed = updates.completed;
      if (updates.comments !== undefined) validUpdates.comments = updates.comments;
      
      // Always update the updatedAt field
      validUpdates.updatedAt = new Date().toISOString();
      
      return await databases.updateDocument(
        databaseId,
        tasksCollectionId,
        id,
        validUpdates
      );
    } catch (error) {
      console.error('Error updating task:', error);
      throw error;
    }
  },

  // Delete a task
  async deleteTask(id) {
    try {
      return await databases.deleteDocument(
        databaseId,
        tasksCollectionId,
        id
      );
    } catch (error) {
      console.error('Error deleting task:', error);
      throw error;
    }
  },

  // Add a comment to a task
  async addComment(taskId, comment) {
    try {
      // First, get the current task to retrieve existing comments
      const task = await databases.getDocument(
        databaseId,
        tasksCollectionId,
        taskId
      );
      
      // Convert the comment object to a string since Appwrite expects strings in arrays
      const commentString = JSON.stringify(comment);
      
      // Add the new comment to the comments array
      const updatedComments = [...(task.comments || []), commentString];
      
      // Update the task with the new comments array
      return await this.updateTask(taskId, { 
        comments: updatedComments 
      });
    } catch (error) {
      console.error('Error adding comment to task:', error);
      throw error;
    }
  },
  
  // Toggle task completion status
  async toggleTaskCompletion(taskId, currentStatus) {
    try {
      return await this.updateTask(taskId, { 
        completed: !currentStatus 
      });
    } catch (error) {
      console.error('Error toggling task completion:', error);
      throw error;
    }
  }
};

export default taskService; 