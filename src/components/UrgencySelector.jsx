/**
 * File: UrgencySelector.jsx
 * Purpose: Slider to select task urgency level
 */
import { useState } from 'react'
import { motion } from 'framer-motion'

export default function UrgencySelector({ onChange, initialValue = 3, disabled = false }) {
  const [urgency, setUrgency] = useState(initialValue)

  const handleChange = (newValue) => {
    setUrgency(newValue)
    // Don't call onChange immediately - only when user confirms with button
  }
  
  // Urgency level descriptions
  const descriptions = {
    1: 'Low priority',
    2: 'Somewhat important',
    3: 'Medium priority',
    4: 'Important',
    5: 'Urgent'
  }
  
  // Urgency level colors matching the design system
  const colors = {
    1: 'bg-[#f76f52]/20',
    2: 'bg-[#f76f52]/40',
    3: 'bg-[#f76f52]/60',
    4: 'bg-[#f76f52]/80',
    5: 'bg-[#f76f52]',
  }

  return (
    <div className="space-y-4 py-2">
      <div className="flex flex-col space-y-3">
        <div className="flex justify-between items-center">
          <div className="text-sm text-[#202020] dark:text-[#f2f0e3] font-medium">Urgency Level:</div>
          <div className="text-lg font-bold text-[#f76f52]">{urgency}.0</div>
        </div>
        <div className="flex items-center gap-3">
          <motion.button
            onClick={() => !disabled && urgency > 1 && handleChange(urgency - 1)}
            whileHover={{ scale: !disabled && urgency > 1 ? 1.1 : 1 }}
            whileTap={{ scale: !disabled && urgency > 1 ? 0.9 : 1 }}
            className="w-8 h-8 flex items-center justify-center text-[#202020] dark:text-[#f2f0e3] hover:bg-[#e8e6d9] dark:hover:bg-[#2a2a2a] disabled:opacity-30 disabled:cursor-not-allowed rounded-md border border-[#d8d6cf] dark:border-[#3a3a3a] transition-colors"
            disabled={disabled || urgency === 1}
          >
            <span className="text-lg font-bold">−</span>
          </motion.button>

          <div className="flex-grow mx-2">
            <div className="h-3 w-full bg-[#e8e6d9] dark:bg-[#2a2a2a] rounded-full overflow-hidden border border-[#d8d6cf] dark:border-[#3a3a3a]">
              <motion.div
                className={`h-full ${colors[urgency]} rounded-full`}
                initial={{ width: '60%' }}
                animate={{ width: `${urgency * 20}%` }}
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              />
            </div>
            <div className="flex justify-between text-xs text-[#3a3a3a] dark:text-[#d1cfbf] mt-1">
              <span>Low</span>
              <span>High</span>
            </div>
          </div>

          <motion.button
            onClick={() => !disabled && urgency < 5 && handleChange(urgency + 1)}
            whileHover={{ scale: !disabled && urgency < 5 ? 1.1 : 1 }}
            whileTap={{ scale: !disabled && urgency < 5 ? 0.9 : 1 }}
            className="w-8 h-8 flex items-center justify-center text-[#202020] dark:text-[#f2f0e3] hover:bg-[#e8e6d9] dark:hover:bg-[#2a2a2a] disabled:opacity-30 disabled:cursor-not-allowed rounded-md border border-[#d8d6cf] dark:border-[#3a3a3a] transition-colors"
            disabled={disabled || urgency === 5}
          >
            <span className="text-lg font-bold">+</span>
          </motion.button>
        </div>

        {/* Description */}
        <div className="text-center">
          <span className="text-sm text-[#3a3a3a] dark:text-[#d1cfbf] bg-[#e8e6d9] dark:bg-[#2a2a2a] px-3 py-1.5 rounded-md border border-[#d8d6cf] dark:border-[#3a3a3a]">
            {descriptions[urgency]}
          </span>
        </div>
      </div>

      <motion.button
        onClick={() => !disabled && onChange(urgency)}
        whileHover={{ scale: !disabled ? 1.02 : 1 }}
        whileTap={{ scale: !disabled ? 0.98 : 1 }}
        disabled={disabled}
        className={`w-full py-2.5 px-4 font-medium rounded-md text-center transition-colors border border-transparent ${
          disabled
            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
            : 'bg-[#f76f52] hover:bg-[#e55e41] text-[#f2f0e3]'
        }`}
      >
        {disabled ? 'Setting Urgency...' : `Set Urgency (${urgency}.0)`}
      </motion.button>
    </div>
  )
}
