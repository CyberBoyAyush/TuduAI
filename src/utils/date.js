/**
 * File: date.js
 * Purpose: Date utility functions for task management
 */

/**
 * Check if a date is today
 * @param {string|Date} date - Date to check
 * @returns {boolean} True if date is today
 */
export const isToday = (date) => {
  const today = new Date()
  const checkDate = new Date(date)
  
  return (
    checkDate.getDate() === today.getDate() &&
    checkDate.getMonth() === today.getMonth() &&
    checkDate.getFullYear() === today.getFullYear()
  )
}

/**
 * Check if a date is in the next 7 days (not including today)
 * @param {string|Date} date - Date to check
 * @returns {boolean} True if date is in the next 7 days
 */
export const isNext7Days = (date) => {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  
  const checkDate = new Date(date)
  checkDate.setHours(0, 0, 0, 0)
  
  const future = new Date(today)
  future.setDate(today.getDate() + 7)
  
  return checkDate > today && checkDate <= future
}

/**
 * Check if a date is in the future beyond the next 7 days
 * @param {string|Date} date - Date to check
 * @returns {boolean} True if date is upcoming
 */
export const isUpcoming = (date) => {
  const checkDate = new Date(date)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  
  const future = new Date(today)
  future.setDate(today.getDate() + 7)
  future.setHours(23, 59, 59, 999)
  
  return checkDate > future
}

/**
 * Check if a date is in the past
 * @param {string|Date} date - Date to check
 * @returns {boolean} True if date is in the past
 */
export const isPast = (date) => {
  const now = new Date()
  const checkDate = new Date(date)
  
  return checkDate < now
}

/**
 * Format a date for display
 * @param {string|Date} date - Date to format
 * @returns {string} Formatted date string like "Today at 7:00 PM"
 */
export const formatDate = (date) => {
  if (!date) return 'No due date'
  
  const dateObj = new Date(date)
  const now = new Date()
  const tomorrow = new Date(now)
  tomorrow.setDate(tomorrow.getDate() + 1)
  
  // Format time
  const timeString = dateObj.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  })
  
  // Check if date is today, tomorrow or other
  if (isToday(dateObj)) {
    return `Today at ${timeString}`
  } else if (
    dateObj.getDate() === tomorrow.getDate() &&
    dateObj.getMonth() === tomorrow.getMonth() &&
    dateObj.getFullYear() === tomorrow.getFullYear()
  ) {
    return `Tomorrow at ${timeString}`
  } else {
    // Format for other dates
    const options = { weekday: 'short', month: 'short', day: 'numeric' }
    const dateString = dateObj.toLocaleDateString('en-US', options)
    return `${dateString} at ${timeString}`
  }
}

/**
 * Get urgency color class based on level and theme
 * @param {number} level - Urgency level (1-5)
 * @returns {string} Tailwind color class
 */
export const getUrgencyColor = (level) => {
  switch (level) {
    case 1:
      return 'bg-violet-200 dark:bg-violet-900/30'
    case 2:
      return 'bg-violet-300 dark:bg-violet-800/40'
    case 3:
      return 'bg-violet-400 dark:bg-violet-700/50'
    case 4:
      return 'bg-violet-500 dark:bg-violet-600/60'
    case 5:
      return 'bg-violet-600 dark:bg-violet-500/70'
    default:
      return 'bg-gray-200 dark:bg-gray-700/30'
  }
}

/**
 * Get due date status color
 * @param {string|Date} date - Due date
 * @returns {string} Tailwind color class
 */
export const getDueDateColor = (date) => {
  if (!date) return 'text-gray-400 dark:text-gray-500'
  
  const now = new Date()
  const dueDate = new Date(date)
  
  if (dueDate < now) {
    return 'text-red-500 dark:text-red-400'
  } else if (isToday(dueDate)) {
    return 'text-yellow-500 dark:text-yellow-400'
  } else {
    return 'text-green-500 dark:text-green-400'
  }
}
