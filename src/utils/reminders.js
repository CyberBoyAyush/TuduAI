/**
 * File: reminders.js
 * Purpose: Utility functions for managing reminders
 */
import { parseTaskInput } from '../lib/openai'
import { v4 as uuidv4 } from 'uuid'

/**
 * Parse a reminder command and extract the reminder text and time
 * @param {string} text - The reminder text (e.g., "!remindme call John tomorrow at 5pm")
 * @returns {Promise<Object>} - The parsed reminder with time and text
 */
export const parseReminder = async (text) => {
  // Remove the command part
  const commandRegex = /^!(?:remindme|rmd)\s+/i
  const reminderText = text.replace(commandRegex, '').trim()
  
  if (!reminderText) {
    return {
      text: 'Reminder for this task',
      dueDate: null,
      error: 'No reminder text provided'
    }
  }
  
  try {
    // Use the existing AI parser to parse the date from the reminder text
    const parsedData = await parseTaskInput(`Reminder ${reminderText}`)
    
    // Extract just the title without the "Reminder" prefix
    let title = parsedData.title
    if (title && title.startsWith('Reminder')) {
      title = title.replace(/^Reminder\s+/i, '')
    }
    
    return {
      text: title || reminderText,
      dueDate: parsedData.dueDate,
      error: !parsedData.dueDate ? 'Could not determine reminder time' : null
    }
  } catch (error) {
    console.error('Error parsing reminder:', error)
    return {
      text: reminderText,
      dueDate: null,
      error: 'Failed to parse reminder time'
    }
  }
}

/**
 * Save a reminder to localStorage
 * @param {Object} reminderData - The reminder data to save
 * @param {Object} contextData - Context data (user, task, workspace)
 * @returns {string} - The ID of the saved reminder
 */
export const saveReminder = (reminderData, contextData) => {
  const { currentUser, taskId, workspaceId } = contextData
  
  if (!currentUser || !taskId) {
    throw new Error('Missing required context data')
  }
  
  // Generate a unique ID for the reminder
  const reminderId = uuidv4()
  
  // Create the reminder object
  const reminder = {
    id: reminderId,
    text: reminderData.text,
    dueDate: reminderData.dueDate,
    taskId,
    taskTitle: contextData.taskTitle || 'Unknown task',
    workspaceId: workspaceId || 'default',
    userId: currentUser.id,
    userEmail: currentUser.email,
    userName: currentUser.name,
    createdAt: new Date().toISOString(),
    status: 'pending'
  }
  
  // Get existing reminders
  const existingReminders = JSON.parse(localStorage.getItem('reminders') || '[]')
  
  // Add the new reminder
  existingReminders.push(reminder)
  
  // Save back to localStorage
  localStorage.setItem('reminders', JSON.stringify(existingReminders))
  
  return reminderId
}

/**
 * Get all reminders for a user
 * @param {string} userId - The user ID to get reminders for
 * @param {string} workspaceId - Optional workspace ID filter
 * @returns {Array} - Array of reminder objects
 */
export const getUserReminders = (userId, workspaceId) => {
  if (!userId) return []
  
  const reminders = JSON.parse(localStorage.getItem('reminders') || '[]')
  
  return reminders.filter(reminder => {
    // Filter by user ID
    const userMatch = reminder.userId === userId
    
    // If workspace ID is provided, filter by that too
    const workspaceMatch = !workspaceId || reminder.workspaceId === workspaceId
    
    return userMatch && workspaceMatch
  })
}

/**
 * Get all reminders for a specific task
 * @param {string} taskId - The task ID to get reminders for
 * @returns {Array} - Array of reminder objects
 */
export const getTaskReminders = (taskId) => {
  if (!taskId) return []
  
  const reminders = JSON.parse(localStorage.getItem('reminders') || '[]')
  
  return reminders.filter(reminder => reminder.taskId === taskId)
}

/**
 * Update a reminder's status
 * @param {string} reminderId - The ID of the reminder to update
 * @param {string} status - The new status ('pending', 'sent', 'cancelled')
 * @returns {boolean} - Whether the update was successful
 */
export const updateReminderStatus = (reminderId, status) => {
  if (!reminderId) return false
  
  const reminders = JSON.parse(localStorage.getItem('reminders') || '[]')
  const updatedReminders = reminders.map(reminder => {
    if (reminder.id === reminderId) {
      return { ...reminder, status }
    }
    return reminder
  })
  
  localStorage.setItem('reminders', JSON.stringify(updatedReminders))
  return true
}

/**
 * Delete a reminder
 * @param {string} reminderId - The ID of the reminder to delete
 * @returns {boolean} - Whether the deletion was successful
 */
export const deleteReminder = (reminderId) => {
  if (!reminderId) return false
  
  const reminders = JSON.parse(localStorage.getItem('reminders') || '[]')
  const filteredReminders = reminders.filter(reminder => reminder.id !== reminderId)
  
  if (filteredReminders.length !== reminders.length) {
    localStorage.setItem('reminders', JSON.stringify(filteredReminders))
    return true
  }
  
  return false
}

/**
 * Get all due reminders (reminders that are due now or in the past)
 * @returns {Array} - Array of due reminder objects
 */
export const getDueReminders = () => {
  const now = new Date()
  const reminders = JSON.parse(localStorage.getItem('reminders') || '[]')
  
  return reminders.filter(reminder => {
    // Only consider pending reminders with a due date
    if (reminder.status !== 'pending' || !reminder.dueDate) {
      return false
    }
    
    const dueDate = new Date(reminder.dueDate)
    return dueDate <= now
  })
}
