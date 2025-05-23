/**
 * File: TaskList.jsx
 * Purpose: Displays tasks in 3 columns based on due date
 */
import { useState, useMemo, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { isToday, isPast, isNext7Days, isUpcoming } from '../utils/date'
import TaskCard from './TaskCard'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { useDroppable } from '@dnd-kit/core'
import React from 'react'

// Constants for column IDs
const COLUMN_IDS = {
  TODAY: 'today',
  UPCOMING: 'upcoming',
  FUTURE: 'future'
};

// Animation variants for columns
const columnVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { 
      duration: 0.3,
      staggerChildren: 0.05
    } 
  }
};

// Memoized TaskColumn component to prevent unnecessary re-renders
const MemoizedTaskColumn = React.memo(function TaskColumn({ title, tasks, containerId, onTaskClick, expandedTaskId, handlers, isActiveDroppable }) {
  const { onUpdate, onDelete, onAddComment, onDeleteComment } = handlers;
  const { isOver, setNodeRef } = useDroppable({ 
    id: containerId,
    data: {
      type: 'column',
      accepts: ['task']
    }
  });

  const taskIds = useMemo(() => tasks.map(task => task.$id), [tasks]);
  
  // Determine if this column is the active drop target
  const isActive = isOver || isActiveDroppable === containerId;
  
  return (
    <div className="space-y-4">
      <div className={`border-b pb-2 border-primary-300 ${isActive ? 'bg-primary-100 rounded-t-md' : ''}`}>
        <h2 className="font-bold text-lg text-primary-700">
          {title} {tasks.length > 0 && `(${tasks.length})`}
        </h2>
      </div>
      
      <div 
        ref={setNodeRef} 
        className={`min-h-[200px] transition-colors rounded-md ${
          isActive ? 'bg-primary-50/50 p-2 border-2 border-dashed border-primary-300' : 'p-0'
        }`}
        style={{ 
          willChange: 'contents',
          transform: 'translateZ(0)',
          backfaceVisibility: 'hidden'
        }}
      >
        <SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
          <div className="relative" style={{ willChange: 'transform' }}>
            {tasks.map((task) => (
              <TaskCard
                key={task.$id}
                task={task}
                isExpanded={expandedTaskId === task.$id}
                onClick={() => onTaskClick(task.$id)}
                onUpdate={onUpdate}
                onDelete={onDelete}
                onAddComment={onAddComment}
                onDeleteComment={onDeleteComment}
              />
            ))}
            
            {tasks.length === 0 && (
              <div className="bg-primary-50 rounded-md p-4 text-center text-primary-800 border border-primary-300">
                <span className="block mb-1">No tasks</span>
                <span className="text-xs opacity-70">Drag tasks here</span>
              </div>
            )}
          </div>
        </SortableContext>
      </div>
    </div>
  );
});

export default function TaskList({ 
  tasks, 
  onUpdate, 
  onDelete, 
  onAddComment, 
  onDeleteComment,
  showCompletedTasks,
  activeDroppableId,
  taskOrders,
  onTaskReorder
}) {
  const [expandedTaskId, setExpandedTaskId] = useState(null)
  
  // Filter tasks based on showCompletedTasks toggle
  const filteredTasks = useMemo(() => {
    if (!tasks) return []
    return showCompletedTasks ? tasks : tasks.filter(task => !task.completed)
  }, [tasks, showCompletedTasks])
  
  // Group tasks by due date category
  const groupedTasks = useMemo(() => {
    if (!filteredTasks.length) return { today: [], upcoming: [], future: [] }
    
    const groups = filteredTasks.reduce(
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
    );
    
    // Apply custom ordering based on taskOrders from props
    Object.keys(groups).forEach(columnId => {
      const columnOrder = taskOrders[columnId];
      if (columnOrder && columnOrder.length > 0) {
        // Create a map for faster lookup
        const taskMap = new Map(groups[columnId].map(task => [task.$id, task]));
        
        // First, add tasks in the order they appear in taskOrder (if they exist)
        const orderedTasks = columnOrder
          .map(id => taskMap.get(id))
          .filter(Boolean);
        
        // Then add any new tasks that aren't in the order yet
        const remainingTasks = groups[columnId].filter(task => !columnOrder.includes(task.$id));
        
        groups[columnId] = [...orderedTasks, ...remainingTasks];
      }
    });
    
    return groups;
  }, [filteredTasks, taskOrders]);
  
  // Update taskOrders when tasks change
  useEffect(() => {
    if (tasks && onTaskReorder) {
      // Use the actual column ID values directly
      const columnMappings = {
        [COLUMN_IDS.TODAY]: 'today',
        [COLUMN_IDS.UPCOMING]: 'upcoming',
        [COLUMN_IDS.FUTURE]: 'future'
      };
      
      Object.values(COLUMN_IDS).forEach(columnId => {
        const existingOrder = taskOrders[columnId] || [];
        const currentTasks = groupedTasks[columnId].map(task => task.$id);
        
        // Check if we need to update the order
        const needsUpdate = 
          // If there are tasks but no order
          (currentTasks.length > 0 && existingOrder.length === 0) ||
          // Or if there are tasks not in the existing order
          currentTasks.some(id => !existingOrder.includes(id)) ||
          // Or if there are ids in the order that no longer exist in tasks
          existingOrder.some(id => !currentTasks.includes(id));
        
        if (needsUpdate) {
          // First, keep ordered tasks that still exist
          const preservedOrder = existingOrder.filter(id => currentTasks.includes(id));
          
          // Then add new tasks that aren't already ordered
          const newTasks = currentTasks.filter(id => !existingOrder.includes(id));
          
          // Update the order
          onTaskReorder(columnId, [...preservedOrder, ...newTasks]);
        }
      });
    }
  }, [tasks, groupedTasks, taskOrders, onTaskReorder]);
  
  // Sort tasks by urgency and due date
  const sortTasks = (taskList) => {
    // If we have a custom order, we don't need additional sorting
    return taskList;
  }
  
  const handleTaskClick = (taskId) => {
    setExpandedTaskId(expandedTaskId === taskId ? null : taskId)
  }
  
  const columnHandlers = {
    onUpdate,
    onDelete,
    onAddComment,
    onDeleteComment
  };
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 font-sans">
      {/* Today & Overdue column */}
      <MemoizedTaskColumn 
        title="Today & Overdue"
        tasks={sortTasks(groupedTasks.today)}
        containerId={COLUMN_IDS.TODAY}
        onTaskClick={handleTaskClick}
        expandedTaskId={expandedTaskId}
        handlers={columnHandlers}
        isActiveDroppable={activeDroppableId}
      />
      
      {/* Next 7 Days column */}
      <MemoizedTaskColumn 
        title="Next 7 Days"
        tasks={sortTasks(groupedTasks.upcoming)}
        containerId={COLUMN_IDS.UPCOMING}
        onTaskClick={handleTaskClick}
        expandedTaskId={expandedTaskId}
        handlers={columnHandlers}
        isActiveDroppable={activeDroppableId}
      />
      
      {/* Upcoming column */}
      <MemoizedTaskColumn 
        title="Upcoming"
        tasks={sortTasks(groupedTasks.future)}
        containerId={COLUMN_IDS.FUTURE}
        onTaskClick={handleTaskClick}
        expandedTaskId={expandedTaskId}
        handlers={columnHandlers}
        isActiveDroppable={activeDroppableId}
      />
    </div>
  )
}

// Export column IDs for use in Todo.jsx
export { COLUMN_IDS };
