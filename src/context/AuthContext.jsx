/**
 * File: AuthContext.jsx
 * Purpose: Stores and provides auth state (currentUser, login, logout)
 */
import { createContext, useState, useContext, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

// Create the context
const AuthContext = createContext(null)

// Custom hook to use the auth context
export const useAuth = () => useContext(AuthContext)

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  // Initialize auth state from localStorage
  useEffect(() => {
    const user = localStorage.getItem('currentUser')
    if (user) {
      setCurrentUser(JSON.parse(user))
    }
    setLoading(false)
  }, [])

  // Login function
  const login = (email, password) => {
    const users = JSON.parse(localStorage.getItem('users') || '[]')
    const user = users.find(u => u.email === email && u.password === password)
    
    if (user) {
      // Create a sanitized user object (remove password)
      const safeUser = { id: user.id, email: user.email, name: user.name }
      localStorage.setItem('currentUser', JSON.stringify(safeUser))
      setCurrentUser(safeUser)
      navigate('/todo')
      return { success: true }
    }
    
    return { 
      success: false, 
      message: 'Invalid email or password' 
    }
  }

  // Register function
  const register = (name, email, password) => {
    const users = JSON.parse(localStorage.getItem('users') || '[]')
    
    // Check if user already exists
    if (users.some(u => u.email === email)) {
      return { 
        success: false, 
        message: 'User with this email already exists' 
      }
    }
    
    // Create new user
    const newUser = {
      id: crypto.randomUUID(),
      name,
      email,
      password
    }
    
    // Save to localStorage
    users.push(newUser)
    localStorage.setItem('users', JSON.stringify(users))
    
    // Log in the new user
    const safeUser = { id: newUser.id, email: newUser.email, name: newUser.name }
    localStorage.setItem('currentUser', JSON.stringify(safeUser))
    setCurrentUser(safeUser)
    
    navigate('/todo')
    return { success: true }
  }

  // Logout function
  const logout = () => {
    localStorage.removeItem('currentUser')
    setCurrentUser(null)
    navigate('/login')
  }

  const value = {
    currentUser,
    loading,
    login,
    register,
    logout
  }

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  )
}
