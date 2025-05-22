import { databases, databaseId, tasksCollectionId, workspacesCollectionId, ID, Query } from './appwrite';
import { account } from './appwrite';

// Add caching for tasks to prevent duplicate API calls
const taskCache = {
  // Cache by workspace and user: { `${userId}-${workspaceId}`: { data: [], timestamp: Date.now() } }
  byWorkspace: new Map(),
  // Cache expiry in milliseconds (30 seconds)
  CACHE_EXPIRY: 30000
};

// Cache management functions
const cacheHelpers = {
  getCacheKey: (userId, workspaceId) => {
    return `${userId}-${workspaceId || 'default'}`;
  },
  
  isCacheValid: (timestamp) => {
    return timestamp && (Date.now() - timestamp < taskCache.CACHE_EXPIRY);
  },
  
  clearCache: (userId, workspaceId) => {
    if (userId) {
      if (workspaceId) {
        // Clear specific workspace cache
        taskCache.byWorkspace.delete(cacheHelpers.getCacheKey(userId, workspaceId));
      } else {
        // Clear all caches for this user
        const keysToDelete = [];
        taskCache.byWorkspace.forEach((_, key) => {
          if (key.startsWith(`${userId}-`)) {
            keysToDelete.push(key);
          }
        });
        keysToDelete.forEach(key => taskCache.byWorkspace.delete(key));
      }
    }
  },
  
  clearAllCaches: () => {
    taskCache.byWorkspace.clear();
  }
};

export const taskService = {
  // Get all tasks for a user and workspace
  async getTasks(userId, workspaceId) {
    try {
      // Check cache first
      const cacheKey = cacheHelpers.getCacheKey(userId, workspaceId);
      const cachedData = taskCache.byWorkspace.get(cacheKey);
      
      if (cachedData && cacheHelpers.isCacheValid(cachedData.timestamp)) {
        return cachedData.data;
      }
      
      // Skip further processing if workspaceId is invalid
      if (!workspaceId) {
        return [];
      }
      
      let response;
      let isSharedWorkspace = false;
      
      // Only check for shared workspace if we have a valid workspaceId
      // (not 'default' or empty string)
      if (workspaceId && workspaceId !== 'default') {
        try {
          const workspace = await databases.getDocument(
            databaseId,
            workspacesCollectionId,
            workspaceId
          );
          
          // Get current user's email for member check
          const user = await account.get();
          const userEmail = user.email;
          
          // Check if this is a shared workspace (either user is owner or member)
          isSharedWorkspace = workspace.members && workspace.members.length > 0;
          
        } catch (error) {
          console.error('Error checking workspace:', error);
          // If workspace doesn't exist or other error, return empty array
          return [];
        }
      }
      
      // For shared workspaces, get ALL tasks by workspaceId only
      // This allows all members to see all tasks in the workspace
      if (isSharedWorkspace) {
        response = await databases.listDocuments(
          databaseId,
          tasksCollectionId,
          [Query.equal('workspaceId', workspaceId)]
        );
      } else {
        // For user's own workspaces, get only their tasks
        const queries = [
          Query.equal('userId', userId)
        ];
        
        if (workspaceId && workspaceId !== 'default') {
          queries.push(Query.equal('workspaceId', workspaceId));
        }
        
        response = await databases.listDocuments(
          databaseId,
          tasksCollectionId,
          queries
        );
      }
      
      // Update cache
      taskCache.byWorkspace.set(cacheKey, {
        data: response.documents,
        timestamp: Date.now()
      });
      
      return response.documents;
    } catch (error) {
      console.error('Error fetching tasks:', error);
      throw error;
    }
  },

  // Create a new task
  async createTask(title, dueDate, urgency, workspaceId, userId) {
    try {
      // Skip if workspaceId is invalid
      if (!workspaceId || workspaceId === 'default') {
        throw new Error('Valid workspaceId is required');
      }
      
      let isSharedWorkspace = false;
      let workspace = null;
      
      try {
        // Get workspace details
        workspace = await databases.getDocument(
          databaseId,
          workspacesCollectionId,
          workspaceId
        );
        
        // Check if this is a shared workspace (has members)
        isSharedWorkspace = workspace.members && workspace.members.length > 0;
      } catch (error) {
        console.error('Error checking workspace for task creation:', error);
        throw new Error('Could not verify workspace');
      }
      
      const now = new Date().toISOString();
      // Generate a string ID
      const docId = crypto.randomUUID();
      
      // Only include fields that match the schema
      const newTask = await databases.createDocument(
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
      
      // Clear related cache
      cacheHelpers.clearCache(userId, workspaceId);
      
      // If this is a shared workspace, clear all caches to ensure everyone sees the new task
      if (isSharedWorkspace) {
        // Clear workspace owner's cache if different from task creator
        if (workspace.userId && workspace.userId !== userId) {
          cacheHelpers.clearCache(workspace.userId, workspaceId);
        }
        
        // Clear all caches to ensure all members see the updates
        // This is less efficient but ensures everyone sees the new task
        cacheHelpers.clearAllCaches();
      }
      
      return newTask;
    } catch (error) {
      console.error('Error creating task:', error);
      throw error;
    }
  },

  // Update an existing task
  async updateTask(id, updates) {
    try {
      // Get the current task first to get userId and workspaceId
      let task;
      try {
        task = await databases.getDocument(databaseId, tasksCollectionId, id);
      } catch (e) {
        console.error('Error getting task for update:', e);
        throw new Error('Task not found');
      }
      
      // Filter out any fields that don't match the schema
      const validUpdates = {};
      
      if (updates.title !== undefined) validUpdates.title = updates.title;
      if (updates.dueDate !== undefined) validUpdates.dueDate = updates.dueDate;
      if (updates.urgency !== undefined) validUpdates.urgency = Number(updates.urgency);
      if (updates.completed !== undefined) validUpdates.completed = updates.completed;
      if (updates.comments !== undefined) validUpdates.comments = updates.comments;
      
      // Always update the updatedAt field
      validUpdates.updatedAt = new Date().toISOString();
      
      const updatedTask = await databases.updateDocument(
        databaseId,
        tasksCollectionId,
        id,
        validUpdates
      );
      
      // Clear cache for the task owner
      if (task.userId) {
        cacheHelpers.clearCache(task.userId, task.workspaceId);
      }
      
      // Check if this is a shared workspace and clear cache for all members
      if (task.workspaceId && task.workspaceId !== 'default') {
        try {
          const workspace = await databases.getDocument(
            databaseId,
            workspacesCollectionId,
            task.workspaceId
          );
          
          // If it's a shared workspace with members
          if (workspace.members && workspace.members.length > 0) {
            // Clear cache for workspace owner if different from task creator
            if (workspace.userId && workspace.userId !== task.userId) {
              cacheHelpers.clearCache(workspace.userId, task.workspaceId);
            }
            
            // Clear all caches to ensure all members see the updates immediately
            cacheHelpers.clearAllCaches();
          }
        } catch (error) {
          console.error('Error clearing cache for shared workspace members:', error);
          // Continue with the update even if cache clearing fails
        }
      }
      
      return updatedTask;
    } catch (error) {
      console.error('Error updating task:', error);
      throw error;
    }
  },

  // Delete a task
  async deleteTask(id) {
    try {
      // Get the task first to know which cache to clear
      let task;
      try {
        task = await databases.getDocument(databaseId, tasksCollectionId, id);
      } catch (e) {
        console.error('Error getting task for deletion:', e);
        // Continue with deletion attempt even if we can't get the task
      }
      
      const result = await databases.deleteDocument(
        databaseId,
        tasksCollectionId,
        id
      );
      
      // If we have task info, clear specific caches
      if (task) {
        // Clear cache for the task owner
        if (task.userId) {
          cacheHelpers.clearCache(task.userId, task.workspaceId);
        }
        
        // Check if this is a shared workspace and clear cache for all members
        if (task.workspaceId && task.workspaceId !== 'default') {
          try {
            const workspace = await databases.getDocument(
              databaseId,
              workspacesCollectionId,
              task.workspaceId
            );
            
            // If it's a shared workspace with members
            if (workspace.members && workspace.members.length > 0) {
              // Clear cache for workspace owner if different from task creator
              if (workspace.userId && workspace.userId !== task.userId) {
                cacheHelpers.clearCache(workspace.userId, task.workspaceId);
              }
              
              // Clear all caches to ensure all members see the updates immediately
              cacheHelpers.clearAllCaches();
            }
          } catch (error) {
            console.error('Error clearing cache for shared workspace members:', error);
            // Continue even if cache clearing fails
          }
        }
      } else {
        // If we don't have task info, clear all caches to be safe
        cacheHelpers.clearAllCaches();
      }
      
      return result;
    } catch (error) {
      console.error('Error deleting task:', error);
      throw error;
    }
  },

  // Delete all tasks for a specific workspace
  async deleteTasksByWorkspaceId(workspaceId) {
    try {
      // First, get all tasks for this workspace
      // We can't know the user ID here, so we'll search only by workspace ID
      const response = await databases.listDocuments(
        databaseId,
        tasksCollectionId,
        [Query.equal('workspaceId', workspaceId)]
      );
      
      // If no tasks found, return early
      if (response.documents.length === 0) {
        return { success: true, deletedCount: 0 };
      }
      
      // Delete all tasks in parallel for better performance
      const deletePromises = response.documents.map(task => 
        this.deleteTask(task.$id)
      );
      
      await Promise.all(deletePromises);
      
      // Get user IDs from tasks to clear caches
      const uniqueUserIds = [...new Set(response.documents.map(task => task.userId))];
      
      // Clear caches for all affected users
      uniqueUserIds.forEach(userId => {
        cacheHelpers.clearCache(userId, workspaceId);
      });
      
      return { success: true, deletedCount: response.documents.length };
    } catch (error) {
      console.error('Error deleting tasks by workspace ID:', error);
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
      const updatedTask = await this.updateTask(taskId, { 
        comments: updatedComments 
      });
      
      // Cache already cleared in updateTask
      
      return updatedTask;
    } catch (error) {
      console.error('Error adding comment to task:', error);
      throw error;
    }
  },
  
  // Toggle task completion status
  async toggleTaskCompletion(taskId, currentStatus) {
    try {
      const updatedTask = await this.updateTask(taskId, { 
        completed: !currentStatus 
      });
      
      // Cache already cleared in updateTask
      
      return updatedTask;
    } catch (error) {
      console.error('Error toggling task completion:', error);
      throw error;
    }
  },
  
  // Clear all caches (useful when switching users or for debugging)
  clearCaches() {
    cacheHelpers.clearAllCaches();
  }
};

export default taskService; 