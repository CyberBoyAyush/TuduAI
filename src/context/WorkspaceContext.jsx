/**
 * File: WorkspaceContext.jsx
 * Purpose: Manages workspaces for the user to organize tasks
 */
import { createContext, useState, useContext, useEffect, useRef, useCallback } from 'react';
import { useAuth } from './AuthContext';
import workspaceService from '../api/workspaceService';

const WorkspaceContext = createContext();

export function useWorkspace() {
  return useContext(WorkspaceContext);
}

const DEFAULT_WORKSPACES = [
  { id: 'default', name: 'Default', icon: '📋', color: 'indigo', isDefault: true }
];

const MAX_WORKSPACES = 5;

export function WorkspaceProvider({ children }) {
  // Fix: Safely access currentUser by not destructuring directly
  const auth = useAuth();
  const currentUser = auth?.currentUser;
  
  const [workspaces, setWorkspaces] = useState(DEFAULT_WORKSPACES);
  const [activeWorkspaceId, setActiveWorkspaceId] = useState('default');
  const [loading, setLoading] = useState(true);
  const hasCleanedUp = useRef(false);
  const initialLoadComplete = useRef(false);

  // Load workspaces from Appwrite when user changes
  useEffect(() => {
    let isMounted = true;
    
    const fetchWorkspaces = async () => {
      if (!currentUser) {
        if (isMounted) {
          setWorkspaces(DEFAULT_WORKSPACES);
          setActiveWorkspaceId('default');
          setLoading(false);
          hasCleanedUp.current = false;
          initialLoadComplete.current = false;
        }
        return;
      }

      // Keep showing loading state until all data is ready
      if (isMounted && !initialLoadComplete.current) {
        setLoading(true);
      }

      try {
        // Fetch all workspaces first
        const fetchedWorkspaces = await workspaceService.getWorkspaces(currentUser.$id);
        
        if (!isMounted) return;
        
        // Separate owned workspaces from shared workspaces
        const ownedWorkspaces = fetchedWorkspaces.filter(w => w.userId === currentUser.$id);
        const sharedWorkspaces = fetchedWorkspaces.filter(w => w.userId !== currentUser.$id);
        
        // Check if user has their own default workspace
        const ownedDefaultWorkspace = ownedWorkspaces.find(w => w.isDefault === true);
        
        let allWorkspaces = [];
        let defaultWorkspaceId = null;
        
        if (ownedDefaultWorkspace) {
          // User has their own default workspace
          allWorkspaces = fetchedWorkspaces; // Include both owned and shared
          defaultWorkspaceId = ownedDefaultWorkspace.$id;
        } else if (ownedWorkspaces.length > 0) {
          // User has workspaces but no default - make the first owned workspace default
          allWorkspaces = fetchedWorkspaces;
          defaultWorkspaceId = ownedWorkspaces[0].$id;
        } else {
          // User has no owned workspaces - create a default workspace
          const defaultWorkspace = await workspaceService.createDefaultWorkspace(currentUser.$id);
          allWorkspaces = [...fetchedWorkspaces, defaultWorkspace]; // Add to existing shared workspaces
          defaultWorkspaceId = defaultWorkspace.$id;
        }
        
        setWorkspaces(allWorkspaces);
        setActiveWorkspaceId(defaultWorkspaceId);
        
        initialLoadComplete.current = true;
        setLoading(false);
      } catch (error) {
        console.error("Error fetching workspaces:", error);
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchWorkspaces();
    
    // Cleanup function
    return () => {
      isMounted = false;
    };
  }, [currentUser]);

  // Refresh workspace list
  const refreshWorkspaces = useCallback(async () => {
    if (!currentUser) return;
    
    try {
      setLoading(true);
      
      // Clear the cache to ensure fresh data
      workspaceService.clearWorkspaceCache();
      
      // Fetch fresh workspace data
      const fetchedWorkspaces = await workspaceService.getWorkspaces(currentUser.$id);
      
      // Separate owned workspaces from shared workspaces (same logic as main fetch)
      const ownedWorkspaces = fetchedWorkspaces.filter(w => w.userId === currentUser.$id);
      
      // Check if user has their own default workspace
      const ownedDefaultWorkspace = ownedWorkspaces.find(w => w.isDefault === true);
      
      setWorkspaces(fetchedWorkspaces);
      
      // Ensure active workspace is still valid
      const workspaceExists = fetchedWorkspaces.some(w => 
        (w.$id === activeWorkspaceId || w.id === activeWorkspaceId)
      );
      
      if (!workspaceExists && fetchedWorkspaces.length > 0) {
        // Find user's own default workspace first, then any default, then first workspace
        if (ownedDefaultWorkspace) {
          setActiveWorkspaceId(ownedDefaultWorkspace.$id);
        } else if (ownedWorkspaces.length > 0) {
          setActiveWorkspaceId(ownedWorkspaces[0].$id);
        } else {
          setActiveWorkspaceId(fetchedWorkspaces[0].$id);
        }
      }
    } catch (error) {
      console.error("Error refreshing workspaces:", error);
    } finally {
      setLoading(false);
    }
  }, [currentUser, activeWorkspaceId]);
  
  // Add a new workspace
  const addWorkspace = async (name, icon = '📋', color = 'indigo') => {
    if (workspaces.length >= MAX_WORKSPACES) {
      throw new Error(`Maximum of ${MAX_WORKSPACES} workspaces allowed`);
    }
    
    if (!auth || !currentUser) {
      throw new Error('You must be logged in to create a workspace');
    }

    try {
      const newWorkspace = await workspaceService.createWorkspace(
        name, 
        icon, 
        color, 
        currentUser.$id,
        false // not default
      );
      
      // Refresh all workspaces to ensure consistency
      await refreshWorkspaces();
      
      return newWorkspace.$id;
    } catch (error) {
      console.error("Error adding workspace:", error);
      throw error;
    }
  };

  // Update an existing workspace
  const updateWorkspace = async (id, updates) => {
    if (!auth || !currentUser) {
      throw new Error('You must be logged in to update a workspace');
    }
    
    try {
      // Add userId to updates for permission checks in the service
      const updatesWithUserId = { ...updates, userId: currentUser.$id };
      const updatedWorkspace = await workspaceService.updateWorkspace(id, updatesWithUserId);
      
      // Refresh all workspaces to ensure consistency
      await refreshWorkspaces();
      
      return updatedWorkspace;
    } catch (error) {
      console.error("Error updating workspace:", error);
      throw error;
    }
  };

  // Delete a workspace
  const deleteWorkspace = async (id) => {
    try {
      // Don't allow deleting the default workspace or the last workspace
      const workspaceToDelete = workspaces.find(w => w.$id === id);
      
      if (!workspaceToDelete) {
        throw new Error('Workspace not found');
      }
      
      if (workspaceToDelete.isDefault) {
        throw new Error('Cannot delete the default workspace');
      }
      
      if (workspaces.length <= 1) {
        throw new Error('Cannot delete the last workspace');
      }
      
      // Store if we're deleting the active workspace
      const isDeletingActive = activeWorkspaceId === id;
      
      await workspaceService.deleteWorkspace(id);
      
      // Refresh workspaces after deletion
      await refreshWorkspaces();
      
      // If needed, the refreshWorkspaces function will already handle
      // updating the activeWorkspaceId if the current one was deleted
    } catch (error) {
      console.error("Error deleting workspace:", error);
      throw error;
    }
  };

  // Switch active workspace
  const switchWorkspace = (id) => {
    console.log('switchWorkspace called with id:', id);
    console.log('Current workspaces:', workspaces);
    
    // Check both id and $id properties to be safe
    const workspaceExists = workspaces.some(w => (w.$id === id || w.id === id));
    
    if (!workspaceExists) {
      console.error(`Workspace with id ${id} not found in`, workspaces);
      
      // Try to find a workspace with a similar ID
      const similarWorkspace = workspaces.find(w => 
        (w.$id && w.$id.includes(id)) || 
        (w.id && w.id.includes(id))
      );
      
      if (similarWorkspace) {
        console.log('Found similar workspace:', similarWorkspace);
        const actualId = similarWorkspace.$id || similarWorkspace.id;
        console.log(`Using similar workspace id: ${actualId}`);
        setActiveWorkspaceId(actualId);
        return;
      }
      
      return;
    }
    
    console.log(`Switching to workspace: ${id}`);
    setActiveWorkspaceId(id);
  };

  // Get the current active workspace
  const getActiveWorkspace = () => {
    return workspaces.find(w => w.$id === activeWorkspaceId) || workspaces[0];
  };
  
  // For testing and cleanup - remove all workspaces
  const resetWorkspaces = async () => {
    if (!auth || !currentUser) return;
    
    try {
      setLoading(true);
      await workspaceService.deleteAllWorkspaces(currentUser.$id);
      const defaultWorkspace = await workspaceService.createDefaultWorkspace(currentUser.$id);
      
      // Refresh workspace data
      await refreshWorkspaces();
      
      hasCleanedUp.current = true;
    } catch (error) {
      console.error("Error resetting workspaces:", error);
    } finally {
      setLoading(false);
    }
  };

  // Check if user is the owner of the workspace
  const isWorkspaceOwner = async (workspaceId) => {
    if (!auth || !currentUser) return false;
    
    try {
      return await workspaceService.isWorkspaceOwner(workspaceId, currentUser.$id);
    } catch (error) {
      console.error("Error checking workspace ownership:", error);
      return false;
    }
  };
  
  // Add a member to a workspace
  const addWorkspaceMember = async (workspaceId, memberEmail) => {
    if (!auth || !currentUser) {
      throw new Error('You must be logged in to add members');
    }
    
    try {
      const result = await workspaceService.addMember(workspaceId, memberEmail, currentUser.$id);
      
      // Refresh workspaces to ensure consistency
      await refreshWorkspaces();
      
      return result;
    } catch (error) {
      console.error("Error adding workspace member:", error);
      throw error;
    }
  };
  
  // Remove a member from a workspace
  const removeWorkspaceMember = async (workspaceId, memberEmail) => {
    if (!auth || !currentUser) {
      throw new Error('You must be logged in to remove members');
    }
    
    try {
      const result = await workspaceService.removeMember(workspaceId, memberEmail, currentUser.$id);
      
      // Refresh workspaces to ensure consistency
      await refreshWorkspaces();
      
      return result;
    } catch (error) {
      console.error("Error removing workspace member:", error);
      throw error;
    }
  };
  
  // Get all members of a workspace
  const getWorkspaceMembers = async (workspaceId) => {
    if (!auth || !currentUser) {
      throw new Error('You must be logged in to view members');
    }

    try {
      return await workspaceService.getWorkspaceMembers(workspaceId, currentUser.$id);
    } catch (error) {
      console.error("Error getting workspace members:", error);
      throw error;
    }
  };

  // Leave a workspace (for members, not owners)
  const leaveWorkspace = async (workspaceId) => {
    if (!auth || !currentUser) {
      throw new Error('You must be logged in to leave a workspace');
    }

    try {
      const result = await workspaceService.leaveWorkspace(workspaceId, currentUser.email);

      // Send email notification to workspace owner if we have the data
      if (result.workspaceData && result.workspaceData.ownerEmail) {
        try {
          const { sendWorkspaceLeaveNotification } = await import('../lib/zohoMailer');
          await sendWorkspaceLeaveNotification({
            ownerEmail: result.workspaceData.ownerEmail,
            workspaceName: result.workspaceData.name,
            memberEmail: result.workspaceData.memberEmail,
            memberName: result.workspaceData.memberName,
            workspaceIcon: result.workspaceData.icon
          });
          console.log('Leave notification email sent successfully');
        } catch (emailError) {
          console.error('Failed to send leave notification email:', emailError);
          // Don't throw error for email failure - the main action (leaving) was successful
        }
      }

      // Refresh workspaces to ensure consistency
      await refreshWorkspaces();

      // If the user left the currently active workspace, switch to another one
      if (activeWorkspaceId === workspaceId) {
        const remainingWorkspaces = workspaces.filter(w =>
          (w.$id !== workspaceId && w.id !== workspaceId) &&
          (w.userId === currentUser.$id || w.members?.includes(currentUser.email))
        );

        if (remainingWorkspaces.length > 0) {
          // Find default workspace or use first available
          const defaultWorkspace = remainingWorkspaces.find(w => w.isDefault === true);
          setActiveWorkspaceId(defaultWorkspace ? defaultWorkspace.$id : remainingWorkspaces[0].$id);
        }
      }

      return result;
    } catch (error) {
      console.error("Error leaving workspace:", error);
      throw error;
    }
  };

  const value = {
    workspaces,
    activeWorkspaceId,
    addWorkspace,
    updateWorkspace,
    deleteWorkspace,
    switchWorkspace,
    getActiveWorkspace,
    resetWorkspaces,
    refreshWorkspaces,
    isWorkspaceOwner,
    addWorkspaceMember,
    removeWorkspaceMember,
    getWorkspaceMembers,
    leaveWorkspace,
    loading
  };

  return (
    <WorkspaceContext.Provider value={value}>
      {children}
    </WorkspaceContext.Provider>
  );
}
