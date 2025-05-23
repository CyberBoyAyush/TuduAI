/**
 * File: TaskCard.jsx
 * Purpose: Displays a task with its urgency, due time, and comment section
 */
import { useState, useMemo, useEffect } from 'react'
import React from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { formatDate, getUrgencyColor, getDueDateColor } from '../utils/date'
import CommentSection from './CommentSection'
import { parseTaskInput } from '../lib/openai'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { 
  CheckIcon, 
  TrashIcon, 
  ChevronDownIcon, 
  ChevronUpIcon,
  ClockIcon,
  ChatBubbleBottomCenterTextIcon,
  ExclamationCircleIcon,
  LightBulbIcon,
  XMarkIcon,
  FlagIcon
} from '@heroicons/react/24/outline'

export default React.memo(function TaskCard({
  task,
  isExpanded,
  onClick,
  onUpdate,
  onDelete,
  onAddComment,
  onDeleteComment,
  isDragOverlay = false
}) {
  const [isRescheduling, setIsRescheduling] = useState(false)
  const [isUrgencyModalOpen, setIsUrgencyModalOpen] = useState(false)
  const [rescheduleInput, setRescheduleInput] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [suggestions, setSuggestions] = useState([])
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false)
  const [showCompletionAnimation, setShowCompletionAnimation] = useState(false)
  
  // DnD setup with useSortable hook - skip if this is a drag overlay
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
    active,
    over,
  } = !isDragOverlay ? useSortable({ 
    id: task.$id,
    data: {
      type: 'task',
      task
    },
    animateLayoutChanges: () => false
  }) : { attributes: {}, listeners: {}, setNodeRef: null };

  const style = !isDragOverlay ? {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
    zIndex: isDragging ? 999 : 1,
    willChange: 'transform',
    transformOrigin: '0 0',
    backfaceVisibility: 'hidden',
  } : {
    willChange: 'transform',
    backfaceVisibility: 'hidden',
  };
  
  // Parse comments (convert from strings to objects if needed)
  const parsedComments = useMemo(() => {
    if (!task.comments || !Array.isArray(task.comments)) return [];
    
    return task.comments.map(comment => {
      if (typeof comment === 'string') {
        try {
          return JSON.parse(comment);
        } catch (e) {
          console.error('Error parsing comment:', e);
          return comment;
        }
      }
      return comment;
    });
  }, [task.comments]);
  
  // Get comment count (for display)
  const commentCount = useMemo(() => {
    return parsedComments.length;
  }, [parsedComments]);
  
  const handleToggleComplete = (e) => {
    e.stopPropagation()
    
    // If we're marking as complete, show the animation
    if (!task.completed) {
      setShowCompletionAnimation(true)
      // Delay the actual update to allow animation to play
      setTimeout(() => {
        onUpdate(task.$id, { completed: true })
        // Keep animation visible for a bit after completion
        setTimeout(() => {
          setShowCompletionAnimation(false)
        }, 800)
      }, 500)
    } else {
      // If unchecking, update immediately without animation
      onUpdate(task.$id, { completed: false })
    }
  }
  
  const handleDelete = (e) => {
    e.stopPropagation()
    setIsDeleteConfirmOpen(true)
  }
  
  const confirmDelete = (e) => {
    if (e) e.stopPropagation()
    onDelete(task.$id)
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
    onUpdate(task.$id, { urgency })
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
          onUpdate(task.$id, { dueDate: new Date(parsedInput.dueDate) })
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
          onUpdate(task.$id, { dueDate: newDate })
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
      onUpdate(task.$id, { dueDate: new Date(suggestion.value) })
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
    animate: { opacity: 1, y: 0, transition: { duration: 0.2 } },
    exit: { opacity: 0, y: -20, transition: { duration: 0.15 } }
  }
  
  // Create urgency levels with their colors and labels
  const urgencyLevels = [
    { value: 5, label: '5.0', color: 'bg-black dark:bg-white', textColor: 'text-red-600 dark:text-red-400', name: 'Critical', description: 'Needs immediate attention' },
    { value: 4, label: '4.0', color: 'bg-gray-800 dark:bg-gray-200', textColor: 'text-orange-600 dark:text-orange-400', name: 'High', description: 'Important and time-sensitive' },
    { value: 3, label: '3.0', color: 'bg-gray-600 dark:bg-gray-400', textColor: 'text-yellow-600 dark:text-yellow-400', name: 'Medium', description: 'Standard priority' },
    { value: 2, label: '2.0', color: 'bg-gray-400 dark:bg-gray-600', textColor: 'text-blue-600 dark:text-blue-400', name: 'Low', description: 'Can wait if necessary' },
    { value: 1, label: '1.0', color: 'bg-gray-300 dark:bg-gray-700', textColor: 'text-green-600 dark:text-green-400', name: 'Minimal', description: 'Little to no urgency' }
  ]
  
  // Get the urgency color
  const getUrgencyIndicator = (urgencyValue) => {
    const level = urgencyLevels.find(l => l.value === Math.round(urgencyValue)) || urgencyLevels[2];
    return level.color;
  }
  
  // Get urgency text color and name
  const getUrgencyDisplay = (urgencyValue) => {
    const level = urgencyLevels.find(l => l.value === Math.round(urgencyValue)) || urgencyLevels[2];
    return { 
      textColor: level.textColor, 
      name: level.name
    };
  }
  
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
  
  const urgencyDisplay = getUrgencyDisplay(task.urgency);
  
  return (
    <>
      <div
        ref={!isDragOverlay ? setNodeRef : undefined}
        style={style}
        className={`bg-primary-100 rounded-md overflow-hidden border border-primary-300 shadow-sm mb-3 transition-all font-sans ${
          task.completed ? 'opacity-60' : 'opacity-100'
        } ${isDragging ? 'shadow-xl border-primary-500 ring-2 ring-primary-300 ring-opacity-50 cursor-grabbing' : ''} ${isDragOverlay ? 'shadow-xl border-primary-500' : ''}`}
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
          
          {/* Add a visual drag indicator */}
          {!isDragOverlay && (
            <div 
              className="absolute right-1 top-1 w-6 h-6 flex items-center justify-center rounded-full bg-primary-200 opacity-40 hover:opacity-80 cursor-grab active:cursor-grabbing transition-opacity"
              {...attributes}
              {...listeners}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="currentColor" className="text-primary-700">
                <path d="M8 6a2 2 0 11-4 0 2 2 0 014 0zm0 6a2 2 0 11-4 0 2 2 0 014 0zm0 6a2 2 0 11-4 0 2 2 0 014 0zm6-12a2 2 0 11-4 0 2 2 0 014 0zm6 0a2 2 0 11-4 0 2 2 0 014 0zm-6 6a2 2 0 11-4 0 2 2 0 014 0zm6 0a2 2 0 11-4 0 2 2 0 014 0zm-6 6a2 2 0 11-4 0 2 2 0 014 0zm6 0a2 2 0 11-4 0 2 2 0 014 0z"/>
              </svg>
            </div>
          )}
          
          {/* Task content */}
          <div className="p-4 pl-5">
            <div className="flex items-start space-x-3">
              {/* Checkbox with completion animation */}
              <div className="relative mt-1">
                <button
                  onClick={handleToggleComplete}
                  className={`w-5 h-5 rounded-sm flex items-center justify-center ${
                    task.completed
                      ? 'bg-primary-700 text-primary-50 border-primary-700 border'
                      : 'border border-primary-800'
                  }`}
                >
                  {task.completed && <CheckIcon className="w-3 h-3" />}
                </button>
                
                {/* Completion animation overlay */}
                <AnimatePresence>
                  {showCompletionAnimation && (
                    <motion.div
                      initial={{ scale: 1.5, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 1.5, opacity: 0 }}
                      transition={{ duration: 0.4, ease: "easeOut" }}
                      className="absolute -left-1.5 -top-1.5 flex items-center justify-center"
                    >
                      <motion.div 
                        className="w-8 h-8 bg-[#f76f52] rounded-md shadow-md flex items-center justify-center border border-[#f76f52]"
                        initial={{ scale: 0, rotate: -10 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{ type: "spring", stiffness: 300, damping: 15 }}
                      >
                        <motion.div
                          initial={{ pathLength: 0, opacity: 0 }}
                          animate={{ pathLength: 1, opacity: 1 }}
                          transition={{ duration: 0.4, delay: 0.2 }}
                        >
                          <CheckIcon className="w-5 h-5 text-white" />
                        </motion.div>
                      </motion.div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              
              {/* Title and due date */}
              <div className="flex-grow">
                <div className="flex items-center justify-between">
                  <h3 className={`font-medium text-primary-700 ${
                    task.completed ? 'line-through text-primary-800' : ''
                  } relative`}>
                    {task.title}
                    
                    {/* Line-through animation */}
                    <AnimatePresence>
                      {showCompletionAnimation && (
                        <motion.div 
                          className="absolute inset-0 w-full"
                          initial={{ width: 0 }}
                          animate={{ width: "100%" }}
                          transition={{ duration: 0.4, delay: 0.3, ease: "easeInOut" }}
                        >
                          <div className="h-0.5 w-full bg-[#f76f52] absolute top-1/2 -translate-y-1/2 rounded-full"></div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </h3>
                  
                  {/* Urgency badge */}
                  <span 
                    onClick={(e) => {
                      e.stopPropagation();
                      handleUrgencyClick(e);
                    }}
                    className={`ml-2 px-2 py-0.5 text-xs font-medium rounded-md border border-primary-300 bg-primary-100 ${urgencyDisplay.textColor} flex items-center cursor-pointer`}
                    title="Click to change urgency"
                  >
                    <FlagIcon className="w-3 h-3 mr-1" />
                    {urgencyDisplay.name}
                  </span>
                </div>
                
                <div className="flex flex-wrap items-center mt-2 text-sm">
                  <div className="flex items-center mr-2">
                    <span onClick={handleUrgencyClick} className="flex items-center cursor-pointer">
                      <span className={`w-7 h-1.5 rounded-sm mr-1 ${getUrgencyIndicator(task.urgency)}`}></span>
                      <span className="text-primary-800">{task.urgency?.toFixed(1)}</span>
                    </span>
                  </div>
                  
                  {task.dueDate && (
                    <span className="text-primary-800 flex items-center">
                      <ClockIcon className="w-3.5 h-3.5 mr-1" />
                      {getFormattedDate(task.dueDate)} {getFormattedTime(task.dueDate)}
                    </span>
                  )}
                </div>
                
                {/* Comment count indicator */}
                {commentCount > 0 && (
                  <div className="flex items-center mt-2 text-xs text-primary-800">
                    <ChatBubbleBottomCenterTextIcon className="w-3 h-3 mr-1" />
                    {commentCount} {commentCount === 1 ? 'comment' : 'comments'}
                  </div>
                )}
              </div>
              
              {/* Action buttons */}
              <div className="flex space-x-1">
                <motion.button
                  onClick={handleReschedule}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  className="p-1 text-primary-800 hover:text-primary-900"
                >
                  <ClockIcon className="w-4 h-4" />
                </motion.button>
                
                <motion.button
                  onClick={handleDelete}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  className="p-1 text-primary-800 hover:text-red-500"
                >
                  <TrashIcon className="w-4 h-4" />
                </motion.button>
                
                <motion.button
                  onClick={onClick}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  className="p-1 text-primary-800 hover:text-primary-900"
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
              className="border-t border-primary-300 overflow-hidden"
            >
              <CommentSection
                taskId={task.$id}
                taskTitle={task.title}
                comments={parsedComments}
                onAddComment={onAddComment}
                onDeleteComment={onDeleteComment}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Render dialogs using Portal to ensure they appear on top */}
      {(isDeleteConfirmOpen || isUrgencyModalOpen || isRescheduling) && createPortal(
        <>
          {/* Delete Confirmation Modal */}
          <AnimatePresence>
            {isDeleteConfirmOpen && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 backdrop-blur-sm font-sans"
                onClick={cancelDelete}
              >
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 10 }}
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  className="bg-[#f2f0e3] dark:bg-[#202020] rounded-md p-5 w-80 shadow-xl flex flex-col border border-[#d8d6cf] dark:border-[#3a3a3a]"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="text-center mb-4">
                    <div className="mx-auto w-12 h-12 rounded-full bg-[#e8e6d9] dark:bg-[#2a2a2a] flex items-center justify-center mb-3 border border-[#d8d6cf] dark:border-[#3a3a3a]">
                      <TrashIcon className="w-6 h-6 text-[#f76f52]" />
                    </div>
                    <h3 className="text-lg font-semibold text-[#202020] dark:text-[#f2f0e3] mb-1">Delete Task</h3>
                    <p className="text-sm text-[#3a3a3a] dark:text-[#d1cfbf]">
                      Are you sure you want to delete this task? This action cannot be undone.
                    </p>
                  </div>
                  
                  <div className="flex justify-between gap-3 mt-2">
                    <motion.button
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={cancelDelete}
                      className="flex-1 py-2 px-4 bg-[#e8e6d9] dark:bg-[#2a2a2a] text-[#202020] dark:text-[#f2f0e3] font-medium border border-[#d8d6cf] dark:border-[#3a3a3a] hover:bg-[#d8d6cf] dark:hover:bg-[#333333] rounded-md"
                    >
                      Cancel
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={confirmDelete}
                      className="flex-1 py-2 px-4 bg-[#f76f52] hover:bg-[#e55e41] text-[#f2f0e3] rounded-md font-medium transition-colors border border-transparent"
                    >
                      Delete
                    </motion.button>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
          
          {/* Urgency Selection Modal */}
          <AnimatePresence>
            {isUrgencyModalOpen && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 backdrop-blur-sm font-sans"
                onClick={handleCloseUrgencyModal}
              >
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 10 }}
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  className="bg-[#f2f0e3] dark:bg-[#202020] rounded-md p-5 w-80 shadow-xl flex flex-col border border-[#d8d6cf] dark:border-[#3a3a3a]"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold text-[#202020] dark:text-[#f2f0e3]">Update Urgency</h3>
                    <motion.button 
                      onClick={handleCloseUrgencyModal}
                      className="text-[#202020] dark:text-[#f2f0e3] hover:text-[#3a3a3a] dark:hover:text-[#d1cfbf] transition-colors"
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
                        className={`flex items-center w-full p-3 rounded-md transition-all border ${
                          Math.round(task.urgency) === level.value 
                            ? 'bg-[#e8e6d9] dark:bg-[#2a2a2a] border-[#d8d6cf] dark:border-[#3a3a3a]' 
                            : 'bg-[#f2f0e3] dark:bg-[#202020] hover:bg-[#e8e6d9] dark:hover:bg-[#2a2a2a] border border-[#d8d6cf] dark:border-[#3a3a3a]'
                        }`}
                      >
                        <div className={`w-8 h-3 rounded-sm ${level.color}`}></div>
                        <div className="ml-3 text-left">
                          <span className={`font-medium ${level.textColor} block`}>{level.name} ({level.label})</span>
                          <span className="text-xs text-[#3a3a3a] dark:text-[#d1cfbf]">{level.description}</span>
                        </div>
                        {level.value >= 4 && (
                          <ExclamationCircleIcon className="w-4 h-4 text-red-500 ml-auto flex-shrink-0" />
                        )}
                      </motion.button>
                    ))}
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
          
          {/* Reschedule modal */}
          <AnimatePresence>
            {isRescheduling && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 backdrop-blur-sm font-sans"
                onClick={handleCloseReschedule}
              >
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 10 }}
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  className="bg-[#f2f0e3] dark:bg-[#202020] rounded-md p-6 w-96 shadow-xl flex flex-col border border-[#d8d6cf] dark:border-[#3a3a3a]"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex items-center justify-between mb-5">
                    <h3 className="text-xl font-semibold text-[#202020] dark:text-[#f2f0e3] flex items-center">
                      <span className="bg-[#e8e6d9] dark:bg-[#2a2a2a] p-2 rounded-md mr-3 border border-[#d8d6cf] dark:border-[#3a3a3a]">
                        <ClockIcon className="w-5 h-5 text-[#f76f52]" />
                      </span>
                      Reschedule Task
                    </h3>
                    <motion.button 
                      onClick={handleCloseReschedule}
                      className="text-[#202020] dark:text-[#f2f0e3] hover:text-[#3a3a3a] dark:hover:text-[#d1cfbf] bg-[#e8e6d9] dark:bg-[#2a2a2a] p-1 rounded-full"
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                    >
                      <XMarkIcon className="w-5 h-5" />
                    </motion.button>
                  </div>
                  
                  <div className="mb-4 text-[#202020] dark:text-[#f2f0e3] text-sm bg-[#e8e6d9] dark:bg-[#2a2a2a] p-3 rounded-md border border-[#d8d6cf] dark:border-[#3a3a3a]">
                    <span className="font-medium">{task.title}</span>
                  </div>
                  
                  <div className="mb-5">
                    <label htmlFor="reschedule-input" className="block text-sm font-medium text-[#202020] dark:text-[#f2f0e3] mb-2">
                      When would you like to reschedule this task?
                    </label>
                    <div className="flex items-center gap-2 mb-3">
                      <div className="relative flex-grow">
                        <input
                          id="reschedule-input"
                          type="text"
                          value={rescheduleInput}
                          onChange={(e) => setRescheduleInput(e.target.value)}
                          placeholder="tomorrow, next week, May 5th..."
                          className="w-full p-3 pl-10 bg-[#e8e6d9] dark:bg-[#2a2a2a] text-[#202020] dark:text-[#f2f0e3] border border-[#d8d6cf] dark:border-[#3a3a3a] rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-[#f76f52]"
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleRescheduleSubmit(e);
                          }}
                        />
                        <ClockIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[#3a3a3a] dark:text-[#d1cfbf]" />
                      </div>
                      <motion.button
                        onClick={handleRescheduleSubmit}
                        disabled={isProcessing}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="px-4 py-3 bg-[#e8e6d9] dark:bg-[#2a2a2a] text-[#202020] dark:text-[#f2f0e3] rounded-md font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed border border-[#d8d6cf] dark:border-[#3a3a3a]"
                      >
                        {isProcessing ? 
                          <div className="w-5 h-5 border-2 border-[#202020] dark:border-[#f2f0e3] border-t-transparent rounded-full animate-spin"></div> : 
                          "Set"
                        }
                      </motion.button>
                    </div>
                    
                    {/* Current date indicator */}
                    {task.dueDate && (
                      <div className="flex items-center text-sm mb-5 p-3 bg-[#e8e6d9] dark:bg-[#2a2a2a] text-[#202020] dark:text-[#f2f0e3]">
                        <div className="bg-[#f2f0e3] dark:bg-[#202020] p-1.5 rounded-full mr-2 border border-[#d8d6cf] dark:border-[#3a3a3a]">
                          <ClockIcon className="w-4 h-4 text-[#f76f52]" />
                        </div>
                        <span>
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
                        <p className="text-sm text-[#202020] dark:text-[#f2f0e3] font-medium mb-3 flex items-center">
                          <LightBulbIcon className="w-4 h-4 mr-1.5 text-[#f76f52]" />
                          Quick Options:
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {suggestions.map((suggestion, index) => (
                            <motion.button
                              key={index}
                              onClick={() => handleSelectSuggestion(suggestion)}
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              className="px-4 py-2 text-sm bg-[#e8e6d9] dark:bg-[#2a2a2a] text-[#202020] dark:text-[#f2f0e3] rounded-md transition-colors border border-[#d8d6cf] dark:border-[#3a3a3a] font-medium flex items-center"
                            >
                              <ClockIcon className="w-3.5 h-3.5 mr-1.5 text-[#f76f52]" />
                              {suggestion.displayText}
                            </motion.button>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {/* Help text */}
                    <p className="text-xs text-[#3a3a3a] dark:text-[#d1cfbf] mt-5 bg-[#e8e6d9] dark:bg-[#2a2a2a] p-2.5 rounded-md border border-[#d8d6cf] dark:border-[#3a3a3a]">
                      <span className="font-medium block mb-1">💡 Pro tip:</span>
                      Try typing natural phrases like "tomorrow afternoon", "next Tuesday at 3pm", or "June 15th at 10am"
                    </p>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </>,
        document.body
      )}
    </>
  )
}, (prevProps, nextProps) => {
  // Only re-render if these props change
  return (
    prevProps.task.$id === nextProps.task.$id &&
    prevProps.isExpanded === nextProps.isExpanded &&
    prevProps.isDragOverlay === nextProps.isDragOverlay &&
    prevProps.task.completed === nextProps.task.completed &&
    prevProps.task.title === nextProps.task.title &&
    prevProps.task.urgency === nextProps.task.urgency &&
    prevProps.task.dueDate === nextProps.task.dueDate &&
    JSON.stringify(prevProps.task.comments) === JSON.stringify(nextProps.task.comments)
  );
});
