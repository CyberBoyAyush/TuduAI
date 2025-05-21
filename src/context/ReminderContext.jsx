/**
 * File: ReminderContext.jsx
 * Purpose: Manages reminders with Appwrite database
 */
import { createContext, useState, useContext, useEffect } from 'react';
import { useAuth } from './AuthContext';
import reminderService from '../api/reminderService';

const ReminderContext = createContext();

export function useReminder() {
  return useContext(ReminderContext);
}

export function ReminderProvider({ children }) {
  const { currentUser } = useAuth();
  const [reminders, setReminders] = useState([]);
  const [loading, setLoading] = useState(true);

  // Load reminders when user changes
  useEffect(() => {
    const fetchReminders = async () => {
      if (!currentUser) {
        setReminders([]);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const fetchedReminders = await reminderService.getReminders(currentUser.$id);
        setReminders(fetchedReminders);
      } catch (error) {
        console.error("Error fetching reminders:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchReminders();
  }, [currentUser]);

  // Add a new reminder
  const addReminder = async (text, dueDate, taskId, taskTitle, workspaceId) => {
    if (!currentUser) return null;

    try {
      const newReminder = await reminderService.createReminder(
        text,
        dueDate,
        taskId,
        taskTitle,
        workspaceId,
        currentUser.$id,
        currentUser.email,
        currentUser.name
      );
      
      setReminders(prevReminders => [...prevReminders, newReminder]);
      return newReminder;
    } catch (error) {
      console.error("Error adding reminder:", error);
      throw error;
    }
  };

  // Update a reminder's status
  const updateReminderStatus = async (id, status) => {
    try {
      const updatedReminder = await reminderService.updateReminderStatus(id, status);
      
      setReminders(prevReminders => 
        prevReminders.map(reminder => 
          reminder.$id === id ? updatedReminder : reminder
        )
      );
      
      return updatedReminder;
    } catch (error) {
      console.error("Error updating reminder status:", error);
      throw error;
    }
  };

  // Delete a reminder
  const deleteReminder = async (id) => {
    try {
      await reminderService.deleteReminder(id);
      setReminders(prevReminders => prevReminders.filter(reminder => reminder.$id !== id));
    } catch (error) {
      console.error("Error deleting reminder:", error);
      throw error;
    }
  };

  // Get reminders for a specific task
  const getTaskReminders = (taskId) => {
    return reminders.filter(reminder => reminder.taskId === taskId);
  };

  // Delete all reminders for a task
  const deleteTaskReminders = async (taskId) => {
    try {
      await reminderService.deleteTaskReminders(taskId);
      setReminders(prevReminders => prevReminders.filter(reminder => reminder.taskId !== taskId));
    } catch (error) {
      console.error("Error deleting task reminders:", error);
      throw error;
    }
  };

  const value = {
    reminders,
    loading,
    addReminder,
    updateReminderStatus,
    deleteReminder,
    getTaskReminders,
    deleteTaskReminders
  };

  return (
    <ReminderContext.Provider value={value}>
      {children}
    </ReminderContext.Provider>
  );
} 