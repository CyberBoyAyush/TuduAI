/**
 * File: WorkspaceContext.jsx
 * Purpose: Manages workspaces for the user to organize tasks
 */
import { createContext, useState, useContext, useEffect, useRef } from 'react';
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
  const { currentUser } = useAuth();
  const [workspaces, setWorkspaces] = useState(DEFAULT_WORKSPACES);
  const [activeWorkspaceId, setActiveWorkspaceId] = useState('default');
  const [loading, setLoading] = useState(true);
  const hasCleanedUp = useRef(false);

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
        }
        return;
      }

      try {
        // Only perform cleanup once per session for this user
        if (!hasCleanedUp.current) {
          await workspaceService.cleanupDefaultWorkspaces(currentUser.$id);
          hasCleanedUp.current = true;
        }
        
        // Now fetch all workspaces for the user
        const fetchedWorkspaces = await workspaceService.getWorkspaces(currentUser.$id);
        
        if (!isMounted) return;
        
        if (fetchedWorkspaces && fetchedWorkspaces.length > 0) {
          setWorkspaces(fetchedWorkspaces);
          
          // Find the default workspace
          const defaultWorkspace = fetchedWorkspaces.find(w => w.isDefault === true);
          
          if (defaultWorkspace) {
            setActiveWorkspaceId(defaultWorkspace.$id);
          } else {
            // If no default workspace, use the first one
            setActiveWorkspaceId(fetchedWorkspaces[0].$id);
          }
        } else {
          // If no workspaces, create a default one
          const defaultWorkspace = await workspaceService.createDefaultWorkspace(currentUser.$id);
          
          if (!isMounted) return;
          
          setWorkspaces([defaultWorkspace]);
          setActiveWorkspaceId(defaultWorkspace.$id);
        }
      } catch (error) {
        console.error("Error fetching workspaces:", error);
      } finally {
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

  // Add a new workspace
  const addWorkspace = async (name, icon = '📋', color = 'indigo') => {
    if (workspaces.length >= MAX_WORKSPACES) {
      throw new Error(`Maximum of ${MAX_WORKSPACES} workspaces allowed`);
    }
    
    if (!currentUser) {
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
      const updatedWorkspaces = await workspaceService.getWorkspaces(currentUser.$id);
      setWorkspaces(updatedWorkspaces);
      
      return newWorkspace.$id;
    } catch (error) {
      console.error("Error adding workspace:", error);
      throw error;
    }
  };

  // Update an existing workspace
  const updateWorkspace = async (id, updates) => {
    if (!currentUser) {
      throw new Error('You must be logged in to update a workspace');
    }
    
    try {
      // Add userId to updates for permission checks in the service
      const updatesWithUserId = { ...updates, userId: currentUser.$id };
      const updatedWorkspace = await workspaceService.updateWorkspace(id, updatesWithUserId);
      
      // Refresh all workspaces to ensure consistency
      const refreshedWorkspaces = await workspaceService.getWorkspaces(currentUser.$id);
      setWorkspaces(refreshedWorkspaces);
      
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
      
      await workspaceService.deleteWorkspace(id);
      
      // Refresh workspaces after deletion
      const updatedWorkspaces = await workspaceService.getWorkspaces(currentUser.$id);
      setWorkspaces(updatedWorkspaces);
      
      // If the active workspace is being deleted, switch to the default workspace
      // or the first available one if default doesn't exist
      if (activeWorkspaceId === id) {
        const defaultWorkspace = updatedWorkspaces.find(w => w.isDefault === true);
        if (defaultWorkspace) {
          setActiveWorkspaceId(defaultWorkspace.$id);
        } else if (updatedWorkspaces.length > 0) {
          setActiveWorkspaceId(updatedWorkspaces[0].$id);
        }
      }
    } catch (error) {
      console.error("Error deleting workspace:", error);
      throw error;
    }
  };

  // Switch active workspace
  const switchWorkspace = (id) => {
    const workspaceExists = workspaces.some(w => w.$id === id);
    if (!workspaceExists) {
      console.error(`Workspace with id ${id} not found`);
      return;
    }
    
    setActiveWorkspaceId(id);
  };

  // Get the current active workspace
  const getActiveWorkspace = () => {
    return workspaces.find(w => w.$id === activeWorkspaceId) || workspaces[0];
  };
  
  // For testing and cleanup - remove all workspaces
  const resetWorkspaces = async () => {
    if (!currentUser) return;
    
    try {
      await workspaceService.deleteAllWorkspaces(currentUser.$id);
      const defaultWorkspace = await workspaceService.createDefaultWorkspace(currentUser.$id);
      setWorkspaces([defaultWorkspace]);
      setActiveWorkspaceId(defaultWorkspace.$id);
      hasCleanedUp.current = true;
    } catch (error) {
      console.error("Error resetting workspaces:", error);
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
    loading
  };

  return (
    <WorkspaceContext.Provider value={value}>
      {children}
    </WorkspaceContext.Provider>
  );
}
