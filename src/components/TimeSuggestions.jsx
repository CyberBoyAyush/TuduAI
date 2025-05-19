/**
 * File: TimeSuggestions.jsx
 * Purpose: Quick time selection buttons
 */
import { motion } from 'framer-motion'

export default function TimeSuggestions({ onSelect }) {
  const today = new Date()
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)
  
  // Common time suggestions
  const suggestions = [
    {
      label: 'Today 12 PM',
      value: new Date(
        today.getFullYear(),
        today.getMonth(),
        today.getDate(),
        12, 0, 0
      ).toISOString()
    },
    {
      label: 'Today 6 PM',
      value: new Date(
        today.getFullYear(),
        today.getMonth(),
        today.getDate(),
        18, 0, 0
      ).toISOString()
    },
    {
      label: 'Tomorrow 9 AM',
      value: new Date(
        tomorrow.getFullYear(),
        tomorrow.getMonth(),
        tomorrow.getDate(),
        9, 0, 0
      ).toISOString()
    },
    {
      label: 'Tomorrow 2 PM',
      value: new Date(
        tomorrow.getFullYear(),
        tomorrow.getMonth(),
        tomorrow.getDate(),
        14, 0, 0
      ).toISOString()
    },
    {
      label: 'Next Monday',
      value: (() => {
        const nextMonday = new Date(today)
        nextMonday.setDate(today.getDate() + (1 + 7 - today.getDay()) % 7)
        nextMonday.setHours(9, 0, 0, 0)
        return nextMonday.toISOString()
      })()
    }
  ]
  
  // Filter out past suggestions
  const validSuggestions = suggestions.filter(
    suggestion => new Date(suggestion.value) > new Date()
  )
  
  return (
    <div className="flex flex-wrap gap-2">
      {validSuggestions.map((suggestion, index) => (
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
  )
}
