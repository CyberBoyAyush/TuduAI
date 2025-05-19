/**
 * File: Navbar.jsx
 * Purpose: App navigation bar with logo, theme toggle, profile icon, and logout button
 */
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuth } from '../context/AuthContext'
import { 
  SunIcon, 
  MoonIcon, 
  UserCircleIcon, 
  ArrowRightOnRectangleIcon 
} from '@heroicons/react/24/outline'

export default function Navbar({ toggleTheme, theme }) {
  const { currentUser, logout } = useAuth()
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  
  return (
    <nav className="border-b border-gray-200 dark:border-neutral-800">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center space-x-2">
          <motion.div 
            className="bg-primary-500 w-8 h-8 rounded-lg flex items-center justify-center"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <span className="text-white font-bold text-xl">T</span>
          </motion.div>
          <span className="font-bold text-xl bg-gradient-to-r from-primary-500 to-violet-500 bg-clip-text text-transparent">
            TuduAI
          </span>
        </Link>
        
        {/* Right side controls */}
        <div className="flex items-center space-x-3">
          {/* Nav Links */}
          <div className="hidden md:flex items-center space-x-4">
            <Link 
              to="/todo" 
              className="text-gray-600 dark:text-gray-300 hover:text-primary-500 dark:hover:text-primary-400"
            >
              Todo
            </Link>
          </div>
          
          {/* Theme toggle */}
          <motion.button
            onClick={toggleTheme}
            className="p-2 rounded-full bg-gray-100 dark:bg-neutral-800 text-gray-800 dark:text-gray-200"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            aria-label="Toggle theme"
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
                className="flex items-center space-x-2 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-neutral-800"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <UserCircleIcon className="w-6 h-6 text-gray-700 dark:text-gray-300" />
                <span className="text-sm hidden sm:inline">{currentUser.name || 'User'}</span>
              </motion.button>
              
              {/* Dropdown menu */}
              {isProfileOpen && (
                <motion.div 
                  className="absolute right-0 mt-2 w-48 py-2 bg-white dark:bg-neutral-800 rounded-md shadow-lg border border-gray-100 dark:border-neutral-700 z-10"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <div className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300 border-b border-gray-100 dark:border-neutral-700">
                    {currentUser.email}
                  </div>
                  
                  <button 
                    onClick={() => {
                      logout()
                      setIsProfileOpen(false)
                    }}
                    className="flex items-center w-full px-4 py-2 text-sm text-red-500 hover:bg-gray-100 dark:hover:bg-neutral-700"
                  >
                    <ArrowRightOnRectangleIcon className="w-5 h-5 mr-2" />
                    Log out
                  </button>
                </motion.div>
              )}
            </div>
          )}
          
          {/* Show login/register when no user */}
          {!currentUser && (
            <div className="flex items-center space-x-2">
              <Link to="/login">
                <motion.button
                  className="px-4 py-2 text-sm font-medium text-gray-800 dark:text-gray-200 bg-gray-100 dark:bg-neutral-800 rounded-md"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Login
                </motion.button>
              </Link>
              <Link to="/register">
                <motion.button
                  className="px-4 py-2 text-sm font-medium text-white bg-primary-500 rounded-md"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Register
                </motion.button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  )
}
