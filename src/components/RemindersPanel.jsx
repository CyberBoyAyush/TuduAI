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
  XMarkIcon,
  CalendarIcon
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
    const fetchReminders = async () => {
      try {
        const userReminders = await getUserReminders(currentUser.$id, activeWorkspaceId)
        
        // Sort reminders by due date (closest first)
        const sortedReminders = userReminders.sort((a, b) => {
          if (!a.dueDate) return 1
          if (!b.dueDate) return -1
          return new Date(a.dueDate) - new Date(b.dueDate)
        })
        
        setReminders(sortedReminders)
      } catch (error) {
        console.error('Error fetching reminders:', error)
      } finally {
        setLoading(false)
      }
    }
    
    fetchReminders()
  }, [currentUser, activeWorkspaceId, isOpen])
  
  // Handle reminder deletion
  const handleDelete = async (reminderId) => {
    try {
      await deleteReminder(reminderId)
      
      // Update local state
      setReminders(prevReminders => 
        prevReminders.filter(reminder => reminder.$id !== reminderId)
      )
    } catch (error) {
      console.error('Error deleting reminder:', error)
    }
  }
  
  // Get status badge for a reminder
  const getReminderStatusBadge = (reminder) => {
    if (reminder.status === 'done') {
      return (
        <span className="inline-flex items-center px-2 py-1 rounded-full bg-green-100 dark:bg-green-900/30 text-xs font-medium text-green-700 dark:text-green-400">
          <CheckCircleIcon className="w-3 h-3 mr-1" />
          Sent
        </span>
      )
    }
    
    if (!reminder.dueDate) {
      return (
        <span className="inline-flex items-center px-2 py-1 rounded-full bg-gray-100 dark:bg-gray-800 text-xs font-medium text-gray-600 dark:text-gray-400">
          <ClockIcon className="w-3 h-3 mr-1" />
          No date
        </span>
      )
    }
    
    if (isPast(reminder.dueDate)) {
      return (
        <span className="inline-flex items-center px-2 py-1 rounded-full bg-amber-100 dark:bg-amber-900/30 text-xs font-medium text-amber-600 dark:text-amber-400">
          <ClockIcon className="w-3 h-3 mr-1" />
          Sending...
        </span>
      )
    }
    
    return (
      <span className="inline-flex items-center px-2 py-1 rounded-full bg-blue-100 dark:bg-blue-900/30 text-xs font-medium text-blue-600 dark:text-blue-400">
        <CalendarIcon className="w-3 h-3 mr-1" />
        {formatDate(reminder.dueDate)}
      </span>
    )
  }
  
  // Map display filter to actual database status
  const getStatusFilter = (displayFilter) => {
    if (displayFilter === 'sent') return 'done';
    return displayFilter;
  };
  
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop overlay */}
          <motion.div
            className="fixed inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-sm z-[9999]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          
          {/* Panel */}
          <motion.div
            className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-white dark:bg-neutral-900 shadow-2xl h-full overflow-auto z-[9999] border-l border-gray-200 dark:border-neutral-700"
            initial={{ x: '100%', boxShadow: "0 0 0 rgba(0, 0, 0, 0)" }}
            animate={{ 
              x: 0, 
              boxShadow: "0 0 40px rgba(0, 0, 0, 0.2)" 
            }}
            exit={{ x: '100%', boxShadow: "0 0 0 rgba(0, 0, 0, 0)" }}
            transition={{ 
              type: 'spring', 
              damping: 25, 
              stiffness: 300 
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="p-4 border-b border-gray-200 dark:border-neutral-700 flex items-center justify-between bg-gradient-to-r from-white to-gray-50 dark:from-neutral-800 dark:to-neutral-900 sticky top-0 z-10">
              <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100 flex items-center">
                <div className="bg-indigo-100 dark:bg-indigo-900/40 p-2 rounded-lg mr-3">
                  <BellAlertIcon className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                </div>
                Your Reminders
              </h2>
              <motion.button 
                onClick={onClose}
                className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-neutral-700 transition-colors"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <XMarkIcon className="w-5 h-5 text-gray-500 dark:text-gray-400" />
              </motion.button>
            </div>
            
            {/* Filter buttons */}
            <div className="sticky top-[73px] z-10 flex p-3 bg-white dark:bg-neutral-800 border-b border-gray-200 dark:border-neutral-700 shadow-sm">
              <div className="bg-gray-100 dark:bg-neutral-700 p-1 rounded-lg flex w-full">
                <button
                  onClick={() => setFilterStatus('all')}
                  className={`flex-1 px-3 py-1.5 text-sm font-medium rounded-md transition-all ${
                    filterStatus === 'all' 
                      ? 'bg-white dark:bg-neutral-900 text-indigo-600 dark:text-indigo-400 shadow-sm' 
                      : 'text-gray-700 dark:text-gray-300 hover:text-indigo-500 dark:hover:text-indigo-400'
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => setFilterStatus('pending')}
                  className={`flex-1 px-3 py-1.5 text-sm font-medium rounded-md transition-all ${
                    filterStatus === 'pending' 
                      ? 'bg-white dark:bg-neutral-900 text-indigo-600 dark:text-indigo-400 shadow-sm' 
                      : 'text-gray-700 dark:text-gray-300 hover:text-indigo-500 dark:hover:text-indigo-400'
                  }`}
                >
                  Pending
                </button>
                <button
                  onClick={() => setFilterStatus('sent')}
                  className={`flex-1 px-3 py-1.5 text-sm font-medium rounded-md transition-all ${
                    filterStatus === 'sent' 
                      ? 'bg-white dark:bg-neutral-900 text-indigo-600 dark:text-indigo-400 shadow-sm' 
                      : 'text-gray-700 dark:text-gray-300 hover:text-indigo-500 dark:hover:text-indigo-400'
                  }`}
                >
                  Sent
                </button>
              </div>
            </div>
            
            <div className="p-4">
              {loading ? (
                <div className="flex flex-col items-center justify-center py-16">
                  <div className="w-12 h-12 rounded-full border-4 border-indigo-100 dark:border-indigo-900/40 border-t-indigo-600 dark:border-t-indigo-400 animate-spin mb-4"></div>
                  <p className="text-gray-500 dark:text-gray-400">Loading reminders...</p>
                </div>
              ) : reminders.length === 0 ? (
                <div className="text-center py-16 px-4">
                  <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-full p-4 w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                    <BellAlertIcon className="w-10 h-10 text-indigo-400 dark:text-indigo-500" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200 mb-2">No reminders</h3>
                  <p className="text-gray-500 dark:text-gray-400 max-w-xs mx-auto">
                    Use <code className="bg-gray-100 dark:bg-neutral-700 px-1.5 py-0.5 rounded text-indigo-600 dark:text-indigo-400">!remindme</code> or <code className="bg-gray-100 dark:bg-neutral-700 px-1.5 py-0.5 rounded text-indigo-600 dark:text-indigo-400">!rmd</code> in a comment to set a reminder
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {reminders
                    .filter(reminder => {
                      if (filterStatus === 'all') return true;
                      if (filterStatus === 'sent') return reminder.status === 'done';
                      return reminder.status === filterStatus;
                    })
                    .map(reminder => (
                      <motion.div
                        key={reminder.$id}
                        className="bg-white dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-xl p-4 shadow-sm hover:shadow-md transition-all"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        whileHover={{ y: -2 }}
                      >
                        <div className="flex justify-between items-start mb-3">
                          <span className="font-medium text-gray-800 dark:text-gray-200">
                            {reminder.text}
                          </span>
                          <motion.button
                            onClick={() => handleDelete(reminder.$id)}
                            className="text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors p-1 rounded-full hover:bg-red-50 dark:hover:bg-red-900/20"
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                          >
                            <TrashIcon className="w-4 h-4" />
                          </motion.button>
                        </div>
                        
                        <div className="flex justify-between items-center">
                          {getReminderStatusBadge(reminder)}
                          
                          <span className="text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-neutral-700 px-2 py-1 rounded-full">
                            {reminder.taskTitle || "Unknown task"}
                          </span>
                        </div>
                      </motion.div>
                    ))}
                  
                  {/* Show message when filtered results are empty */}
                  {reminders.length > 0 && 
                   filterStatus !== 'all' && 
                   !reminders.some(r => {
                     if (filterStatus === 'sent') return r.status === 'done';
                     return r.status === filterStatus;
                   }) && (
                    <div className="text-center py-12 px-4">
                      <div className="bg-gray-100 dark:bg-neutral-800 rounded-full p-3 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                        <ClockIcon className="w-8 h-8 text-gray-400 dark:text-gray-500" />
                      </div>
                      <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-2">
                        No {filterStatus} reminders
                      </h3>
                      <button 
                        onClick={() => setFilterStatus('all')} 
                        className="mt-2 text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20 px-4 py-2 rounded-lg hover:bg-indigo-100 dark:hover:bg-indigo-900/30 transition-colors"
                      >
                        Show all reminders
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
