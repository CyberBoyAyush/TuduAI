/**
 * File: Register.jsx
 * Purpose: New user registration page
 */
import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuth } from '../context/AuthContext'
import { 
  UserIcon, 
  AtSymbolIcon, 
  LockClosedIcon,
  ArrowRightIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline'

export default function Register() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  
  const { register, currentUser } = useAuth()
  const navigate = useNavigate()
  
  // Redirect if already logged in
  useEffect(() => {
    if (currentUser) {
      navigate('/todo')
    }
  }, [currentUser, navigate])
  
  const handleSubmit = async (e) => {
    e.preventDefault()
    
    // Validate form
    if (!name || !email || !password || !confirmPassword) {
      setError('Please fill in all fields')
      return
    }
    
    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }
    
    if (password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }
    
    try {
      setError('')
      setLoading(true)
      
      const result = await register(name, email, password)
      
      if (!result.success) {
        setError(result.message || 'Failed to create account')
      } else {
        // Show success animation before redirecting
        setSuccess(true)
        setTimeout(() => navigate('/todo'), 800)
      }
    } catch (err) {
      setError('Failed to create account. Please try again.')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }
  
  return (
    <div className="max-w-md mx-auto px-4 py-8 h-full flex items-center">
      <motion.div
        className="bg-white dark:bg-neutral-800/80 backdrop-blur-sm rounded-xl shadow-lg overflow-hidden p-8 my-8 border border-gray-200 dark:border-neutral-700 w-full"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
      >
        {success ? (
          <motion.div 
            className="text-center py-8"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
          >
            <motion.div 
              className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full mx-auto flex items-center justify-center mb-4"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            >
              <CheckCircleIcon className="w-10 h-10 text-green-500" />
            </motion.div>
            <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-2">Registration Successful</h2>
            <p className="text-gray-600 dark:text-gray-300">Redirecting to your tasks...</p>
          </motion.div>
        ) : (
          <>
            <div className="text-center mb-8">
              <motion.div 
                className="w-16 h-16 mx-auto mb-4 bg-indigo-100 dark:bg-indigo-900/20 rounded-full flex items-center justify-center shadow-inner"
                whileHover={{ scale: 1.05, rotate: 5 }}
                transition={{ type: "spring", stiffness: 400, damping: 10 }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" className="text-primary-500">
                  <path fill="currentColor" d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 2h2v2h-2V5zm0 4h2v2h-2V9zm-4 4h2v2H8v-2zm0-4h2v2H8V9zm0-4h2v2H8V5zm8 8h-2v-2h2v2zm0-4h-2v-2h2v2zm0-4h-2V5h2v2zm2 12H6v-2h12v2z"/>
                </svg>
              </motion.div>
              <h2 className="text-2xl font-bold mb-1 bg-gradient-to-r from-primary-500 to-violet-500 bg-clip-text text-transparent">
                Join TuduAI
              </h2>
              <p className="text-gray-500 dark:text-gray-400 text-sm">Create an account to manage your tasks</p>
            </div>
            
            {error && (
              <motion.div 
                className="mb-6 p-3 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 rounded-lg shadow-sm"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ type: "spring", stiffness: 300, damping: 25 }}
              >
                {error}
              </motion.div>
            )}
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Full Name
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <UserIcon className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                  </div>
                  <motion.input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full py-3 pl-10 pr-3 border border-gray-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-700/50 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent shadow-sm"
                    placeholder="John Doe"
                    required
                    whileFocus={{ scale: 1.01 }}
                    transition={{ duration: 0.2 }}
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Email
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <AtSymbolIcon className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                  </div>
                  <motion.input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full py-3 pl-10 pr-3 border border-gray-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-700/50 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent shadow-sm"
                    placeholder="you@example.com"
                    required
                    whileFocus={{ scale: 1.01 }}
                    transition={{ duration: 0.2 }}
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <LockClosedIcon className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                  </div>
                  <motion.input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full py-3 pl-10 pr-3 border border-gray-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-700/50 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent shadow-sm"
                    placeholder="••••••••"
                    required
                    minLength={6}
                    whileFocus={{ scale: 1.01 }}
                    transition={{ duration: 0.2 }}
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Confirm Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <LockClosedIcon className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                  </div>
                  <motion.input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full py-3 pl-10 pr-3 border border-gray-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-700/50 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent shadow-sm"
                    placeholder="••••••••"
                    required
                    minLength={6}
                    whileFocus={{ scale: 1.01 }}
                    transition={{ duration: 0.2 }}
                  />
                </div>
              </div>
              
              <div>
                <motion.button
                  type="submit"
                  className="w-full py-3 px-4 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50 shadow-md flex items-center justify-center"
                  whileHover={{ scale: 1.02, boxShadow: "0 5px 15px rgba(0, 0, 0, 0.1)" }}
                  whileTap={{ scale: 0.98 }}
                  disabled={loading}
                >
                  {loading ? (
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  ) : (
                    <ArrowRightIcon className="w-5 h-5 mr-2" />
                  )}
                  {loading ? 'Creating Account...' : 'Create Account'}
                </motion.button>
              </div>
            </form>
            
            <div className="mt-6 text-center text-sm">
              <span className="text-gray-600 dark:text-gray-400">Already have an account? </span>
              <Link to="/login" className="text-primary-600 dark:text-primary-400 hover:underline font-medium">
                Sign in
              </Link>
            </div>
          </>
        )}
      </motion.div>
    </div>
  )
}
