/**
 * File: ReminderService.jsx
 * Purpose: Background service to check for due reminders
 */
import { useEffect, useState, useRef } from 'react'
import { useAuth } from '../context/AuthContext'
import { getDueReminders, updateReminderStatus } from '../utils/reminders'
import { sendReminderEmail } from '../lib/zohoMailer'

/**
 * Send an email notification for a reminder
 * @param {Object} reminder - The reminder object
 * @returns {Promise<boolean>} - Whether the email was sent successfully
 */
const sendEmailNotification = async (reminder) => {
  try {
    await sendReminderEmail({
      userEmail: reminder.userEmail,
      reminderTitle: reminder.taskTitle,
      reminderBody: reminder.text,
      dueDate: reminder.dueDate,
      userName: reminder.userName
    });
    return true;
  } catch (error) {
    console.error('Failed to send reminder email:', error);
    return false;
  }
}

/**
 * Process all due reminders and send notifications
 */
const processDueReminders = async (userId) => {
  try {
    const dueReminders = await getDueReminders(userId)
    
    // Process each due reminder
    const processPromises = dueReminders.map(async (reminder) => {
      try {
        // Send the email notification
        const emailSent = await sendEmailNotification(reminder)
        
        if (emailSent) {
          // Update the reminder status
          await updateReminderStatus(reminder.$id, 'done')
        }
      } catch (error) {
        console.error(`Failed to process reminder ${reminder.$id}:`, error)
      }
    });
    
    // Wait for all reminders to be processed
    await Promise.all(processPromises);
    
    return dueReminders.length;
  } catch (error) {
    console.error("Error processing due reminders:", error)
    return 0;
  }
}

/**
 * Component that periodically checks for due reminders in the background
 */
export default function ReminderService() {
  const { currentUser } = useAuth()
  const [lastCheck, setLastCheck] = useState(null)
  const [isChecking, setIsChecking] = useState(false)
  const checkInterval = useRef(null)
  
  // Check for due reminders every minute
  useEffect(() => {
    // Only run if user is logged in
    if (!currentUser) return
    
    // Cleanup any existing interval first
    if (checkInterval.current) {
      clearInterval(checkInterval.current)
    }
    
    // Process reminders immediately on mount, but only if not already checking
    const checkReminders = async () => {
      // Prevent concurrent checks
      if (isChecking) return
      
      setIsChecking(true)
      try {
        await processDueReminders(currentUser.$id)
        setLastCheck(new Date())
      } finally {
        setIsChecking(false)
      }
    }
    
    // Run initial check
    checkReminders()
    
    // Set up interval to check for due reminders
    checkInterval.current = setInterval(checkReminders, 60000) // Check every minute
    
    return () => {
      if (checkInterval.current) {
        clearInterval(checkInterval.current)
      }
    }
  }, [currentUser, isChecking])
  
  // This is a background service, so it doesn't render anything
  return null
}
