/**
 * File: TaskInput.jsx
 * Purpose: Input for creating new tasks with AI parsing
 */
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { parseTaskInput } from '../lib/openai'
import TimeSuggestions from './TimeSuggestions'
import UrgencySelector from './UrgencySelector'
import { PlusIcon, BoltIcon, ClockIcon } from '@heroicons/react/24/outline'

export default function TaskInput({ onAddTask }) {
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [parsedTask, setParsedTask] = useState(null)
  const [error, setError] = useState(null)
  
  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!input.trim()) return
    
    setLoading(true)
    setError(null)
    
    try {
      // Parse the input using OpenAI
      const result = await parseTaskInput(input)
      
      // Check if we need additional information
      if (!result.dueDate || !result.urgency) {
        // We'll handle this with our UI
        setParsedTask(result)
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
  }
  
  const finalizeTask = (updates = {}) => {
    // Add the task with any additional details provided
    onAddTask({
      ...parsedTask,
      ...updates
    })
    resetForm()
  }
  
  return (
    <div className="w-full max-w-3xl mx-auto bg-white dark:bg-neutral-800 rounded-xl shadow-sm border border-gray-200 dark:border-neutral-700 p-4 mb-8">
      <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-200">
        What's on your agenda?
      </h2>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex items-center">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="e.g. Learn JavaScript tomorrow at 7PM"
            className="flex-grow py-2 px-4 rounded-l-lg border-l border-t border-b border-gray-300 dark:border-neutral-600 bg-gray-50 dark:bg-neutral-700 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
            disabled={loading}
          />
          <motion.button
            type="submit"
            className="py-2 px-4 rounded-r-lg bg-primary-500 hover:bg-primary-600 text-white font-medium flex items-center justify-center"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            disabled={loading || !input.trim()}
          >
            {loading ? (
              <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : (
              <>
                <PlusIcon className="w-5 h-5 mr-1" />
                <span>Add</span>
              </>
            )}
          </motion.button>
        </div>
        
        {error && (
          <motion.div 
            className="p-3 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 rounded-lg"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {error}
          </motion.div>
        )}
        
        <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center">
          <BoltIcon className="w-3 h-3 mr-1" />
          <span>Powered by GPT-4.1 Mini</span>
        </div>
      </form>
      
      {/* Additional information prompt if needed */}
      <AnimatePresence>
        {parsedTask && (
          <motion.div
            className="mt-4 border-t border-gray-200 dark:border-neutral-700 pt-4"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            <h3 className="font-medium text-gray-800 dark:text-gray-200 mb-2">
              Task: {parsedTask.title}
            </h3>
            
            {!parsedTask.dueDate && (
              <div className="mb-4">
                <div className="flex items-center mb-2 text-sm text-gray-600 dark:text-gray-400">
                  <ClockIcon className="w-4 h-4 mr-1" />
                  <span>When is this due?</span>
                </div>
                <TimeSuggestions 
                  onSelect={(dueDate) => finalizeTask({ 
                    dueDate,
                    urgency: parsedTask.urgency 
                  })}
                />
              </div>
            )}
            
            {!parsedTask.urgency && (
              <div className="mb-4">
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                  How urgent is this task?
                </div>
                <UrgencySelector 
                  onChange={(urgency) => finalizeTask({ 
                    urgency,
                    dueDate: parsedTask.dueDate 
                  })}
                />
              </div>
            )}
            
            <motion.button
              onClick={resetForm}
              className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Cancel
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
