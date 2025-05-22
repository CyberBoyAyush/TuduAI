/**
 * File: TaskList.jsx
 * Purpose: Displays tasks in 3 columns based on due date
 */
import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { isToday, isPast, isNext7Days, isUpcoming } from '../utils/date'
import TaskCard from './TaskCard'

export default function TaskList({ tasks, onUpdate, onDelete, onAddComment, onDeleteComment, showCompletedTasks }) {
  const [expandedTaskId, setExpandedTaskId] = useState(null)
  
  // Filter tasks based on showCompletedTasks toggle
  const filteredTasks = useMemo(() => {
    if (!tasks) return []
    return showCompletedTasks ? tasks : tasks.filter(task => !task.completed)
  }, [tasks, showCompletedTasks])
  
  // Group tasks by due date category
  const groupedTasks = useMemo(() => {
    if (!filteredTasks.length) return { today: [], upcoming: [], future: [] }
    
    return filteredTasks.reduce(
      (acc, task) => {
        if (!task.dueDate) {
          acc.today.push(task)
        } else if (isPast(task.dueDate) || isToday(task.dueDate)) {
          acc.today.push(task)
        } else if (isNext7Days(task.dueDate)) {
          acc.upcoming.push(task)
        } else {
          acc.future.push(task)
        }
        
        return acc
      },
      { today: [], upcoming: [], future: [] }
    )
  }, [filteredTasks])
  
  // Sort tasks by urgency and due date
  const sortTasks = (taskList) => {
    return [...taskList].sort((a, b) => {
      // First sort by completion status
      if (a.completed !== b.completed) {
        return a.completed ? 1 : -1
      }
      
      // Then by due date if both have one
      if (a.dueDate && b.dueDate) {
        return new Date(a.dueDate) - new Date(b.dueDate)
      }
      
      // One or both don't have due dates, sort by urgency (higher first)
      return (b.urgency || 3) - (a.urgency || 3)
    })
  }
  
  const handleTaskClick = (taskId) => {
    setExpandedTaskId(expandedTaskId === taskId ? null : taskId)
  }
  
  const columnVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { 
        duration: 0.5,
        staggerChildren: 0.1
      } 
    }
  }
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 font-sans">
      {/* Today & Overdue column */}
      <motion.div 
        className="space-y-4"
        variants={columnVariants}
        initial="hidden"
        animate="visible"
      >
        <div className="border-b pb-2 border-primary-300">
          <h2 className="font-bold text-lg text-primary-700">
            Today & Overdue {groupedTasks.today.length > 0 && `(${groupedTasks.today.length})`}
          </h2>
        </div>
        
        <AnimatePresence>
          {sortTasks(groupedTasks.today).map((task) => (
            <TaskCard
              key={task.$id}
              task={task}
              isExpanded={expandedTaskId === task.$id}
              onClick={() => handleTaskClick(task.$id)}
              onUpdate={onUpdate}
              onDelete={onDelete}
              onAddComment={onAddComment}
              onDeleteComment={onDeleteComment}
            />
          ))}
          
          {groupedTasks.today.length === 0 && (
            <motion.div 
              className="bg-primary-50 rounded-md p-4 text-center text-primary-800 border border-primary-300"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              No tasks for today
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
      
      {/* Next 7 Days column */}
      <motion.div 
        className="space-y-4"
        variants={columnVariants}
        initial="hidden"
        animate="visible"
      >
        <div className="border-b pb-2 border-primary-300">
          <h2 className="font-bold text-lg text-primary-700">
            Next 7 Days {groupedTasks.upcoming.length > 0 && `(${groupedTasks.upcoming.length})`}
          </h2>
        </div>
        
        <AnimatePresence>
          {sortTasks(groupedTasks.upcoming).map((task) => (
            <TaskCard
              key={task.$id}
              task={task}
              isExpanded={expandedTaskId === task.$id}
              onClick={() => handleTaskClick(task.$id)}
              onUpdate={onUpdate}
              onDelete={onDelete}
              onAddComment={onAddComment}
              onDeleteComment={onDeleteComment}
            />
          ))}
          
          {groupedTasks.upcoming.length === 0 && (
            <motion.div 
              className="bg-primary-50 rounded-md p-4 text-center text-primary-800 border border-primary-300"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              No upcoming tasks
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
      
      {/* Upcoming column */}
      <motion.div 
        className="space-y-4"
        variants={columnVariants}
        initial="hidden"
        animate="visible"
      >
        <div className="border-b pb-2 border-primary-300">
          <h2 className="font-bold text-lg text-primary-700">
            Upcoming {groupedTasks.future.length > 0 && `(${groupedTasks.future.length})`}
          </h2>
        </div>
        
        <AnimatePresence>
          {sortTasks(groupedTasks.future).map((task) => (
            <TaskCard
              key={task.$id}
              task={task}
              isExpanded={expandedTaskId === task.$id}
              onClick={() => handleTaskClick(task.$id)}
              onUpdate={onUpdate}
              onDelete={onDelete}
              onAddComment={onAddComment}
              onDeleteComment={onDeleteComment}
            />
          ))}
          
          {groupedTasks.future.length === 0 && (
            <motion.div 
              className="bg-primary-50 rounded-md p-4 text-center text-primary-800 border border-primary-300"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              No future tasks
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  )
}
