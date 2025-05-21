/**
 * File: reminders.js
 * Purpose: Utility functions for managing reminders
 */
import { parseTaskInput } from '../lib/openai'
import reminderService from '../api/reminderService'

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
 * Save a reminder using Appwrite reminderService
 * @param {Object} reminderData - The reminder data to save
 * @param {Object} contextData - Context data (user, task, workspace)
 * @returns {Promise<string>} - The ID of the saved reminder
 */
export const saveReminder = async (reminderData, contextData) => {
  const { currentUser, taskId, workspaceId } = contextData
  
  if (!currentUser || !taskId) {
    throw new Error('Missing required context data')
  }
  
  try {
    // Create the reminder via Appwrite service
    const newReminder = await reminderService.createReminder(
      reminderData.text,
      reminderData.dueDate,
      taskId,
      contextData.taskTitle || 'Unknown task',
      workspaceId || 'default',
      currentUser.$id,
      currentUser.email,
      currentUser.name
    )
    
    return newReminder.$id
  } catch (error) {
    console.error('Error saving reminder:', error)
    throw error
  }
}

/**
 * Get all reminders for a user
 * @param {string} userId - The user ID to get reminders for
 * @param {string} workspaceId - Optional workspace ID filter
 * @returns {Promise<Array>} - Array of reminder objects
 */
export const getUserReminders = async (userId, workspaceId) => {
  if (!userId) return []
  
  try {
    const reminders = await reminderService.getReminders(userId)
    
    if (workspaceId) {
      return reminders.filter(reminder => reminder.workspaceId === workspaceId)
    }
    
    return reminders
  } catch (error) {
    console.error('Error getting user reminders:', error)
    return []
  }
}

/**
 * Get all reminders for a specific task
 * @param {string} taskId - The task ID to get reminders for
 * @returns {Promise<Array>} - Array of reminder objects
 */
export const getTaskReminders = async (taskId) => {
  if (!taskId) return []
  
  try {
    return await reminderService.getTaskReminders(taskId)
  } catch (error) {
    console.error('Error getting task reminders:', error)
    return []
  }
}

/**
 * Update a reminder's status
 * @param {string} reminderId - The ID of the reminder to update
 * @param {string} status - The new status ('pending', 'sent', 'cancelled')
 * @returns {Promise<boolean>} - Whether the update was successful
 */
export const updateReminderStatus = async (reminderId, status) => {
  if (!reminderId) return false
  
  try {
    await reminderService.updateReminderStatus(reminderId, status)
    return true
  } catch (error) {
    console.error('Error updating reminder status:', error)
    return false
  }
}

/**
 * Delete a reminder
 * @param {string} reminderId - The ID of the reminder to delete
 * @returns {Promise<boolean>} - Whether the deletion was successful
 */
export const deleteReminder = async (reminderId) => {
  if (!reminderId) return false
  
  try {
    await reminderService.deleteReminder(reminderId)
    return true
  } catch (error) {
    console.error('Error deleting reminder:', error)
    return false
  }
}

/**
 * Get all due reminders (reminders that are due now or in the past)
 * @param {string} userId - User ID to filter by (optional)
 * @returns {Promise<Array>} - Array of due reminder objects
 */
export const getDueReminders = async (userId) => {
  const now = new Date()
  
  try {
    // Get all reminders or just this user's reminders if userId is provided
    const allReminders = await reminderService.getReminders(userId)
    
    return allReminders.filter(reminder => {
      // Only consider pending reminders with a due date
      if (reminder.status !== 'pending' || !reminder.dueDate) {
        return false
      }
      
      const dueDate = new Date(reminder.dueDate)
      return dueDate <= now
    })
  } catch (error) {
    console.error('Error getting due reminders:', error)
    return []
  }
}
