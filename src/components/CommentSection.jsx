/**
 * File: CommentSection.jsx
 * Purpose: Display and manage comments for a task
 */
import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { formatDate } from '../utils/date'
import { useAuth } from '../context/AuthContext'
import { useWorkspace } from '../context/WorkspaceContext'
import { parseReminder, saveReminder } from '../utils/reminders'
import { 
  PaperAirplaneIcon, 
  TrashIcon,
  LightBulbIcon,
  BellAlertIcon,
  ClockIcon,
  ExclamationCircleIcon
} from '@heroicons/react/24/outline'

export default function CommentSection({ taskId, taskTitle, comments, onAddComment, onDeleteComment }) {
  const [newComment, setNewComment] = useState('')
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false)
  const [commentToDelete, setCommentToDelete] = useState(null)
  const [reminderProcessing, setReminderProcessing] = useState(false)
  const [reminderError, setReminderError] = useState(null)
  const { currentUser } = useAuth()
  const { activeWorkspaceId } = useWorkspace()
  
  // Parse stringified comments
  const parsedComments = useMemo(() => {
    if (!comments || !Array.isArray(comments)) return [];
    
    return comments.map(comment => {
      if (typeof comment === 'string') {
        try {
          return JSON.parse(comment);
        } catch (e) {
          // If parsing fails, return a fallback object
          console.error('Error parsing comment JSON:', e);
          return { 
            id: 'invalid-' + Math.random().toString(36).substr(2, 9),
            text: comment,
            user: 'Unknown',
            time: new Date().toISOString()
          };
        }
      }
      return comment;
    });
  }, [comments]);
  
  const handleAddComment = async (e) => {
    e.preventDefault()
    
    if (!newComment.trim()) return
    
    // Check if this is a reminder command
    const reminderRegex = /^!(?:remindme|rmd)\s+/i
    if (reminderRegex.test(newComment)) {
      setReminderProcessing(true)
      setReminderError(null)
      
      try {
        // Parse the reminder text and date
        const parsedReminder = await parseReminder(newComment)
        
        if (parsedReminder.error) {
          setReminderError(parsedReminder.error)
          // Still add the comment, but note that we couldn't parse the date
          onAddComment(taskId, newComment)
          setNewComment('')
        } else {
          // Save the reminder
          const contextData = {
            currentUser,
            taskId,
            workspaceId: activeWorkspaceId,
            taskTitle
          }
          
          await saveReminder(parsedReminder, contextData)
          
          // Add a regular comment
          onAddComment(taskId, newComment)
          setNewComment('')
        }
      } catch (error) {
        console.error('Error processing reminder:', error)
        setReminderError('Failed to set reminder, but comment was added')
        
        // Still add the comment even if reminder processing failed
        onAddComment(taskId, newComment)
        setNewComment('')
      } finally {
        setReminderProcessing(false)
      }
    } else {
      // Regular comment
      onAddComment(taskId, newComment)
      setNewComment('')
    }
  }
  
  const handleDeleteComment = (commentId) => {
    setCommentToDelete(commentId)
    setIsDeleteConfirmOpen(true)
  }
  
  const confirmDeleteComment = () => {
    onDeleteComment(taskId, commentToDelete)
    setIsDeleteConfirmOpen(false)
    setCommentToDelete(null)
  }
  
  const cancelDeleteComment = () => {
    setIsDeleteConfirmOpen(false)
    setCommentToDelete(null)
  }
  
  // Process special commands in comments
  const processCommentText = (text) => {
    // Handle command: !remindme or !rmd
    if (text.match(/^!(?:remindme|rmd)\s+/i)) {
      const reminderText = text.replace(/^!(?:remindme|rmd)\s+/i, '').trim()
      
      return (
        <div className="flex items-start space-x-2">
          <BellAlertIcon className="w-4 h-4 text-amber-500 dark:text-yellow-500 shrink-0 mt-0.5" />
          <div>
            <span className="font-medium text-gray-800 dark:text-gray-200">Reminder set</span>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {reminderText || 'Reminder for this task'}
            </p>
          </div>
        </div>
      )
    }
    
    // Handle command: !help
    if (text.startsWith('!help')) {
      return (
        <div className="flex items-start space-x-2">
          <LightBulbIcon className="w-4 h-4 text-amber-500 dark:text-yellow-500 shrink-0 mt-0.5" />
          <div>
            <span className="font-medium text-gray-800 dark:text-gray-200">Help</span>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Available commands:
              <br />• !remindme or !rmd - Set a reminder (e.g., "!rmd call John tomorrow at 3pm")
              <br />• !help - Show this help message
            </p>
          </div>
        </div>
      )
    }
    
    // Regular comment text
    return <p className="text-gray-800 dark:text-gray-200">{text}</p>
  }
  
  // Format relative time
  const formatRelativeTime = (dateString) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInSeconds = Math.floor((now - date) / 1000)
    
    if (diffInSeconds < 60) {
      return 'just now'
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60)
      return `${minutes}m ago`
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600)
      return `${hours}h ago`
    } else if (diffInSeconds < 604800) {
      const days = Math.floor(diffInSeconds / 86400)
      return `${days}d ago`
    } else {
      return formatDate(date).split(' at ')[0]
    }
  }
  
  return (
    <div className="p-4 space-y-4 bg-gray-50 dark:bg-neutral-800/80 transition-all">
      {/* Comments list */}
      <div className="space-y-3 max-h-60 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-neutral-600 pr-1">
        {parsedComments.length === 0 ? (
          <div className="flex items-center justify-center p-4 text-center">
            <p className="text-sm text-gray-500 dark:text-gray-400 italic">
              No comments yet. Add the first one!
            </p>
          </div>
        ) : (
          parsedComments.map((comment) => (
            <motion.div
              key={comment.id}
              className="flex space-x-3"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
            >
              {/* User avatar */}
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-100 to-violet-100 dark:from-indigo-900/40 dark:to-violet-900/40 text-indigo-700 dark:text-indigo-300 flex items-center justify-center font-medium text-sm shrink-0 shadow-sm">
                {comment.user.charAt(0).toUpperCase()}
              </div>
              
              {/* Comment content */}
              <div className="flex-grow">
                <div className="bg-white dark:bg-neutral-800 p-3 rounded-lg shadow-sm border border-gray-200 dark:border-neutral-700 hover:border-gray-300 dark:hover:border-neutral-600 transition-colors">
                  <div className="flex justify-between items-start mb-1">
                    <span className="font-medium text-sm text-gray-800 dark:text-gray-200">
                      {comment.user}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {formatRelativeTime(comment.time)}
                    </span>
                  </div>
                  
                  {processCommentText(comment.text)}
                </div>
                
                {/* Delete action */}
                <motion.button
                  onClick={() => handleDeleteComment(comment.id)}
                  className="mt-1 text-xs text-gray-500 hover:text-red-500 dark:text-gray-400 dark:hover:text-red-400 flex items-center opacity-70 hover:opacity-100 transition-opacity"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <TrashIcon className="w-3 h-3 mr-1" />
                  Delete
                </motion.button>
              </div>
            </motion.div>
          ))
        )}
      </div>
      
      {/* Add comment form */}
      <form onSubmit={handleAddComment} className="mt-4 flex items-center space-x-2">
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-100 to-violet-100 dark:from-indigo-900/40 dark:to-violet-900/40 text-indigo-700 dark:text-indigo-300 flex items-center justify-center font-medium text-sm shrink-0 shadow-sm">
          {currentUser?.name?.charAt(0).toUpperCase() || 'U'}
        </div>
        
        <div className="flex-grow relative">
          <input
            type="text"
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Add a comment or use !help"
            className="w-full p-2 rounded-md border border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-gray-800 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-transparent shadow-sm outline-none transition-all"
            disabled={reminderProcessing}
          />
          {reminderError && (
            <div className="absolute -bottom-6 left-0 text-xs text-red-500 flex items-center">
              <ExclamationCircleIcon className="w-3 h-3 mr-1" />
              {reminderError}
            </div>
          )}
        </div>
        
        <motion.button
          type="submit"
          className="p-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md transition-colors disabled:opacity-50 shadow-sm"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          disabled={!newComment.trim() || reminderProcessing}
        >
          {reminderProcessing ? (
            <ClockIcon className="w-5 h-5 animate-pulse" />
          ) : (
            <PaperAirplaneIcon className="w-5 h-5" />
          )}
        </motion.button>
      </form>
      
      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {isDeleteConfirmOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
            onClick={() => cancelDeleteComment()}
          >
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="bg-white dark:bg-neutral-800 rounded-lg p-5 w-80 shadow-xl flex flex-col border border-gray-200 dark:border-neutral-700"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="text-center mb-4">
                <div className="mx-auto w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mb-3 shadow-inner">
                  <TrashIcon className="w-6 h-6 text-red-500 dark:text-red-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-1">Delete Comment</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Are you sure you want to delete this comment?
                </p>
              </div>
              
              <div className="flex justify-between gap-3 mt-2">
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => cancelDeleteComment()}
                  className="flex-1 py-2 px-4 bg-gray-200 dark:bg-neutral-700 rounded-md text-gray-800 dark:text-gray-300 font-medium hover:bg-gray-300 dark:hover:bg-neutral-600 transition-colors shadow-sm"
                >
                  Cancel
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => confirmDeleteComment()}
                  className="flex-1 py-2 px-4 bg-red-500 hover:bg-red-600 rounded-md text-white font-medium transition-colors shadow-sm"
                >
                  Delete
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
