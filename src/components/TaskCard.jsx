/**
 * File: TaskCard.jsx
 * Purpose: Displays a task with its urgency, due time, and comment section
 */
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { formatDate, getUrgencyColor, getDueDateColor } from '../utils/date'
import CommentSection from './CommentSection'
import { parseTaskInput } from '../lib/openai'
import { 
  CheckIcon, 
  TrashIcon, 
  ChevronDownIcon, 
  ChevronUpIcon,
  ClockIcon,
  ChatBubbleBottomCenterTextIcon,
  ExclamationCircleIcon,
  LightBulbIcon
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
  const [isRescheduling, setIsRescheduling] = useState(false)
  const [isUrgencyModalOpen, setIsUrgencyModalOpen] = useState(false)
  const [rescheduleInput, setRescheduleInput] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [suggestions, setSuggestions] = useState([])
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false)
  
  const handleToggleComplete = (e) => {
    e.stopPropagation()
    onUpdate(task.id, { completed: !task.completed })
  }
  
  const handleDelete = (e) => {
    e.stopPropagation()
    setIsDeleteConfirmOpen(true)
  }
  
  const confirmDelete = (e) => {
    if (e) e.stopPropagation()
    onDelete(task.id)
    setIsDeleteConfirmOpen(false)
  }
  
  const cancelDelete = (e) => {
    if (e) e.stopPropagation()
    setIsDeleteConfirmOpen(false)
  }
  
  const handleReschedule = (e) => {
    e.stopPropagation()
    setIsRescheduling(true)
    
    // Generate default date suggestions
    const now = new Date()
    const tomorrow = new Date(now)
    tomorrow.setDate(tomorrow.getDate() + 1)
    tomorrow.setHours(9, 0, 0, 0)
    
    const nextWeek = new Date(now)
    nextWeek.setDate(nextWeek.getDate() + 7)
    nextWeek.setHours(9, 0, 0, 0)
    
    // Set default suggestions
    setSuggestions([
      { 
        type: "datetime", 
        value: tomorrow.toISOString(), 
        displayText: "Tomorrow morning" 
      },
      { 
        type: "datetime", 
        value: nextWeek.toISOString(), 
        displayText: "Next week" 
      }
    ])
  }
  
  const handleUrgencyClick = (e) => {
    e.stopPropagation()
    setIsUrgencyModalOpen(true)
  }
  
  const handleSetUrgency = (urgency, e) => {
    e.stopPropagation()
    onUpdate(task.id, { urgency })
    setIsUrgencyModalOpen(false)
  }
  
  const handleCloseUrgencyModal = (e) => {
    e.stopPropagation()
    setIsUrgencyModalOpen(false)
  }
  
  const handleRescheduleSubmit = async (e) => {
    e.stopPropagation()
    
    if (rescheduleInput.trim()) {
      setIsProcessing(true)
      
      try {
        // Use OpenAI parser to get a structured date from natural language
        const parsedInput = await parseTaskInput(`Reschedule to ${rescheduleInput.trim()}`)
        
        if (parsedInput.dueDate) {
          onUpdate(task.id, { dueDate: new Date(parsedInput.dueDate) })
          setIsRescheduling(false)
          setRescheduleInput('')
        } else if (parsedInput.suggestions && parsedInput.suggestions.length > 0) {
          // If no direct date but suggestions available, show them
          setSuggestions(parsedInput.suggestions.filter(s => 
            s.type === "date" || s.type === "datetime" || s.type === "time"
          ))
        }
      } catch (error) {
        console.error("Error parsing reschedule date:", error)
        
        // Fallback: try direct date parsing if OpenAI fails
        const newDate = new Date(rescheduleInput.trim())
        if (!isNaN(newDate.getTime())) {
          onUpdate(task.id, { dueDate: newDate })
          setIsRescheduling(false)
          setRescheduleInput('')
        }
      } finally {
        setIsProcessing(false)
      }
    }
  }
  
  const handleSelectSuggestion = (suggestion) => {
    if (suggestion.value) {
      onUpdate(task.id, { dueDate: new Date(suggestion.value) })
      setIsRescheduling(false)
      setRescheduleInput('')
    }
  }
  
  const handleCloseReschedule = (e) => {
    e.stopPropagation()
    setIsRescheduling(false)
    setRescheduleInput('')
  }
  
  const cardVariants = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.3 } },
    exit: { opacity: 0, y: -20, transition: { duration: 0.2 } }
  }
  
  // Create urgency levels with their colors
  const urgencyLevels = [
    { value: 5, label: '5.0', color: 'bg-red-500', name: 'Critical', description: 'Needs immediate attention' },
    { value: 4, label: '4.0', color: 'bg-orange-500', name: 'High', description: 'Important and time-sensitive' },
    { value: 3, label: '3.0', color: 'bg-yellow-500', name: 'Medium', description: 'Standard priority' },
    { value: 2, label: '2.0', color: 'bg-blue-500', name: 'Low', description: 'Can wait if necessary' },
    { value: 1, label: '1.0', color: 'bg-green-500', name: 'Minimal', description: 'Little to no urgency' }
  ]
  
  // Get formatted time for display
  const getFormattedTime = (date) => {
    if (!date) return '';
    const d = new Date(date);
    return d.toLocaleTimeString('en-US', { 
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  }
  
  // Get formatted date for display
  const getFormattedDate = (date) => {
    if (!date) return '';
    const d = new Date(date);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    
    if (d.toDateString() === today.toDateString()) {
      return 'Today at';
    } else if (d.toDateString() === tomorrow.toDateString()) {
      return 'Tomorrow at';
    }
    
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    }) + ' at';
  }
  
  // Get the urgency color
  const getUrgencyIndicator = (urgencyValue) => {
    const level = urgencyLevels.find(l => l.value === Math.round(urgencyValue)) || urgencyLevels[2];
    return level.color;
  }
  
  return (
    <motion.div
      variants={cardVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className={`bg-white dark:bg-neutral-900 rounded-lg overflow-hidden border border-gray-200 dark:border-neutral-700 shadow-md mb-3 transition-opacity ${
        task.completed ? 'opacity-60' : 'opacity-100'
      }`}
    >
      {/* Task header and content */}
      <div 
        onClick={onClick}
        className="cursor-pointer relative"
      >
        {/* Left accent bar based on urgency */}
        <div 
          className={`absolute left-0 top-0 bottom-0 w-1 ${getUrgencyIndicator(task.urgency)}`}
        />
        
        {/* Task content */}
        <div className="p-4 pl-5">
          <div className="flex items-start space-x-3">
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
              <h3 className={`font-medium text-gray-800 dark:text-white ${
                task.completed ? 'line-through text-gray-500 dark:text-neutral-400' : ''
              }`}>
                {task.title}
              </h3>
              
              <div className="flex flex-wrap items-center mt-1 text-sm">
                <div className="flex items-center mr-2">
                  <span onClick={handleUrgencyClick} className="flex items-center cursor-pointer">
                    <span className={`w-7 h-1.5 rounded-sm mr-1 ${getUrgencyIndicator(task.urgency)}`}></span>
                    <span className="text-amber-600 dark:text-yellow-400">Urgency: {task.urgency?.toFixed(1)}</span>
                  </span>
                </div>
                
                {task.dueDate && (
                  <span className="text-gray-600 dark:text-neutral-400">
                    {getFormattedDate(task.dueDate)} {getFormattedTime(task.dueDate)}
                  </span>
                )}
              </div>
              
              {/* Comment count indicator */}
              {task.comments && task.comments.length > 0 && (
                <div className="flex items-center mt-2 text-xs text-gray-500 dark:text-neutral-400">
                  <ChatBubbleBottomCenterTextIcon className="w-3 h-3 mr-1" />
                  {task.comments.length} {task.comments.length === 1 ? 'comment' : 'comments'}
                </div>
              )}
            </div>
            
            {/* Action buttons */}
            <div className="flex space-x-1">
              <motion.button
                onClick={handleReschedule}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className="p-1 text-gray-400 dark:text-neutral-500 hover:text-gray-600 dark:hover:text-neutral-300"
              >
                <ClockIcon className="w-4 h-4" />
              </motion.button>
              
              <motion.button
                onClick={handleDelete}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className="p-1 text-gray-400 dark:text-neutral-500 hover:text-red-500"
              >
                <TrashIcon className="w-4 h-4" />
              </motion.button>
              
              <motion.button
                onClick={onClick}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className="p-1 text-gray-400 dark:text-neutral-500 hover:text-gray-600 dark:hover:text-neutral-300"
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
      
      {/* Delete Confirmation Modal */}
      {isDeleteConfirmOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
          onClick={cancelDelete}
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
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-1">Delete Task</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Are you sure you want to delete this task? This action cannot be undone.
              </p>
            </div>
            
            <div className="flex justify-between gap-3 mt-2">
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={cancelDelete}
                className="flex-1 py-2 px-4 bg-gray-200 dark:bg-neutral-700 rounded-md text-gray-800 dark:text-gray-300 font-medium hover:bg-gray-300 dark:hover:bg-neutral-600 transition-colors shadow-sm"
              >
                Cancel
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={confirmDelete}
                className="flex-1 py-2 px-4 bg-red-500 hover:bg-red-600 rounded-md text-white font-medium transition-colors shadow-sm"
              >
                Delete
              </motion.button>
            </div>
          </motion.div>
        </div>
      )}
      
      {/* Urgency Selection Modal */}
      {isUrgencyModalOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
          onClick={handleCloseUrgencyModal}
        >
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="bg-white dark:bg-neutral-800 rounded-lg p-5 w-80 shadow-xl flex flex-col border border-gray-200 dark:border-neutral-700"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Update Urgency</h3>
              <motion.button 
                onClick={handleCloseUrgencyModal}
                className="text-gray-500 dark:text-neutral-400 hover:text-gray-700 dark:hover:text-white transition-colors"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                ✕
              </motion.button>
            </div>
            
            <div className="flex flex-col gap-3">
              {urgencyLevels.map((level) => (
                <motion.button
                  key={level.value}
                  onClick={(e) => handleSetUrgency(level.value, e)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className={`flex items-center w-full p-3 rounded-md transition-all ${
                    Math.round(task.urgency) === level.value 
                      ? 'bg-gray-100 dark:bg-neutral-700 border border-gray-300 dark:border-neutral-500 shadow-inner' 
                      : 'bg-white dark:bg-neutral-900 hover:bg-gray-50 dark:hover:bg-neutral-700 border border-gray-200 dark:border-neutral-800 shadow-sm'
                  }`}
                >
                  <div className={`w-8 h-3 rounded-sm ${level.color} shadow-inner`}></div>
                  <div className="ml-3 text-left">
                    <span className="font-medium text-gray-800 dark:text-white block">{level.name} ({level.label})</span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">{level.description}</span>
                  </div>
                  {level.value >= 4 && (
                    <ExclamationCircleIcon className="w-4 h-4 text-red-500 ml-auto flex-shrink-0" />
                  )}
                </motion.button>
              ))}
            </div>
          </motion.div>
        </div>
      )}
      
      {/* Reschedule modal */}
      {isRescheduling && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
          onClick={handleCloseReschedule}
        >
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="bg-white dark:bg-neutral-800 rounded-lg p-5 w-80 z-20 shadow-xl flex flex-col border border-gray-200 dark:border-neutral-700"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white flex items-center">
                <ClockIcon className="w-5 h-5 mr-2 text-indigo-500 dark:text-indigo-400" />
                Reschedule Task
              </h3>
              <motion.button 
                onClick={handleCloseReschedule}
                className="text-gray-500 dark:text-neutral-400 hover:text-gray-700 dark:hover:text-white transition-colors"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                ✕
              </motion.button>
            </div>
            
            <div className="mb-2 text-gray-600 dark:text-gray-300 text-sm">
              <span className="font-medium">{task.title}</span>
            </div>
            
            <div className="mb-4">
              <div className="flex items-center gap-2 mb-3">
                <input
                  type="text"
                  value={rescheduleInput}
                  onChange={(e) => setRescheduleInput(e.target.value)}
                  placeholder="tomorrow, next week, May 5th..."
                  className="flex-grow p-2 bg-white dark:bg-neutral-700 border border-gray-300 dark:border-neutral-600 rounded-md text-gray-800 dark:text-white text-sm shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleRescheduleSubmit(e);
                  }}
                />
                <motion.button
                  onClick={handleRescheduleSubmit}
                  disabled={isProcessing}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                >
                  {isProcessing ? 
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : 
                    "Set"
                  }
                </motion.button>
              </div>
              
              {/* Current date indicator */}
              {task.dueDate && (
                <div className="flex items-center text-sm mb-4 p-2 bg-gray-50 dark:bg-neutral-700/30 rounded-md border border-gray-200 dark:border-neutral-600/30">
                  <ClockIcon className="w-4 h-4 mr-1.5 text-gray-500 dark:text-gray-400" />
                  <span className="text-gray-600 dark:text-gray-300">
                    Currently due: {new Date(task.dueDate).toLocaleString('en-US', {
                      weekday: 'short',
                      month: 'short',
                      day: 'numeric',
                      hour: 'numeric',
                      minute: '2-digit'
                    })}
                  </span>
                </div>
              )}
              
              {/* Suggestions */}
              {suggestions.length > 0 && (
                <div className="mt-4">
                  <p className="text-xs text-gray-500 dark:text-gray-400 font-medium mb-2 flex items-center">
                    <LightBulbIcon className="w-3.5 h-3.5 mr-1 text-indigo-500 dark:text-indigo-400" />
                    Quick Options:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {suggestions.map((suggestion, index) => (
                      <motion.button
                        key={index}
                        onClick={() => handleSelectSuggestion(suggestion)}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="px-3 py-1.5 text-xs bg-gray-100 dark:bg-neutral-700 hover:bg-gray-200 dark:hover:bg-neutral-600 text-gray-800 dark:text-gray-200 rounded-full transition-colors shadow-sm border border-gray-200 dark:border-neutral-700 font-medium"
                      >
                        {suggestion.displayText}
                      </motion.button>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Help text */}
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-4">
                Try typing something like "tomorrow afternoon" or "next Tuesday at 3pm"
              </p>
            </div>
          </motion.div>
        </div>
      )}
      
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
