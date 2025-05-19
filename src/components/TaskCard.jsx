/**
 * File: TaskCard.jsx
 * Purpose: Displays a task with its urgency, due time, and comment section
 */
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { formatDate, getUrgencyColor, getDueDateColor } from '../utils/date'
import CommentSection from './CommentSection'
import { 
  CheckIcon, 
  TrashIcon, 
  ChevronDownIcon, 
  ChevronUpIcon,
  PencilIcon,
  ChatBubbleBottomCenterTextIcon
} from '@heroicons/react/24/outline'

export default function TaskCard({
  task,
  isExpanded,
  onClick,
  onUpdate,
  onDelete,
  onAddComment,
  onDeleteComment
}) {
  const [isEditing, setIsEditing] = useState(false)
  const [editedTitle, setEditedTitle] = useState(task.title)
  
  const handleToggleComplete = (e) => {
    e.stopPropagation()
    onUpdate(task.id, { completed: !task.completed })
  }
  
  const handleDelete = (e) => {
    e.stopPropagation()
    
    if (confirm('Are you sure you want to delete this task?')) {
      onDelete(task.id)
    }
  }
  
  const handleEdit = (e) => {
    e.stopPropagation()
    
    if (isEditing) {
      onUpdate(task.id, { title: editedTitle })
      setIsEditing(false)
    } else {
      setIsEditing(true)
    }
  }
  
  const cardVariants = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.3 } },
    exit: { opacity: 0, y: -20, transition: { duration: 0.2 } }
  }
  
  return (
    <motion.div
      variants={cardVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className={`bg-white dark:bg-neutral-800 rounded-lg shadow-sm border border-gray-200 dark:border-neutral-700 overflow-hidden ${
        task.completed ? 'opacity-70' : 'opacity-100'
      }`}
    >
      {/* Task header and content */}
      <div 
        onClick={onClick}
        className="cursor-pointer"
      >
        {/* Urgency indicator bar */}
        <div 
          className={`h-1 ${getUrgencyColor(task.urgency)}`}
        />
        
        <div className="p-4">
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-3 flex-grow">
              {/* Checkbox */}
              <button
                onClick={handleToggleComplete}
                className={`mt-1 w-5 h-5 rounded-full flex items-center justify-center ${
                  task.completed
                    ? 'bg-green-500 text-white'
                    : 'border border-gray-300 dark:border-neutral-600'
                }`}
              >
                {task.completed && <CheckIcon className="w-3 h-3" />}
              </button>
              
              {/* Title and due date */}
              <div className="flex-grow">
                {isEditing ? (
                  <input
                    type="text"
                    value={editedTitle}
                    onChange={(e) => setEditedTitle(e.target.value)}
                    onClick={(e) => e.stopPropagation()}
                    className="w-full p-1 mb-1 rounded border border-gray-300 dark:border-neutral-600 bg-gray-50 dark:bg-neutral-700 text-gray-900 dark:text-gray-100"
                    autoFocus
                  />
                ) : (
                  <h3 className={`font-medium text-gray-800 dark:text-gray-100 ${
                    task.completed ? 'line-through text-gray-500 dark:text-gray-400' : ''
                  }`}>
                    {task.title}
                  </h3>
                )}
                
                <div className={`text-sm ${getDueDateColor(task.dueDate)}`}>
                  {formatDate(task.dueDate)}
                </div>
                
                {/* Comment count indicator */}
                {task.comments && task.comments.length > 0 && (
                  <div className="flex items-center mt-2 text-xs text-gray-500 dark:text-gray-400">
                    <ChatBubbleBottomCenterTextIcon className="w-3 h-3 mr-1" />
                    {task.comments.length} {task.comments.length === 1 ? 'comment' : 'comments'}
                  </div>
                )}
              </div>
            </div>
            
            {/* Action buttons */}
            <div className="flex space-x-1">
              <motion.button
                onClick={handleEdit}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className="p-1 text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
              >
                <PencilIcon className="w-4 h-4" />
              </motion.button>
              
              <motion.button
                onClick={handleDelete}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className="p-1 text-gray-400 hover:text-red-500"
              >
                <TrashIcon className="w-4 h-4" />
              </motion.button>
              
              <motion.button
                onClick={onClick}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className="p-1 text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
              >
                {isExpanded ? (
                  <ChevronUpIcon className="w-4 h-4" />
                ) : (
                  <ChevronDownIcon className="w-4 h-4" />
                )}
              </motion.button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Expandable comment section */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="border-t border-gray-200 dark:border-neutral-700 overflow-hidden"
          >
            <CommentSection
              taskId={task.id}
              comments={task.comments || []}
              onAddComment={onAddComment}
              onDeleteComment={onDeleteComment}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
