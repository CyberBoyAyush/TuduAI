/**
 * File: ReminderService.jsx
 * Purpose: Background service to check for due reminders
 */
import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { getDueReminders, updateReminderStatus } from '../utils/reminders'

/**
 * Send an email notification for a reminder
 * @param {Object} reminder - The reminder object
 * @returns {Promise<boolean>} - Whether the email was sent successfully
 */
const sendReminderEmail = async (reminder) => {
  // In a real application, you would connect to a backend service to send emails
  console.log(`[MOCK EMAIL] Sending reminder to ${reminder.userEmail}:`, {
    subject: `Reminder: ${reminder.text}`,
    body: `
      Hello ${reminder.userName},
      
      This is a reminder for: ${reminder.text}
      
      View your task: [Link to task]
      
      Regards,
      The TuduAI Team
    `
  })
  
  return new Promise((resolve) => {
    // Simulate network request
    setTimeout(() => {
      // In a real app, you'd check for API response here
      resolve(true)
    }, 500)
  })
}

/**
 * Process all due reminders and send notifications
 */
const processDueReminders = async () => {
  const dueReminders = getDueReminders()
  
  // Process each due reminder
  for (const reminder of dueReminders) {
    try {
      // Send the email notification
      const emailSent = await sendReminderEmail(reminder)
      
      if (emailSent) {
        // Update the reminder status
        updateReminderStatus(reminder.id, 'sent')
      }
    } catch (error) {
      console.error(`Failed to process reminder ${reminder.id}:`, error)
    }
  }
}

/**
 * Component that periodically checks for due reminders in the background
 */
export default function ReminderService() {
  const { currentUser } = useAuth()
  const [lastCheck, setLastCheck] = useState(null)
  
  // Check for due reminders every minute
  useEffect(() => {
    if (!currentUser) return
    
    // Process reminders immediately on mount
    processDueReminders()
    setLastCheck(new Date())
    
    // Set up interval to check for due reminders
    const intervalId = setInterval(() => {
      processDueReminders()
      setLastCheck(new Date())
    }, 60000) // Check every minute
    
    return () => clearInterval(intervalId)
  }, [currentUser])
  
  // This is a background service, so it doesn't render anything
  return null
}
