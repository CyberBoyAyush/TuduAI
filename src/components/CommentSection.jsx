/**
 * File: CommentSection.jsx
 * Purpose: Display and manage comments for a task
 */
import { useState, useMemo, useRef, useEffect } from 'react'
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
  ExclamationCircleIcon,
  ChatBubbleLeftEllipsisIcon,
  FireIcon
} from '@heroicons/react/24/outline'

export default function CommentSection({ taskId, taskTitle, comments, onAddComment, onDeleteComment }) {
  const [newComment, setNewComment] = useState('')
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false)
  const [commentToDelete, setCommentToDelete] = useState(null)
  const [reminderProcessing, setReminderProcessing] = useState(false)
  const [reminderError, setReminderError] = useState(null)
  const { currentUser } = useAuth()
  const { activeWorkspaceId } = useWorkspace()
  const commentsEndRef = useRef(null)
  const inputRef = useRef(null)
  
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
  
  // Auto-scroll to latest comment when new ones are added
  useEffect(() => {
    if (commentsEndRef.current) {
      commentsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [parsedComments.length]);

  // Focus input when component mounts
  useEffect(() => {
    if (inputRef.current) {
      setTimeout(() => {
        inputRef.current.focus();
      }, 300);
    }
  }, []);
  
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
  
  // Get an avatar color based on username
  const getUserAvatarColors = (username) => {
    if (!username) return { from: 'from-gray-400', to: 'to-gray-500', text: 'text-white' };
    
    // Generate a consistent color based on the username
    const colorSets = [
      { from: 'from-pink-500', to: 'to-rose-500', text: 'text-white' },
      { from: 'from-amber-400', to: 'to-orange-500', text: 'text-white' },
      { from: 'from-emerald-500', to: 'to-green-600', text: 'text-white' },
      { from: 'from-cyan-500', to: 'to-blue-600', text: 'text-white' },
      { from: 'from-violet-500', to: 'to-purple-600', text: 'text-white' },
      { from: 'from-indigo-500', to: 'to-blue-600', text: 'text-white' },
      { from: 'from-red-500', to: 'to-pink-600', text: 'text-white' },
    ];
    
    // Use a hash-like function to get a consistent color for the same name
    let hash = 0;
    for (let i = 0; i < username.length; i++) {
      hash = ((hash << 5) - hash) + username.charCodeAt(i);
    }
    hash = Math.abs(hash) % colorSets.length;
    
    return colorSets[hash];
  }
  
  // Process special commands in comments
  const processCommentText = (text) => {
    // Handle command: !remindme or !rmd
    if (text.match(/^!(?:remindme|rmd)\s+/i)) {
      const reminderText = text.replace(/^!(?:remindme|rmd)\s+/i, '').trim()
      
      return (
        <div className="flex items-start space-x-2">
          <div className="p-1.5 bg-amber-100 dark:bg-amber-900/30 rounded-full">
            <BellAlertIcon className="w-4 h-4 text-amber-600 dark:text-amber-400" />
          </div>
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
          <div className="p-1.5 bg-blue-100 dark:bg-blue-900/30 rounded-full">
            <LightBulbIcon className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <span className="font-medium text-gray-800 dark:text-gray-200">Help</span>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Available commands:
              <br />• <span className="font-sans text-xs bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded">!remindme</span> or <span className="font-sans text-xs bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded">!rmd</span> - Set a reminder
              <br />• <span className="font-sans text-xs bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded">!help</span> - Show this help message
            </p>
          </div>
        </div>
      )
    }
    
    // Regular comment text
    return <p className="text-gray-800 dark:text-gray-200 whitespace-pre-wrap">{text}</p>
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
    <div className="p-4 space-y-4 bg-primary-50 transition-all font-sans">
      {/* Comment section header */}
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-medium text-primary-700 flex items-center">
          <ChatBubbleLeftEllipsisIcon className="w-4 h-4 mr-2" />
          Comments {parsedComments.length > 0 && <span className="ml-1.5 text-xs bg-primary-100 text-primary-700 px-1.5 py-0.5 rounded-full">{parsedComments.length}</span>}
        </h3>
      </div>
      
      {/* Comments list */}
      <div className="space-y-4 max-h-64 overflow-y-auto scrollbar-thin scrollbar-thumb-primary-300 scrollbar-track-transparent pr-1 pb-1">
        {parsedComments.length === 0 ? (
          <motion.div 
            className="flex flex-col items-center justify-center p-4 text-center space-y-2 rounded-md border border-dashed border-primary-300 bg-primary-100"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <FireIcon className="w-10 h-10 text-primary-800 opacity-75" />
            <p className="text-sm text-primary-800">
              No comments yet. Start the conversation!
            </p>
          </motion.div>
        ) : (
          parsedComments.map((comment, index) => {
            const avatarColors = getUserAvatarColors(comment.user);
            
            return (
              <motion.div
                key={comment.id}
                className={`flex ${index % 2 === 0 ? 'justify-start' : 'justify-start'}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
              >
                {/* User avatar */}
                <motion.div 
                  whileHover={{ scale: 1.1 }}
                  className="w-8 h-8 rounded-md bg-primary-700 text-primary-50 flex items-center justify-center font-medium text-sm shrink-0 border border-primary-300"
                >
                  {comment.user.charAt(0).toUpperCase()}
                </motion.div>
                
                {/* Comment content */}
                <div className={`flex-grow ml-3 max-w-[90%]`}>
                  <motion.div 
                    className="bg-primary-50 p-3 rounded-md shadow-sm border border-primary-300"
                    whileHover={{ y: -2 }}
                    transition={{ duration: 0.2 }}
                  >
                    <div className="flex justify-between items-start mb-1.5">
                      <span className="font-medium text-sm text-primary-700">
                        {comment.user}
                      </span>
                      <span className="text-xs text-primary-800 bg-primary-100 rounded-full px-2 py-0.5">
                        {formatRelativeTime(comment.time)}
                      </span>
                    </div>
                    
                    {processCommentText(comment.text)}
                  </motion.div>
                  
                  {/* Delete action */}
                  <motion.button
                    onClick={() => handleDeleteComment(comment.id)}
                    className="mt-1 ml-1 text-xs text-primary-800 hover:text-red-500 flex items-center opacity-0 group-hover:opacity-100 hover:opacity-100 transition-all duration-200"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <TrashIcon className="w-3 h-3 mr-1" />
                    Delete
                  </motion.button>
                </div>
              </motion.div>
            );
          })
        )}
        <div ref={commentsEndRef} />
      </div>
      
      {/* Add comment form */}
      <form onSubmit={handleAddComment} className="mt-4">
        <div className="flex items-center space-x-3 group bg-primary-50 transition-all">
          {/* User avatar */}
          <motion.div 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="w-8 h-8 rounded-md bg-primary-700 text-primary-50 flex items-center justify-center font-medium text-sm shrink-0 border border-primary-300"
          >
            {currentUser?.name?.charAt(0).toUpperCase() || 'U'}
          </motion.div>
          
          {/* Input field */}
          <div className="flex-grow relative">
            <input
              ref={inputRef}
              type="text"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Add a comment or use !help"
              className="w-full py-1.5 px-2 rounded-md bg-transparent border-none text-primary-700 placeholder-primary-800 focus:ring-0 focus:outline-none text-sm font-sans"
              disabled={reminderProcessing}
            />
            {reminderError && (
              <div className="absolute -bottom-6 left-0 text-xs text-red-500 flex items-center bg-primary-100 p-1 rounded-md shadow-sm">
                <ExclamationCircleIcon className="w-3 h-3 mr-1" />
                {reminderError}
              </div>
            )}
          </div>
          
          {/* Action buttons */}
          <motion.button
            type="submit"
            className={`p-2 rounded-md transition-all border ${
              !newComment.trim() || reminderProcessing
              ? 'bg-primary-100 text-primary-700 border-primary-300'
              : 'bg-primary-700 text-primary-50 hover:bg-primary-800 border-primary-600'
            }`}
            whileHover={{ scale: !newComment.trim() || reminderProcessing ? 1 : 1.05 }}
            whileTap={{ scale: !newComment.trim() || reminderProcessing ? 1 : 0.95 }}
            disabled={!newComment.trim() || reminderProcessing}
          >
            {reminderProcessing ? (
              <ClockIcon className="w-5 h-5 animate-pulse" />
            ) : (
              <PaperAirplaneIcon className="w-5 h-5" />
            )}
          </motion.button>
        </div>
      </form>
      
      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {isDeleteConfirmOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm font-sans"
            onClick={() => cancelDeleteComment()}
          >
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="bg-primary-100 rounded-md p-5 w-80 shadow-md flex flex-col border border-primary-300"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="text-center mb-4">
                <motion.div 
                  initial={{ rotate: 0 }}
                  animate={{ rotate: [0, -10, 10, -5, 5, 0] }}
                  transition={{ duration: 0.5 }}
                  className="mx-auto w-12 h-12 rounded-md bg-primary-50 flex items-center justify-center mb-3 border border-primary-300"
                >
                  <TrashIcon className="w-6 h-6 text-primary-700" />
                </motion.div>
                <h3 className="text-lg font-semibold text-primary-700 mb-1">Delete Comment</h3>
                <p className="text-sm text-primary-800">
                  Are you sure you want to delete this comment?
                </p>
              </div>
              
              <div className="flex justify-between gap-3 mt-2">
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => cancelDeleteComment()}
                  className="flex-1 py-2.5 px-4 bg-primary-100 text-primary-700 font-medium hover:bg-primary-200 transition-colors border border-primary-300"
                >
                  Cancel
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => confirmDeleteComment()}
                  className="flex-1 py-2.5 px-4 bg-red-500 hover:bg-red-600 rounded-md text-primary-50 font-medium transition-colors border border-transparent"
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
