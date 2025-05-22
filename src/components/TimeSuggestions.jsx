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
            className="px-3 py-2 bg-primary-100 text-primary-700 rounded-md text-sm font-medium border border-primary-300 hover:bg-primary-200"
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
          className="px-3 py-2 bg-primary-100 text-primary-700 rounded-md text-sm font-medium border border-primary-300 hover:bg-primary-200"
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
          className="px-3 py-2 bg-primary-100 text-primary-700 rounded-md text-sm font-medium border border-primary-300 hover:bg-primary-200"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          Two weeks
        </motion.button>
        
        <motion.button
          onClick={() => {
            // Set to end of month at 9 AM
            const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0)
            endOfMonth.setHours(9, 0, 0, 0)
            onSelect(endOfMonth.toISOString())
          }}
          className="px-3 py-2 bg-primary-100 text-primary-700 rounded-md text-sm font-medium border border-primary-300 hover:bg-primary-200"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          End of month
        </motion.button>
        
        <motion.button
          onClick={() => setShowCustomInput(!showCustomInput)}
          className="px-3 py-2 bg-primary-500 text-white rounded-md text-sm font-medium border border-transparent hover:bg-primary-600"
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
            className="overflow-hidden"
          >
            <div className="bg-primary-100 p-4 rounded-md border border-primary-300">
              <div className="flex flex-col space-y-3">
                <label htmlFor="custom-date" className="text-sm font-medium text-primary-700">
                  Enter a date or description:
                </label>
                
                <div className="relative">
                  <input
                    ref={inputRef}
                    id="custom-date"
                    type="text"
                    value={customDateInput}
                    onChange={(e) => setCustomDateInput(e.target.value)}
                    placeholder="next Monday at 3pm, May 15th at noon, etc."
                    className="w-full p-2 border border-primary-300 rounded-md bg-primary-50 text-primary-700 placeholder-primary-800/60"
                    autoFocus
                  />
                </div>
                
                <div className="flex justify-between space-x-2">
                  <motion.button
                    onClick={() => setShowCustomInput(false)}
                    className="px-3 py-2 bg-primary-50 text-primary-700 rounded-md text-sm border border-primary-300"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    Cancel
                  </motion.button>
                  
                  <motion.button
                    onClick={async () => {
                      if (!customDateInput.trim()) return;
                      
                      setIsProcessing(true);
                      setProcessingMessage('Processing your date...');
                      setProcessingError('');
                      
                      try {
                        const result = await parseTaskInput(`Task due ${customDateInput.trim()}`);
                        
                        if (result.dueDate) {
                          onSelect(result.dueDate);
                          setShowCustomInput(false);
                          setCustomDateInput('');
                        } else {
                          setProcessingError('Could not understand the date. Please try again with a clearer format.');
                        }
                      } catch (error) {
                        console.error('Error parsing custom date:', error);
                        setProcessingError('Error processing date. Please try again.');
                      } finally {
                        setIsProcessing(false);
                        setProcessingMessage('');
                      }
                    }}
                    className={`px-3 py-2 bg-primary-500 text-white rounded-md text-sm font-medium border border-transparent hover:bg-primary-600 flex items-center justify-center min-w-[80px] ${
                      isProcessing ? 'opacity-70 cursor-not-allowed' : ''
                    }`}
                    whileHover={{ scale: isProcessing ? 1 : 1.05 }}
                    whileTap={{ scale: isProcessing ? 1 : 0.95 }}
                    disabled={isProcessing}
                  >
                    {isProcessing ? (
                      <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    ) : (
                      'Set Date'
                    )}
                  </motion.button>
                </div>
                
                {processingMessage && (
                  <p className="text-xs text-primary-800">{processingMessage}</p>
                )}
                
                {processingError && (
                  <p className="text-xs text-red-500">{processingError}</p>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
