/**
 * File: TaskContext.jsx
 * Purpose: Manages tasks with Appwrite database
 */
import { createContext, useState, useContext, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { useWorkspace } from './WorkspaceContext';
import taskService from '../api/taskService';

const TaskContext = createContext();

export function useTask() {
  return useContext(TaskContext);
}

export function TaskProvider({ children }) {
  const { currentUser } = useAuth();
  const { activeWorkspaceId } = useWorkspace();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  // Load tasks when user or workspace changes
  useEffect(() => {
    const fetchTasks = async () => {
      if (!currentUser || !activeWorkspaceId) {
        setTasks([]);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const fetchedTasks = await taskService.getTasks(currentUser.$id, activeWorkspaceId);
        setTasks(fetchedTasks);
      } catch (error) {
        console.error("Error fetching tasks:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchTasks();
  }, [currentUser, activeWorkspaceId]);

  // Add a new task
  const addTask = async (title, dueDate, urgency) => {
    try {
      const newTask = await taskService.createTask(
        title,
        dueDate,
        urgency,
        activeWorkspaceId,
        currentUser.$id
      );
      
      setTasks(prevTasks => [...prevTasks, newTask]);
      return newTask;
    } catch (error) {
      console.error("Error adding task:", error);
      throw error;
    }
  };

  // Update a task
  const updateTask = async (id, updates) => {
    try {
      const updatedTask = await taskService.updateTask(id, updates);
      
      setTasks(prevTasks => 
        prevTasks.map(task => 
          task.$id === id ? updatedTask : task
        )
      );
      
      return updatedTask;
    } catch (error) {
      console.error("Error updating task:", error);
      throw error;
    }
  };

  // Delete a task
  const deleteTask = async (id) => {
    try {
      await taskService.deleteTask(id);
      setTasks(prevTasks => prevTasks.filter(task => task.$id !== id));
    } catch (error) {
      console.error("Error deleting task:", error);
      throw error;
    }
  };

  // Toggle a task's completion status
  const toggleTaskCompletion = async (id) => {
    try {
      const task = tasks.find(t => t.$id === id);
      if (!task) return;

      const updatedTask = await taskService.toggleTaskCompletion(id, task.completed);
      
      setTasks(prevTasks => 
        prevTasks.map(t => 
          t.$id === id ? updatedTask : t
        )
      );
    } catch (error) {
      console.error("Error toggling task completion:", error);
      throw error;
    }
  };

  // Add a comment to a task
  const addComment = async (taskId, comment) => {
    try {
      const updatedTask = await taskService.addComment(taskId, comment);
      
      setTasks(prevTasks => 
        prevTasks.map(task => 
          task.$id === taskId ? updatedTask : task
        )
      );
      
      return updatedTask;
    } catch (error) {
      console.error("Error adding comment to task:", error);
      throw error;
    }
  };

  const value = {
    tasks,
    loading,
    addTask,
    updateTask,
    deleteTask,
    toggleTaskCompletion,
    addComment
  };

  return (
    <TaskContext.Provider value={value}>
      {children}
    </TaskContext.Provider>
  );
} 