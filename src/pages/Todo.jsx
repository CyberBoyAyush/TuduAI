/**
 * File: Todo.jsx
 * Purpose: Main dashboard with all task logic, UI, and columns
 */
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuth } from '../context/AuthContext'
import { useWorkspace } from '../context/WorkspaceContext'
import useTasks from '../hooks/useTasks'
import TaskInput from '../components/TaskInput'
import TaskList from '../components/TaskList'
import { PlusIcon, ArrowPathIcon } from '@heroicons/react/24/outline'

export default function Todo({ showCompletedTasks }) {
  const { currentUser, loading: authLoading } = useAuth()
  const { resetWorkspaces } = useWorkspace()
  const { 
    tasks, 
    loading: tasksLoading,
    refreshing,
    refreshTasks,
    addTask,
    updateTask,
    deleteTask,
    addComment,
    deleteComment,
    toggleTaskCompletion 
  } = useTasks()
  
  const [isAddingTask, setIsAddingTask] = useState(false)
  const [addingTaskStatus, setAddingTaskStatus] = useState(null)
  const navigate = useNavigate()
  
  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !currentUser) {
      navigate('/login')
    }
  }, [currentUser, authLoading, navigate])
  
  const handleAddTask = async (taskData) => {
    setIsAddingTask(true);
    setAddingTaskStatus('Adding task...');
    
    try {
      const newTaskId = await addTask(taskData);
      setAddingTaskStatus('Task added successfully!');
      setTimeout(() => {
        setAddingTaskStatus(null);
      }, 2000);
      return newTaskId;
    } catch (error) {
      console.error("Error adding task:", error);
      setAddingTaskStatus('Failed to add task');
      setTimeout(() => {
        setAddingTaskStatus(null);
      }, 2000);
      return null;
    } finally {
      setIsAddingTask(false);
    }
  }
  
  if (authLoading || tasksLoading) {
    return (
      <div className="flex items-center justify-center h-64 font-sans">
        <div className="flex flex-col items-center">
          <ArrowPathIcon className="w-10 h-10 text-primary-700 animate-spin" />
          <p className="mt-4 text-primary-800">Loading your tasks...</p>
        </div>
      </div>
    )
  }
  
  return (
    <div className="max-w-7xl mx-auto font-sans">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="mb-8"
      >
        {/* Show task input at the top, always visible like in the screenshot */}
        <div className="mt-4">
          <TaskInput onAddTask={handleAddTask} />
          {addingTaskStatus && (
            <p className={`text-sm mt-2 ${addingTaskStatus.includes('Failed') ? 'text-red-500' : 'text-green-500'}`}>
              {addingTaskStatus}
            </p>
          )}
        </div>
      </motion.div>
      
      {/* Refresh button and section header */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-primary-700">Your Tasks</h2>
        <motion.button
          onClick={refreshTasks}
          disabled={refreshing}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="flex items-center px-3 py-2 bg-primary-100 text-primary-700 rounded-md border border-primary-300 hover:bg-primary-200 transition-colors shadow-sm"
        >
          <ArrowPathIcon className={`w-5 h-5 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          <span className="text-sm font-medium">Refresh Tasks</span>
        </motion.button>
      </div>
      
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
