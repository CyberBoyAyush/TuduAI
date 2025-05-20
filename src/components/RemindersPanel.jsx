/**
 * File: RemindersPanel.jsx
 * Purpose: Display upcoming reminders for the user
 */
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { formatDate, isPast } from '../utils/date'
import { useAuth } from '../context/AuthContext'
import { useWorkspace } from '../context/WorkspaceContext'
import { getUserReminders, deleteReminder } from '../utils/reminders'
import {
  BellAlertIcon,
  TrashIcon,
  CheckCircleIcon,
  ClockIcon,
  XMarkIcon
} from '@heroicons/react/24/outline'

export default function RemindersPanel({ isOpen, onClose }) {
  const { currentUser } = useAuth()
  const { activeWorkspaceId } = useWorkspace()
  const [reminders, setReminders] = useState([])
  const [loading, setLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState('all')
  
  // Load reminders when user or workspace changes
  useEffect(() => {
    if (!currentUser) {
      setReminders([])
      setLoading(false)
      return
    }
    
    setLoading(true)
    
    // Get reminders for the current user in the active workspace
    const userReminders = getUserReminders(currentUser.id, activeWorkspaceId)
    
    // Sort reminders by due date (closest first)
    const sortedReminders = userReminders.sort((a, b) => {
      if (!a.dueDate) return 1
      if (!b.dueDate) return -1
      return new Date(a.dueDate) - new Date(b.dueDate)
    })
    
    setReminders(sortedReminders)
    setLoading(false)
  }, [currentUser, activeWorkspaceId, isOpen])
  
  // Handle reminder deletion
  const handleDelete = (reminderId) => {
    deleteReminder(reminderId)
    
    // Update local state
    setReminders(prevReminders => 
      prevReminders.filter(reminder => reminder.id !== reminderId)
    )
  }
  
  // Get status badge for a reminder
  const getReminderStatusBadge = (reminder) => {
    if (reminder.status === 'sent') {
      return (
        <span className="inline-flex items-center text-xs font-medium text-green-700 dark:text-green-400">
          <CheckCircleIcon className="w-3 h-3 mr-1" />
          Sent
        </span>
      )
    }
    
    if (!reminder.dueDate) {
      return (
        <span className="inline-flex items-center text-xs font-medium text-gray-500 dark:text-gray-400">
          <ClockIcon className="w-3 h-3 mr-1" />
          No date
        </span>
      )
    }
    
    if (isPast(reminder.dueDate)) {
      return (
        <span className="inline-flex items-center text-xs font-medium text-amber-600 dark:text-amber-400">
          <ClockIcon className="w-3 h-3 mr-1" />
          Sending...
        </span>
      )
    }
    
    return (
      <span className="inline-flex items-center text-xs font-medium text-blue-600 dark:text-blue-400">
        <ClockIcon className="w-3 h-3 mr-1" />
        {formatDate(reminder.dueDate)}
      </span>
    )
  }
  
  // If panel is closed, don't render anything
  if (!isOpen) return null
  
  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 bg-black/40 dark:bg-black/50 backdrop-blur-sm z-40"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          className="absolute right-0 top-0 bottom-0 w-full max-w-sm bg-white dark:bg-neutral-900 shadow-xl h-full overflow-auto"
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', damping: 30, stiffness: 300 }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="p-4 border-b border-gray-200 dark:border-neutral-700 flex items-center justify-between bg-white dark:bg-neutral-800">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200 flex items-center">
              <BellAlertIcon className="w-5 h-5 mr-2 text-indigo-500 dark:text-indigo-400" />
              Your Reminders
            </h2>
            <button 
              onClick={onClose}
              className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-neutral-700 transition-colors"
            >
              <XMarkIcon className="w-5 h-5 text-gray-500 dark:text-gray-400" />
            </button>
          </div>
          
          {/* Filter buttons */}
          <div className="flex p-3 bg-white dark:bg-neutral-800 border-b border-gray-200 dark:border-neutral-700">
            <button
              onClick={() => setFilterStatus('all')}
              className={`flex-1 px-3 py-1.5 text-xs font-medium rounded-l-md transition-colors ${
                filterStatus === 'all' 
                  ? 'bg-indigo-600 text-white' 
                  : 'bg-gray-100 dark:bg-neutral-700 text-gray-700 dark:text-gray-300'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilterStatus('pending')}
              className={`flex-1 px-3 py-1.5 text-xs font-medium transition-colors ${
                filterStatus === 'pending' 
                  ? 'bg-indigo-600 text-white' 
                  : 'bg-gray-100 dark:bg-neutral-700 text-gray-700 dark:text-gray-300'
              }`}
            >
              Pending
            </button>
            <button
              onClick={() => setFilterStatus('sent')}
              className={`flex-1 px-3 py-1.5 text-xs font-medium rounded-r-md transition-colors ${
                filterStatus === 'sent' 
                  ? 'bg-indigo-600 text-white' 
                  : 'bg-gray-100 dark:bg-neutral-700 text-gray-700 dark:text-gray-300'
              }`}
            >
              Sent
            </button>
          </div>
          
          <div className="p-4">
            {loading ? (
              <div className="flex justify-center py-8">
                <ClockIcon className="w-8 h-8 text-indigo-500 dark:text-indigo-400 animate-pulse" />
              </div>
            ) : reminders.length === 0 ? (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <BellAlertIcon className="w-10 h-10 mx-auto mb-3 text-gray-300 dark:text-gray-600" />
                <p>No reminders found</p>
                <p className="text-sm mt-2">
                  Use <code className="bg-gray-100 dark:bg-neutral-700 px-1 py-0.5 rounded">!remindme</code> or <code className="bg-gray-100 dark:bg-neutral-700 px-1 py-0.5 rounded">!rmd</code> in a comment to set a reminder
                </p>
              </div>
            ) : (              <div className="space-y-3">
                {reminders
                  .filter(reminder => filterStatus === 'all' || reminder.status === filterStatus)
                  .map(reminder => (
                    <motion.div
                    key={reminder.id}
                    className="bg-gray-50 dark:bg-neutral-800/50 border border-gray-200 dark:border-neutral-700 rounded-lg p-3"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                  >
                    <div className="flex justify-between mb-1">
                      <span className="font-medium text-gray-800 dark:text-gray-200">
                        {reminder.text}
                      </span>
                      <button
                        onClick={() => handleDelete(reminder.id)}
                        className="text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors"
                      >
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    </div>
                    
                    <div className="flex justify-between items-center text-xs">
                      {getReminderStatusBadge(reminder)}
                      
                      <span className="text-gray-500 dark:text-gray-400">
                        Task: {reminder.taskTitle || "Unknown task"}
                      </span>
                    </div>
                  </motion.div>
                ))}
                
                {/* Show message when filtered results are empty */}
                {reminders.length > 0 && 
                 filterStatus !== 'all' && 
                 !reminders.some(r => r.status === filterStatus) && (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    <ClockIcon className="w-8 h-8 mx-auto mb-3 text-gray-300 dark:text-gray-600" />
                    <p>No {filterStatus} reminders found</p>
                    <button 
                      onClick={() => setFilterStatus('all')} 
                      className="mt-2 text-indigo-500 dark:text-indigo-400 text-sm hover:underline"
                    >
                      Show all reminders
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
