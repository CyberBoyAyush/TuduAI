/**
 * File: TimeSuggestions.jsx
 * Purpose: Quick time selection buttons
 */
import { motion } from 'framer-motion'

export default function TimeSuggestions({ onSelect }) {
  const today = new Date()
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)
  
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
            // Create a date picker
            const input = document.createElement('input')
            input.type = 'datetime-local'
            
            // Set min to now
            const now = new Date()
            input.min = now.toISOString().substring(0, 16)
            
            // Add event listener
            input.addEventListener('change', (e) => {
              const selectedDate = new Date(e.target.value)
              onSelect(selectedDate.toISOString())
            })
            
            // Trigger click
            input.click()
          }}
          className="px-3 py-2 bg-primary-100 dark:bg-primary-900/20 text-primary-800 dark:text-primary-300 rounded-md text-sm font-medium"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          Custom date
        </motion.button>
      </div>
    </div>
  )
}
