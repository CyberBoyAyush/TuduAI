/**
 * File: Navbar.jsx
 * Purpose: App navigation bar with logo, theme toggle, profile icon, and logout button
 */
import { useState, useEffect } from 'react'
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
  BellAlertIcon
} from '@heroicons/react/24/outline'

// Logo component for better reusability
const Logo = ({ className = "" }) => (
  <div className={`flex items-center space-x-2 ${className}`}>
    <motion.div 
      className="bg-gradient-to-br from-indigo-500 to-violet-600 w-8 h-8 rounded-lg flex items-center justify-center shadow-md"
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
      <CheckCircleIcon className="w-5 h-5 text-white" />
    </motion.div>
    <span className="font-bold text-xl bg-gradient-to-br from-indigo-600 to-violet-600 bg-clip-text text-transparent">
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
  
  // Close mobile menu when route changes
  useEffect(() => {
    setIsMobileMenuOpen(false)
  }, [location.pathname])
  
  // Get the current active workspace
  const activeWorkspace = getActiveWorkspace()
  

  
  return (
    <nav className="border-b border-gray-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 sticky top-0 z-40 shadow-sm">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        {/* Logo - always visible */}
        <div className="flex items-center">
          <Link to="/" aria-label="TuduAI Home">
            <Logo />
          </Link>
          
          {/* Workspace selector (only when logged in) */}
          {currentUser && (
            <div className="ml-4 relative">
              <motion.button
                onClick={() => setIsWorkspaceSelectorOpen(!isWorkspaceSelectorOpen)}
                className="flex items-center space-x-2 px-3 py-1.5 rounded-full bg-gray-200 dark:bg-neutral-800 hover:bg-gray-300 dark:hover:bg-neutral-700 text-gray-800 dark:text-white transition-colors text-sm"
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                aria-expanded={isWorkspaceSelectorOpen}
                aria-label="Select workspace"
              >
                <span className="font-medium max-w-[100px] truncate">
                  {activeWorkspace?.name || 'Default'}
                </span>
                <span className="hidden sm:inline text-xs opacity-70 ml-1">
                  ⌥1
                </span>
              </motion.button>
              
              {/* Workspace selector dropdown */}
              <div className="absolute left-0 mt-2 z-50">
                <WorkspaceSelector
                  isOpen={isWorkspaceSelectorOpen}
                  onClose={() => setIsWorkspaceSelectorOpen(false)}
                  theme={theme}
                />
              </div>
            </div>
          )}
        </div>
        
        {/* Right side controls */}
        <div className="flex items-center space-x-2">

          
          {/* Show completed tasks toggle - only show on todo page */}
          {currentUser && location.pathname === '/todo' && (
            <motion.button
              onClick={toggleShowCompletedTasks}
              className="p-2 rounded-full text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-neutral-800 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              aria-label={showCompletedTasks ? "Hide completed tasks" : "Show completed tasks"}
            >
              {showCompletedTasks ? (
                <EyeSlashIcon className="w-5 h-5" />
              ) : (
                <EyeIcon className="w-5 h-5" />
              )}
            </motion.button>
          )}
          
          {/* Reminders button - only show when logged in */}
          {currentUser && (
            <motion.button
              onClick={() => setIsRemindersPanelOpen(true)}
              className="p-2 rounded-full text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-neutral-800 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              aria-label="Your reminders"
            >
              <BellAlertIcon className="w-5 h-5" />
            </motion.button>
          )}
          
          {/* Theme toggle */}
          <motion.button
            onClick={toggleTheme}
            className="p-2 rounded-full text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-neutral-800 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            aria-label={theme === 'dark' ? "Switch to light mode" : "Switch to dark mode"}
          >
            {theme === 'dark' ? (
              <SunIcon className="w-5 h-5" />
            ) : (
              <MoonIcon className="w-5 h-5" />
            )}
          </motion.button>
          
          {/* Show profile/logout when user is logged in */}
          {currentUser && (
            <div className="relative">
              <motion.button
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                className="flex items-center space-x-2 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-neutral-800 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                aria-expanded={isProfileOpen}
                aria-haspopup="true"
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-100 to-violet-100 dark:from-indigo-900/40 dark:to-violet-900/40 flex items-center justify-center text-indigo-700 dark:text-indigo-300 font-medium text-sm">
                  {currentUser.name?.charAt(0).toUpperCase() || currentUser.email?.charAt(0).toUpperCase() || 'U'}
                </div>
                <span className="text-sm hidden sm:inline font-medium text-gray-700 dark:text-gray-300">
                  {currentUser.name || currentUser.email.split('@')[0] || 'User'}
                </span>
              </motion.button>
              
              {/* Dropdown menu */}
              <AnimatePresence>
                {isProfileOpen && (
                  <motion.div 
                    className="absolute right-0 mt-2 w-64 py-2 bg-white dark:bg-neutral-800 rounded-lg shadow-xl border border-gray-100 dark:border-neutral-700 z-50"
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  >
                    <div className="px-4 py-3 border-b border-gray-100 dark:border-neutral-700">
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        {currentUser.name || 'User'}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 truncate">
                        {currentUser.email}
                      </p>
                    </div>
                    
                    <div className="border-t border-gray-100 dark:border-neutral-700 py-1 mt-1">
                      <button 
                        onClick={() => {
                          logout()
                          setIsProfileOpen(false)
                        }}
                        className="flex items-center w-full px-4 py-2 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
                      >
                        <ArrowRightOnRectangleIcon className="w-5 h-5 mr-3" />
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
            <div className="flex items-center space-x-2">
              <Link to="/login">
                <motion.button
                  className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-gray-50 dark:hover:bg-neutral-800 rounded-md transition-colors"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Login
                </motion.button>
              </Link>
              <Link to="/register">
                <motion.button
                  className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 rounded-md shadow-sm transition-colors"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Register
                </motion.button>
              </Link>
            </div>
          )}
          
          {/* Remove mobile menu button since there are no navigation links */}
        </div>
      </div>
      
      {/* Reminders Panel */}
      <RemindersPanel 
        isOpen={isRemindersPanelOpen} 
        onClose={() => setIsRemindersPanelOpen(false)} 
      />
    </nav>
  )
}
