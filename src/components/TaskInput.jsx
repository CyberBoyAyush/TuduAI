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



export default function TaskInput({ onAddTask }) {
  const [input, setInput] = useState('')
  const [isExpanded, setIsExpanded] = useState(false)
  const [loading, setLoading] = useState(false)
  const [parsedTask, setParsedTask] = useState(null)
  const [error, setError] = useState(null)
  const [showTips, setShowTips] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
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


  
  // Preview the AI-parsed task data
  const parsePreview = async () => {
    if (!input.trim()) return
    
    setLoading(true)
    
    try {
      const result = await parseTaskInput(input)
      
      // Check if date is in the past
      if (result.dueDate && isPastDate(result.dueDate)) {
        setPastDateTask(result);
        setShowPastDateDialog(true);
        setLoading(false);
        return;
      }
      
      // Ensure all dates are in the future
      if (result.dueDate) {
        const dueDate = new Date(result.dueDate);
        const now = new Date();
        
        // If the parsed time is in the past but on the same day, assume it's for tomorrow
        if (dueDate < now) {
          // If it's the same day but earlier time
          if (dueDate.toDateString() === now.toDateString()) {
            dueDate.setDate(dueDate.getDate() + 1);
          } else {
            // For past dates (like "Monday" when today is Wednesday)
            // Keep incrementing by 1 day until in the future
            while (dueDate < now) {
              dueDate.setDate(dueDate.getDate() + 1);
            }
          }
          result.dueDate = dueDate.toISOString();
        }
      }
      
      // Set urgency to 4.5 for keywords like investor, deadline, urgent
      if (!result.urgency && 
          (input.toLowerCase().includes("investor") || 
           input.toLowerCase().includes("deadline") || 
           input.toLowerCase().includes("urgent"))) {
        result.urgency = 4.5;
        
        // Remove urgency from stillNeeded if it exists
        if (result.stillNeeded) {
          result.stillNeeded = result.stillNeeded.filter(item => item !== "urgency");
        }
      }
      
      // Show the parsed result
      setParsedTask(result)
      
      // If we have all the required fields, enable direct add
      if (result.title && result.dueDate && result.urgency) {
        // Wait for preview to show briefly before completing
        setTimeout(async () => {
          try {
            setIsSaving(true);
            await onAddTask(result);
            resetForm();
          } catch (error) {
            console.error('Error saving task:', error);
            setError('Failed to save task. Please try again.');
          } finally {
            setIsSaving(false);
          }
        }, 1500)
      }
    } catch (error) {
      console.error('Error parsing task:', error)
      setError('Failed to parse your task. Please try again.')
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
              onSelect={(date) => {
                try {
                  // Check if date is in the past
                  if (isPastDate(date)) {
                    const updatedTask = {
                      ...parsedTask,
                      dueDate: date
                    };
                    setPastDateTask(updatedTask);
                    setShowPastDateDialog(true);
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
                  parseTaskInput(naturalLanguagePrompt)
                    .then(result => {
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
                        onAddTask(updatedTask);
                        resetForm();
                      } else {
                        // We still need to get the urgency
                        finalizeTask({ 
                          dueDate: updatedTask.dueDate,
                          urgency: updatedTask.urgency 
                        });
                      }
                    })
                    .catch(error => {
                      console.error("Error parsing natural language date:", error);
                      // If there's an error parsing, just use the date as is
                      const updatedTask = {
                        ...parsedTask,
                        dueDate: date
                      };
                      
                      if (updatedTask.dueDate && updatedTask.urgency) {
                        onAddTask(updatedTask);
                        resetForm();
                      } else {
                        finalizeTask({ 
                          dueDate: updatedTask.dueDate,
                          urgency: updatedTask.urgency 
                        });
                      }
                    });
                } catch (error) {
                  console.error("Error processing selected date:", error);
                  // Fallback - use date directly if there's any error
                  finalizeTask({ dueDate: date, urgency: parsedTask.urgency });
                }
              }}
            />
            
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
              onChange={(urgency) => {
                // Complete the task creation
                finalizeTask({ urgency });
              }}
              initialValue={3}
            />
            
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
                  className="text-[#202020] dark:text-[#f2f0e3] hover:bg-[#e8e6d9] dark:hover:bg-[#2a2a2a] p-2 sm:p-2.5 rounded-md transition-colors border border-[#d8d6cf] dark:border-[#3a3a3a] flex-shrink-0"
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