/**
 * File: auth.js
 * Purpose: Authentication utility functions (login, register, getCurrentUser)
 */

/**
 * Get the current logged-in user
 * @returns {Object|null} The current user or null if not logged in
 */
export const getCurrentUser = () => {
  const userString = localStorage.getItem('currentUser')
  return userString ? JSON.parse(userString) : null
}

/**
 * Login with email and password
 * @param {string} email User email
 * @param {string} password User password
 * @returns {Object} Result object with success status and optional message
 */
export const login = (email, password) => {
  const users = JSON.parse(localStorage.getItem('users') || '[]')
  const user = users.find(u => u.email === email && u.password === password)
  
  if (user) {
    // Create a sanitized user object (remove password)
    const safeUser = { id: user.id, email: user.email, name: user.name }
    localStorage.setItem('currentUser', JSON.stringify(safeUser))
    return { success: true, user: safeUser }
  }
  
  return { 
    success: false, 
    message: 'Invalid email or password' 
  }
}

/**
 * Register a new user
 * @param {string} name User's display name
 * @param {string} email User email
 * @param {string} password User password
 * @returns {Object} Result object with success status and optional message
 */
export const register = (name, email, password) => {
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
  
  // Create a sanitized user object (remove password)
  const safeUser = { id: newUser.id, email: newUser.email, name: newUser.name }
  localStorage.setItem('currentUser', JSON.stringify(safeUser))
  
  return { success: true, user: safeUser }
}

/**
 * Logout the current user
 */
export const logout = () => {
  localStorage.removeItem('currentUser')
}
