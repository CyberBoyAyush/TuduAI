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
  ArrowUpIcon
} from '@heroicons/react/24/outline'

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
  const inputRef = useRef(null)
  
  // Focus input when expanded
  useEffect(() => {
    if (isExpanded && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isExpanded])

  const handleSubmit = async (e) => {
    e?.preventDefault()
    
    if (!input.trim()) return
    
    setLoading(true)
    setError(null)
    
    try {
      // Parse the input using OpenAI or fallback parser
      const result = await parseTaskInput(input)
      
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
    setError(null)
    setIsExpanded(false)
    setIsSaving(false)
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
  
  // Preview the AI-parsed task data
  const parsePreview = async () => {
    if (!input.trim()) return
    
    setLoading(true)
    
    try {
      const result = await parseTaskInput(input)
      
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
    <div className="mx-auto max-w-2xl">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className={`bg-white dark:bg-neutral-800 shadow-xl backdrop-blur-sm rounded-2xl overflow-hidden border border-gray-200/80 dark:border-neutral-700/80 transition-all ${
          isExpanded ? 'p-6' : 'p-4'
        }`}
      >
        {parsedTask && !parsedTask.dueDate ? (
          <div>
            <h3 className="text-base sm:text-lg font-semibold mb-4 text-gray-800 dark:text-white flex items-center bg-gradient-to-r from-indigo-500 to-purple-500 bg-clip-text text-transparent">
              <ClockIcon className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-indigo-500 dark:text-indigo-400" />
              When is "{parsedTask.title.length > 20 ? parsedTask.title.substring(0, 20) + '...' : parsedTask.title}" due?
            </h3>
            
            <TimeSuggestions 
              onSelect={(date) => {
                try {
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
                className="text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors px-3 sm:px-4 py-2 rounded-lg border border-gray-200 dark:border-neutral-700 hover:bg-gray-50 dark:hover:bg-neutral-700/50 shadow-sm"
              >
                Cancel
              </motion.button>
              
              <motion.button
                onClick={() => finalizeTask({ dueDate: null, urgency: parsedTask.urgency })}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                className="text-xs sm:text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors px-3 sm:px-4 py-2 rounded-lg border border-indigo-100 dark:border-indigo-800/30 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 shadow-sm"
              >
                <span className="hidden sm:inline">Skip (no due date)</span>
                <span className="sm:hidden">Skip</span>
              </motion.button>
            </div>
          </div>
        ) : parsedTask && !parsedTask.urgency ? (
          <div>
            <h3 className="text-base sm:text-lg font-semibold mb-4 text-gray-800 dark:text-white flex items-center bg-gradient-to-r from-indigo-500 to-purple-500 bg-clip-text text-transparent">
              <ExclamationCircleIcon className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-indigo-500 dark:text-indigo-400" />
              How urgent is this task?
            </h3>
            
            <div className="mb-4 text-sm sm:text-md text-gray-700 dark:text-gray-300 p-3 sm:p-4 bg-gray-50 dark:bg-neutral-700/30 rounded-xl border border-gray-200 dark:border-neutral-600/30 shadow-inner">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <span className="font-medium truncate">{parsedTask.title.length > 25 ? parsedTask.title.substring(0, 25) + '...' : parsedTask.title}</span>
                {parsedTask.dueDate && (
                  <span className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 flex items-center whitespace-nowrap">
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
                const updatedTask = {
                  ...parsedTask,
                  urgency
                };
                
                // Complete the task creation
                onAddTask(updatedTask);
                resetForm();
              }}
              initialValue={3}
            />
            
            <div className="mt-5 flex justify-between gap-2">
              <motion.button
                onClick={resetForm}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                className="text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors px-3 sm:px-4 py-2 rounded-lg border border-gray-200 dark:border-neutral-700 hover:bg-gray-50 dark:hover:bg-neutral-700/50 shadow-sm"
              >
                Cancel
              </motion.button>
              
              <motion.button
                onClick={() => finalizeTask({ urgency: 3, dueDate: parsedTask.dueDate })}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                className="text-xs sm:text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors px-3 sm:px-4 py-2 rounded-lg border border-indigo-100 dark:border-indigo-800/30 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 shadow-sm"
              >
                <span className="hidden sm:inline">Use Default (3)</span>
                <span className="sm:hidden">Default (3)</span>
              </motion.button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="relative">
            <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 sm:gap-3">
              <div className="bg-gradient-to-br from-violet-500/10 to-indigo-500/10 dark:from-violet-400/20 dark:to-indigo-400/20 text-violet-600 dark:text-violet-400 p-2 sm:p-3 rounded-xl shadow-sm border border-violet-200/50 dark:border-violet-700/30 hidden sm:block">
                <PlusIcon className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onFocus={() => setIsExpanded(true)}
                placeholder="What do you want to do?"
                className="flex-grow bg-transparent border-none focus:outline-none focus:ring-0 text-gray-800 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 text-sm sm:text-base py-2 sm:py-3 min-w-0 transition-all"
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
                  className="text-violet-600 dark:text-violet-400 hover:text-violet-700 dark:hover:text-violet-300 p-2 sm:p-2.5 rounded-xl transition-colors bg-violet-50 dark:bg-violet-900/20 border border-violet-200/50 dark:border-violet-800/30 shadow-sm flex-shrink-0"
                >
                  <LightBulbIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                </motion.button>
              )}
              
              {loading && (
                <div className="p-2 sm:p-2.5 flex-shrink-0">
                  <ArrowPathIcon className="w-4 h-4 sm:w-5 sm:h-5 text-violet-500 animate-spin" />
                </div>
              )}
              
              <motion.button
                type="submit"
                disabled={!input.trim() || loading}
                whileHover={{ scale: input.trim() && !loading ? 1.03 : 1 }}
                whileTap={{ scale: input.trim() && !loading ? 0.97 : 1 }}
                className={`px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl text-white font-medium bg-gradient-to-br from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md flex-shrink-0 ${
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
                      className="text-xs flex items-center text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-neutral-700/30 px-2 sm:px-3 py-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-neutral-700/50 transition-colors shadow-sm"
                    >
                      <InformationCircleIcon className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                      {showTips ? 'Hide tips' : <span><span className="hidden sm:inline">Type naturally, AI will parse your task</span><span className="sm:hidden">Tips</span></span>}
                    </motion.button>
                    
                    <motion.span 
                      className="text-xs text-gray-500 dark:text-gray-400 flex items-center bg-gray-50 dark:bg-neutral-900/50 px-2 sm:px-3 py-1.5 rounded-full shadow-sm"
                      whileHover={{ scale: 1.05 }}
                      transition={{ duration: 0.2 }}
                    >
                      <BoltIcon className="w-3 h-3 sm:w-3.5 sm:h-3.5 mr-1 sm:mr-1.5 text-amber-500" />
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
                        className="mb-4 p-4 bg-gradient-to-br from-gray-50 to-gray-50/70 dark:from-neutral-800/50 dark:to-neutral-800/30 rounded-xl text-sm text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-neutral-700/50 shadow-sm"
                      >
                        <p className="font-medium mb-2.5 flex items-center">
                          <LightBulbIcon className="w-4 h-4 mr-1.5 text-amber-500" />
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
                        className="mb-4 p-3 sm:p-5 bg-gradient-to-br from-violet-50/90 to-indigo-50/90 dark:from-violet-900/10 dark:to-indigo-900/10 border border-violet-200/70 dark:border-violet-800/20 rounded-xl shadow-sm"
                      >
                        <h4 className="font-medium text-sm sm:text-base text-violet-800 dark:text-violet-300 mb-2 sm:mb-3 flex items-center">
                          <LightBulbIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1 sm:mr-1.5" />
                          AI Parsed Your Task
                        </h4>
                        <div className="text-xs sm:text-sm space-y-2 sm:space-y-3 text-gray-700 dark:text-gray-300">
                          <div className="flex items-start">
                            <span className="font-medium w-12 sm:w-16 shrink-0">Title:</span>
                            <span className="flex-grow font-semibold text-gray-900 dark:text-gray-100 line-clamp-2">{parsedTask.title}</span>
                          </div>
                          <div className="flex items-start">
                            <span className="font-medium w-12 sm:w-16 shrink-0">Due:</span>
                            <span>
                              {parsedTask.dueDate 
                                ? <span className="flex items-center bg-white/60 dark:bg-white/5 px-2 py-1 rounded-md text-xs sm:text-sm">
                                    <ClockIcon className="w-3 h-3 sm:w-3.5 sm:h-3.5 mr-1 sm:mr-1.5 text-indigo-500 dark:text-indigo-400" />
                                    {new Date(parsedTask.dueDate).toLocaleString('en-US', {
                                      weekday: 'short',
                                      month: 'short',
                                      day: 'numeric',
                                      hour: 'numeric',
                                      minute: '2-digit'
                                    })}
                                  </span>
                                : <span className="text-gray-500 dark:text-gray-400 italic">Not specified</span>}
                            </span>
                          </div>
                          <div className="flex items-start">
                            <span className="font-medium w-12 sm:w-16 shrink-0">Urgency:</span>
                            <span>
                              {parsedTask.urgency 
                                ? <span className="flex items-center bg-white/60 dark:bg-white/5 px-2 py-1 rounded-md text-xs sm:text-sm">
                                    <span className={`inline-block w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full mr-1 sm:mr-1.5 ${
                                      parsedTask.urgency >= 4.5 ? 'bg-red-500' :
                                      parsedTask.urgency >= 3.5 ? 'bg-orange-500' :
                                      parsedTask.urgency >= 2.5 ? 'bg-yellow-500' :
                                      parsedTask.urgency >= 1.5 ? 'bg-blue-500' :
                                      'bg-green-500'
                                    }`}></span>
                                    {parsedTask.urgency}/5
                                  </span>
                                : <span className="text-gray-500 dark:text-gray-400 italic">Not specified</span>}
                            </span>
                          </div>
                          
                          {/* Display follow-up message if present */}
                          {parsedTask.followUp && (
                            <p className="mt-2 sm:mt-3 text-xs sm:text-sm text-violet-600 dark:text-violet-400 border-t border-violet-100 dark:border-violet-800/30 pt-2">
                              <span className="font-medium">Next step:</span> {parsedTask.followUp}
                            </p>
                          )}
                          
                          {/* Show suggestions if available */}
                          {parsedTask.suggestions && parsedTask.suggestions.length > 0 && (
                            <div className="mt-2 sm:mt-3 border-t border-violet-100 dark:border-violet-800/30 pt-2">
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
                                    className="px-2 sm:px-3 py-1 sm:py-1.5 bg-white dark:bg-neutral-800 text-violet-700 dark:text-violet-300 rounded-full text-xs hover:bg-violet-50 dark:hover:bg-violet-900/20 border border-violet-200 dark:border-violet-800/30 shadow-sm transition-colors"
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
                        className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800/30 rounded-xl text-sm text-red-600 dark:text-red-300 flex items-start shadow-sm"
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
    </div>
  )
}