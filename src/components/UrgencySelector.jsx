/**
 * File: UrgencySelector.jsx
 * Purpose: Slider to select task urgency level
 */
import { useState } from 'react'
import { motion } from 'framer-motion'

export default function UrgencySelector({ onChange, initialValue = 3 }) {
  const [urgency, setUrgency] = useState(initialValue)
  
  const handleChange = (newValue) => {
    setUrgency(newValue)
    onChange(newValue)
  }
  
  // Urgency level descriptions
  const descriptions = {
    1: 'Low priority',
    2: 'Somewhat important',
    3: 'Medium priority',
    4: 'Important',
    5: 'Urgent'
  }
  
  // Urgency level colors
  const colors = {
    1: 'bg-violet-200 dark:bg-violet-900/30',
    2: 'bg-violet-300 dark:bg-violet-800/40',
    3: 'bg-violet-400 dark:bg-violet-700/50',
    4: 'bg-violet-500 dark:bg-violet-600/60',
    5: 'bg-violet-600 dark:bg-violet-500/70',
  }
  
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        {[1, 2, 3, 4, 5].map(value => (
          <motion.button
            key={value}
            onClick={() => handleChange(value)}
            className={`w-12 h-12 rounded-full flex items-center justify-center font-medium ${
              urgency === value
                ? 'bg-primary-100 dark:bg-primary-900/20 text-primary-800 dark:text-primary-300 ring-2 ring-primary-500'
                : 'bg-gray-100 dark:bg-neutral-700 text-gray-800 dark:text-gray-200'
            }`}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            {value}
          </motion.button>
        ))}
      </div>
      
      <div className="h-2 w-full bg-gray-200 dark:bg-neutral-700 rounded-full overflow-hidden">
        <motion.div
          className={`h-full ${colors[urgency]}`}
          initial={{ width: '60%' }} // Default is 3 out of 5 (60%)
          animate={{ width: `${urgency * 20}%` }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        />
      </div>
      
      <div className="text-center text-sm font-medium text-primary-600 dark:text-primary-400">
        {descriptions[urgency]}
      </div>
    </div>
  )
}
