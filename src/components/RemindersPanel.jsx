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
        <span className="inline-flex items-center px-2 py-1 rounded-md bg-white dark:bg-black text-black dark:text-white border border-black/10 dark:border-white/10 text-xs">
          <CheckCircleIcon className="w-3 h-3 mr-1" />
          Sent
        </span>
      )
    }
    
    if (!reminder.dueDate) {
      return (
        <span className="inline-flex items-center px-2 py-1 rounded-md bg-white dark:bg-black text-black dark:text-white border border-black/10 dark:border-white/10 text-xs">
          <ClockIcon className="w-3 h-3 mr-1" />
          No date
        </span>
      )
    }
    
    if (isPast(reminder.dueDate)) {
      return (
        <span className="inline-flex items-center px-2 py-1 rounded-md bg-white dark:bg-black text-black dark:text-white border border-black/10 dark:border-white/10 text-xs">
          <ClockIcon className="w-3 h-3 mr-1" />
          Sending...
        </span>
      )
    }
    
    return (
      <span className="inline-flex items-center px-2 py-1 rounded-md bg-white dark:bg-black text-black dark:text-white border border-black/10 dark:border-white/10 text-xs">
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
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[9999]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          
          {/* Panel */}
          <motion.div
            className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-primary-50 shadow-md h-full overflow-auto z-[9999] border-l border-primary-300 font-sans"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ 
              type: 'spring', 
              damping: 25, 
              stiffness: 300 
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="p-4 border-b border-primary-300 flex items-center justify-between sticky top-0 z-10 bg-primary-50">
              <h2 className="text-lg font-semibold text-primary-700 flex items-center">
                <div className="bg-primary-100 p-2 rounded-md mr-3 border border-primary-300">
                  <BellAlertIcon className="w-5 h-5 text-primary-700" />
                </div>
                Your Reminders
              </h2>
              <motion.button 
                onClick={onClose}
                className="p-2 rounded-full hover:bg-primary-100 transition-colors"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <XMarkIcon className="w-5 h-5 text-primary-700" />
              </motion.button>
            </div>
            
            {/* Filter buttons */}
            <div className="sticky top-[73px] z-10 flex p-3 bg-primary-50 border-b border-primary-300">
              <div className="bg-primary-100 p-1 rounded-md flex w-full">
                <button
                  onClick={() => setFilterStatus('all')}
                  className={`flex-1 px-3 py-1.5 text-sm font-medium rounded-md transition-all ${
                    filterStatus === 'all' 
                      ? 'bg-primary-50 text-primary-700 shadow-sm border border-primary-300' 
                      : 'text-primary-800 hover:text-primary-700'
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => setFilterStatus('pending')}
                  className={`flex-1 px-3 py-1.5 text-sm font-medium rounded-md transition-all ${
                    filterStatus === 'pending' 
                      ? 'bg-primary-50 text-primary-700 shadow-sm border border-primary-300' 
                      : 'text-primary-800 hover:text-primary-700'
                  }`}
                >
                  Pending
                </button>
                <button
                  onClick={() => setFilterStatus('sent')}
                  className={`flex-1 px-3 py-1.5 text-sm font-medium rounded-md transition-all ${
                    filterStatus === 'sent' 
                      ? 'bg-primary-50 text-primary-700 shadow-sm border border-primary-300' 
                      : 'text-primary-800 hover:text-primary-700'
                  }`}
                >
                  Sent
                </button>
              </div>
            </div>
            
            <div className="p-4">
              {loading ? (
                <div className="flex flex-col items-center justify-center py-16">
                  <div className="w-12 h-12 rounded-full border-2 border-primary-300 border-t-primary-700 animate-spin mb-4"></div>
                  <p className="text-primary-800">Loading reminders...</p>
                </div>
              ) : reminders.length === 0 ? (
                <div className="text-center py-16 px-4">
                  <div className="bg-primary-100 rounded-md p-4 w-20 h-20 mx-auto mb-4 flex items-center justify-center border border-primary-300">
                    <BellAlertIcon className="w-10 h-10 text-primary-700" />
                  </div>
                  <h3 className="text-lg font-medium text-primary-700 mb-2">No reminders</h3>
                  <p className="text-primary-800 max-w-xs mx-auto">
                    Use <code className="bg-primary-100 px-1.5 py-0.5 rounded-md text-primary-700 border border-primary-300">!remindme</code> or <code className="bg-primary-100 px-1.5 py-0.5 rounded-md text-primary-700 border border-primary-300">!rmd</code> in a comment to set a reminder
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
                        className="bg-primary-50 border border-primary-300 rounded-md p-4 shadow-sm"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        whileHover={{ y: -2 }}
                      >
                        <div className="flex justify-between items-start mb-3">
                          <span className="font-medium text-primary-700">
                            {reminder.text}
                          </span>
                          <motion.button
                            onClick={() => handleDelete(reminder.$id)}
                            className="text-primary-800 hover:text-primary-700 transition-colors p-1 rounded-full"
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                          >
                            <TrashIcon className="w-4 h-4" />
                          </motion.button>
                        </div>
                        
                        <div className="flex justify-between items-center">
                          {getReminderStatusBadge(reminder)}
                          
                          <span className="text-xs text-primary-800 bg-primary-100 px-2 py-1 rounded-md border border-primary-300">
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
                      <div className="bg-primary-100 rounded-md p-3 w-16 h-16 mx-auto mb-4 flex items-center justify-center border border-primary-300">
                        <ClockIcon className="w-8 h-8 text-primary-700" />
                      </div>
                      <h3 className="text-lg font-medium text-primary-700 mb-2">
                        No {filterStatus} reminders
                      </h3>
                      <button 
                        onClick={() => setFilterStatus('all')} 
                        className="mt-2 text-primary-700 bg-primary-100 px-4 py-2 rounded-md hover:bg-primary-200 transition-colors border border-primary-300"
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
