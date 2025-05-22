/**
 * File: WorkspaceSelector.jsx
 * Purpose: Display and manage workspace selection with keyboard shortcuts
 */
import { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useWorkspace } from '../context/WorkspaceContext'
import { useAuth } from '../context/AuthContext'
import { Link, useNavigate } from 'react-router-dom'
import { 
  PlusIcon, 
  PencilIcon, 
  TrashIcon, 
  XMarkIcon,
  ChevronUpIcon,
  ChevronDownIcon,
  FolderIcon,
  KeyIcon,
  Cog6ToothIcon,
  UserGroupIcon,
  FolderPlusIcon
} from '@heroicons/react/24/outline'
import { createPortal } from 'react-dom'

export default function WorkspaceSelector({ isOpen, onClose, theme }) {
  const workspace = useWorkspace();
  const workspaces = workspace?.workspaces || [];
  const activeWorkspaceId = workspace?.activeWorkspaceId;
  const switchWorkspace = workspace?.switchWorkspace;
  const addWorkspace = workspace?.addWorkspace;
  const updateWorkspace = workspace?.updateWorkspace;
  const deleteWorkspace = workspace?.deleteWorkspace;
  const getActiveWorkspace = workspace?.getActiveWorkspace;
  const loading = workspace?.loading;
  const { currentUser } = useAuth();
  
  // Separate owned and shared workspaces
  const ownedWorkspaces = workspaces.filter(w => w.userId === currentUser?.$id);
  const sharedWorkspaces = workspaces.filter(w => w.userId !== currentUser?.$id && w.userId);
  
  const navigate = useNavigate()
  const isDarkMode = theme === 'dark'
  
  const [newWorkspaceName, setNewWorkspaceName] = useState('')
  const [isAdding, setIsAdding] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [editingName, setEditingName] = useState('')
  
  // Detect if user is on Mac or Windows/Linux
  const isMac = useMemo(() => {
    return navigator.platform.toUpperCase().indexOf('MAC') >= 0 ||
           navigator.userAgent.toUpperCase().indexOf('MAC') >= 0;
  }, []);
  
  // Shortcut prefix based on platform
  const shortcutPrefix = isMac ? '⌥' : 'Alt+';
  
  const handleSubmitNewWorkspace = (e) => {
    e.preventDefault()
    if (!addWorkspace) {
      console.error("Workspace context not fully initialized");
      return;
    }
    
    if (newWorkspaceName.trim()) {
      try {
        addWorkspace(newWorkspaceName.trim())
        setNewWorkspaceName('')
        setIsAdding(false)
      } catch (error) {
        alert(error.message)
      }
    }
  }
  
  const handleSubmitEdit = (e, id) => {
    e.preventDefault()
    if (!updateWorkspace) {
      console.error("Workspace context not fully initialized");
      return;
    }
    
    if (editingName.trim()) {
      updateWorkspace(id, { name: editingName.trim() })
      setEditingId(null)
      setEditingName('')
    }
  }
  
  const [deletingWorkspaceId, setDeletingWorkspaceId] = useState(null);
  
  const handleDelete = (id) => {
    try {
      if (!workspaces || workspaces.length === 0) {
        console.error("Workspace context not fully initialized");
        return;
      }
      
      // Check if it's the default workspace
      const workspace = workspaces.find(w => w.id === id);
      if (workspace?.isDefault) {
        // Show error message
        alert("Cannot delete the default workspace");
        return;
      }
      
      // Show the delete confirmation modal
      setDeletingWorkspaceId(id);
    } catch (error) {
      console.error(error.message);
    }
  }
  
  const confirmDelete = () => {
    try {
      if (!deleteWorkspace || !workspaces) {
        console.error("Workspace context not fully initialized");
        setDeletingWorkspaceId(null);
        return;
      }
      
      if (deletingWorkspaceId) {
        // Double-check it's not the default workspace
        const workspaceToDelete = workspaces.find(w => w.id === deletingWorkspaceId);
        if (workspaceToDelete?.isDefault) {
          alert("Cannot delete the default workspace");
          setDeletingWorkspaceId(null);
          return;
        }
        
        deleteWorkspace(deletingWorkspaceId);
        setDeletingWorkspaceId(null);
      }
    } catch (error) {
      console.error(error.message);
      // Show error message to user
      alert("Error deleting workspace: " + error.message);
      setDeletingWorkspaceId(null);
    }
  }
  
  const cancelDelete = () => {
    setDeletingWorkspaceId(null);
  }
  
  const startEditing = (workspace) => {
    setEditingId(workspace.id)
    setEditingName(workspace.name)
  }
  
  const goToWorkspaceSettings = (workspaceId) => {
    if (!workspaceId) {
      console.error("Invalid workspace ID");
      return;
    }
    navigate(`/workspace/${workspaceId}/settings`)
    onClose()
  }
  
  // Modal JSX for delete confirmation
  const deleteModal = deletingWorkspaceId ? createPortal(
    <div 
      className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/60 backdrop-blur-sm font-sans"
      style={{ position: 'fixed', inset: 0, zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
    >
      <motion.div
        className="bg-[#f2f0e3] dark:bg-[#202020] rounded-md p-6 shadow-xl max-w-sm w-full mx-4 z-[100000] border border-[#d8d6cf] dark:border-[#3a3a3a] flex flex-col items-center"
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ 
          type: "spring", 
          damping: 25, 
          stiffness: 350 
        }}
        onClick={e => e.stopPropagation()}
        style={{
          position: 'relative',
          left: 'unset',
          top: 'unset',
          margin: 0,
          transform: 'none',
          zIndex: 100000
        }}
      >
        {/* Warning icon */}
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30 mb-5">
          <TrashIcon className="h-8 w-8 text-red-600 dark:text-red-400" aria-hidden="true" />
        </div>
        {/* Title and description */}
        <div className="text-center">
          <h3 className="text-xl font-semibold leading-6 text-[#202020] dark:text-[#f2f0e3] mb-2" id="modal-title">
            Delete Workspace
          </h3>
          <div>
            <p className="text-sm text-[#3a3a3a] dark:text-[#d1cfbf]">
              Are you sure you want to delete this workspace? All tasks within this workspace will be permanently removed. This action cannot be undone.
            </p>
          </div>
        </div>
        {/* Action buttons */}
        <div className="mt-6 flex justify-center gap-3 w-full">
          <button
            type="button"
            className="inline-flex justify-center rounded-md border border-[#d8d6cf] dark:border-[#3a3a3a] bg-[#f2f0e3] dark:bg-[#202020] px-4 py-2.5 text-sm font-medium text-[#3a3a3a] dark:text-[#d1cfbf] shadow-sm hover:bg-[#e8e6d9] dark:hover:bg-[#2a2a2a] focus:outline-none focus:ring-1 focus:ring-[#f76f52] flex-1"
            onClick={cancelDelete}
          >
            Cancel
          </button>
          <button
            type="button"
            className="inline-flex justify-center rounded-md border border-transparent bg-[#f76f52] px-4 py-2.5 text-sm font-medium text-[#f2f0e3] shadow-sm hover:bg-[#e55e41] focus:outline-none focus:ring-1 focus:ring-[#f76f52] flex-1"
            onClick={confirmDelete}
          >
            Delete
          </button>
        </div>
      </motion.div>
    </div>,
    typeof window !== "undefined" ? document.body : null
  ) : null;

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            transition={{ duration: 0.2 }}
            className="bg-[#f2f0e3] dark:bg-[#202020] rounded-md shadow-md border border-[#d8d6cf] dark:border-[#3a3a3a] max-h-[80vh] overflow-hidden w-64 sm:w-72 mx-auto sm:mx-0 font-sans"
          >
            <div className="bg-[#f2f0e3] dark:bg-[#202020] sticky top-0 z-10 border-b border-[#d8d6cf] dark:border-[#3a3a3a]">
              <div className="px-4 py-3 flex justify-between items-center">
                <h3 className="text-base font-medium text-[#202020] dark:text-[#f2f0e3]">Workspaces</h3>
                <div className="flex items-center">
                  <span className="text-xs font-sans bg-[#e8e6d9] dark:bg-[#2a2a2a] text-[#3a3a3a] dark:text-[#d1cfbf] py-0.5 px-1.5 rounded-md mr-2">
                    {isMac ? '⌥1, ⌥2...' : 'Alt+1, Alt+2...'}
                  </span>
                  <button 
                    onClick={onClose} 
                    className="text-[#3a3a3a] hover:text-[#202020] dark:text-[#d1cfbf] dark:hover:text-[#f2f0e3]"
                  >
                    <XMarkIcon className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
            
            <div className="overflow-y-auto max-h-[calc(80vh-48px)]">
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#f76f52]"></div>
                </div>
              ) : (
                <>
                  {/* Owned Workspaces list */}
                  <div className="px-3 pt-2 pb-1 text-xs text-[#3a3a3a] dark:text-[#d1cfbf] uppercase font-medium tracking-wide">
                    <div className="flex items-center">
                      <FolderIcon className="w-3 h-3 mr-1" />
                      <span>My Workspaces</span>
                    </div>
                  </div>
              
                  <div>
                    {ownedWorkspaces.map((workspace, index) => (
                      <div key={workspace.id || workspace.$id} className="relative">
                        {editingId === workspace.id ? (
                          <form onSubmit={(e) => handleSubmitEdit(e, workspace.id)} className="p-2 bg-[#e8e6d9] dark:bg-[#2a2a2a]">
                            <div className="flex relative">
                              <input
                                type="text"
                                value={editingName}
                                onChange={e => setEditingName(e.target.value)}
                                className="flex-1 text-sm p-2 pl-3 border border-[#d8d6cf] dark:border-[#3a3a3a] rounded-md focus:outline-none focus:ring-1 focus:ring-[#f76f52] bg-[#f2f0e3] dark:bg-[#202020] text-[#202020] dark:text-[#f2f0e3] pr-10"
                                autoFocus
                                maxLength={20}
                              />
                              <motion.button
                                type="submit"
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.95 }}
                                className="absolute right-2 top-1/2 transform -translate-y-1/2 w-7 h-7 bg-[#f76f52] text-[#f2f0e3] rounded-md flex items-center justify-center hover:bg-[#e55e41]"
                              >
                                <PencilIcon className="w-3.5 h-3.5" />
                              </motion.button>
                            </div>
                            <div className="flex justify-between mt-2 text-xs text-[#3a3a3a] dark:text-[#d1cfbf]">
                              <span>{editingName.length}/20</span>
                              <button 
                                onClick={() => setEditingId(null)}
                                className="text-[#3a3a3a] hover:text-[#202020] dark:text-[#d1cfbf] dark:hover:text-[#f2f0e3]"
                              >
                                Cancel
                              </button>
                            </div>
                          </form>
                        ) : (
                          <div 
                            className={`group flex items-center justify-between px-4 py-2.5 cursor-pointer transition-colors ${
                              (workspace.id === activeWorkspaceId || workspace.$id === activeWorkspaceId)
                                ? 'bg-[#e8e6d9] dark:bg-[#2a2a2a] text-[#202020] dark:text-[#f2f0e3]'
                                : 'hover:bg-[#e8e6d9] dark:hover:bg-[#2a2a2a] text-[#3a3a3a] dark:text-[#d1cfbf]'
                            }`}
                            onClick={() => {
                              if (switchWorkspace) {
                                switchWorkspace(workspace.$id || workspace.id);
                                onClose();
                              } else {
                                console.error("Workspace context not fully initialized");
                              }
                            }}
                          >
                            <div className="flex items-center overflow-hidden">
                              <span className="w-6 h-6 flex items-center justify-center text-center mr-2 flex-shrink-0">
                                {workspace.icon || '📋'}
                              </span>
                              <span className="truncate font-medium">{workspace.name}</span>
                            </div>
                            
                            <div className="flex items-center">
                              {index < 5 && (
                                <span className="text-xs bg-[#e8e6d9] dark:bg-[#2a2a2a] text-[#3a3a3a] dark:text-[#d1cfbf] py-0.5 px-1.5 rounded-md ml-1.5 font-sans">
                                  {isMac ? `⌥${index + 1}` : `Alt+${index + 1}`}
                                </span>
                              )}
                              
                              {/* Show buttons on hover */}
                              <div className="flex ml-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                {/* Settings button */}
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    goToWorkspaceSettings(workspace.$id || workspace.id);
                                  }}
                                  className="p-1 text-[#3a3a3a] hover:text-[#202020] dark:text-[#d1cfbf] dark:hover:text-[#f2f0e3] transition-colors"
                                  title="Workspace settings"
                                >
                                  <Cog6ToothIcon className="w-3.5 h-3.5" />
                                </button>
                                
                                {/* Edit button */}
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    startEditing(workspace);
                                  }}
                                  className="p-1 text-[#3a3a3a] hover:text-[#202020] dark:text-[#d1cfbf] dark:hover:text-[#f2f0e3] transition-colors"
                                  title="Edit workspace name"
                                >
                                  <PencilIcon className="w-3.5 h-3.5" />
                                </button>
                                
                                {/* Show delete button only if not the default workspace */}
                                {!workspace.isDefault ? (
                                  <button 
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDelete(workspace.id);
                                    }}
                                    className="p-1 text-[#3a3a3a] hover:text-red-500 dark:text-[#d1cfbf] dark:hover:text-red-400 transition-colors"
                                    title="Delete workspace"
                                  >
                                    <TrashIcon className="w-3.5 h-3.5" />
                                  </button>
                                ) : (
                                  <div className="p-1 text-[#d8d6cf] dark:text-[#3a3a3a] cursor-not-allowed" title="Cannot delete default workspace">
                                    <TrashIcon className="w-3.5 h-3.5" />
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                  
                  {/* Shared Workspaces section */}
                  {sharedWorkspaces.length > 0 && (
                    <>
                      <div className="px-3 pt-3 pb-1 mt-1 text-xs text-[#3a3a3a] dark:text-[#d1cfbf] uppercase font-medium tracking-wide border-t border-[#d8d6cf] dark:border-[#3a3a3a]">
                        <div className="flex items-center">
                          <UserGroupIcon className="w-3 h-3 mr-1" />
                          <span>Shared with me</span>
                        </div>
                      </div>
                      <div>
                        {sharedWorkspaces.map((workspace) => (
                          <div key={workspace.id || workspace.$id} className="relative">
                            <div 
                              className={`group flex items-center justify-between px-4 py-2.5 cursor-pointer transition-colors ${
                                (workspace.id === activeWorkspaceId || workspace.$id === activeWorkspaceId)
                                  ? 'bg-[#e8e6d9] dark:bg-[#2a2a2a] text-[#202020] dark:text-[#f2f0e3]'
                                  : 'hover:bg-[#e8e6d9] dark:hover:bg-[#2a2a2a] text-[#3a3a3a] dark:text-[#d1cfbf]'
                              }`}
                              onClick={() => {
                                if (switchWorkspace) {
                                  switchWorkspace(workspace.$id || workspace.id);
                                  onClose();
                                } else {
                                  console.error("Workspace context not fully initialized");
                                }
                              }}
                            >
                              <div className="flex items-center overflow-hidden">
                                <span className="w-6 h-6 flex items-center justify-center text-center mr-2 flex-shrink-0">
                                  {workspace.icon || '📋'}
                                </span>
                                <span className="truncate font-medium">{workspace.name}</span>
                              </div>
                              
                              <div className="flex items-center">
                                {/* Show settings button on hover */}
                                <div className="flex opacity-0 group-hover:opacity-100 transition-opacity">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      goToWorkspaceSettings(workspace.$id || workspace.id);
                                    }}
                                    className="p-1 text-[#3a3a3a] hover:text-[#202020] dark:text-[#d1cfbf] dark:hover:text-[#f2f0e3] transition-colors"
                                    title="Workspace settings"
                                  >
                                    <Cog6ToothIcon className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                  
                  {/* Add new workspace button */}
                  {isAdding ? (
                    <div className="p-3 bg-[#e8e6d9] dark:bg-[#2a2a2a] mt-2 border-t border-[#d8d6cf] dark:border-[#3a3a3a]">
                      <form onSubmit={handleSubmitNewWorkspace}>
                        <div className="flex relative">
                          <input
                            type="text"
                            value={newWorkspaceName}
                            onChange={e => setNewWorkspaceName(e.target.value)}
                            placeholder="New workspace name"
                            className="w-full p-2.5 pl-3 pr-10 text-sm border border-[#d8d6cf] dark:border-[#3a3a3a] rounded-md 
                            focus:outline-none focus:ring-1 focus:ring-[#f76f52] focus:border-transparent 
                            bg-[#f2f0e3] dark:bg-[#202020] text-[#202020] dark:text-[#f2f0e3] placeholder-[#3a3a3a]/60 dark:placeholder-[#d1cfbf]/60"
                            autoFocus
                            maxLength={20}
                          />
                          <motion.button
                            type="submit"
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.95 }}
                            className="absolute right-2 top-1/2 transform -translate-y-1/2 w-8 h-8 
                            bg-[#f76f52] text-[#f2f0e3] rounded-md flex items-center justify-center
                            hover:bg-[#e55e41] shadow-sm"
                          >
                            <PlusIcon className="w-5 h-5" />
                          </motion.button>
                        </div>
                        <div className="flex justify-between mt-2 text-xs text-[#3a3a3a] dark:text-[#d1cfbf]">
                          <span>{newWorkspaceName.length}/20</span>
                          <button 
                            onClick={() => setIsAdding(false)}
                            className="text-[#3a3a3a] hover:text-[#202020] dark:text-[#d1cfbf] dark:hover:text-[#f2f0e3]"
                          >
                            Cancel
                          </button>
                        </div>
                      </form>
                    </div>
                  ) : (
                    ownedWorkspaces.length < 5 && (
                      <div className="mt-2 border-t border-[#d8d6cf] dark:border-[#3a3a3a]">
                        <motion.button
                          className="w-full px-4 py-3 flex items-center justify-center text-[#202020] dark:text-[#f2f0e3] hover:bg-[#e8e6d9] dark:hover:bg-[#2a2a2a] transition-colors"
                          onClick={() => setIsAdding(true)}
                          whileHover={{ backgroundColor: 'rgba(229, 231, 235, 0.7)', dark: { backgroundColor: 'rgba(17, 24, 39, 0.7)' } }}
                          transition={{ duration: 0.2 }}
                        >
                          <FolderPlusIcon className="w-4 h-4 mr-2 text-[#f76f52]" />
                          <span className="font-medium">New Workspace</span>
                        </motion.button>
                      </div>
                    )
                  )}
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete modal rendered via portal */}
      {deleteModal}
    </>
  )
}
