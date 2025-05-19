/**
 * File: App.jsx
 * Purpose: Root layout with Navbar and <Routes />
 */
import { useState, useEffect } from 'react'
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import Navbar from './components/Navbar'
import Home from './pages/Home'
import Login from './pages/Login'
import Register from './pages/Register'
import Todo from './pages/Todo'
import { AuthProvider } from './context/AuthContext'
import { WorkspaceProvider } from './context/WorkspaceContext'

function App() {
  const location = useLocation()
  const [theme, setTheme] = useState(() => {
    // Check if theme is stored in localStorage
    const savedTheme = localStorage.getItem('theme')
    // Check if OS prefers dark mode
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    
    return savedTheme || (prefersDark ? 'dark' : 'light')
  })
  const [showCompletedTasks, setShowCompletedTasks] = useState(false)

  // Apply the theme when it changes
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
    localStorage.setItem('theme', theme)
  }, [theme])

  const toggleTheme = () => {
    setTheme(prevTheme => prevTheme === 'dark' ? 'light' : 'dark')
  }
  
  const toggleShowCompletedTasks = () => {
    setShowCompletedTasks(prevState => !prevState)
  }

  return (
    <AuthProvider>
      <WorkspaceProvider>
        <div className="min-h-screen flex flex-col">
          <Navbar 
            toggleTheme={toggleTheme} 
            theme={theme} 
            showCompletedTasks={showCompletedTasks} 
            toggleShowCompletedTasks={toggleShowCompletedTasks} 
          />
          <main className="flex-grow container mx-auto px-4 py-8">
            <AnimatePresence mode="wait">
              <Routes location={location} key={location.pathname}>
                <Route path="/" element={<Home />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/todo" element={<Todo showCompletedTasks={showCompletedTasks} />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </AnimatePresence>
          </main>
        </div>
      </WorkspaceProvider>
    </AuthProvider>
  )
}

export default App
