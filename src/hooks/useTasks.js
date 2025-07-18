/**
 * File: useTasks.js
 * Purpose: Custom hook for tasks management (CRUD operations)
 */
import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../context/AuthContext'
import { useWorkspace } from '../context/WorkspaceContext'
import taskService from '../api/taskService'
import reminderService from '../api/reminderService'

/**
 * Custom hook for managing tasks with Appwrite persistence
 */
export default function useTasks() {
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const { currentUser } = useAuth()
  const { activeWorkspaceId } = useWorkspace()
  
  // Function to fetch tasks
  const fetchTasks = useCallback(async (isRefreshing = false) => {
    // Skip if not authenticated or no workspace
    if (!currentUser || !activeWorkspaceId) {
      setTasks([])
      setLoading(false)
      if (isRefreshing) setRefreshing(false)
      return
    }
    
    try {
      // Clear cache to ensure fresh data
      taskService.clearCaches()
      
      const tasksData = await taskService.getTasks(currentUser.$id, activeWorkspaceId)
      setTasks(tasksData)
    } catch (error) {
      console.error('Error fetching tasks:', error)
      setTasks([])
    } finally {
      setLoading(false)
      if (isRefreshing) setRefreshing(false)
    }
  }, [currentUser, activeWorkspaceId])
  
  // Manual refresh function
  const refreshTasks = useCallback(() => {
    setRefreshing(true)
    fetchTasks(true)
  }, [fetchTasks])
  
  // Load tasks from Appwrite when user or workspace changes
  useEffect(() => {
    let isMounted = true;
    
    const loadTasks = async () => {
      // Set loading only once at the beginning
      if (isMounted) setLoading(true);
      
      if (!currentUser || !activeWorkspaceId) {
        if (isMounted) {
          setTasks([])
          setLoading(false)
        }
        return
      }
      
      try {
        const tasksData = await taskService.getTasks(currentUser.$id, activeWorkspaceId)
        
        if (isMounted) {
          setTasks(tasksData)
          setLoading(false)
        }
      } catch (error) {
        console.error('Error fetching tasks:', error)
        if (isMounted) {
          setTasks([])
          setLoading(false)
        }
      }
    }
    
    loadTasks()
    
    return () => {
      isMounted = false;
    }
  }, [currentUser, activeWorkspaceId])
  
  /**
   * Add a new task
   * @param {Object} taskData - Task data (title, dueDate, urgency)
   * @returns {string} New task ID
   */
  const addTask = async (taskData) => {
    if (!currentUser || !activeWorkspaceId) return null;
    
    try {
      const newTask = await taskService.createTask(
        taskData.title,
        taskData.dueDate,
        taskData.urgency || 3, // Default urgency is medium (3)
        activeWorkspaceId,
        currentUser.$id
      )
      
      setTasks(prevTasks => [...prevTasks, newTask])
      return newTask.$id
    } catch (error) {
      console.error('Error adding task:', error)
      return null
    }
  }
  
  /**
   * Update an existing task
   * @param {string} id - Task ID
   * @param {Object} updates - Fields to update
   */
  const updateTask = async (id, updates) => {
    try {
      const updatedTask = await taskService.updateTask(id, updates)
      
      setTasks(prevTasks => 
        prevTasks.map(task => 
          task.$id === id ? updatedTask : task
        )
      )
      
      return updatedTask
    } catch (error) {
      console.error('Error updating task:', error)
    }
  }
  
  /**
   * Delete a task
   * @param {string} id - Task ID
   */
  const deleteTask = async (id) => {
    try {
      await taskService.deleteTask(id)
      setTasks(prevTasks => prevTasks.filter(task => task.$id !== id))
    } catch (error) {
      console.error('Error deleting task:', error)
    }
  }
  
  /**
   * Add a comment to a task
   * @param {string} taskId - Task ID
   * @param {string} text - Comment text
   */
  const addComment = async (taskId, text) => {
    try {
      const newComment = {
        id: crypto.randomUUID(),
        text,
        user: currentUser.name,
        time: new Date().toISOString()
      }
      
      const updatedTask = await taskService.addComment(taskId, newComment)
      
      setTasks(prevTasks => 
        prevTasks.map(task => 
          task.$id === taskId ? updatedTask : task
        )
      )
      
      return updatedTask
    } catch (error) {
      console.error('Error adding comment:', error)
    }
  }
  
  /**
   * Delete a comment from a task
   * @param {string} taskId - Task ID
   * @param {string} commentId - Comment ID
   */
  const deleteComment = async (taskId, commentId) => {
    try {
      // Get the current task
      const task = tasks.find(t => t.$id === taskId)
      if (!task) return
      
      // Parse any stringified comments
      const parsedComments = (task.comments || []).map(comment => {
        if (typeof comment === 'string') {
          try {
            return JSON.parse(comment)
          } catch (e) {
            return comment
          }
        }
        return comment
      })
      
      // Find the comment that's being deleted to check if it's a reminder
      const commentToDelete = parsedComments.find(c => c.id === commentId);
      
      // Check if the deleted comment contains a reminder command
      if (commentToDelete && typeof commentToDelete.text === 'string') {
        const reminderRegex = /^!(?:remindme|rmd)\s+/i;
        if (reminderRegex.test(commentToDelete.text)) {
          try {
            // Find and delete all reminders associated with this task
            const taskReminders = await reminderService.getTaskReminders(taskId);
            
            // Delete each reminder for this task
            // This ensures we don't leave orphaned reminders
            await Promise.all(
              taskReminders.map(reminder => reminderService.deleteReminder(reminder.$id))
            );
            
            console.log(`Deleted reminders for task ${taskId} after reminder comment was deleted`);
          } catch (error) {
            console.error('Error deleting associated reminders:', error);
            // Continue with comment deletion even if reminder deletion fails
          }
        }
      }
      
      // Filter out the comment to delete
      const filteredComments = parsedComments.filter(c => c.id !== commentId)
      
      // Stringify the comments again for storage
      const stringifiedComments = filteredComments.map(comment => {
        if (typeof comment === 'object') {
          return JSON.stringify(comment)
        }
        return comment
      })
      
      // Update the task with the new comments array
      const updatedTask = await taskService.updateTask(taskId, { comments: stringifiedComments })
      
      setTasks(prevTasks => 
        prevTasks.map(t => 
          t.$id === taskId ? updatedTask : t
        )
      )
    } catch (error) {
      console.error('Error deleting comment:', error)
    }
  }
  
  /**
   * Toggle task completion status
   * @param {string} id - Task ID
   */
  const toggleTaskCompletion = async (id) => {
    try {
      const task = tasks.find(t => t.$id === id)
      if (!task) return
      
      const updatedTask = await taskService.toggleTaskCompletion(id, task.completed)
      
      setTasks(prevTasks => 
        prevTasks.map(t => 
          t.$id === id ? updatedTask : t
        )
      )
    } catch (error) {
      console.error('Error toggling task completion:', error)
    }
  }
  
  return {
    tasks,
    loading,
    refreshing,
    refreshTasks,
    addTask,
    updateTask,
    deleteTask,
    addComment,
    deleteComment,
    toggleTaskCompletion
  }
}
