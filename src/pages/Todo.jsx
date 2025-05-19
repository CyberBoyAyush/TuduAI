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

export default function Todo() {
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
      />
      
      {/* Empty state */}
      {tasks.length === 0 && (
        <motion.div 
          className="text-center py-16 rounded-lg border-2 border-dashed border-gray-300 dark:border-neutral-700"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <h3 className="text-xl font-medium text-gray-900 dark:text-white mb-2">
            No tasks yet
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Click "New Task" to add your first task
          </p>
          <motion.button
            onClick={() => setIsAddingTask(true)}
            className="px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-md inline-flex items-center"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <PlusIcon className="w-5 h-5 mr-2" />
            <span>Add Your First Task</span>
          </motion.button>
        </motion.div>
      )}
    </div>
  )
}
