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
  EyeIcon,
  EyeSlashIcon,
  FolderIcon,
  KeyIcon,
  ChevronUpIcon,
  ChevronDownIcon,
  BellAlertIcon,
  BuildingOfficeIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline'
import { getUserReminders } from '../utils/reminders'

// Logo component for better reusability
const Logo = ({ className = "" }) => (
  <div className={`flex items-center space-x-2 ${className} font-sans`}>
    <motion.div 
      className="bg-[#f76f52] w-8 h-8 rounded-md flex items-center justify-center shadow-sm"
      whileHover={{ 
        scale: 1.05, 
        rotate: [0, -5, 5, 0],
        transition: { duration: 0.5 } 
      }}
      whileTap={{ scale: 0.95 }}
    >
      <CheckCircleIcon className="w-5 h-5 text-[#f2f0e3] dark:text-[#202020]" />
    </motion.div>
    <span className="font-bold text-xl text-[#202020] dark:text-[#f2f0e3] tracking-tight">
      TuduAI
    </span>
  </div>
)

export default function Navbar({ toggleTheme, theme, showCompletedTasks, toggleShowCompletedTasks }) {
  const { currentUser, logout } = useAuth()
  const workspace = useWorkspace()
  const workspaces = workspace?.workspaces || []
  const activeWorkspaceId = workspace?.activeWorkspaceId
  const switchWorkspace = workspace?.switchWorkspace
  const getActiveWorkspace = workspace?.getActiveWorkspace
  
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isWorkspaceSelectorOpen, setIsWorkspaceSelectorOpen] = useState(false)
  const [isRemindersPanelOpen, setIsRemindersPanelOpen] = useState(false)
  const [reminderCount, setReminderCount] = useState(0)
  const location = useLocation()
  const profileRef = useRef(null)
  const workspaceRef = useRef(null)
  
  // Close mobile menu when route changes
  useEffect(() => {
    setIsMobileMenuOpen(false)
  }, [location.pathname])
  
  // Get the current active workspace
  const activeWorkspace = getActiveWorkspace ? getActiveWorkspace() : null
  
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
    // Only handle if user is not in an input field
    if (document.activeElement.tagName === 'INPUT' || 
        document.activeElement.tagName === 'TEXTAREA') {
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
      
      // If we have a valid number key
      if (keyNum !== null && keyNum >= 1 && keyNum <= 5) {
        // Prevent default browser behavior
        event.preventDefault();
        
        // Find the workspace at the corresponding index (0-indexed)
        const targetIndex = keyNum - 1;
        
        // Filter to only owned workspaces for keyboard shortcuts
        const ownedWorkspaces = workspaces.filter(w => w.userId === currentUser?.$id);
        
        if (ownedWorkspaces && ownedWorkspaces.length > targetIndex) {
          const targetWorkspace = ownedWorkspaces[targetIndex];
          
          if (!targetWorkspace) {
            return;
          }
          
          // From checking WorkspaceContext.jsx, we know workspaces use $id
          if (targetWorkspace.$id && targetWorkspace.$id !== activeWorkspaceId) {
            switchWorkspace(targetWorkspace.$id);
          } else if (targetWorkspace.id && targetWorkspace.id !== activeWorkspaceId) {
            // Fallback to id for default workspaces
            switchWorkspace(targetWorkspace.id);
          }
        }
      }
    }
  }, [workspaces, activeWorkspaceId, switchWorkspace, currentUser]);
  
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
  
  // Load reminder count
  useEffect(() => {
    const loadReminderCount = async () => {
      if (!currentUser || !activeWorkspaceId) {
        setReminderCount(0)
        return
      }
      
      try {
        const reminders = await getUserReminders(currentUser.$id, activeWorkspaceId)
        // Count only pending reminders (not sent)
        const pendingCount = reminders.filter(r => r.status !== 'done').length
        setReminderCount(pendingCount)
      } catch (error) {
        console.error('Error loading reminder count:', error)
        setReminderCount(0)
      }
    }
    
    loadReminderCount()
    
    // Refresh count every 30 seconds
    const interval = setInterval(loadReminderCount, 30000)
    return () => clearInterval(interval)
  }, [currentUser, activeWorkspaceId])
  
  return (
    <>
      <nav className="border-b border-[#d8d6cf] dark:border-[#2a2a2a] bg-[#f2f0e3] dark:bg-[#202020] font-sans backdrop-blur-md bg-opacity-90 dark:bg-opacity-90 sticky top-0 z-40 shadow-sm">
        <div className="container mx-auto px-4 py-3 sm:py-4 flex items-center justify-between">
          {/* Logo - always visible */}
          <div className="flex items-center">
            <Link to="/" aria-label="TuduAI Home">
              <Logo />
            </Link>
            
            {/* Mobile Workspace selector (only when logged in and on small screens) */}
            {currentUser && (
              <div className="ml-2 relative sm:hidden" ref={workspaceRef}>
                <motion.button
                  onClick={() => setIsWorkspaceSelectorOpen(!isWorkspaceSelectorOpen)}
                  className="flex items-center space-x-1 px-2 py-1.5 rounded-md bg-[#e8e6d9] dark:bg-[#2a2a2a] hover:bg-[#dbd9cc] dark:hover:bg-[#333333] text-[#202020] dark:text-[#f2f0e3] transition-all text-xs border border-[#d8d6cf] dark:border-[#3a3a3a]"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  aria-expanded={isWorkspaceSelectorOpen}
                  aria-label="Select workspace"
                >
                  <BuildingOfficeIcon className="w-3 h-3 text-[#3a3a3a] dark:text-[#d1cfbf]" />
                  <span className="font-medium max-w-[60px] truncate text-xs">
                    {activeWorkspace?.name || 'Default'}
                  </span>
                  <motion.span 
                    animate={{ rotate: isWorkspaceSelectorOpen ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                    className="text-[#3a3a3a] dark:text-[#d1cfbf]"
                  >
                    <ChevronDownIcon className="w-3 h-3" />
                  </motion.span>
                </motion.button>
                
                {/* Mobile Workspace selector dropdown */}
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
            
            {/* Desktop Workspace selector (only when logged in and on larger screens) */}
            {currentUser && (
              <div className="ml-3 sm:ml-5 relative hidden sm:block" ref={workspaceRef}>
                <motion.button
                  onClick={() => setIsWorkspaceSelectorOpen(!isWorkspaceSelectorOpen)}
                  className="flex items-center space-x-2 px-3.5 py-2 rounded-md bg-[#e8e6d9] dark:bg-[#2a2a2a] hover:bg-[#dbd9cc] dark:hover:bg-[#333333] text-[#202020] dark:text-[#f2f0e3] transition-all text-sm border border-[#d8d6cf] dark:border-[#3a3a3a]"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  aria-expanded={isWorkspaceSelectorOpen}
                  aria-label="Select workspace"
                  title="Press Option/Alt + number to switch workspaces"
                  initial={{ boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.05)" }}
                  animate={{ 
                    boxShadow: isWorkspaceSelectorOpen 
                      ? "0 4px 6px -1px rgba(0, 0, 0, 0.1)" 
                      : "0 1px 2px 0 rgba(0, 0, 0, 0.05)" 
                  }}
                >
                  <BuildingOfficeIcon className="w-4 h-4 text-[#3a3a3a] dark:text-[#d1cfbf]" />
                  <span className="font-medium max-w-[120px] truncate">
                    {activeWorkspace?.name || 'Default'}
                  </span>
                  <motion.span 
                    animate={{ rotate: isWorkspaceSelectorOpen ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                    className="ml-1 text-[#3a3a3a] dark:text-[#d1cfbf]"
                  >
                    <ChevronDownIcon className="w-4 h-4" />
                  </motion.span>
                </motion.button>
                
                {/* Desktop Workspace selector dropdown */}
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
                className="p-1.5 sm:p-2 rounded-md text-[#3a3a3a] dark:text-[#d1cfbf] hover:bg-[#e8e6d9] dark:hover:bg-[#2a2a2a] hover:text-[#202020] dark:hover:text-[#f2f0e3] transition-all relative group"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                aria-label={showCompletedTasks ? "Hide completed tasks" : "Show completed tasks"}
              >
                <motion.div
                  className="absolute inset-0 bg-[#e8e6d9] dark:bg-[#2a2a2a] rounded-md opacity-0 group-hover:opacity-100 -z-10"
                  initial={false}
                  animate={{ scale: showCompletedTasks ? 1 : 0.8 }}
                  transition={{ duration: 0.2 }}
                />
                {showCompletedTasks ? (
                  <EyeSlashIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                ) : (
                  <EyeIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                )}
                <span className="sr-only">{showCompletedTasks ? "Hide completed" : "Show completed"}</span>
                <span className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 text-[10px] font-medium text-[#3a3a3a] dark:text-[#d1cfbf] whitespace-nowrap opacity-0 group-hover:opacity-100 group-hover:-bottom-4 transition-all duration-200 hidden sm:block">
                  {showCompletedTasks ? "Hide" : "Show"}
                </span>
              </motion.button>
            )}
            
            {/* Insights button - only show when logged in */}
            {currentUser && (
              <Link to="/insights">
                <motion.button
                  className="p-1.5 sm:p-2 rounded-md text-[#3a3a3a] dark:text-[#d1cfbf] hover:bg-[#e8e6d9] dark:hover:bg-[#2a2a2a] hover:text-[#202020] dark:hover:text-[#f2f0e3] transition-all relative group"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  aria-label="Weekly Insights"
                >
                  <motion.div
                    className="absolute inset-0 bg-[#e8e6d9] dark:bg-[#2a2a2a] rounded-md opacity-0 group-hover:opacity-100 -z-10"
                    transition={{ duration: 0.2 }}
                  />
                  <ChartBarIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span className="sr-only">Insights</span>
                  <span className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 text-[10px] font-medium text-[#3a3a3a] dark:text-[#d1cfbf] whitespace-nowrap opacity-0 group-hover:opacity-100 group-hover:-bottom-4 transition-all duration-200 hidden sm:block">
                    Insights
                  </span>
                </motion.button>
              </Link>
            )}

            {/* Reminders button - only show when logged in */}
            {currentUser && (
              <motion.button
                onClick={() => setIsRemindersPanelOpen(true)}
                className="p-1.5 sm:p-2 rounded-md text-[#3a3a3a] dark:text-[#d1cfbf] hover:bg-[#e8e6d9] dark:hover:bg-[#2a2a2a] hover:text-[#202020] dark:hover:text-[#f2f0e3] transition-all relative group"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                aria-label={`Your reminders${reminderCount > 0 ? ` (${reminderCount})` : ''}`}
              >
                <motion.div
                  className="absolute inset-0 bg-[#e8e6d9] dark:bg-[#2a2a2a] rounded-md opacity-0 group-hover:opacity-100 -z-10"
                  transition={{ duration: 0.2 }}
                />
                <div className="relative flex items-center justify-center">
                  <BellAlertIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                  <AnimatePresence>
                    {reminderCount > 0 && (
                      <motion.span
                        className="absolute -top-1 -right-1 bg-[#f76f52] text-white text-xs font-bold rounded-full min-w-[16px] h-4 flex items-center justify-center px-1 shadow-sm"
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0, opacity: 0 }}
                        transition={{ type: "spring", stiffness: 500, damping: 30 }}
                      >
                        {reminderCount > 99 ? '99+' : reminderCount}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </div>
                <span className="sr-only">Reminders</span>
                <span className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 text-[10px] font-medium text-[#3a3a3a] dark:text-[#d1cfbf] whitespace-nowrap opacity-0 group-hover:opacity-100 group-hover:-bottom-4 transition-all duration-200 hidden sm:block">
                  Reminders{reminderCount > 0 && ` (${reminderCount})`}
                </span>
              </motion.button>
            )}
            
            {/* Theme toggle */}
            <motion.button
              onClick={toggleTheme}
              className="p-1.5 sm:p-2 rounded-md text-[#3a3a3a] dark:text-[#d1cfbf] hover:bg-[#e8e6d9] dark:hover:bg-[#2a2a2a] hover:text-[#202020] dark:hover:text-[#f2f0e3] transition-all relative group"
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
                className="absolute inset-0 bg-[#e8e6d9] dark:bg-[#2a2a2a] rounded-md opacity-0 group-hover:opacity-100 -z-10"
                transition={{ duration: 0.2 }}
              />
              {theme === 'dark' ? (
                <SunIcon className="w-4 h-4 sm:w-5 sm:h-5" />
              ) : (
                <MoonIcon className="w-4 h-4 sm:w-5 sm:h-5" />
              )}
              <span className="sr-only">{theme === 'dark' ? "Light mode" : "Dark mode"}</span>
              <span className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 text-[10px] font-medium text-[#3a3a3a] dark:text-[#d1cfbf] whitespace-nowrap opacity-0 group-hover:opacity-100 group-hover:-bottom-4 transition-all duration-200 hidden sm:block">
                {theme === 'dark' ? "Light" : "Dark"}
              </span>
            </motion.button>
            
            {/* Show profile/logout when user is logged in */}
            {currentUser && (
              <div className="relative" ref={profileRef}>
                <motion.button
                  onClick={() => setIsProfileOpen(!isProfileOpen)}
                  className="flex items-center space-x-1 sm:space-x-2 py-1.5 px-2 sm:px-3 rounded-md hover:bg-[#e8e6d9] dark:hover:bg-[#2a2a2a] transition-all ml-0.5 sm:ml-1"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  aria-expanded={isProfileOpen}
                  aria-haspopup="true"
                >
                  <motion.div 
                    className="w-7 h-7 sm:w-8 sm:h-8 rounded-md bg-[#f76f52] flex items-center justify-center text-[#f2f0e3] dark:text-[#202020] font-medium text-xs sm:text-sm shadow-sm ring-2 ring-[#f2f0e3] dark:ring-[#202020]"
                    whileHover={{ scale: 1.08 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    {currentUser.name?.charAt(0).toUpperCase() || currentUser.email?.charAt(0).toUpperCase() || 'U'}
                  </motion.div>
                  <span className="text-sm hidden sm:inline font-medium text-[#202020] dark:text-[#f2f0e3]">
                    {currentUser.name || currentUser.email.split('@')[0] || 'User'}
                  </span>
                  <motion.span 
                    animate={{ rotate: isProfileOpen ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                    className="hidden sm:block text-[#3a3a3a] dark:text-[#d1cfbf]"
                  >
                    <ChevronDownIcon className="w-4 h-4" />
                  </motion.span>
                </motion.button>
                
                {/* Dropdown menu */}
                <AnimatePresence>
                  {isProfileOpen && (
                    <motion.div 
                      className="absolute right-0 mt-3 w-64 py-2 bg-[#f2f0e3] dark:bg-[#202020] rounded-md shadow-xl border border-[#d8d6cf] dark:border-[#2a2a2a] z-50 overflow-hidden"
                      initial={{ opacity: 0, y: -20, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -20, scale: 0.95, transition: { duration: 0.2 } }}
                      transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    >
                      <div className="px-4 py-3 border-b border-[#d8d6cf] dark:border-[#2a2a2a] bg-[#e8e6d9] dark:bg-[#2a2a2a]">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 rounded-md bg-[#f76f52] flex items-center justify-center text-[#f2f0e3] dark:text-[#202020] font-medium text-md shadow-sm">
                            {currentUser.name?.charAt(0).toUpperCase() || currentUser.email?.charAt(0).toUpperCase() || 'U'}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-[#202020] dark:text-[#f2f0e3]">
                              {currentUser.name || 'User'}
                            </p>
                            <p className="text-xs text-[#3a3a3a] dark:text-[#d1cfbf] mt-0.5 truncate">
                              {currentUser.email}
                            </p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="border-t border-[#d8d6cf] dark:border-[#2a2a2a] py-1 bg-[#e8e6d9] dark:bg-[#2a2a2a]">
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
              <div className="flex items-center space-x-1 sm:space-x-2 ml-1 sm:ml-2">
                <Link to="/login">
                  <motion.button
                    className="px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium text-[#3a3a3a] dark:text-[#d1cfbf] hover:text-[#202020] dark:hover:text-[#f2f0e3] hover:bg-[#e8e6d9] dark:hover:bg-[#2a2a2a] rounded-md transition-all border border-transparent hover:border-[#d8d6cf] dark:hover:border-[#3a3a3a]"
                    whileHover={{ scale: 1.03, y: -1 }}
                    whileTap={{ scale: 0.97 }}
                  >
                    Login
                  </motion.button>
                </Link>
                <Link to="/register">
                  <motion.button
                    className="px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium text-[#f2f0e3] bg-[#f76f52] hover:bg-[#e55e41] rounded-md shadow-sm"
                    whileHover={{ scale: 1.03, y: -1 }}
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
        onClose={() => {
          setIsRemindersPanelOpen(false)
          // Refresh reminder count when panel closes
          if (currentUser && activeWorkspaceId) {
            getUserReminders(currentUser.$id, activeWorkspaceId)
              .then(reminders => {
                const pendingCount = reminders.filter(r => r.status !== 'done').length
                setReminderCount(pendingCount)
              })
              .catch(error => console.error('Error refreshing reminder count:', error))
          }
        }} 
      />
    </>
  )
}
