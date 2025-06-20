/**
 * File: TaskInput.jsx
 * Purpose: Input for creating new tasks with AI parsing
 */
import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { parseTaskInput } from '../lib/openai'
import TimeSuggestions from './TimeSuggestions'
import UrgencySelector from './UrgencySelector'
import { 
  PlusIcon, 
  BoltIcon, 
  LightBulbIcon,
  ArrowPathIcon,
  InformationCircleIcon,
  ClockIcon,
  ExclamationCircleIcon,
  ArrowUpIcon,
  CalendarIcon,
  CheckIcon,
  XMarkIcon
} from '@heroicons/react/24/outline'
import { createPortal } from 'react-dom'

// Helper function to format task data as XML tags
const formatTaskAsXML = (taskData) => {
  let output = '';
  
  // Add title tag if present
  if (taskData.title) {
    output += `<title>${taskData.title}</title>\n`;
  }
  
  // Add date tag if present
  if (taskData.dueDate) {
    output += `<date>${taskData.dueDate}</date>\n`;
  }
  
  // Add urgency tag if present
  if (taskData.urgency !== null) {
    output += `<urgency>${taskData.urgency.toFixed(1)}</urgency>\n`;
  }
  
  // Add follow_up tag
  output += `<follow_up>${taskData.followUp || 'Anything else to add?'}</follow_up>\n`;
  
  // Add still_needed tag if there are missing fields
  if (taskData.stillNeeded && taskData.stillNeeded.length > 0) {
    output += `<still_needed>${taskData.stillNeeded.join(', ')}</still_needed>\n`;
  }
  
  // Add suggestions
  if (taskData.suggestions && taskData.suggestions.length > 0) {
    taskData.suggestions.forEach(suggestion => {
      output += `<suggestion type="${suggestion.type}" value="${suggestion.value}">${suggestion.displayText}</suggestion>\n`;
    });
  }
  
  // Add todo_complete tag if all required fields are present
  if (taskData.title && taskData.dueDate && taskData.urgency !== null) {
    output += `<todo_complete>\n`;
  }
  
  return output;
};

export default function TaskInput({ onAddTask }) {
  const [input, setInput] = useState('')
  const [isExpanded, setIsExpanded] = useState(false)
  const [loading, setLoading] = useState(false)
  const [parsedTask, setParsedTask] = useState(null)
  const [error, setError] = useState(null)
  const [urgency, setUrgency] = useState(3)
  const [showTips, setShowTips] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isSelectingDate, setIsSelectingDate] = useState(false)
  const [showAISuggestions, setShowAISuggestions] = useState(false)
  const [aiSuggestions, setAISuggestions] = useState([])
  const [showPastDateDialog, setShowPastDateDialog] = useState(false)
  const [pastDateTask, setPastDateTask] = useState(null)
  const [showCustomDatePicker, setShowCustomDatePicker] = useState(false)
  const inputRef = useRef(null)
  
  // Focus input when expanded
  useEffect(() => {
    if (isExpanded && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isExpanded])

  // Function to check if a date is in the past
  const isPastDate = (dateString) => {
    if (!dateString) return false;
    const date = new Date(dateString);
    const now = new Date();
    return date < now;
  }

  // Function to adjust date to future
  const adjustToFuture = (dateString) => {
    if (!dateString) return null;
    
    const date = new Date(dateString);
    const now = new Date();
    
    // If it's the same day but earlier time
    if (date.toDateString() === now.toDateString()) {
      date.setDate(date.getDate() + 1);
    } else {
      // For past dates (like "Monday" when today is Wednesday)
      while (date < now) {
        date.setDate(date.getDate() + 7); // Add a week
      }
    }
    
    return date.toISOString();
  }

  // Function to generate comprehensive AI suggestions based on task content
  const generateAISuggestions = (taskInput, parsedData = null) => {
    const input = taskInput.toLowerCase();
    const suggestions = [];

    // Advanced context analysis
    const words = input.split(' ');
    const taskLength = words.length;
    
    // Time estimation suggestions - more intelligent
    if (!input.includes('hour') && !input.includes('minute') && !input.includes('day') && !input.includes('min')) {
      if (input.includes('call') || input.includes('meeting')) {
        suggestions.push({
          type: 'time',
          title: 'Time estimation',
          suggestion: 'Calls and meetings typically take 30-60 minutes. Adding duration helps with scheduling',
          icon: '⏱️',
          action: 'Add 30 min'
        });
      } else if (input.includes('email') || input.includes('message')) {
        suggestions.push({
          type: 'time',
          title: 'Quick task timing',
          suggestion: 'Email tasks usually take 10-15 minutes. Setting a timer can improve focus',
          icon: '📧',
          action: 'Add 15 min'
        });
      } else if (input.includes('workout') || input.includes('exercise') || input.includes('gym')) {
        suggestions.push({
          type: 'time',
          title: 'Workout duration',
          suggestion: 'Standard workouts are 45-90 minutes. Plan accordingly for optimal results',
          icon: '💪',
          action: 'Add 60 min'
        });
      } else {
        suggestions.push({
          type: 'time',
          title: 'Time estimation',
          suggestion: 'Adding a time estimate helps with better planning and prevents overcommitment',
          icon: '⏱️',
          action: 'Add duration'
        });
      }
    }

    // Smart urgency detection
    const urgentKeywords = ['urgent', 'asap', 'deadline', 'important', 'critical', 'emergency', 'rush'];
    const hasUrgentKeyword = urgentKeywords.some(keyword => input.includes(keyword));
    
    if (hasUrgentKeyword) {
      suggestions.push({
        type: 'urgency',
        title: 'High priority detected',
        suggestion: 'Urgent tasks should be tackled first. Consider setting urgency 4-5 and scheduling for today',
        icon: '🚨',
        action: 'Set urgent'
      });
    }

    // Context-aware timing suggestions
    if (input.includes('gym') || input.includes('workout') || input.includes('exercise') || input.includes('run')) {
      suggestions.push({
        type: 'timing',
        title: 'Peak performance timing',
        suggestion: 'Morning workouts (6-9 AM) boost energy for the day and have better adherence rates',
        icon: '🌅',
        action: 'Schedule 7 AM'
      });
    }

    if (input.includes('study') || input.includes('learn') || input.includes('read') || input.includes('homework')) {
      suggestions.push({
        type: 'timing',
        title: 'Cognitive peak hours',
        suggestion: 'Brain function peaks 9 AM-12 PM. Schedule learning when your mind is sharpest',
        icon: '🧠',
        action: 'Schedule 10 AM'
      });
    }

    if (input.includes('creative') || input.includes('write') || input.includes('design') || input.includes('brainstorm') || input.includes('art')) {
      suggestions.push({
        type: 'timing',
        title: 'Creative flow state',
        suggestion: 'Creative work flows best in morning quiet hours (8-11 AM) with minimal distractions',
        icon: '🎨',
        action: 'Schedule 9 AM'
      });
    }

    // Social and communication optimization
    if (input.includes('call') || input.includes('meeting') || input.includes('interview')) {
      suggestions.push({
        type: 'preparation',
        title: 'Meeting preparation',
        suggestion: 'Block 10-15 min before meetings for agenda review and mental preparation',
        icon: '📋',
        action: 'Add prep time'
      });
    }

    // Task breakdown for complex activities
    const complexKeywords = ['project', 'plan', 'organize', 'research', 'setup', 'install', 'learn'];
    if (complexKeywords.some(keyword => input.includes(keyword)) || taskLength > 5) {
      suggestions.push({
        type: 'breakdown',
        title: 'Complex task detected',
        suggestion: 'Break large tasks into 25-30 min focused chunks for better completion rates',
        icon: '🔧',
        action: 'Break down'
      });
    }

    // Health and wellness
    if (input.includes('doctor') || input.includes('dentist') || input.includes('appointment') || input.includes('checkup')) {
      suggestions.push({
        type: 'health',
        title: 'Health appointment',
        suggestion: 'Set multiple reminders: 1 week, 24 hours, and 2 hours before to ensure attendance',
        icon: '🏥',
        action: 'Set reminders'
      });
    }

    // Shopping and errands optimization
    if (input.includes('grocery') || input.includes('shop') || input.includes('buy') || input.includes('store')) {
      suggestions.push({
        type: 'efficiency',
        title: 'Shopping strategy',
        suggestion: 'Shop 10 AM-12 PM on weekdays for less crowds, better selection, and faster checkout',
        icon: '🛒',
        action: 'Schedule 11 AM'
      });
    }

    // Work and productivity
    if (input.includes('work') || input.includes('task') || input.includes('job') || input.includes('email')) {
      suggestions.push({
        type: 'productivity',
        title: 'Productivity boost',
        suggestion: 'Use the 2-minute rule: if it takes less than 2 minutes, do it now',
        icon: '⚡',
        action: 'Quick task'
      });
    }

    // Habit formation
    if (input.includes('daily') || input.includes('every') || input.includes('habit') || input.includes('routine')) {
      suggestions.push({
        type: 'habit',
        title: 'Habit stacking',
        suggestion: 'Link new habits to existing ones. Same time, same place = better adherence',
        icon: '🔄',
        action: 'Make routine'
      });
    }

    // Social tasks
    if (input.includes('family') || input.includes('friend') || input.includes('social') || input.includes('visit')) {
      suggestions.push({
        type: 'social',
        title: 'Social connection',
        suggestion: 'Quality time is best in evenings when everyone is relaxed and available',
        icon: '👥',
        action: 'Schedule evening'
      });
    }

    // Default context-aware suggestion
    if (suggestions.length === 0) {
      suggestions.push({
        type: 'general',
        title: 'Smart scheduling',
        suggestion: 'Most people are most productive 9-11 AM. Schedule important tasks during peak hours',
        icon: '📈',
        action: 'Optimize timing'
      });
    }

    // Ensure we don't have too many suggestions
    return suggestions.slice(0, 3);
  };

  const handleSubmit = async (e) => {
    e?.preventDefault()
    
    if (!input.trim()) return
    
    setLoading(true)
    setError(null)
    
    try {
      // Parse the input using OpenAI or fallback parser
      const result = await parseTaskInput(input)
      
      // Check if date is in the past
      if (result.dueDate && isPastDate(result.dueDate)) {
        setPastDateTask(result);
        setShowPastDateDialog(true);
        setLoading(false);
        return;
      }
      
      // Store the parsed result
      setParsedTask(result)
      
      // Check if we need additional information
      if (!result.dueDate && !result.urgency) {
        // If both are missing, first ask for due date
        // Do nothing, the UI will show the date picker
      } else if (!result.dueDate) {
        // Due date is missing, but we have urgency
        // Do nothing, the UI will show the date picker
      } else if (!result.urgency) {
        // Urgency is missing, but we have due date
        // Do nothing, the UI will show the urgency selector
      } else {
        // We have everything we need, add the task
        await finalizeTask(result);
      }
    } catch (err) {
      setError('Failed to parse your task. Please try again.')
      console.error('Task parsing error:', err)
    } finally {
      setLoading(false)
    }
  }
  
  const resetForm = () => {
    setInput('')
    setParsedTask(null)
    setPastDateTask(null)
    setError(null)
    setIsExpanded(false)
    setIsSaving(false)
    setIsSelectingDate(false)
    setShowAISuggestions(false)
    setAISuggestions([])
    setShowPastDateDialog(false)
  }
  
  const finalizeTask = async (updates = {}) => {
    try {
      setIsSaving(true);
      // Add the task with any additional details provided
      await onAddTask({
        ...parsedTask,
        ...updates
      });
      resetForm();
    } catch (error) {
      console.error('Error saving task:', error);
      setError('Failed to save task. Please try again.');
    } finally {
      setIsSaving(false);
    }
  }

  // Handle past date dialog actions
  const handleKeepPastDate = async () => {
    try {
      setIsSaving(true);
      await onAddTask(pastDateTask);
      resetForm();
    } catch (error) {
      console.error('Error saving task with past date:', error);
      setError('Failed to save task. Please try again.');
    } finally {
      setIsSaving(false);
      setShowPastDateDialog(false);
    }
  }

  // Show custom date picker when user clicks "Adjust to Future"
  const handleShowCustomDatePicker = () => {
    setShowCustomDatePicker(true);
    setShowPastDateDialog(false);
  }
  
  // Handle selection of custom date
  const handleCustomDateSelection = async (date) => {
    if (!date) return;
    
    try {
      setIsSaving(true);
      
      const adjustedTask = {
        ...pastDateTask,
        dueDate: new Date(date).toISOString()
      };
      
      await onAddTask(adjustedTask);
      resetForm();
    } catch (error) {
      console.error('Error saving adjusted task:', error);
      setError('Failed to save task. Please try again.');
    } finally {
      setIsSaving(false);
      setShowCustomDatePicker(false);
    }
  }

  const handleAdjustToFuture = async () => {
    const adjustedTask = {
      ...pastDateTask,
      dueDate: adjustToFuture(pastDateTask.dueDate)
    };
    
    try {
      setIsSaving(true);
      await onAddTask(adjustedTask);
      resetForm();
    } catch (error) {
      console.error('Error saving adjusted task:', error);
      setError('Failed to save task. Please try again.');
    } finally {
      setIsSaving(false);
      setShowPastDateDialog(false);
    }
  }
  
  // Show AI suggestions based on task input
  const parsePreview = async () => {
    if (!input.trim()) return
    
    setLoading(true)
    
    try {
      // Generate AI suggestions based on the input
      const suggestions = generateAISuggestions(input);
      setAISuggestions(suggestions);
      setShowAISuggestions(true);
      
      // Only parse the task if needed for the suggestions, but don't set it as the main task
      // This keeps the lightbulb focused on suggestions rather than task creation
      
    } catch (error) {
      console.error('Error generating suggestions:', error)
      setError('Failed to generate suggestions. Please try again.')
    } finally {
      setLoading(false)
    }
  }
  
  return (
    <div className="mx-auto max-w-2xl font-sans">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -5 }}
        transition={{ duration: 0.4 }}
        className={`bg-[#f2f0e3] dark:bg-[#202020] shadow-md backdrop-blur-sm rounded-md overflow-hidden border border-[#d8d6cf] dark:border-[#3a3a3a] transition-all ${
          isExpanded ? 'p-6' : 'p-4'
        }`}
      >
        {parsedTask && !parsedTask.dueDate ? (
          <div>
            <h3 className="text-base sm:text-lg font-semibold mb-4 text-[#202020] dark:text-[#f2f0e3] flex items-center">
              <ClockIcon className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-[#f76f52]" />
              When is "{parsedTask.title.length > 20 ? parsedTask.title.substring(0, 20) + '...' : parsedTask.title}" due?
            </h3>
            
            <TimeSuggestions 
              onSelect={async (date) => {
                try {
                  setIsSelectingDate(true);
                  
                  // Check if date is in the past
                  if (isPastDate(date)) {
                    const updatedTask = {
                      ...parsedTask,
                      dueDate: date
                    };
                    setPastDateTask(updatedTask);
                    setShowPastDateDialog(true);
                    setIsSelectingDate(false);
                    return;
                  }
                  
                  // Create a formatted version of the date that would be easily understood in natural language
                  const dateObj = new Date(date);
                  const formattedDate = dateObj.toLocaleString('en-US', {
                    weekday: 'long',
                    month: 'long',
                    day: 'numeric',
                    hour: 'numeric',
                    minute: '2-digit',
                    hour12: true
                  });
                  
                  // Generate a natural language prompt that would result in this date
                  const naturalLanguagePrompt = `${parsedTask.title} on ${formattedDate}`;
                  
                  // Try to parse with the natural language parser to get consistent results
                  try {
                    const result = await parseTaskInput(naturalLanguagePrompt);
                    // Use the original title from the parsed task, but the date from the natural language processing
                    const updatedTask = {
                      ...parsedTask,
                      dueDate: result.dueDate || date, // Fallback to original date if parsing fails
                    };
                    
                    // Verify the date is valid and in the future
                    const dueDate = new Date(updatedTask.dueDate);
                    const now = new Date();
                    
                    if (dueDate < now) {
                      // Simple adjustment - if it's the same day but earlier time, set to tomorrow same time
                      if (dueDate.toDateString() === now.toDateString()) {
                        dueDate.setDate(dueDate.getDate() + 1);
                      } else {
                        // Otherwise, increment until in the future
                        while (dueDate < now) {
                          dueDate.setDate(dueDate.getDate() + 1);
                        }
                      }
                      updatedTask.dueDate = dueDate.toISOString();
                    }
                    
                    // If we now have all required fields, complete the task
                    if (updatedTask.dueDate && updatedTask.urgency) {
                      await onAddTask(updatedTask);
                      resetForm();
                    } else {
                      // We still need to get the urgency
                      await finalizeTask({ 
                        dueDate: updatedTask.dueDate,
                        urgency: updatedTask.urgency 
                      });
                    }
                  } catch (error) {
                    console.error("Error parsing natural language date:", error);
                    // If there's an error parsing, just use the date as is
                    const updatedTask = {
                      ...parsedTask,
                      dueDate: date
                    };
                    
                    if (updatedTask.dueDate && updatedTask.urgency) {
                      await onAddTask(updatedTask);
                      resetForm();
                    } else {
                      await finalizeTask({ 
                        dueDate: updatedTask.dueDate,
                        urgency: updatedTask.urgency 
                      });
                    }
                  }
                } catch (error) {
                  console.error("Error processing selected date:", error);
                  // Fallback - use date directly if there's any error
                  await finalizeTask({ dueDate: date, urgency: parsedTask.urgency });
                } finally {
                  setIsSelectingDate(false);
                }
              }}
              disabled={isSelectingDate}
            />
            
            {/* Loading animation for date selection */}
            <AnimatePresence>
              {isSelectingDate && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="mt-4 flex items-center justify-center p-4 bg-[#e8e6d9] dark:bg-[#2a2a2a] rounded-md border border-[#d8d6cf] dark:border-[#3a3a3a]"
                >
                  <ArrowPathIcon className="w-5 h-5 text-[#f76f52] animate-spin mr-3" />
                  <span className="text-sm text-[#202020] dark:text-[#f2f0e3]">Creating task...</span>
                </motion.div>
              )}
            </AnimatePresence>
            
            <div className="mt-5 flex justify-between gap-2">
              <motion.button
                onClick={resetForm}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                className="text-xs sm:text-sm font-medium text-[#202020] dark:text-[#f2f0e3] hover:bg-[#e8e6d9] dark:hover:bg-[#2a2a2a] transition-colors px-3 sm:px-4 py-2 rounded-md border border-[#d8d6cf] dark:border-[#3a3a3a]"
              >
                Cancel
              </motion.button>
              
              <motion.button
                onClick={() => finalizeTask({ dueDate: null, urgency: parsedTask.urgency })}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                className="text-xs sm:text-sm font-medium text-[#f2f0e3] bg-[#f76f52] hover:bg-[#e55e41] transition-colors px-3 sm:px-4 py-2 rounded-md border border-transparent"
              >
                <span className="hidden sm:inline">Skip (no due date)</span>
                <span className="sm:hidden">Skip</span>
              </motion.button>
            </div>
          </div>
        ) : parsedTask && !parsedTask.urgency ? (
          <div>
            <h3 className="text-base sm:text-lg font-semibold mb-4 text-[#202020] dark:text-[#f2f0e3] flex items-center">
              <ExclamationCircleIcon className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-[#f76f52]" />
              How urgent is this task?
            </h3>
            
            <div className="mb-4 text-sm sm:text-md text-[#202020] dark:text-[#f2f0e3] p-3 sm:p-4 bg-[#e8e6d9] dark:bg-[#2a2a2a] rounded-md border border-[#d8d6cf] dark:border-[#3a3a3a]">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <span className="font-medium truncate">{parsedTask.title.length > 25 ? parsedTask.title.substring(0, 25) + '...' : parsedTask.title}</span>
                {parsedTask.dueDate && (
                  <span className="text-xs sm:text-sm text-[#3a3a3a] dark:text-[#d1cfbf] flex items-center whitespace-nowrap">
                    <ClockIcon className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                    {new Date(parsedTask.dueDate).toLocaleString('en-US', {
                      weekday: 'short',
                      month: 'short',
                      day: 'numeric',
                      hour: 'numeric',
                      minute: '2-digit'
                    })}
                  </span>
                )}
              </div>
            </div>
            
            <UrgencySelector
              onChange={async (urgency) => {
                try {
                  setIsSelectingDate(true); // Reuse the same loading state
                  const updatedTask = {
                    ...parsedTask,
                    urgency
                  };

                  // Complete the task creation only when user confirms
                  await onAddTask(updatedTask);
                  resetForm();
                } catch (error) {
                  console.error('Error saving task with urgency:', error);
                  setError('Failed to save task. Please try again.');
                } finally {
                  setIsSelectingDate(false);
                }
              }}
              initialValue={3}
              disabled={isSelectingDate}
            />
            
            {/* Loading animation for urgency selection */}
            <AnimatePresence>
              {isSelectingDate && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="mt-4 flex items-center justify-center p-4 bg-[#e8e6d9] dark:bg-[#2a2a2a] rounded-md border border-[#d8d6cf] dark:border-[#3a3a3a]"
                >
                  <ArrowPathIcon className="w-5 h-5 text-[#f76f52] animate-spin mr-3" />
                  <span className="text-sm text-[#202020] dark:text-[#f2f0e3]">Creating task...</span>
                </motion.div>
              )}
            </AnimatePresence>
            
            <div className="mt-5 flex justify-between gap-2">
              <motion.button
                onClick={resetForm}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                className="text-xs sm:text-sm font-medium text-[#202020] dark:text-[#f2f0e3] hover:bg-[#e8e6d9] dark:hover:bg-[#2a2a2a] transition-colors px-3 sm:px-4 py-2 rounded-md border border-[#d8d6cf] dark:border-[#3a3a3a]"
              >
                Cancel
              </motion.button>
              
              <motion.button
                onClick={() => finalizeTask({ urgency: 3, dueDate: parsedTask.dueDate })}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                className="text-xs sm:text-sm font-medium text-[#f2f0e3] bg-[#f76f52] hover:bg-[#e55e41] transition-colors px-3 sm:px-4 py-2 rounded-md border border-transparent"
              >
                <span className="hidden sm:inline">Use Default (3)</span>
                <span className="sm:hidden">Default (3)</span>
              </motion.button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="relative">
            <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 sm:gap-3">
              <div className="bg-[#e8e6d9] dark:bg-[#2a2a2a] text-[#202020] dark:text-[#f2f0e3] p-2 sm:p-3 rounded-md border border-[#d8d6cf] dark:border-[#3a3a3a] hidden sm:block">
                <PlusIcon className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onFocus={() => setIsExpanded(true)}
                placeholder="What do you want to do?"
                className="flex-grow bg-transparent border-none focus:outline-none focus:ring-0 text-[#202020] dark:text-[#f2f0e3] placeholder-[#3a3a3a]/60 dark:placeholder-[#d1cfbf]/60 text-sm sm:text-base py-2 sm:py-3 min-w-0 transition-all font-sans"
                disabled={loading}
              />
              
              {input.trim() && !loading && (
                <motion.button
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  type="button"
                  onClick={parsePreview}
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  whileTap={{ scale: 0.9 }}
                  className={`p-2 sm:p-2.5 rounded-md transition-colors border flex-shrink-0 ${
                    showAISuggestions 
                      ? 'text-[#f76f52] bg-[#f76f52]/10 border-[#f76f52]/30 hover:bg-[#f76f52]/20'
                      : 'text-[#202020] dark:text-[#f2f0e3] hover:bg-[#e8e6d9] dark:hover:bg-[#2a2a2a] border-[#d8d6cf] dark:border-[#3a3a3a]'
                  }`}
                  title="Get AI suggestions based on your task"
                >
                  <LightBulbIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                </motion.button>
              )}
              
              {loading && (
                <div className="p-2 sm:p-2.5 flex-shrink-0">
                  <ArrowPathIcon className="w-4 h-4 sm:w-5 sm:h-5 text-[#202020] dark:text-[#f2f0e3] animate-spin" />
                </div>
              )}
              
              <motion.button
                type="submit"
                disabled={!input.trim() || loading}
                whileHover={{ scale: input.trim() && !loading ? 1.03 : 1 }}
                whileTap={{ scale: input.trim() && !loading ? 0.97 : 1 }}
                className={`px-4 sm:px-5 py-2 sm:py-2.5 rounded-md text-[#f2f0e3] font-medium bg-[#f76f52] hover:bg-[#e55e41] disabled:opacity-50 disabled:cursor-not-allowed transition-all border border-transparent flex-shrink-0 ${
                  (!input.trim() || loading) ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                <span className="flex items-center">
                  <span className="sm:inline">Add</span>
                  <ArrowUpIcon className="w-4 h-4 ml-1 -rotate-45" />
                </span>
              </motion.button>
            </div>
            
            <AnimatePresence>
              {isExpanded && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                  className="mt-5"
                >
                  {/* Info notice */}
                  <div className="flex flex-wrap sm:flex-nowrap justify-between items-center gap-2 mb-3">
                    <motion.button
                      type="button"
                      onClick={() => setShowTips(!showTips)}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="text-xs flex items-center text-[#202020] dark:text-[#f2f0e3] bg-[#e8e6d9] dark:bg-[#2a2a2a] px-2 sm:px-3 py-1.5 rounded-md hover:bg-[#dbd9cc] dark:hover:bg-[#333333] transition-colors border border-[#d8d6cf] dark:border-[#3a3a3a]"
                    >
                      <InformationCircleIcon className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                      {showTips ? 'Hide tips' : <span><span className="hidden sm:inline">Type naturally, AI will parse your task</span><span className="sm:hidden">Tips</span></span>}
                    </motion.button>
                    
                    <motion.span 
                      className="text-xs text-[#202020] dark:text-[#f2f0e3] flex items-center bg-[#e8e6d9] dark:bg-[#2a2a2a] px-2 sm:px-3 py-1.5 rounded-md border border-[#d8d6cf] dark:border-[#3a3a3a]"
                      whileHover={{ scale: 1.05 }}
                      transition={{ duration: 0.2 }}
                    >
                      <BoltIcon className="w-3 h-3 sm:w-3.5 sm:h-3.5 mr-1 sm:mr-1.5 text-[#f76f52]" />
                      <span>GPT-4.1 Mini</span>
                    </motion.span>
                  </div>
                  
                  <AnimatePresence>
                    {showTips && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.3, ease: "easeInOut" }}
                        className="mb-4 p-4 bg-[#e8e6d9] dark:bg-[#2a2a2a] rounded-md text-sm text-[#202020] dark:text-[#f2f0e3] border border-[#d8d6cf] dark:border-[#3a3a3a]"
                      >
                        <p className="font-medium mb-2.5 flex items-center">
                          <LightBulbIcon className="w-4 h-4 mr-1.5 text-[#f76f52]" />
                          Try natural language like:
                        </p>
                        <ul className="list-disc ml-5 space-y-1.5">
                          <li>"Call mom tomorrow at 5pm"</li>
                          <li>"Submit report by Friday afternoon, urgency 5"</li>
                          <li>"Gym workout every Monday at 7am"</li>
                        </ul>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* AI Suggestions */}
                  <AnimatePresence>
                    {showAISuggestions && aiSuggestions.length > 0 && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.4, ease: "easeInOut" }}
                        className="mb-4 p-4 bg-[#f2f0e3] dark:bg-[#2a2a2a] rounded-md text-sm text-[#202020] dark:text-[#f2f0e3] border border-[#f76f52]/30 dark:border-[#f76f52]/40"
                      >
                        <p className="font-medium mb-3 flex items-center">
                          <LightBulbIcon className="w-4 h-4 mr-1.5 text-[#f76f52]" />
                          AI Suggestions:
                        </p>
                        <div className="space-y-3">
                          {aiSuggestions.map((suggestion, index) => (
                            <motion.div
                              key={index}
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: index * 0.1 }}
                              className="flex items-start p-3 bg-[#e8e6d9] dark:bg-[#202020] rounded-md border border-[#d8d6cf] dark:border-[#3a3a3a]"
                            >
                              <span className="text-lg mr-3 flex-shrink-0 mt-0.5">{suggestion.icon}</span>
                              <div className="flex-grow">
                                <p className="font-medium text-[#202020] dark:text-[#f2f0e3] mb-1">
                                  {suggestion.title}
                                </p>
                                <p className="text-xs text-[#3a3a3a] dark:text-[#d1cfbf] leading-relaxed mb-2">
                                  {suggestion.suggestion}
                                </p>
                                {suggestion.action && (
                                  <motion.button
                                    onClick={() => {
                                      // Enhanced action handlers
                                      const currentInput = input;
                                      
                                      switch(suggestion.action) {
                                        case 'Add 30 min':
                                          setInput(prev => prev + ' (30 min)');
                                          break;
                                        case 'Add 15 min':
                                          setInput(prev => prev + ' (15 min)');
                                          break;
                                        case 'Add 60 min':
                                          setInput(prev => prev + ' (1 hour)');
                                          break;
                                        case 'Add duration':
                                          setInput(prev => prev + ' (30 min)');
                                          break;
                                        case 'Set urgent':
                                          setInput(prev => prev + ' (urgent)');
                                          break;
                                        case 'Schedule 7 AM':
                                          setInput(prev => prev + ' at 7am tomorrow');
                                          break;
                                        case 'Schedule 9 AM':
                                          setInput(prev => prev + ' at 9am tomorrow');
                                          break;
                                        case 'Schedule 10 AM':
                                          setInput(prev => prev + ' at 10am tomorrow');
                                          break;
                                        case 'Schedule 11 AM':
                                          setInput(prev => prev + ' at 11am tomorrow');
                                          break;
                                        case 'Schedule evening':
                                          setInput(prev => prev + ' at 6pm today');
                                          break;
                                        case 'Add prep time':
                                          setInput(prev => prev + ' (include 15 min prep)');
                                          break;
                                        case 'Break down':
                                          setInput(prev => prev + ' (break into steps)');
                                          break;
                                        case 'Set reminders':
                                          setInput(prev => prev + ' (set multiple reminders)');
                                          break;
                                        case 'Quick task':
                                          setInput(prev => prev + ' (quick 2-min task)');
                                          break;
                                        case 'Make routine':
                                          setInput(prev => prev + ' (daily routine)');
                                          break;
                                        case 'Optimize timing':
                                          setInput(prev => prev + ' at 10am');
                                          break;
                                        default:
                                          // Generic enhancement
                                          setInput(prev => prev + ' (optimized)');
                                      }
                                    }}
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    className="px-3 py-1.5 bg-[#f76f52] hover:bg-[#e55e41] text-[#f2f0e3] rounded text-xs font-medium transition-colors"
                                  >
                                    {suggestion.action}
                                  </motion.button>
                                )}
                              </div>
                            </motion.div>
                          ))}
                        </div>
                        <motion.button
                          onClick={() => setShowAISuggestions(false)}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          className="mt-3 text-xs text-[#f76f52] hover:text-[#e55e41] flex items-center"
                        >
                          <XMarkIcon className="w-3 h-3 mr-1" />
                          Got it, thanks!
                        </motion.button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                  
                  {/* Preview of parsed data */}
                  <AnimatePresence>
                    {parsedTask && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.4, type: "spring", stiffness: 300, damping: 25 }}
                        className="mb-4 p-3 sm:p-5 bg-[#e8e6d9] dark:bg-[#2a2a2a] border border-[#d8d6cf] dark:border-[#3a3a3a] rounded-md"
                      >
                        <h4 className="font-medium text-sm sm:text-base text-[#202020] dark:text-[#f2f0e3] mb-2 sm:mb-3 flex items-center">
                          <LightBulbIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1 sm:mr-1.5 text-[#f76f52]" />
                          AI Parsed Your Task
                        </h4>
                        <div className="text-xs sm:text-sm space-y-2 sm:space-y-3 text-[#202020] dark:text-[#f2f0e3]">
                          <div className="flex items-start">
                            <span className="font-medium w-12 sm:w-16 shrink-0">Title:</span>
                            <span className="flex-grow font-semibold text-[#202020] dark:text-[#f2f0e3] line-clamp-2">{parsedTask.title}</span>
                          </div>
                          <div className="flex items-start">
                            <span className="font-medium w-12 sm:w-16 shrink-0">Due:</span>
                            <span>
                              {parsedTask.dueDate 
                                ? <span className="flex items-center bg-[#f2f0e3]/60 dark:bg-[#202020]/60 px-2 py-1 rounded-md text-xs sm:text-sm border border-[#d8d6cf] dark:border-[#3a3a3a]">
                                    <ClockIcon className="w-3 h-3 sm:w-3.5 sm:h-3.5 mr-1 sm:mr-1.5 text-[#f76f52]" />
                                    {new Date(parsedTask.dueDate).toLocaleString('en-US', {
                                      weekday: 'short',
                                      month: 'short',
                                      day: 'numeric',
                                      hour: 'numeric',
                                      minute: '2-digit'
                                    })}
                                  </span>
                                : <span className="text-[#3a3a3a] dark:text-[#d1cfbf] italic">Not specified</span>}
                            </span>
                          </div>
                          <div className="flex items-start">
                            <span className="font-medium w-12 sm:w-16 shrink-0">Urgency:</span>
                            <span>
                              {parsedTask.urgency 
                                ? <span className="flex items-center bg-[#f2f0e3]/60 dark:bg-[#202020]/60 px-2 py-1 rounded-md text-xs sm:text-sm border border-[#d8d6cf] dark:border-[#3a3a3a]">
                                    <span className={`inline-block w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full mr-1 sm:mr-1.5 border border-[#d8d6cf] dark:border-[#3a3a3a] ${
                                      parsedTask.urgency >= 4.5 ? 'bg-[#f76f52]' :
                                      parsedTask.urgency >= 3.5 ? 'bg-[#f76f52]/80' :
                                      parsedTask.urgency >= 2.5 ? 'bg-[#f76f52]/60' :
                                      parsedTask.urgency >= 1.5 ? 'bg-[#f76f52]/40' :
                                      'bg-[#f76f52]/20'
                                    }`}></span>
                                    {parsedTask.urgency}/5
                                  </span>
                                : <span className="text-[#3a3a3a] dark:text-[#d1cfbf] italic">Not specified</span>}
                            </span>
                          </div>
                          
                          {/* Display follow-up message if present */}
                          {parsedTask.followUp && (
                            <p className="mt-2 sm:mt-3 text-xs sm:text-sm text-[#202020] dark:text-[#f2f0e3] border-t border-[#d8d6cf] dark:border-[#3a3a3a] pt-2">
                              <span className="font-medium">Next step:</span> {parsedTask.followUp}
                            </p>
                          )}
                          
                          {/* Show suggestions if available */}
                          {parsedTask.suggestions && parsedTask.suggestions.length > 0 && (
                            <div className="mt-2 sm:mt-3 border-t border-[#d8d6cf] dark:border-[#3a3a3a] pt-2">
                              <p className="font-medium text-xs sm:text-sm mb-1.5 sm:mb-2">Suggestions:</p>
                              <div className="flex flex-wrap gap-1.5 sm:gap-2">
                                {parsedTask.suggestions.map((suggestion, index) => (
                                  <motion.button
                                    key={index}
                                    onClick={() => {
                                      // Handle suggestion click based on type
                                      if (suggestion.type === 'datetime' || suggestion.type === 'date' || suggestion.type === 'time') {
                                        const updatedTask = {
                                          ...parsedTask,
                                          dueDate: suggestion.value
                                        };
                                        // If this completes the task, submit it
                                        if (updatedTask.title && updatedTask.urgency) {
                                          onAddTask(updatedTask);
                                          resetForm();
                                        } else {
                                          setParsedTask(updatedTask);
                                        }
                                      } else if (suggestion.type === 'urgency') {
                                        const updatedTask = {
                                          ...parsedTask,
                                          urgency: suggestion.value
                                        };
                                        // If this completes the task, submit it
                                        if (updatedTask.title && updatedTask.dueDate) {
                                          onAddTask(updatedTask);
                                          resetForm();
                                        } else {
                                          setParsedTask(updatedTask);
                                        }
                                      }
                                    }}
                                    whileHover={{ scale: 1.05, y: -1 }}
                                    whileTap={{ scale: 0.95 }}
                                    className="px-2 sm:px-3 py-1 sm:py-1.5 bg-[#f2f0e3] dark:bg-[#202020] text-[#202020] dark:text-[#f2f0e3] rounded-md text-xs hover:bg-[#dbd9cc] dark:hover:bg-[#333333] border border-[#d8d6cf] dark:border-[#3a3a3a] transition-colors"
                                  >
                                    <span className="hidden sm:inline">{suggestion.displayText}</span>
                                    <span className="sm:hidden">
                                      {suggestion.displayText.length > 15 
                                        ? suggestion.displayText.substring(0, 15) + '...' 
                                        : suggestion.displayText}
                                    </span>
                                  </motion.button>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                  
                  {/* Error message */}
                  <AnimatePresence>
                    {error && (
                      <motion.div 
                        className="mb-4 p-3 bg-[#f2f0e3] dark:bg-[#202020] border border-red-500 rounded-md text-sm text-red-500 flex items-start"
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                      >
                        <ExclamationCircleIcon className="w-5 h-5 mr-2 shrink-0 text-red-500" />
                        <span>{error}</span>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              )}
            </AnimatePresence>
          </form>
        )}
      </motion.div>
      
      {/* Past Date Dialog */}
      {showPastDateDialog && createPortal(
        <div 
          className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/60 backdrop-blur-sm font-sans"
          onClick={() => setShowPastDateDialog(false)}
        >
          <motion.div
            className="bg-[#f2f0e3] dark:bg-[#202020] rounded-md shadow-xl max-w-md w-full mx-4 z-[100000] border border-[#d8d6cf] dark:border-[#3a3a3a] overflow-hidden"
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ 
              type: "spring", 
              damping: 25, 
              stiffness: 350 
            }}
            onClick={e => e.stopPropagation()}
          >
            {/* Header with gradient */}
            <div className="bg-gradient-to-r from-orange-100 to-orange-50 dark:from-orange-900/40 dark:to-orange-800/20 px-6 py-5 border-b border-[#d8d6cf] dark:border-[#3a3a3a] flex items-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-orange-100 dark:bg-orange-900/30 mr-4 border border-orange-200 dark:border-orange-800/60">
                <CalendarIcon className="h-6 w-6 text-orange-600 dark:text-orange-400" aria-hidden="true" />
              </div>
              <div>
                <h3 className="text-lg font-semibold leading-6 text-[#202020] dark:text-[#f2f0e3]">
                  Past Due Date Detected
                </h3>
                <p className="text-sm text-[#3a3a3a] dark:text-[#d1cfbf] mt-0.5">
                  This task is scheduled for a time that's already passed
                </p>
              </div>
              <motion.button
                onClick={() => setShowPastDateDialog(false)}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className="ml-auto p-1.5 text-[#3a3a3a] hover:text-[#202020] dark:text-[#d1cfbf] dark:hover:text-[#f2f0e3] bg-[#f2f0e3]/80 dark:bg-[#202020]/80 hover:bg-[#e8e6d9] dark:hover:bg-[#2a2a2a] rounded-full transition-colors"
              >
                <XMarkIcon className="w-5 h-5" />
              </motion.button>
            </div>
            
            {/* Body content */}
            <div className="px-6 py-5">
              <div className="bg-[#e8e6d9] dark:bg-[#2a2a2a] p-4 rounded-md mb-5 border border-[#d8d6cf] dark:border-[#3a3a3a] shadow-sm">
                <p className="font-medium text-[#202020] dark:text-[#f2f0e3] text-base line-clamp-2">{pastDateTask?.title}</p>
                <div className="flex items-center justify-between mt-2.5 pt-2.5 border-t border-[#d8d6cf] dark:border-[#3a3a3a]">
                  <p className="text-sm text-[#3a3a3a] dark:text-[#d1cfbf] flex items-center">
                    <ClockIcon className="w-4 h-4 mr-2 text-orange-500" />
                    {pastDateTask?.dueDate && new Date(pastDateTask.dueDate).toLocaleString('en-US', {
                      weekday: 'short',
                      month: 'short',
                      day: 'numeric',
                      hour: 'numeric',
                      minute: '2-digit'
                    })}
                  </p>
                  <span className="text-xs px-2 py-1 bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-300 rounded-full font-medium">
                    Past date
                  </span>
                </div>
              </div>
              
              <div className="bg-orange-50/50 dark:bg-orange-900/10 border border-orange-100 dark:border-orange-800/20 rounded-md p-3.5 mb-5">
                <p className="text-sm text-[#3a3a3a] dark:text-[#d1cfbf] flex items-start">
                  <InformationCircleIcon className="w-5 h-5 mr-2 text-orange-500 flex-shrink-0 mt-0.5" />
                  <span>
                    Would you like to <span className="font-medium text-[#202020] dark:text-[#f2f0e3]">keep this past date</span> or <span className="font-medium text-[#202020] dark:text-[#f2f0e3]">choose a different date</span>?
                  </span>
                </p>
              </div>
            </div>
            
            {/* Footer with actions */}
            <div className="px-6 py-4 bg-[#e8e6d9] dark:bg-[#2a2a2a] border-t border-[#d8d6cf] dark:border-[#3a3a3a] flex flex-col sm:flex-row gap-3 sm:gap-4">
              <motion.button
                onClick={handleKeepPastDate}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="inline-flex justify-center items-center rounded-md border border-[#d8d6cf] dark:border-[#3a3a3a] bg-[#f2f0e3] dark:bg-[#202020] px-4 py-2.5 text-sm font-medium text-[#3a3a3a] dark:text-[#d1cfbf] shadow-sm hover:bg-[#dbd9cc] dark:hover:bg-[#333333] focus:outline-none focus:ring-1 focus:ring-[#f76f52] flex-1 sm:flex-initial sm:flex-grow"
              >
                <CheckIcon className="w-4 h-4 mr-2" />
                Keep Past Date
              </motion.button>
              
              <motion.button
                onClick={handleShowCustomDatePicker}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="inline-flex justify-center items-center rounded-md border border-transparent bg-[#f76f52] px-4 py-2.5 text-sm font-medium text-[#f2f0e3] shadow-sm hover:bg-[#e55e41] focus:outline-none focus:ring-1 focus:ring-[#f76f52] flex-1 sm:flex-initial sm:flex-grow"
              >
                <CalendarIcon className="w-4 h-4 mr-2" />
                Choose New Date
              </motion.button>
            </div>
          </motion.div>
        </div>,
        document.body
      )}

      {/* Custom Date Picker Modal */}
      {showCustomDatePicker && createPortal(
        <div 
          className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/60 backdrop-blur-sm font-sans"
          onClick={() => setShowCustomDatePicker(false)}
        >
          <motion.div
            className="bg-[#f2f0e3] dark:bg-[#202020] rounded-md shadow-xl max-w-md w-full mx-4 z-[100000] border border-[#d8d6cf] dark:border-[#3a3a3a] overflow-hidden"
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 350 }}
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-[#f76f52]/20 to-[#f76f52]/10 dark:from-[#f76f52]/30 dark:to-[#f76f52]/20 px-6 py-5 border-b border-[#d8d6cf] dark:border-[#3a3a3a] flex items-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#f76f52]/20 dark:bg-[#f76f52]/30 mr-4 border border-[#f76f52]/30 dark:border-[#f76f52]/40">
                <CalendarIcon className="h-6 w-6 text-[#f76f52]" aria-hidden="true" />
              </div>
              <div>
                <h3 className="text-lg font-semibold leading-6 text-[#202020] dark:text-[#f2f0e3]">
                  Choose New Date
                </h3>
                <p className="text-sm text-[#3a3a3a] dark:text-[#d1cfbf] mt-0.5">
                  Select a new due date and time for this task
                </p>
              </div>
              <motion.button
                onClick={() => setShowCustomDatePicker(false)}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className="ml-auto p-1.5 text-[#3a3a3a] hover:text-[#202020] dark:text-[#d1cfbf] dark:hover:text-[#f2f0e3] bg-[#f2f0e3]/80 dark:bg-[#202020]/80 hover:bg-[#e8e6d9] dark:hover:bg-[#2a2a2a] rounded-full transition-colors"
              >
                <XMarkIcon className="w-5 h-5" />
              </motion.button>
            </div>
            
            {/* Task Preview */}
            <div className="px-6 pt-5">
              <div className="bg-[#e8e6d9] dark:bg-[#2a2a2a] p-3 rounded-md mb-4 border border-[#d8d6cf] dark:border-[#3a3a3a]">
                <p className="text-sm font-medium text-[#202020] dark:text-[#f2f0e3] line-clamp-1">{pastDateTask?.title}</p>
              </div>
            </div>
            
            {/* Date Picker */}
            <div className="px-6 pb-5">
              <TimeSuggestions
                onSelect={handleCustomDateSelection}
                initialDate={new Date()}
                showTitle={false}
              />
            </div>
            
            {/* Footer */}
            <div className="px-6 py-4 bg-[#e8e6d9] dark:bg-[#2a2a2a] border-t border-[#d8d6cf] dark:border-[#3a3a3a] flex justify-end">
              <motion.button
                onClick={() => setShowCustomDatePicker(false)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="inline-flex justify-center items-center rounded-md border border-[#d8d6cf] dark:border-[#3a3a3a] bg-[#f2f0e3] dark:bg-[#202020] px-4 py-2.5 text-sm font-medium text-[#3a3a3a] dark:text-[#d1cfbf] shadow-sm hover:bg-[#dbd9cc] dark:hover:bg-[#333333] focus:outline-none focus:ring-1 focus:ring-[#f76f52]"
              >
                Cancel
              </motion.button>
            </div>
          </motion.div>
        </div>,
        document.body
      )}
    </div>
  )
}