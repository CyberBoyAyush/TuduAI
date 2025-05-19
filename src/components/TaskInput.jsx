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
  InformationCircleIcon
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
      
      // Log the formatted XML output to console for debugging
      console.log("Parsed task as XML:");
      console.log(formatTaskAsXML(result));
      
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
        onAddTask(result)
        resetForm()
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
  }
  
  const finalizeTask = (updates = {}) => {
    // Add the task with any additional details provided
    onAddTask({
      ...parsedTask,
      ...updates
    })
    resetForm()
  }
  
  // Preview the AI-parsed task data
  const parsePreview = async () => {
    if (!input.trim()) return
    
    setLoading(true)
    
    try {
      // Display the current time information to the user for context
      const now = new Date();
      console.log(`Current time for parsing: ${now.toLocaleString()}`);
      
      const result = await parseTaskInput(input)
      
      // Log for debugging
      console.log('Parsed task:', result)
      console.log('XML format:')
      console.log(formatTaskAsXML(result))
      
      // Ensure all dates are in the future
      if (result.dueDate) {
        const dueDate = new Date(result.dueDate);
        const now = new Date();
        
        // If the parsed time is in the past but on the same day, assume it's for tomorrow
        if (dueDate < now) {
          console.log("Adjusting time: parsed time is in the past");
          
          // If it's the same day but earlier time
          if (dueDate.toDateString() === now.toDateString()) {
            dueDate.setDate(dueDate.getDate() + 1);
            console.log(`Adjusted to tomorrow: ${dueDate.toLocaleString()}`);
          } else {
            // For past dates (like "Monday" when today is Wednesday)
            // Keep incrementing by 1 day until in the future
            while (dueDate < now) {
              dueDate.setDate(dueDate.getDate() + 1);
            }
            console.log(`Adjusted to future date: ${dueDate.toLocaleString()}`);
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
        console.log("Set urgency to 4.5 based on keywords");
        
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
        setTimeout(() => {
          onAddTask(result)
          resetForm()
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
        className={`bg-white dark:bg-neutral-800 shadow-md rounded-xl overflow-hidden border border-gray-200 dark:border-neutral-700 transition-all ${
          isExpanded ? 'p-5' : 'p-3'
        }`}
      >
        {parsedTask && !parsedTask.dueDate ? (
          <div>
            <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-white">
              When is "{parsedTask.title}" due?
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
                  
                  console.log(`Selected date: ${formattedDate}`);
                  
                  // Generate a natural language prompt that would result in this date
                  const naturalLanguagePrompt = `${parsedTask.title} on ${formattedDate}`;
                  
                  // Log the natural language prompt for debugging
                  console.log(`Natural language prompt for parsing: ${naturalLanguagePrompt}`);
                  
                  // Try to parse with the natural language parser to get consistent results
                  parseTaskInput(naturalLanguagePrompt)
                    .then(result => {
                      console.log("Natural language parsed result:", result);
                      
                      // Use the original title from the parsed task, but the date from the natural language processing
                      const updatedTask = {
                        ...parsedTask,
                        dueDate: result.dueDate || date, // Fallback to original date if parsing fails
                      };
                      
                      // Verify the date is valid and in the future
                      const dueDate = new Date(updatedTask.dueDate);
                      const now = new Date();
                      
                      if (dueDate < now) {
                        console.warn("Due date is in the past, adjusting");
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
            
            <div className="mt-4 flex justify-between">
              <button
                onClick={resetForm}
                className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
              >
                Cancel
              </button>
              
              <button
                onClick={() => finalizeTask({ dueDate: null, urgency: parsedTask.urgency })}
                className="text-sm text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300"
              >
                Skip (no due date)
              </button>
            </div>
          </div>
        ) : parsedTask && !parsedTask.urgency ? (
          <div>
            <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-white">
              How urgent is this task?
            </h3>
            
            <div className="mb-4 text-md text-gray-700 dark:text-gray-300">
              <span className="font-medium">{parsedTask.title}</span>
              {parsedTask.dueDate && (
                <span className="text-sm ml-2 text-gray-500 dark:text-gray-400">
                  Due: {new Date(parsedTask.dueDate).toLocaleString('en-US', {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric',
                    hour: 'numeric',
                    minute: '2-digit'
                  })}
                </span>
              )}
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
            
            <div className="mt-4 flex justify-between">
              <button
                onClick={resetForm}
                className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
              >
                Cancel
              </button>
              
              <button
                onClick={() => finalizeTask({ urgency: 3, dueDate: parsedTask.dueDate })}
                className="text-sm text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300"
              >
                Use Default (3)
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="flex items-center gap-3">
              <div className="bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400 p-2 rounded-lg">
                <PlusIcon className="w-5 h-5" />
              </div>
              
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onFocus={() => setIsExpanded(true)}
                placeholder="Add a task... (e.g., 'Learn JavaScript tomorrow at 7PM')"
                className="flex-grow bg-transparent border-none focus:outline-none focus:ring-0 text-gray-800 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
                disabled={loading}
              />
              
              {input.trim() && !loading && (
                <motion.button
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  type="button"
                  onClick={parsePreview}
                  className="text-violet-600 dark:text-violet-400 hover:text-violet-700 dark:hover:text-violet-300 p-2 rounded-lg"
                >
                  <LightBulbIcon className="w-5 h-5" />
                </motion.button>
              )}
              
              {loading && (
                <ArrowPathIcon className="w-5 h-5 text-violet-500 animate-spin" />
              )}
              
              <button
                type="submit"
                disabled={!input.trim() || loading}
                className={`px-4 py-2 rounded-lg text-white bg-violet-600 hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors ${
                  (!input.trim() || loading) ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                Add
              </button>
            </div>
            
            <AnimatePresence>
              {isExpanded && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                  className="mt-4"
                >
                  {/* Info notice */}
                  <button
                    type="button"
                    onClick={() => setShowTips(!showTips)}
                    className="text-xs flex items-center text-gray-500 dark:text-gray-400 mb-3"
                  >
                    <InformationCircleIcon className="w-4 h-4 mr-1" />
                    {showTips ? 'Hide tips' : 'Type naturally, AI will parse your task'}
                  </button>
                  
                  <AnimatePresence>
                    {showTips && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mb-4 p-3 bg-gray-50 dark:bg-neutral-700/30 rounded-lg text-sm text-gray-600 dark:text-gray-300"
                      >
                        <p>Try natural language like:</p>
                        <ul className="list-disc ml-5 mt-1 space-y-1">
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
                        className="mb-4 p-3 bg-violet-50 dark:bg-violet-900/10 border border-violet-100 dark:border-violet-800/20 rounded-lg"
                      >
                        <h4 className="font-medium text-violet-800 dark:text-violet-300 mb-2">AI Parsed Your Task</h4>
                        <div className="text-sm space-y-1 text-gray-700 dark:text-gray-300">
                          <p><span className="font-medium">Title:</span> {parsedTask.title}</p>
                          <p>
                            <span className="font-medium">Due:</span>{" "}
                            {parsedTask.dueDate 
                              ? new Date(parsedTask.dueDate).toLocaleString('en-US', {
                                  weekday: 'short',
                                  month: 'short',
                                  day: 'numeric',
                                  hour: 'numeric',
                                  minute: '2-digit'
                                })
                              : 'Not specified'}
                          </p>
                          <p>
                            <span className="font-medium">Urgency:</span>{" "}
                            {parsedTask.urgency ? `${parsedTask.urgency}/5` : 'Not specified'}
                          </p>
                          
                          {/* Display follow-up message if present */}
                          {parsedTask.followUp && (
                            <p className="mt-2 text-violet-600 dark:text-violet-400">
                              <span className="font-medium">Next step:</span> {parsedTask.followUp}
                            </p>
                          )}
                          
                          {/* Show suggestions if available */}
                          {parsedTask.suggestions && parsedTask.suggestions.length > 0 && (
                            <div className="mt-2">
                              <p className="font-medium">Suggestions:</p>
                              <div className="flex flex-wrap gap-2 mt-1">
                                {parsedTask.suggestions.map((suggestion, index) => (
                                  <button
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
                                    className="px-3 py-1 bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 rounded-full text-xs hover:bg-violet-200 dark:hover:bg-violet-800/50"
                                  >
                                    {suggestion.displayText}
                                  </button>
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
                        className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800/30 rounded-lg text-sm text-red-600 dark:text-red-300"
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                      >
                        {error}
                      </motion.div>
                    )}
                  </AnimatePresence>
                  
                  <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center mt-4">
                    <BoltIcon className="w-3 h-3 mr-1" />
                    <span>Powered by GPT-4.1 Mini</span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </form>
        )}
      </motion.div>
    </div>
  )
}