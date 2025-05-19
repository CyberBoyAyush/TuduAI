/**
 * File: Login.jsx
 * Purpose: User login page
 */
import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuth } from '../context/AuthContext'
import { AtSymbolIcon, LockClosedIcon } from '@heroicons/react/24/outline'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  
  const { login, currentUser } = useAuth()
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
    if (!email || !password) {
      setError('Please fill in all fields')
      return
    }
    
    try {
      setError('')
      setLoading(true)
      
      const result = await login(email, password)
      
      if (!result.success) {
        setError(result.message || 'Failed to log in')
      }
    } catch (err) {
      setError('Failed to log in. Please try again.')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }
  
  // Demo login
  const handleDemoLogin = async () => {
    try {
      setError('')
      setLoading(true)
      
      // Create a demo user if it doesn't exist
      const users = JSON.parse(localStorage.getItem('users') || '[]')
      const demoUser = users.find(u => u.email === 'demo@example.com')
      
      if (!demoUser) {
        // Register a demo user
        const newUsers = [
          ...users,
          {
            id: crypto.randomUUID(),
            name: 'Demo User',
            email: 'demo@example.com',
            password: 'demo123'
          }
        ]
        localStorage.setItem('users', JSON.stringify(newUsers))
      }
      
      // Log in with demo credentials
      const result = await login('demo@example.com', 'demo123')
      
      if (!result.success) {
        setError(result.message || 'Failed to log in with demo account')
      }
    } catch (err) {
      setError('Failed to log in with demo account')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }
  
  return (
    <div className="max-w-md mx-auto">
      <motion.div
        className="bg-white dark:bg-neutral-800 rounded-xl shadow-md overflow-hidden p-8 my-8 border border-gray-200 dark:border-neutral-700"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <h2 className="text-2xl font-bold text-center mb-8 bg-gradient-to-r from-primary-500 to-violet-500 bg-clip-text text-transparent">
          Login to TuduAI
        </h2>
        
        {error && (
          <motion.div 
            className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 rounded-lg"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {error}
          </motion.div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Email
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <AtSymbolIcon className="h-5 w-5 text-gray-400 dark:text-gray-500" />
              </div>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full py-2 pl-10 pr-3 border border-gray-300 dark:border-neutral-600 rounded-md bg-white dark:bg-neutral-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="you@example.com"
                required
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
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full py-2 pl-10 pr-3 border border-gray-300 dark:border-neutral-600 rounded-md bg-white dark:bg-neutral-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="••••••••"
                required
              />
            </div>
          </div>
          
          <div>
            <motion.button
              type="submit"
              className="w-full py-2 px-4 bg-primary-500 hover:bg-primary-600 text-white font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              disabled={loading}
            >
              {loading ? 'Logging in...' : 'Login'}
            </motion.button>
          </div>
        </form>
        
        <div className="mt-6 text-center">
          <motion.button
            onClick={handleDemoLogin}
            className="w-full py-2 px-4 border border-gray-300 dark:border-neutral-600 hover:bg-gray-50 dark:hover:bg-neutral-700 text-gray-700 dark:text-gray-200 font-medium rounded-md"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            disabled={loading}
          >
            Try with Demo Account
          </motion.button>
        </div>
        
        <div className="mt-6 text-center text-sm text-gray-600 dark:text-gray-400">
          Don't have an account?{' '}
          <Link to="/register" className="text-primary-600 dark:text-primary-400 hover:underline">
            Register
          </Link>
        </div>
      </motion.div>
    </div>
  )
}
