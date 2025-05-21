import { databases, databaseId, workspacesCollectionId, ID, Query } from './appwrite';

export const workspaceService = {
  // Get all workspaces for a user
  async getWorkspaces(userId) {
    try {
      console.log('Getting workspaces for user:', userId);
      const response = await databases.listDocuments(
        databaseId,
        workspacesCollectionId,
        [Query.equal('userId', userId)]
      );
      console.log('Found workspaces:', response.documents);
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
      
      console.log('Creating regular workspace with name:', name);
      
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
            console.log('Setting workspace to non-default:', workspace.$id);
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
      console.log('Looking for ALL default workspaces for user:', userId);
      const response = await databases.listDocuments(
        databaseId,
        workspacesCollectionId,
        [
          Query.equal('userId', userId),
          Query.equal('isDefault', true)
        ]
      );
      
      console.log('Found default workspaces:', response.documents.length);
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
      
      // If we have more than one default workspace, keep only the first one
      if (defaultWorkspaces.length > 1) {
        console.log('Found multiple default workspaces, cleaning up...');
        
        // Keep the first one as default, change all others to non-default
        for (let i = 1; i < defaultWorkspaces.length; i++) {
          await this.updateWorkspace(defaultWorkspaces[i].$id, { isDefault: false });
        }
        
        return defaultWorkspaces[0]; // Return the one we kept as default
      } else if (defaultWorkspaces.length === 1) {
        return defaultWorkspaces[0]; // Just return the only default workspace
      }
      
      return null; // No default workspaces found
    } catch (error) {
      console.error('Error cleaning up default workspaces:', error);
      throw error;
    }
  },

  // Create a default workspace for new users
  async createDefaultWorkspace(userId) {
    try {
      console.log('Creating default workspace requested for user:', userId);
      
      // First run the cleanup to ensure there's only one default workspace (or none)
      const existingDefault = await this.cleanupDefaultWorkspaces(userId);
      
      // If a default workspace already exists after cleanup, return it
      if (existingDefault) {
        console.log("Default workspace already exists after cleanup:", existingDefault.$id);
        return existingDefault;
      }
      
      // Otherwise create a new default workspace
      console.log("No default workspace found, creating a new one");
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
      
      for (const workspace of workspaces) {
        await this.deleteWorkspace(workspace.$id);
      }
      
      return { success: true };
    } catch (error) {
      console.error('Error deleting all workspaces:', error);
      throw error;
    }
  }
};

export default workspaceService; 