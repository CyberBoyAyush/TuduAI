/**
 * File: Navbar.jsx
 * Purpose: App navigation bar with logo, theme toggle, profile icon, and logout button
 */
import { useState, useEffect, useRef, useCallback } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../context/AuthContext'
import { useWorkspace } from '../context/WorkspaceContext'
import WorkspaceSelector from './WorkspaceSelector'
import RemindersPanel from './RemindersPanel'
import { 
  SunIcon, 
  MoonIcon, 
  UserCircleIcon, 
  ArrowRightOnRectangleIcon,
  Bars3Icon,
  XMarkIcon,
  CheckCircleIcon,
  Cog6ToothIcon,
  EyeIcon,
  EyeSlashIcon,
  FolderIcon,
  KeyIcon,
  ChevronUpIcon,
  ChevronDownIcon,
  BellAlertIcon,
  BuildingOfficeIcon,
  UserIcon
} from '@heroicons/react/24/outline'

// Logo component for better reusability
const Logo = ({ className = "" }) => (
  <div className={`flex items-center space-x-2 ${className}`}>
    <motion.div 
      className="bg-gradient-to-br from-indigo-500 to-violet-600 w-9 h-9 rounded-xl flex items-center justify-center shadow-md shadow-indigo-500/20"
      whileHover={{ 
        scale: 1.05, 
        rotate: [0, -5, 5, 0],
        transition: { duration: 0.5 } 
      }}
      whileTap={{ scale: 0.95 }}
    >
      <CheckCircleIcon className="w-5 h-5 text-white" />
    </motion.div>
    <span className="font-bold text-xl bg-gradient-to-br from-indigo-600 to-violet-600 bg-clip-text text-transparent tracking-tight">
      TuduAI
    </span>
  </div>
)

export default function Navbar({ toggleTheme, theme, showCompletedTasks, toggleShowCompletedTasks }) {
  const { currentUser, logout } = useAuth()
  const { workspaces, activeWorkspaceId, switchWorkspace, getActiveWorkspace } = useWorkspace()
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isWorkspaceSelectorOpen, setIsWorkspaceSelectorOpen] = useState(false)
  const [isRemindersPanelOpen, setIsRemindersPanelOpen] = useState(false)
  const location = useLocation()
  const profileRef = useRef(null)
  const workspaceRef = useRef(null)
  
  // Close mobile menu when route changes
  useEffect(() => {
    setIsMobileMenuOpen(false)
  }, [location.pathname])
  
  // Get the current active workspace
  const activeWorkspace = getActiveWorkspace()
  
  // Close dropdowns when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setIsProfileOpen(false)
      }
      if (workspaceRef.current && !workspaceRef.current.contains(event.target)) {
        setIsWorkspaceSelectorOpen(false)
      }
    }
    
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [profileRef, workspaceRef])
  
  // Handle keyboard shortcuts for workspace switching
  const handleKeyboardShortcuts = useCallback((event) => {
    console.log('Keydown event:', event.key, 'Alt:', event.altKey, 'KeyCode:', event.keyCode);
    
    // Only handle if user is not in an input field
    if (document.activeElement.tagName === 'INPUT' || 
        document.activeElement.tagName === 'TEXTAREA') {
      console.log('Input field active, ignoring shortcut');
      return;
    }
    
    // Check for Option/Alt + number keys (1-5)
    // Check both key and keyCode for better compatibility
    if (event.altKey && !event.ctrlKey && !event.metaKey && !event.shiftKey) {
      let keyNum = null;
      
      // Check for numeric keys across the top of keyboard (1-5)
      if (event.key >= '1' && event.key <= '5') {
        keyNum = parseInt(event.key);
      } 
      // Also check numeric keypad (1-5) using keyCodes
      else if (event.keyCode >= 49 && event.keyCode <= 53) {
        keyNum = event.keyCode - 48;  // KeyCode 49 = '1', etc.
      }
      // Also check numpad keys
      else if (event.keyCode >= 97 && event.keyCode <= 101) {
        keyNum = event.keyCode - 96;  // KeyCode 97 = numpad '1', etc.
      }
      
      console.log('Detected key number:', keyNum);
      
      // If we have a valid number key
      if (keyNum !== null && keyNum >= 1 && keyNum <= 5) {
        // Prevent default browser behavior
        event.preventDefault();
        
        console.log('Valid workspace shortcut pressed:', keyNum);
        console.log('Available workspaces:', workspaces);
        
        // Find the workspace at the corresponding index (0-indexed)
        const targetIndex = keyNum - 1;
        
        if (workspaces && workspaces.length > targetIndex) {
          const targetWorkspace = workspaces[targetIndex];
          console.log('Target workspace:', targetWorkspace);
          
          if (!targetWorkspace) {
            console.error('No workspace found at index', targetIndex);
            return;
          }
          
          // Log current and target workspace ID
          const workspaceId = targetWorkspace.$id || targetWorkspace.id;
          console.log('Current workspace ID:', activeWorkspaceId);
          console.log('Target workspace ID:', workspaceId);
          
          // From checking WorkspaceContext.jsx, we know workspaces use $id
          if (targetWorkspace.$id && targetWorkspace.$id !== activeWorkspaceId) {
            console.log('Switching to workspace by $id:', targetWorkspace.$id);
            switchWorkspace(targetWorkspace.$id);
          } else if (targetWorkspace.id && targetWorkspace.id !== activeWorkspaceId) {
            // Fallback to id for default workspaces
            console.log('Switching to workspace by id:', targetWorkspace.id);
            switchWorkspace(targetWorkspace.id);
          } else {
            console.log('Already on this workspace, not switching');
          }
        } else {
          console.log('No workspace at index', targetIndex, 'Available:', workspaces.length);
        }
      }
    }
  }, [workspaces, activeWorkspaceId, switchWorkspace]);
  
  // Set up keyboard shortcut listener
  useEffect(() => {
    // Only set up shortcuts if user is logged in
    if (currentUser) {
      document.addEventListener('keydown', handleKeyboardShortcuts);
      
      return () => {
        document.removeEventListener('keydown', handleKeyboardShortcuts);
      };
    }
  }, [currentUser, handleKeyboardShortcuts]);
  
  return (
    <>
      <nav className="border-b border-gray-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 backdrop-blur-md bg-opacity-90 dark:bg-opacity-90 sticky top-0 z-40 shadow-sm">
        <div className="container mx-auto px-4 py-3 sm:py-4 flex items-center justify-between">
          {/* Logo - always visible */}
          <div className="flex items-center">
            <Link to="/" aria-label="TuduAI Home">
              <Logo />
            </Link>
            
            {/* Workspace selector (only when logged in) */}
            {currentUser && (
              <div className="ml-5 relative" ref={workspaceRef}>
                <motion.button
                  onClick={() => setIsWorkspaceSelectorOpen(!isWorkspaceSelectorOpen)}
                  className="flex items-center space-x-2 px-3.5 py-2 rounded-xl bg-gray-100 dark:bg-neutral-800/70 hover:bg-gray-200 dark:hover:bg-neutral-700/70 text-gray-800 dark:text-white transition-all text-sm border border-gray-200/50 dark:border-neutral-700/70 shadow-sm"
                  whileHover={{ scale: 1.03, y: -1 }}
                  whileTap={{ scale: 0.97 }}
                  aria-expanded={isWorkspaceSelectorOpen}
                  aria-label="Select workspace"
                  title="Press Option/Alt + number to switch workspaces"
                  initial={{ boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.05)" }}
                  animate={{ 
                    boxShadow: isWorkspaceSelectorOpen 
                      ? "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)" 
                      : "0 1px 2px 0 rgba(0, 0, 0, 0.05)" 
                  }}
                >
                  <BuildingOfficeIcon className="w-4 h-4 text-indigo-500 dark:text-indigo-400" />
                  <span className="font-medium max-w-[120px] truncate">
                    {activeWorkspace?.name || 'Default'}
                  </span>
                  <motion.span 
                    animate={{ rotate: isWorkspaceSelectorOpen ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                    className="ml-1 text-gray-500 dark:text-gray-400"
                  >
                    <ChevronDownIcon className="w-4 h-4" />
                  </motion.span>
                </motion.button>
                
                {/* Workspace selector dropdown */}
                <AnimatePresence>
                  {isWorkspaceSelectorOpen && (
                    <motion.div 
                      className="absolute left-0 mt-2 z-50"
                      initial={{ opacity: 0, y: -10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -10, scale: 0.95 }}
                      transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    >
                      <WorkspaceSelector
                        isOpen={isWorkspaceSelectorOpen}
                        onClose={() => setIsWorkspaceSelectorOpen(false)}
                        theme={theme}
                      />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}
          </div>
          
          {/* Right side controls */}
          <div className="flex items-center space-x-1 sm:space-x-2">
            {/* Show completed tasks toggle - only show on todo page */}
            {currentUser && location.pathname === '/todo' && (
              <motion.button
                onClick={toggleShowCompletedTasks}
                className="p-2 rounded-xl text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-neutral-800 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all relative group"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                aria-label={showCompletedTasks ? "Hide completed tasks" : "Show completed tasks"}
              >
                <motion.div
                  className="absolute inset-0 bg-gray-100 dark:bg-neutral-800 rounded-xl opacity-0 group-hover:opacity-100 -z-10"
                  initial={false}
                  animate={{ scale: showCompletedTasks ? 1 : 0.8 }}
                  transition={{ duration: 0.2 }}
                />
                {showCompletedTasks ? (
                  <EyeSlashIcon className="w-5 h-5" />
                ) : (
                  <EyeIcon className="w-5 h-5" />
                )}
                <span className="sr-only">{showCompletedTasks ? "Hide completed" : "Show completed"}</span>
                <span className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 text-[10px] font-medium text-gray-500 dark:text-gray-400 whitespace-nowrap opacity-0 group-hover:opacity-100 group-hover:-bottom-4 transition-all duration-200">
                  {showCompletedTasks ? "Hide" : "Show"}
                </span>
              </motion.button>
            )}
            
            {/* Reminders button - only show when logged in */}
            {currentUser && (
              <motion.button
                onClick={() => setIsRemindersPanelOpen(true)}
                className="p-2 rounded-xl text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-neutral-800 hover:text-amber-500 dark:hover:text-amber-400 transition-all relative group"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                aria-label="Your reminders"
              >
                <motion.div
                  className="absolute inset-0 bg-gray-100 dark:bg-neutral-800 rounded-xl opacity-0 group-hover:opacity-100 -z-10"
                  transition={{ duration: 0.2 }}
                />
                <BellAlertIcon className="w-5 h-5" />
                <span className="sr-only">Reminders</span>
                <span className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 text-[10px] font-medium text-gray-500 dark:text-gray-400 whitespace-nowrap opacity-0 group-hover:opacity-100 group-hover:-bottom-4 transition-all duration-200">
                  Reminders
                </span>
              </motion.button>
            )}
            
            {/* Theme toggle */}
            <motion.button
              onClick={toggleTheme}
              className="p-2 rounded-xl text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-neutral-800 hover:text-yellow-500 dark:hover:text-blue-400 transition-all relative group"
              whileHover={{ 
                scale: 1.05, 
                rotate: theme === 'dark' ? 180 : 0,
                transition: { 
                  rotate: { duration: 0.5 }, 
                  scale: { duration: 0.2 }
                } 
              }}
              whileTap={{ scale: 0.95 }}
              aria-label={theme === 'dark' ? "Switch to light mode" : "Switch to dark mode"}
            >
              <motion.div
                className="absolute inset-0 bg-gray-100 dark:bg-neutral-800 rounded-xl opacity-0 group-hover:opacity-100 -z-10"
                transition={{ duration: 0.2 }}
              />
              {theme === 'dark' ? (
                <SunIcon className="w-5 h-5" />
              ) : (
                <MoonIcon className="w-5 h-5" />
              )}
              <span className="sr-only">{theme === 'dark' ? "Light mode" : "Dark mode"}</span>
              <span className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 text-[10px] font-medium text-gray-500 dark:text-gray-400 whitespace-nowrap opacity-0 group-hover:opacity-100 group-hover:-bottom-4 transition-all duration-200">
                {theme === 'dark' ? "Light" : "Dark"}
              </span>
            </motion.button>
            
            {/* Show profile/logout when user is logged in */}
            {currentUser && (
              <div className="relative" ref={profileRef}>
                <motion.button
                  onClick={() => setIsProfileOpen(!isProfileOpen)}
                  className="flex items-center space-x-2 py-1.5 px-2 sm:px-3 rounded-xl hover:bg-gray-100 dark:hover:bg-neutral-800 transition-all ml-1"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  aria-expanded={isProfileOpen}
                  aria-haspopup="true"
                >
                  <motion.div 
                    className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white font-medium text-sm shadow-md shadow-indigo-500/20 ring-2 ring-white dark:ring-neutral-900"
                    whileHover={{ scale: 1.08 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    {currentUser.name?.charAt(0).toUpperCase() || currentUser.email?.charAt(0).toUpperCase() || 'U'}
                  </motion.div>
                  <span className="text-sm hidden sm:inline font-medium text-gray-800 dark:text-gray-200">
                    {currentUser.name || currentUser.email.split('@')[0] || 'User'}
                  </span>
                  <motion.span 
                    animate={{ rotate: isProfileOpen ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                    className="hidden sm:block text-gray-500 dark:text-gray-400"
                  >
                    <ChevronDownIcon className="w-4 h-4" />
                  </motion.span>
                </motion.button>
                
                {/* Dropdown menu */}
                <AnimatePresence>
                  {isProfileOpen && (
                    <motion.div 
                      className="absolute right-0 mt-3 w-64 py-2 bg-white dark:bg-neutral-800 rounded-xl shadow-xl border border-gray-100 dark:border-neutral-700 z-50 overflow-hidden"
                      initial={{ opacity: 0, y: -20, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -20, scale: 0.95, transition: { duration: 0.2 } }}
                      transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    >
                      <div className="px-4 py-3 border-b border-gray-100 dark:border-neutral-700 bg-gray-50 dark:bg-neutral-800/80">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white font-medium text-md shadow-md">
                            {currentUser.name?.charAt(0).toUpperCase() || currentUser.email?.charAt(0).toUpperCase() || 'U'}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-800 dark:text-white">
                              {currentUser.name || 'User'}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 truncate">
                              {currentUser.email}
                            </p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="py-1">
                        <Link
                          to="/profile"
                          className="flex items-center w-full px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-neutral-700/50"
                          onClick={() => setIsProfileOpen(false)}
                        >
                          <UserIcon className="w-4 h-4 mr-3 text-gray-500 dark:text-gray-400" />
                          My Profile
                        </Link>
                        <Link
                          to="/settings"
                          className="flex items-center w-full px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-neutral-700/50"
                          onClick={() => setIsProfileOpen(false)}
                        >
                          <Cog6ToothIcon className="w-4 h-4 mr-3 text-gray-500 dark:text-gray-400" />
                          Settings
                        </Link>
                      </div>
                      
                      <div className="border-t border-gray-100 dark:border-neutral-700 py-1 mt-1 bg-gray-50/50 dark:bg-neutral-800/80">
                        <button 
                          onClick={() => {
                            logout()
                            setIsProfileOpen(false)
                          }}
                          className="flex items-center w-full px-4 py-2.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                        >
                          <ArrowRightOnRectangleIcon className="w-4 h-4 mr-3" />
                          Log out
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}
            
            {/* Show login/register when no user */}
            {!currentUser && (
              <div className="flex items-center space-x-2 ml-2">
                <Link to="/login">
                  <motion.button
                    className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-gray-50 dark:hover:bg-neutral-800 rounded-lg transition-all border border-transparent hover:border-gray-200 dark:hover:border-neutral-700"
                    whileHover={{ scale: 1.03, y: -1 }}
                    whileTap={{ scale: 0.97 }}
                  >
                    Login
                  </motion.button>
                </Link>
                <Link to="/register">
                  <motion.button
                    className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 rounded-lg shadow-md shadow-indigo-500/20 transition-all"
                    whileHover={{ scale: 1.03, y: -1, boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)" }}
                    whileTap={{ scale: 0.97 }}
                  >
                    Register
                  </motion.button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </nav>
      
      {/* Reminders Panel - Moved outside nav for proper z-index stacking */}
      <RemindersPanel 
        isOpen={isRemindersPanelOpen} 
        onClose={() => setIsRemindersPanelOpen(false)} 
      />
    </>
  )
}
