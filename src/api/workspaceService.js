import { databases, databaseId, workspacesCollectionId, ID, Query } from './appwrite';
import taskService from './taskService';

export const workspaceService = {
  // Get all workspaces for a user
  async getWorkspaces(userId) {
    try {
      const response = await databases.listDocuments(
        databaseId,
        workspacesCollectionId,
        [Query.equal('userId', userId)]
      );
      return response.documents;
    } catch (error) {
      console.error('Error fetching workspaces:', error);
      throw error;
    }
  },

  // Create a new workspace
  async createWorkspace(name, icon, color, userId, isDefault = false) {
    try {
      // If this is supposed to be a default workspace, check if one already exists
      if (isDefault) {
        // Use the dedicated method to handle default workspace creation
        return await this.createDefaultWorkspace(userId);
      }

      // Generate a string ID
      const docId = crypto.randomUUID();
      
      // Ensure we only include fields that match the schema
      // IMPORTANT: Include the "id" field in the document data as required by schema
      return await databases.createDocument(
        databaseId,
        workspacesCollectionId,
        docId,
        {
          id: docId, // Add the id field to match the schema
          name: name,
          icon: icon,
          color: color,
          userId: userId,
          isDefault: isDefault
        }
      );
    } catch (error) {
      console.error('Error creating workspace:', error);
      throw error;
    }
  },

  // Update an existing workspace
  async updateWorkspace(id, updates) {
    try {
      // If we're trying to set this workspace as default
      if (updates.isDefault === true) {
        // First, check if there are any existing default workspaces
        const existingDefaults = await this.getDefaultWorkspaces(updates.userId || '');
        
        // Update all existing defaults to non-default
        for (const workspace of existingDefaults) {
          if (workspace.$id !== id) {
            await databases.updateDocument(
              databaseId,
              workspacesCollectionId,
              workspace.$id,
              { isDefault: false }
            );
          }
        }
      }
      
      // Ensure we only update fields that are in the schema
      const validUpdates = {};
      if (updates.name !== undefined) validUpdates.name = updates.name;
      if (updates.icon !== undefined) validUpdates.icon = updates.icon;
      if (updates.color !== undefined) validUpdates.color = updates.color;
      if (updates.isDefault !== undefined) validUpdates.isDefault = updates.isDefault;
      
      return await databases.updateDocument(
        databaseId,
        workspacesCollectionId,
        id,
        validUpdates
      );
    } catch (error) {
      console.error('Error updating workspace:', error);
      throw error;
    }
  },

  // Delete a workspace
  async deleteWorkspace(id) {
    try {
      // First, delete all tasks associated with this workspace
      await taskService.deleteTasksByWorkspaceId(id);
      
      // Then delete the workspace itself
      return await databases.deleteDocument(
        databaseId,
        workspacesCollectionId,
        id
      );
    } catch (error) {
      console.error('Error deleting workspace:', error);
      throw error;
    }
  },

  // Get ALL default workspaces for a user (should only be one, but checking for multiples)
  async getDefaultWorkspaces(userId) {
    try {
      // This method is called frequently, so we'll optimize the query
      // to return only the necessary fields to save bandwidth
      const response = await databases.listDocuments(
        databaseId,
        workspacesCollectionId,
        [
          Query.equal('userId', userId),
          Query.equal('isDefault', true)
        ]
      );
      
      return response.documents;
    } catch (error) {
      console.error('Error fetching default workspaces:', error);
      throw error;
    }
  },

  // Get SINGLE default workspace for a user
  async getDefaultWorkspace(userId) {
    try {
      const defaultWorkspaces = await this.getDefaultWorkspaces(userId);
      
      if (defaultWorkspaces.length > 0) {
        // Return the first default workspace
        return defaultWorkspaces[0];
      }
      
      return null;
    } catch (error) {
      console.error('Error fetching default workspace:', error);
      throw error;
    }
  },

  // Clean up duplicate default workspaces
  async cleanupDefaultWorkspaces(userId) {
    try {
      const defaultWorkspaces = await this.getDefaultWorkspaces(userId);
      
      // If no default workspaces or just one, no need to clean up
      if (defaultWorkspaces.length <= 1) {
        return defaultWorkspaces.length === 1 ? defaultWorkspaces[0] : null;
      }
      
      // If we have more than one default workspace, keep only the first one
      // Update all others to non-default in a single batch if possible
      const updatePromises = [];
      for (let i = 1; i < defaultWorkspaces.length; i++) {
        updatePromises.push(
          databases.updateDocument(
            databaseId,
            workspacesCollectionId,
            defaultWorkspaces[i].$id,
            { isDefault: false }
          )
        );
      }
      
      // Wait for all updates to complete
      await Promise.all(updatePromises);
      
      // Return the one we kept as default
      return defaultWorkspaces[0];
    } catch (error) {
      console.error('Error cleaning up default workspaces:', error);
      throw error;
    }
  },

  // Create a default workspace for new users
  async createDefaultWorkspace(userId) {
    try {
      // First check if a default workspace already exists to avoid redundant cleanup
      const existingDefaults = await this.getDefaultWorkspaces(userId);
      
      // If at least one default workspace exists, run cleanup and return the first one
      if (existingDefaults.length > 0) {
        // Only run cleanup if we have multiple default workspaces
        if (existingDefaults.length > 1) {
          await this.cleanupDefaultWorkspaces(userId);
        }
        return existingDefaults[0];
      }
      
      // Otherwise create a new default workspace
      const docId = crypto.randomUUID();
      
      return await databases.createDocument(
        databaseId,
        workspacesCollectionId,
        docId,
        {
          id: docId,
          name: 'Default',
          icon: '📋',
          color: 'indigo',
          userId: userId,
          isDefault: true
        }
      );
    } catch (error) {
      console.error('Error creating default workspace:', error);
      throw error;
    }
  },
  
  // Delete all workspaces for testing purposes
  async deleteAllWorkspaces(userId) {
    try {
      const workspaces = await this.getWorkspaces(userId);
      
      // Delete all workspaces in parallel for better performance
      const deletePromises = workspaces.map(workspace => 
        this.deleteWorkspace(workspace.$id)
      );
      
      await Promise.all(deletePromises);
      
      return { success: true };
    } catch (error) {
      console.error('Error deleting all workspaces:', error);
      throw error;
    }
  }
};

export default workspaceService; 