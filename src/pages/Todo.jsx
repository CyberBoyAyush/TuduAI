/**
 * File: Todo.jsx
 * Purpose: Main dashboard with all task logic, UI, and columns
 */
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuth } from '../context/AuthContext'
import useTasks from '../hooks/useTasks'
import TaskInput from '../components/TaskInput'
import TaskList from '../components/TaskList'
import { PlusIcon, ArrowPathIcon } from '@heroicons/react/24/outline'

export default function Todo({ showCompletedTasks }) {
  const { currentUser, loading: authLoading } = useAuth()
  const { 
    tasks, 
    loading: tasksLoading,
    addTask,
    updateTask,
    deleteTask,
    addComment,
    deleteComment,
    toggleTaskCompletion 
  } = useTasks()
  
  const [isAddingTask, setIsAddingTask] = useState(false)
  const navigate = useNavigate()
  
  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !currentUser) {
      navigate('/login')
    }
  }, [currentUser, authLoading, navigate])
  
  const handleAddTask = (taskData) => {
    const newTaskId = addTask(taskData)
    return newTaskId
  }
  
  if (authLoading || tasksLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center">
          <ArrowPathIcon className="w-10 h-10 text-primary-500 animate-spin" />
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading your tasks...</p>
        </div>
      </div>
    )
  }
  
  return (
    <div className="max-w-7xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="mb-8"
      >
        {/* Show task input at the top, always visible like in the screenshot */}
        <div className="mt-4">
          <TaskInput onAddTask={(taskData) => {
            handleAddTask(taskData)
          }} />
        </div>
      </motion.div>
      
      {/* Task list */}
      <TaskList
        tasks={tasks}
        onUpdate={updateTask}
        onDelete={deleteTask}
        onAddComment={addComment}
        onDeleteComment={deleteComment}
        showCompletedTasks={showCompletedTasks}
      />
    </div>
  )
}
