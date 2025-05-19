/**
 * File: useTasks.js
 * Purpose: Custom hook for tasks management (CRUD operations)
 */
import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { useWorkspace } from '../context/WorkspaceContext'
import { v4 as uuidv4 } from 'uuid'

/**
 * Custom hook for managing tasks with localStorage persistence
 */
export default function useTasks() {
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const { currentUser } = useAuth()
  const { activeWorkspaceId } = useWorkspace()
  
  // Load tasks from localStorage when user or workspace changes
  useEffect(() => {
    if (!currentUser) {
      setTasks([])
      setLoading(false)
      return
    }
    
    const userKey = `tasks_${currentUser.email}_${activeWorkspaceId}`
    const savedTasks = localStorage.getItem(userKey)
    
    if (savedTasks) {
      setTasks(JSON.parse(savedTasks))
    } else {
      setTasks([])
    }
    
    setLoading(false)
  }, [currentUser, activeWorkspaceId])
  
  // Save tasks to localStorage when they change
  useEffect(() => {
    if (!currentUser || loading) return
    
    const userKey = `tasks_${currentUser.email}_${activeWorkspaceId}`
    localStorage.setItem(userKey, JSON.stringify(tasks))
  }, [tasks, currentUser, activeWorkspaceId, loading])
  
  /**
   * Add a new task
   * @param {Object} taskData - Task data (title, dueDate, urgency)
   * @returns {string} New task ID
   */
  const addTask = (taskData) => {
    const newTask = {
      id: uuidv4(),
      title: taskData.title,
      dueDate: taskData.dueDate,
      urgency: taskData.urgency || 3, // Default urgency is medium (3)
      completed: false,
      comments: [],
      createdAt: new Date().toISOString()
    }
    
    setTasks(prevTasks => [...prevTasks, newTask])
    return newTask.id
  }
  
  /**
   * Update an existing task
   * @param {string} id - Task ID
   * @param {Object} updates - Fields to update
   */
  const updateTask = (id, updates) => {
    setTasks(prevTasks => 
      prevTasks.map(task => 
        task.id === id ? { ...task, ...updates } : task
      )
    )
  }
  
  /**
   * Delete a task
   * @param {string} id - Task ID
   */
  const deleteTask = (id) => {
    setTasks(prevTasks => prevTasks.filter(task => task.id !== id))
  }
  
  /**
   * Add a comment to a task
   * @param {string} taskId - Task ID
   * @param {string} text - Comment text
   */
  const addComment = (taskId, text) => {
    setTasks(prevTasks => 
      prevTasks.map(task => {
        if (task.id === taskId) {
          const newComment = {
            id: uuidv4(),
            text,
            user: currentUser.name,
            time: new Date().toISOString()
          }
          
          return {
            ...task,
            comments: [...task.comments, newComment]
          }
        }
        return task
      })
    )
  }
  
  /**
   * Delete a comment from a task
   * @param {string} taskId - Task ID
   * @param {string} commentId - Comment ID
   */
  const deleteComment = (taskId, commentId) => {
    setTasks(prevTasks => 
      prevTasks.map(task => {
        if (task.id === taskId) {
          return {
            ...task,
            comments: task.comments.filter(c => c.id !== commentId)
          }
        }
        return task
      })
    )
  }
  
  /**
   * Toggle task completion status
   * @param {string} id - Task ID
   */
  const toggleTaskCompletion = (id) => {
    setTasks(prevTasks => 
      prevTasks.map(task => 
        task.id === id ? { ...task, completed: !task.completed } : task
      )
    )
  }
  
  return {
    tasks,
    loading,
    addTask,
    updateTask,
    deleteTask,
    addComment,
    deleteComment,
    toggleTaskCompletion
  }
}
