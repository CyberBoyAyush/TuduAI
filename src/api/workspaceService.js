import { databases, databaseId, workspacesCollectionId, ID, Query } from './appwrite';
import taskService from './taskService';
import { account } from './appwrite';

export const workspaceService = {
  // Cache for workspaces
  _workspaceCache: {
    data: null,
    timestamp: 0,
    expiryMs: 30000 // 30 seconds cache
  },
  
  // Get all workspaces for a user
  async getWorkspaces(userId) {
    try {
      // Check cache first (except for the first load)
      const now = Date.now();
      if (this._workspaceCache.data && 
          (now - this._workspaceCache.timestamp < this._workspaceCache.expiryMs)) {
        return this._workspaceCache.data;
      }
      
      // First get the user's email for shared workspace lookup
      const user = await account.get();
      const userEmail = user.email;
      
      // Fetch both owned and shared workspaces in parallel for faster loading
      const [ownedResponse, sharedResponse] = await Promise.all([
        // Get workspaces owned by the user
        databases.listDocuments(
          databaseId,
          workspacesCollectionId,
          [Query.equal('userId', userId)]
        ),
        
        // Get workspaces where the user is a member (using email)
        databases.listDocuments(
          databaseId,
          workspacesCollectionId,
          [Query.search('members', userEmail)]
        )
      ]);
      
      // Combine both sets of workspaces and remove duplicates
      const allWorkspaces = [
        ...ownedResponse.documents,
        ...sharedResponse.documents.filter(shared => 
          !ownedResponse.documents.some(owned => owned.$id === shared.$id)
        )
      ];
      
      // Update cache
      this._workspaceCache = {
        data: allWorkspaces,
        timestamp: Date.now(),
        expiryMs: 30000
      };
      
      return allWorkspaces;
    } catch (error) {
      console.error('Error fetching workspaces:', error);
      throw error;
    }
  },
  
  // Clear workspace cache (call this when workspaces are modified)
  clearWorkspaceCache() {
    this._workspaceCache = {
      data: null,
      timestamp: 0,
      expiryMs: 30000
    };
  },

  // Create a new workspace
  async createWorkspace(name, icon, color, userId, isDefault = false) {
    try {
      // If this is supposed to be a default workspace, check if one already exists
      if (isDefault) {
        // Use the dedicated method to handle default workspace creation
        return await this.createDefaultWorkspace(userId);
      }

      // Get the user's email for the ownerEmail field
      const user = await account.get();
      const userEmail = user.email;

      // Generate a string ID
      const docId = crypto.randomUUID();
      
      // Ensure we only include fields that match the schema
      // IMPORTANT: Include the "id" field in the document data as required by schema
      const newWorkspace = await databases.createDocument(
        databaseId,
        workspacesCollectionId,
        docId,
        {
          id: docId, // Add the id field to match the schema
          name: name,
          icon: icon,
          color: color,
          userId: userId,
          isDefault: isDefault,
          members: [], // Initialize empty members array
          ownerEmail: userEmail // Add owner's email
        }
      );
      
      // Clear cache when creating a workspace
      this.clearWorkspaceCache();
      
      return newWorkspace;
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
      if (updates.members !== undefined) validUpdates.members = updates.members;
      
      const updatedWorkspace = await databases.updateDocument(
        databaseId,
        workspacesCollectionId,
        id,
        validUpdates
      );
      
      // Clear cache when updating a workspace
      this.clearWorkspaceCache();
      
      return updatedWorkspace;
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
      const result = await databases.deleteDocument(
        databaseId,
        workspacesCollectionId,
        id
      );
      
      // Clear cache when deleting a workspace
      this.clearWorkspaceCache();
      
      return result;
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

  // Get SINGLE default workspace for a user (only owned by the user)
  async getDefaultWorkspace(userId) {
    try {
      const defaultWorkspaces = await this.getDefaultWorkspaces(userId);
      
      // Filter to only include workspaces owned by this user
      const ownedDefaults = defaultWorkspaces.filter(workspace => workspace.userId === userId);
      
      if (ownedDefaults.length > 0) {
        // Return the first owned default workspace
        return ownedDefaults[0];
      }
      
      return null;
    } catch (error) {
      console.error('Error fetching default workspace:', error);
      throw error;
    }
  },

  // Clean up duplicate default workspaces (only for owned workspaces)
  async cleanupDefaultWorkspaces(userId) {
    try {
      const defaultWorkspaces = await this.getDefaultWorkspaces(userId);
      
      // Filter to only include workspaces owned by this user
      const ownedDefaults = defaultWorkspaces.filter(workspace => workspace.userId === userId);
      
      // If no owned default workspaces or just one, no need to clean up
      if (ownedDefaults.length <= 1) {
        return ownedDefaults.length === 1 ? ownedDefaults[0] : null;
      }
      
      // If we have more than one owned default workspace, keep only the first one
      // Update all others to non-default in a single batch if possible
      const updatePromises = [];
      for (let i = 1; i < ownedDefaults.length; i++) {
        updatePromises.push(
          databases.updateDocument(
            databaseId,
            workspacesCollectionId,
            ownedDefaults[i].$id,
            { isDefault: false }
          )
        );
      }
      
      // Wait for all updates to complete
      await Promise.all(updatePromises);
      
      // Return the one we kept as default
      return ownedDefaults[0];
    } catch (error) {
      console.error('Error cleaning up default workspaces:', error);
      throw error;
    }
  },

  // Create a default workspace for new users
  async createDefaultWorkspace(userId) {
    try {
      // First check if a default workspace already exists for this specific user
      const existingDefaults = await this.getDefaultWorkspaces(userId);
      
      // Filter to only include workspaces owned by this user (not shared)
      const ownedDefaults = existingDefaults.filter(workspace => workspace.userId === userId);
      
      // If at least one owned default workspace exists, run cleanup and return the first one
      if (ownedDefaults.length > 0) {
        // Only run cleanup if we have multiple default workspaces
        if (ownedDefaults.length > 1) {
          await this.cleanupDefaultWorkspaces(userId);
          // Re-fetch after cleanup
          const cleanedDefaults = await this.getDefaultWorkspaces(userId);
          const cleanedOwnedDefaults = cleanedDefaults.filter(workspace => workspace.userId === userId);
          if (cleanedOwnedDefaults.length > 0) {
            return cleanedOwnedDefaults[0];
          }
        } else {
          return ownedDefaults[0];
        }
      }
      
      // Get the user's email for the ownerEmail field
      const user = await account.get();
      const userEmail = user.email;
      
      // Create a new default workspace since none exists for this user
      const docId = crypto.randomUUID();
      
      const defaultWorkspace = await databases.createDocument(
        databaseId,
        workspacesCollectionId,
        docId,
        {
          id: docId,
          name: 'Default',
          icon: '📋',
          color: 'indigo',
          userId: userId,
          isDefault: true,
          members: [], // Initialize empty members array
          ownerEmail: userEmail // Add owner's email
        }
      );
      
      // Clear cache when creating a default workspace
      this.clearWorkspaceCache();
      
      return defaultWorkspace;
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
  },

  // Add a member to a workspace
  async addMember(workspaceId, memberEmail, currentUserId) {
    try {
      // Get the workspace to check permissions
      const workspace = await databases.getDocument(
        databaseId,
        workspacesCollectionId,
        workspaceId
      );
      
      // Only the workspace owner can add members
      if (workspace.userId !== currentUserId) {
        throw new Error('Only the workspace owner can add members');
      }
      
      // Check if this is a default workspace
      if (workspace.isDefault) {
        throw new Error('Cannot share the default workspace');
      }
      
      // Get the current members array
      const members = workspace.members || [];
      
      // Check if we've reached the maximum number of members (5 total including owner)
      if (members.length >= 4) {
        throw new Error('Maximum of 5 users allowed per workspace (including owner)');
      }
      
      // Check if the member is already in the workspace
      if (members.includes(memberEmail)) {
        throw new Error('User is already a member of this workspace');
      }
      
      // Add the new member
      members.push(memberEmail);
      
      // Update the workspace
      const result = await databases.updateDocument(
        databaseId,
        workspacesCollectionId,
        workspaceId,
        { members: members }
      );
      
      // Clear cache when adding a member
      this.clearWorkspaceCache();
      
      return result;
    } catch (error) {
      console.error('Error adding member to workspace:', error);
      throw error;
    }
  },
  
  // Remove a member from a workspace
  async removeMember(workspaceId, memberEmail, currentUserId) {
    try {
      // Get the workspace to check permissions
      const workspace = await databases.getDocument(
        databaseId,
        workspacesCollectionId,
        workspaceId
      );

      // Only the workspace owner can remove members
      if (workspace.userId !== currentUserId) {
        throw new Error('Only the workspace owner can remove members');
      }

      // Get the current members array
      const members = workspace.members || [];

      // Remove the member
      const updatedMembers = members.filter(email => email !== memberEmail);

      // Update the workspace
      const result = await databases.updateDocument(
        databaseId,
        workspacesCollectionId,
        workspaceId,
        { members: updatedMembers }
      );

      // Clear cache when removing a member
      this.clearWorkspaceCache();

      return result;
    } catch (error) {
      console.error('Error removing member from workspace:', error);
      throw error;
    }
  },

  // Allow a user to leave a workspace they are a member of
  async leaveWorkspace(workspaceId, userEmail) {
    try {
      // Get the workspace
      const workspace = await databases.getDocument(
        databaseId,
        workspacesCollectionId,
        workspaceId
      );

      // Get the current members array
      const members = workspace.members || [];

      // Check if the user is actually a member
      if (!members.includes(userEmail)) {
        throw new Error('You are not a member of this workspace');
      }

      // Check if the user is the owner (owners cannot leave their own workspace)
      const user = await account.get();
      if (workspace.userId === user.$id) {
        throw new Error('Workspace owners cannot leave their own workspace');
      }

      // Remove the user from members
      const updatedMembers = members.filter(email => email !== userEmail);

      // Update the workspace
      const result = await databases.updateDocument(
        databaseId,
        workspacesCollectionId,
        workspaceId,
        { members: updatedMembers }
      );

      // Clear cache
      this.clearWorkspaceCache();

      // Return workspace data for email notification
      // Get owner email with fallback for older workspaces
      let ownerEmail = workspace.ownerEmail;
      if (!ownerEmail) {
        // For older workspaces without ownerEmail, we can't get the owner's email
        // since account.get() only works for the current user
        console.warn('Workspace missing ownerEmail field, cannot send notification');
        ownerEmail = null; // Will skip email notification
      }

      return {
        ...result,
        workspaceData: {
          name: workspace.name,
          icon: workspace.icon,
          ownerEmail: ownerEmail,
          memberEmail: userEmail,
          memberName: user.name || null
        }
      };
    } catch (error) {
      console.error('Error leaving workspace:', error);
      throw error;
    }
  },
  
  // Check if a user is the owner of a workspace
  async isWorkspaceOwner(workspaceId, userId) {
    try {
      const workspace = await databases.getDocument(
        databaseId,
        workspacesCollectionId,
        workspaceId
      );
      
      return workspace.userId === userId;
    } catch (error) {
      console.error('Error checking workspace ownership:', error);
      return false;
    }
  },
  
  // Get all members of a workspace
  async getWorkspaceMembers(workspaceId, currentUserId) {
    try {
      // Get the current user's email
      const user = await account.get();
      const userEmail = user.email;
      
      const workspace = await databases.getDocument(
        databaseId,
        workspacesCollectionId,
        workspaceId
      );
      
      // Only the workspace owner or members can view the member list
      if (workspace.userId !== currentUserId && !workspace.members.includes(userEmail)) {
        throw new Error('You do not have permission to view this workspace');
      }
      
      // Use the stored ownerEmail if available, otherwise get it
      let ownerEmail = workspace.ownerEmail;
      
      // If ownerEmail is not available in the document, use fallback
      if (!ownerEmail) {
        console.warn('Workspace missing ownerEmail field');
        ownerEmail = workspace.userId; // Fallback to userId if email is not available
      }
      
      return {
        owner: ownerEmail, // Return email instead of userId
        members: workspace.members || []
      };
    } catch (error) {
      console.error('Error getting workspace members:', error);
      throw error;
    }
  }
};

export default workspaceService;