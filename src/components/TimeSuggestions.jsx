/**
 * File: TimeSuggestions.jsx
 * Purpose: Quick time selection buttons
 */
import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { parseTaskInput } from '../lib/openai'

export default function TimeSuggestions({ onSelect }) {
  const today = new Date()
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)
  
  const [showCustomInput, setShowCustomInput] = useState(false)
  const [customDateInput, setCustomDateInput] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [processingMessage, setProcessingMessage] = useState('')
  const [processingError, setProcessingError] = useState('')
  const inputRef = useRef(null)
  
  // Format a date to a simple time string
  const formatTimeOnly = (hours, minutes = 0) => {
    const date = new Date();
    date.setHours(hours, minutes, 0, 0);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };
  
  // Format day name
  const getDayName = (date) => {
    return date.toLocaleDateString('en-US', { weekday: 'short' });
  };
  
  // Common time suggestions
  const suggestions = [
    {
      label: `Today ${formatTimeOnly(12)}`,
      value: new Date(
        today.getFullYear(),
        today.getMonth(),
        today.getDate(),
        12, 0, 0
      ).toISOString()
    },
    {
      label: `Today ${formatTimeOnly(15)}`,
      value: new Date(
        today.getFullYear(),
        today.getMonth(),
        today.getDate(),
        15, 0, 0
      ).toISOString()
    },
    {
      label: `Today ${formatTimeOnly(18)}`,
      value: new Date(
        today.getFullYear(),
        today.getMonth(),
        today.getDate(),
        18, 0, 0
      ).toISOString()
    },
    {
      label: `Tomorrow ${formatTimeOnly(9)}`,
      value: new Date(
        tomorrow.getFullYear(),
        tomorrow.getMonth(),
        tomorrow.getDate(),
        9, 0, 0
      ).toISOString()
    },
    {
      label: `Tomorrow ${formatTimeOnly(14)}`,
      value: new Date(
        tomorrow.getFullYear(),
        tomorrow.getMonth(),
        tomorrow.getDate(),
        14, 0, 0
      ).toISOString()
    }
  ]
  
  // Add suggestions for the rest of the week
  for (let i = 2; i <= 6; i++) {
    const futureDate = new Date(today)
    futureDate.setDate(today.getDate() + i)
    
    // Skip weekend days
    if (futureDate.getDay() === 0 || futureDate.getDay() === 6) {
      continue
    }
    
    suggestions.push({
      label: `${getDayName(futureDate)} ${formatTimeOnly(9)}`,
      value: new Date(
        futureDate.getFullYear(),
        futureDate.getMonth(),
        futureDate.getDate(),
        9, 0, 0
      ).toISOString()
    })
  }
  
  // Add weekend suggestions
  const saturday = new Date(today)
  saturday.setDate(today.getDate() + ((6 - today.getDay()) % 7 || 7)) // Next Saturday
  
  const sunday = new Date(today)
  sunday.setDate(today.getDate() + ((0 - today.getDay()) % 7 || 7)) // Next Sunday
  
  suggestions.push(
    {
      label: `${getDayName(saturday)} ${formatTimeOnly(10)}`,
      value: new Date(
        saturday.getFullYear(),
        saturday.getMonth(),
        saturday.getDate(),
        10, 0, 0
      ).toISOString()
    },
    {
      label: `${getDayName(sunday)} ${formatTimeOnly(10)}`,
      value: new Date(
        sunday.getFullYear(),
        sunday.getMonth(),
        sunday.getDate(),
        10, 0, 0
      ).toISOString()
    }
  )
  
  // Filter out past suggestions
  const validSuggestions = suggestions.filter(
    suggestion => new Date(suggestion.value) > new Date()
  )
  
  // Group suggestions by date for better organization
  const groupedSuggestions = validSuggestions.reduce((acc, suggestion) => {
    const date = new Date(suggestion.value).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
    
    if (!acc[date]) {
      acc[date] = [];
    }
    
    acc[date].push(suggestion);
    return acc;
  }, {});
  
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
        {validSuggestions.slice(0, 6).map((suggestion, index) => (
          <motion.button
            key={index}
            onClick={() => onSelect(suggestion.value)}
            className="px-3 py-2 bg-gray-100 dark:bg-neutral-700 text-gray-800 dark:text-gray-200 rounded-md text-sm font-medium"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {suggestion.label}
          </motion.button>
        ))}
      </div>
      
      <div className="flex flex-wrap gap-2">
        <motion.button
          onClick={() => {
            // Set to a week from now at 9 AM
            const nextWeek = new Date(today)
            nextWeek.setDate(today.getDate() + 7)
            nextWeek.setHours(9, 0, 0, 0)
            onSelect(nextWeek.toISOString())
          }}
          className="px-3 py-2 bg-gray-100 dark:bg-neutral-700 text-gray-800 dark:text-gray-200 rounded-md text-sm font-medium"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          Next week
        </motion.button>
        
        <motion.button
          onClick={() => {
            // Set to two weeks from now at 9 AM
            const twoWeeks = new Date(today)
            twoWeeks.setDate(today.getDate() + 14)
            twoWeeks.setHours(9, 0, 0, 0)
            onSelect(twoWeeks.toISOString())
          }}
          className="px-3 py-2 bg-gray-100 dark:bg-neutral-700 text-gray-800 dark:text-gray-200 rounded-md text-sm font-medium"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          Two weeks
        </motion.button>
        
        <motion.button
          onClick={() => {
            // Set to next month on the 1st at 9 AM
            const nextMonth = new Date(today)
            nextMonth.setMonth(nextMonth.getMonth() + 1)
            nextMonth.setDate(1)
            nextMonth.setHours(9, 0, 0, 0)
            onSelect(nextMonth.toISOString())
          }}
          className="px-3 py-2 bg-gray-100 dark:bg-neutral-700 text-gray-800 dark:text-gray-200 rounded-md text-sm font-medium"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          Next month
        </motion.button>
        
        <motion.button
          onClick={() => {
            setShowCustomInput(true)
            setProcessingMessage('')
            setProcessingError('')
            
            // Focus the input after rendering
            setTimeout(() => {
              if (inputRef.current) {
                inputRef.current.focus()
              }
            }, 100)
          }}
          className="px-3 py-2 bg-primary-100 dark:bg-primary-900/20 text-primary-800 dark:text-primary-300 rounded-md text-sm font-medium"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          Custom date
        </motion.button>
      </div>
      
      <AnimatePresence>
        {showCustomInput && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-4 bg-gray-50 dark:bg-neutral-800 p-4 rounded-lg border border-gray-200 dark:border-neutral-700"
          >
            <form 
              onSubmit={(e) => {
                e.preventDefault()
                
                if (!customDateInput.trim()) {
                  setProcessingError('Please enter a date/time')
                  return
                }
                
                setIsProcessing(true)
                setProcessingMessage('Processing your date...')
                setProcessingError('')
                
                try {
                  // Create a mock task with the entered date/time for AI parsing
                  const mockTaskInput = `Task ${customDateInput.trim()}`
                  console.log(`Parsing custom date entry: "${mockTaskInput}"`)
                  
                  // Check for common time patterns that might need disambiguation
                  const pmTimePattern = /\b(\d{1,2})\s*(?:pm|p\.m\.)\b/i;
                  const amTimePattern = /\b(\d{1,2})\s*(?:am|a\.m\.)\b/i;
                  const hasExplicitPm = pmTimePattern.test(customDateInput.toLowerCase());
                  const hasExplicitAm = amTimePattern.test(customDateInput.toLowerCase());
                  
                  // For simple hour numbers, ensure PM is properly indicated for afternoon/evening hours
                  let enhancedInput = customDateInput.trim();
                  if (!hasExplicitPm && !hasExplicitAm) {
                    const hourMatch = /\b(\d{1,2})\b/.exec(customDateInput);
                    if (hourMatch) {
                      const hour = parseInt(hourMatch[1]);
                      // For hours that are likely PM (5-11), add PM if not specified
                      if (hour >= 5 && hour <= 11 && 
                          (customDateInput.toLowerCase().includes('evening') || 
                           customDateInput.toLowerCase().includes('night') ||
                           customDateInput.toLowerCase().includes('afternoon') ||
                           customDateInput.toLowerCase().includes('dinner'))) {
                        enhancedInput = customDateInput.replace(
                          new RegExp(`\\b${hour}\\b`), 
                          `${hour}pm`
                        );
                        console.log(`Enhanced input to clarify PM: "${enhancedInput}"`);
                      }
                    }
                  }
                  
                  // Parse the natural language input
                  parseTaskInput(`Task ${enhancedInput}`)
                    .then(result => {
                      if (result.dueDate) {
                        console.log(`Successfully parsed date: ${result.dueDate}`)
                        
                        // Validate that the parsed date makes sense
                        const parsedDate = new Date(result.dueDate);
                        const now = new Date();
                        
                        // If it parsed to an AM time but likely should be PM
                        const hour = parsedDate.getHours();
                        const hasPmIndicator = customDateInput.toLowerCase().match(/\b(?:pm|p\.m\.|evening|night|dinner|afternoon)\b/);
                        
                        // If it's early morning (12am-7am) but no explicit morning/AM indicator
                        if (hour >= 0 && hour < 7 && hasPmIndicator && 
                            !customDateInput.toLowerCase().match(/\b(?:am|a\.m\.|morning|dawn)\b/)) {
                          console.log(`Fixing likely incorrect AM time: ${hour}am -> ${hour+12}pm`);
                          parsedDate.setHours(hour + 12);
                          result.dueDate = parsedDate.toISOString();
                        }
                        
                        // Format the date for display
                        const formattedDate = parsedDate.toLocaleString('en-US', {
                          weekday: 'long',
                          month: 'long',
                          day: 'numeric',
                          hour: 'numeric',
                          minute: '2-digit',
                          hour12: true
                        })
                        
                        setProcessingMessage(`Date set to: ${formattedDate}`)
                        
                        // Wait a moment to show success message before closing
                        setTimeout(() => {
                          // Pass the parsed date to the parent component
                          onSelect(result.dueDate)
                          setShowCustomInput(false)
                          setCustomDateInput('')
                          setIsProcessing(false)
                          setProcessingMessage('')
                        }, 1500)
                      } else {
                        setProcessingError("I couldn't understand that date/time. Please try again with a clearer format.")
                        setIsProcessing(false)
                        console.error("Failed to parse date from input:", customDateInput)
                      }
                    })
                    .catch(error => {
                      console.error("Error parsing date:", error)
                      setProcessingError("There was an error processing your date. Please try again.")
                      setIsProcessing(false)
                    })
                } catch (error) {
                  console.error("Error in custom date processing:", error)
                  setProcessingError("There was an error processing your date. Please try again.")
                  setIsProcessing(false)
                }
              }}
              className="space-y-3"
            >
              <div>
                <label 
                  htmlFor="custom-date-input" 
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                >
                  Enter a date/time in natural language:
                </label>
                <input
                  ref={inputRef}
                  id="custom-date-input"
                  type="text"
                  value={customDateInput}
                  onChange={(e) => setCustomDateInput(e.target.value)}
                  placeholder="e.g., 'tomorrow at 7am', 'friday at 3pm'"
                  className="w-full px-3 py-2 bg-white dark:bg-neutral-700 border border-gray-300 dark:border-neutral-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400"
                  disabled={isProcessing}
                />
              </div>
              
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowCustomInput(false)
                    setCustomDateInput('')
                    setProcessingMessage('')
                    setProcessingError('')
                  }}
                  className="px-3 py-2 bg-gray-100 dark:bg-neutral-700 text-gray-800 dark:text-gray-200 rounded-md text-sm font-medium"
                  disabled={isProcessing}
                >
                  Cancel
                </button>
                
                <button
                  type="submit"
                  className="px-3 py-2 bg-primary-500 text-white rounded-md text-sm font-medium disabled:opacity-50"
                  disabled={isProcessing || !customDateInput.trim()}
                >
                  {isProcessing ? 'Processing...' : 'Set Date'}
                </button>
              </div>
              
              {processingMessage && (
                <div className="p-2 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300 rounded-md text-sm">
                  {processingMessage}
                </div>
              )}
              
              {processingError && (
                <div className="p-2 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 rounded-md text-sm">
                  {processingError}
                </div>
              )}
              
              <div className="text-xs text-gray-500 dark:text-gray-400">
                Try phrases like "7am tomorrow", "next friday at 3pm", "tomorrow 6pm", or "in two days at noon"
              </div>
              
              {/* Clickable example suggestions */}
              <div className="mt-2 flex flex-wrap gap-1">
                {['tomorrow 6pm', 'friday 3pm', 'next week', 'tonight 8pm'].map((example) => (
                  <button
                    key={example}
                    type="button"
                    onClick={() => setCustomDateInput(example)}
                    className="text-xs text-primary-600 dark:text-primary-400 hover:underline"
                    disabled={isProcessing}
                  >
                    {example}
                  </button>
                ))}
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
