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
    <div className="space-y-6 py-4">
      <div className="flex flex-col space-y-2">
        <div className="flex justify-between items-center">
          <div className="text-sm text-gray-700 dark:text-gray-300">Urgency:</div>
          <div className="text-lg font-bold text-gray-700 dark:text-gray-300">{urgency}.0</div>
        </div>
        <div className="flex items-center">
          <button 
            onClick={() => urgency > 1 && handleChange(urgency - 1)}
            className="w-8 h-8 flex items-center justify-center text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 disabled:opacity-30"
            disabled={urgency === 1}
          >
            &lt;
          </button>
          
          <div className="flex-grow mx-2">
            <div className="h-2 w-full bg-gray-200 dark:bg-neutral-700 rounded-full overflow-hidden">
              <motion.div
                className={`h-full ${colors[urgency]}`}
                initial={{ width: '60%' }}
                animate={{ width: `${urgency * 20}%` }}
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              />
            </div>
          </div>
          
          <button 
            onClick={() => urgency < 5 && handleChange(urgency + 1)}
            className="w-8 h-8 flex items-center justify-center text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 disabled:opacity-30"
            disabled={urgency === 5}
          >
            &gt;
          </button>
        </div>
      </div>
      
      <motion.button
        onClick={() => onChange(urgency)}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className="w-full py-2 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-md text-center"
      >
        Set Urgency (⌘ + ↵)
      </motion.button>
    </div>
  )
}
