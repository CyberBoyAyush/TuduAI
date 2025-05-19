/**
 * File: CommentSection.jsx
 * Purpose: Display and manage comments for a task
 */
import { useState } from 'react'
import { motion } from 'framer-motion'
import { formatDate } from '../utils/date'
import { useAuth } from '../context/AuthContext'
import { 
  PaperAirplaneIcon, 
  TrashIcon,
  LightBulbIcon,
  BellAlertIcon
} from '@heroicons/react/24/outline'

export default function CommentSection({ taskId, comments, onAddComment, onDeleteComment }) {
  const [newComment, setNewComment] = useState('')
  const { currentUser } = useAuth()
  
  const handleAddComment = (e) => {
    e.preventDefault()
    
    if (!newComment.trim()) return
    
    onAddComment(taskId, newComment)
    setNewComment('')
  }
  
  const handleDeleteComment = (commentId) => {
    if (confirm('Delete this comment?')) {
      onDeleteComment(taskId, commentId)
    }
  }
  
  // Process special commands in comments
  const processCommentText = (text) => {
    // Handle command: !remindme
    if (text.startsWith('!remindme')) {
      return (
        <div className="flex items-start space-x-2">
          <BellAlertIcon className="w-4 h-4 text-yellow-500 shrink-0 mt-0.5" />
          <div>
            <span className="font-medium">Reminder set</span>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {text.replace('!remindme', '').trim() || 'Reminder for this task'}
            </p>
          </div>
        </div>
      )
    }
    
    // Handle command: !help
    if (text.startsWith('!help')) {
      return (
        <div className="flex items-start space-x-2">
          <LightBulbIcon className="w-4 h-4 text-yellow-500 shrink-0 mt-0.5" />
          <div>
            <span className="font-medium">Help</span>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Available commands:
              <br />• !remindme - Set a reminder
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
    <div className="p-4 space-y-4 bg-neutral-900/50">
      {/* Comments list */}
      <div className="space-y-3 max-h-60 overflow-y-auto">
        {comments.length === 0 ? (
          <p className="text-sm text-gray-400 italic">
            No comments yet
          </p>
        ) : (
          comments.map((comment) => (
            <motion.div
              key={comment.id}
              className="flex space-x-3"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              {/* User avatar */}
              <div className="w-8 h-8 rounded-full bg-neutral-800 text-gray-300 flex items-center justify-center font-medium text-sm shrink-0">
                {comment.user.charAt(0).toUpperCase()}
              </div>
              
              {/* Comment content */}
              <div className="flex-grow">
                <div className="bg-neutral-800 p-3 rounded-lg">
                  <div className="flex justify-between items-start mb-1">
                    <span className="font-medium text-sm text-gray-200">
                      {comment.user}
                    </span>
                    <span className="text-xs text-gray-400">
                      {formatRelativeTime(comment.time)}
                    </span>
                  </div>
                  
                  {processCommentText(comment.text)}
                </div>
                
                {/* Delete action */}
                <button
                  onClick={() => handleDeleteComment(comment.id)}
                  className="mt-1 text-xs text-gray-400 hover:text-red-400"
                >
                  <TrashIcon className="w-3 h-3 inline mr-1" />
                  Delete
                </button>
              </div>
            </motion.div>
          ))
        )}
      </div>
      
      {/* Add comment form */}
      <form onSubmit={handleAddComment} className="mt-4 flex items-center space-x-2">
        <div className="w-8 h-8 rounded-full bg-neutral-800 text-gray-300 flex items-center justify-center font-medium text-sm shrink-0">
          {currentUser?.name?.charAt(0).toUpperCase() || 'U'}
        </div>
        
        <input
          type="text"
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Add a comment or use !help"
          className="flex-grow p-2 rounded-md border border-neutral-600 bg-neutral-800 text-gray-100"
        />
        
        <motion.button
          type="submit"
          className="p-2 bg-indigo-600 text-white rounded-md"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          disabled={!newComment.trim()}
        >
          <PaperAirplaneIcon className="w-5 h-5" />
        </motion.button>
      </form>
    </div>
  )
}
