/**
 * File: WorkspaceSelector.jsx
 * Purpose: Display and manage workspace selection with keyboard shortcuts
 */
import { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useWorkspace } from '../context/WorkspaceContext'
import { 
  PlusIcon, 
  PencilIcon, 
  TrashIcon, 
  XMarkIcon,
  ChevronUpIcon,
  ChevronDownIcon,
  FolderIcon,
  KeyIcon
} from '@heroicons/react/24/outline'

export default function WorkspaceSelector({ isOpen, onClose, theme }) {
  const { 
    workspaces, 
    activeWorkspaceId, 
    switchWorkspace, 
    addWorkspace, 
    updateWorkspace, 
    deleteWorkspace,
    getActiveWorkspace
  } = useWorkspace()
  
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
    if (editingName.trim()) {
      updateWorkspace(id, { name: editingName.trim() })
      setEditingId(null)
      setEditingName('')
    }
  }
  
  const [deletingWorkspaceId, setDeletingWorkspaceId] = useState(null);
  
  const handleDelete = (id) => {
    try {
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
  
  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            transition={{ duration: 0.2 }}
            className="bg-white dark:bg-neutral-900 rounded-lg shadow-xl border border-gray-200 dark:border-neutral-800 max-h-96 overflow-hidden w-44"
          >
            <div className="bg-white dark:bg-neutral-900 sticky top-0 z-10">
              <div className="px-3 pt-2.5 pb-1 text-xs text-gray-500 dark:text-gray-400 uppercase font-medium tracking-wide flex justify-between items-center">
                <span>Workspaces</span>
                <span className="text-[10px] font-normal">{shortcutPrefix}+Number</span>
              </div>
            </div>
            
            <div>
              {/* Workspace list */}
              <div>
                {workspaces.map((workspace, index) => (
                  <div key={workspace.id} className="relative">
                    {editingId === workspace.id ? (
                      <form onSubmit={(e) => handleSubmitEdit(e, workspace.id)} className="p-2 bg-gray-100 dark:bg-neutral-800">
                        <div className="flex relative">
                          <input
                            type="text"
                            value={editingName}
                            onChange={e => setEditingName(e.target.value)}
                            className="flex-1 text-sm p-1.5 pl-3 border border-gray-300 dark:border-neutral-700 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white dark:bg-neutral-700 text-gray-800 dark:text-white pr-10"
                            autoFocus
                            maxLength={20}
                          />
                          <motion.button
                            type="submit"
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.95 }}
                            className="absolute right-2 top-1/2 transform -translate-y-1/2 w-6 h-6 bg-indigo-600 text-white rounded-full flex items-center justify-center hover:bg-indigo-500"
                          >
                            <PencilIcon className="w-3 h-3" />
                          </motion.button>
                        </div>
                        <div className="flex justify-between mt-1.5 text-xs text-gray-500 dark:text-gray-500">
                          <span>{editingName.length}/20</span>
                          <button 
                            onClick={() => setEditingId(null)}
                            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                          >
                            Cancel
                          </button>
                        </div>
                      </form>
                    ) : (
                      <div 
                        className={`group flex items-center justify-between px-3 py-1.5 cursor-pointer transition-colors ${
                          (workspace.id === activeWorkspaceId || workspace.$id === activeWorkspaceId)
                            ? 'bg-gray-200 dark:bg-neutral-700 text-gray-800 dark:text-white'
                            : 'hover:bg-gray-100 dark:hover:bg-neutral-800 text-gray-700 dark:text-gray-300'
                        }`}
                        onClick={() => switchWorkspace(workspace.$id || workspace.id)}
                      >
                        <div className="flex items-center overflow-hidden">
                          <span className="truncate">{workspace.name}</span>
                        </div>
                        
                        <div className="flex items-center">
                          {index < 5 && (
                            <span className="text-xs bg-gray-100 dark:bg-neutral-800 text-gray-500 dark:text-gray-400 py-0.5 px-1.5 rounded-md ml-1.5 font-mono">
                              {shortcutPrefix}{index + 1}
                            </span>
                          )}
                          
                          {/* Show edit and delete buttons on hover */}
                          <div className="flex opacity-0 group-hover:opacity-100 transition-opacity">
                            {/* Edit button */}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                startEditing(workspace);
                              }}
                              className="ml-1.5 p-1 text-gray-500 hover:text-indigo-500 dark:text-gray-400 dark:hover:text-indigo-400 transition-colors"
                              title="Edit workspace name"
                            >
                              <PencilIcon className="w-3 h-3" />
                            </button>
                            
                            {/* Show delete button only if not the default workspace */}
                            {!workspace.isDefault ? (
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDelete(workspace.id);
                                }}
                                className="p-1 text-gray-500 hover:text-red-500 dark:text-gray-400 dark:hover:text-red-400 transition-colors"
                                title="Delete workspace"
                              >
                                <TrashIcon className="w-3 h-3" />
                              </button>
                            ) : (
                              <div className="p-1 text-gray-300 dark:text-gray-600 cursor-not-allowed" title="Cannot delete default workspace">
                                <TrashIcon className="w-3 h-3" />
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
              
              {/* Add new workspace button */}
              {isAdding ? (
                <div className="p-2 bg-gray-100 dark:bg-neutral-800">
                  <form onSubmit={handleSubmitNewWorkspace} className="flex relative">
                    <input
                      type="text"
                      value={newWorkspaceName}
                      onChange={e => setNewWorkspaceName(e.target.value)}
                      placeholder="New workspace"
                      className="w-full p-2 pl-3 pr-10 text-sm border border-gray-300 dark:border-neutral-600 rounded-md 
                      focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent 
                      bg-white dark:bg-neutral-700 text-gray-800 dark:text-white placeholder-gray-400"
                      autoFocus
                      maxLength={20}
                    />
                    <motion.button
                      type="submit"
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 w-7 h-7 
                      bg-indigo-600 text-white rounded-full flex items-center justify-center
                      hover:bg-indigo-500 shadow-md"
                    >
                      <PlusIcon className="w-4 h-4" />
                    </motion.button>
                  </form>
                  <div className="flex justify-between mt-2 text-xs text-gray-500 dark:text-gray-500">
                    <span>{newWorkspaceName.length}/20</span>
                    <button 
                      onClick={() => setIsAdding(false)}
                      className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                workspaces.length < 5 && (
                  <motion.div 
                    className="px-3 py-2 flex items-center text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-neutral-800 cursor-pointer border-t border-gray-200 dark:border-neutral-800" 
                    onClick={() => setIsAdding(true)}
                    whileHover={{ backgroundColor: 'rgba(243, 244, 246, 0.5)', dark: { backgroundColor: 'rgba(64, 64, 64, 0.5)' } }}
                    transition={{ duration: 0.2 }}
                  >
                    <PlusIcon className="w-4 h-4 mr-1.5 text-indigo-500" />
                    <span className="text-sm">New Workspace</span>
                  </motion.div>
                )
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Separate AnimatePresence for the modal dialog */}
      <AnimatePresence>
        {deletingWorkspaceId && (
          <div 
            className="fixed inset-0 z-[9999] flex items-center justify-center"
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              minHeight: '100vh',
              minWidth: '100vw',
              pointerEvents: 'auto',
              background: 'rgba(0,0,0,0.6)',
            }}
          >
            {/* Modal dialog */}
            <motion.div
              className="bg-white dark:bg-neutral-800 rounded-lg p-6 shadow-2xl max-w-sm w-full mx-4 z-[10000] border border-gray-200 dark:border-neutral-700 flex flex-col items-center"
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ 
                type: "spring", 
                damping: 25, 
                stiffness: 350 
              }}
              onClick={e => e.stopPropagation()}
            >
              {/* Warning icon */}
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30 mb-4">
                <TrashIcon className="h-7 w-7 text-red-600 dark:text-red-400" aria-hidden="true" />
              </div>
              {/* Title and description */}
              <div className="text-center">
                <h3 className="text-lg font-medium leading-6 text-gray-900 dark:text-white" id="modal-title">
                  Delete Workspace
                </h3>
                <div className="mt-2">
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Are you sure you want to delete this workspace? All tasks within this workspace will be permanently removed. This action cannot be undone.
                  </p>
                </div>
              </div>
              {/* Action buttons */}
              <div className="mt-6 flex justify-center gap-3 w-full">
                <button
                  type="button"
                  className="inline-flex justify-center rounded-md border border-gray-300 dark:border-neutral-600 bg-white dark:bg-neutral-700 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 shadow-sm hover:bg-gray-50 dark:hover:bg-neutral-600 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 flex-1"
                  onClick={cancelDelete}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="inline-flex justify-center rounded-md border border-transparent bg-red-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 flex-1"
                  onClick={confirmDelete}
                >
                  Delete
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  )
}
