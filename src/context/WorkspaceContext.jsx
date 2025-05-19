/**
 * File: WorkspaceContext.jsx
 * Purpose: Manages workspaces for the user to organize tasks
 */
import { createContext, useState, useContext, useEffect } from 'react';
import { useAuth } from './AuthContext';

const WorkspaceContext = createContext();

export function useWorkspace() {
  return useContext(WorkspaceContext);
}

const DEFAULT_WORKSPACES = [
  { id: 'default', name: 'Default', icon: '📋', color: 'indigo' }
];

const MAX_WORKSPACES = 5;

export function WorkspaceProvider({ children }) {
  const { currentUser } = useAuth();
  const [workspaces, setWorkspaces] = useState(DEFAULT_WORKSPACES);
  const [activeWorkspaceId, setActiveWorkspaceId] = useState('default');
  const [loading, setLoading] = useState(true);

  // Load workspaces from localStorage when user changes
  useEffect(() => {
    if (!currentUser) {
      setWorkspaces(DEFAULT_WORKSPACES);
      setActiveWorkspaceId('default');
      setLoading(false);
      return;
    }

    const userKey = `workspaces_${currentUser.email}`;
    const savedWorkspaces = localStorage.getItem(userKey);
    
    if (savedWorkspaces) {
      setWorkspaces(JSON.parse(savedWorkspaces));
    } else {
      setWorkspaces(DEFAULT_WORKSPACES);
    }

    const activeKey = `active_workspace_${currentUser.email}`;
    const savedActive = localStorage.getItem(activeKey);
    
    if (savedActive) {
      setActiveWorkspaceId(savedActive);
    } else {
      setActiveWorkspaceId('default');
    }
    
    setLoading(false);
  }, [currentUser]);

  // Save workspaces to localStorage when they change
  useEffect(() => {
    if (!currentUser || loading) return;
    
    const userKey = `workspaces_${currentUser.email}`;
    localStorage.setItem(userKey, JSON.stringify(workspaces));
    
    const activeKey = `active_workspace_${currentUser.email}`;
    localStorage.setItem(activeKey, activeWorkspaceId);
  }, [workspaces, activeWorkspaceId, currentUser, loading]);

  // Add a new workspace
  const addWorkspace = (name, icon = '📋', color = 'indigo') => {
    if (workspaces.length >= MAX_WORKSPACES) {
      throw new Error(`Maximum of ${MAX_WORKSPACES} workspaces allowed`);
    }

    const id = Date.now().toString();
    const newWorkspace = { id, name, icon, color };
    
    setWorkspaces(prevWorkspaces => [...prevWorkspaces, newWorkspace]);
    return id;
  };

  // Update an existing workspace
  const updateWorkspace = (id, updates) => {
    setWorkspaces(prevWorkspaces => 
      prevWorkspaces.map(workspace => 
        workspace.id === id ? { ...workspace, ...updates } : workspace
      )
    );
  };

  // Delete a workspace
  const deleteWorkspace = (id) => {
    // Don't allow deleting the default workspace or the last workspace
    if (id === 'default') {
      throw new Error('Cannot delete the default workspace');
    }
    
    if (workspaces.length <= 1) {
      throw new Error('Cannot delete the last workspace');
    }
    
    setWorkspaces(prevWorkspaces => prevWorkspaces.filter(w => w.id !== id));
    
    // If the active workspace is being deleted, switch to the default workspace
    // or the first available one if default doesn't exist
    if (activeWorkspaceId === id) {
      const defaultWorkspace = workspaces.find(w => w.id === 'default');
      if (defaultWorkspace) {
        setActiveWorkspaceId('default');
      } else {
        setActiveWorkspaceId(workspaces.find(w => w.id !== id)?.id);
      }
    }
  };

  // Switch active workspace
  const switchWorkspace = (id) => {
    const workspaceExists = workspaces.some(w => w.id === id);
    if (!workspaceExists) {
      console.error(`Workspace with id ${id} not found`);
      return;
    }
    
    setActiveWorkspaceId(id);
  };

  // Get the current active workspace
  const getActiveWorkspace = () => {
    return workspaces.find(w => w.id === activeWorkspaceId) || workspaces[0];
  };

  const value = {
    workspaces,
    activeWorkspaceId,
    addWorkspace,
    updateWorkspace,
    deleteWorkspace,
    switchWorkspace,
    getActiveWorkspace,
    loading
  };

  return (
    <WorkspaceContext.Provider value={value}>
      {children}
    </WorkspaceContext.Provider>
  );
}
