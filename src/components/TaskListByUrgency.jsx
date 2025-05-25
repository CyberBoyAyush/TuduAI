/**
 * File: TaskListByUrgency.jsx
 * Purpose: Displays tasks grouped by urgency level (Low, Medium, High)
 */
import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import TaskCard from './TaskCard'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { useDroppable } from '@dnd-kit/core'
import React from 'react'
import { 
  FlagIcon,
  ExclamationTriangleIcon,
  ExclamationCircleIcon 
} from '@heroicons/react/24/outline'

// Constants for urgency column IDs
const URGENCY_COLUMN_IDS = {
  HIGH: 'high-urgency',
  MEDIUM: 'medium-urgency', 
  LOW: 'low-urgency'
};

// Memoized UrgencyColumn component
const MemoizedUrgencyColumn = React.memo(function UrgencyColumn({ 
  title, 
  tasks, 
  containerId, 
  onTaskClick, 
  expandedTaskId, 
  handlers, 
  isActiveDroppable,
  urgencyRange,
  icon: Icon,
  colorClasses
}) {
  const { onUpdate, onDelete, onAddComment, onDeleteComment } = handlers;
  const { isOver, setNodeRef } = useDroppable({ 
    id: containerId,
    data: {
      type: 'urgency-column',
      accepts: ['task'],
      urgencyRange
    }
  });

  const taskIds = useMemo(() => tasks.map(task => task.$id), [tasks]);
  const isActive = isOver || isActiveDroppable === containerId;
  
  return (
    <div className="space-y-4">
      <div className={`border-b pb-2 border-primary-300 ${isActive ? 'bg-primary-100 rounded-t-md' : ''}`}>
        <h2 className={`font-bold text-lg text-primary-700 flex items-center ${colorClasses.text}`}>
          <Icon className={`w-5 h-5 mr-2 ${colorClasses.icon}`} />
          {title} {tasks.length > 0 && `(${tasks.length})`}
        </h2>
      </div>
      
      <div 
        ref={setNodeRef} 
        className={`min-h-[200px] transition-colors rounded-md ${
          isActive ? 'bg-primary-50/50 p-2 border-2 border-dashed border-primary-300' : 'p-0'
        }`}
      >
        <SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
          <div className="relative">
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
                <span className="block mb-1">No {title.toLowerCase()} tasks</span>
                <span className="text-xs opacity-70">Drag tasks here</span>
              </div>
            )}
          </div>
        </SortableContext>
      </div>
    </div>
  );
});

export default function TaskListByUrgency({ 
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
  
  // Group tasks by urgency level
  const groupedTasks = useMemo(() => {
    if (!filteredTasks.length) return { high: [], medium: [], low: [] }
    
    const groups = filteredTasks.reduce(
      (acc, task) => {
        const urgency = task.urgency || 3; // Default to medium
        
        if (urgency >= 4) {
          acc.high.push(task)
        } else if (urgency >= 2.5) {
          acc.medium.push(task)
        } else {
          acc.low.push(task)
        }
        
        return acc
      },
      { high: [], medium: [], low: [] }
    );
    
    // Sort within each group by urgency (descending) then by due date
    Object.keys(groups).forEach(key => {
      groups[key].sort((a, b) => {
        // First sort by urgency (higher first)
        if (b.urgency !== a.urgency) {
          return (b.urgency || 3) - (a.urgency || 3);
        }
        // Then by due date (earlier first)
        if (a.dueDate && b.dueDate) {
          return new Date(a.dueDate) - new Date(b.dueDate);
        }
        if (a.dueDate) return -1;
        if (b.dueDate) return 1;
        return 0;
      });
    });
    
    return groups;
  }, [filteredTasks]);
  
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
      {/* High Urgency column */}
      <MemoizedUrgencyColumn 
        title="High Priority"
        tasks={groupedTasks.high}
        containerId={URGENCY_COLUMN_IDS.HIGH}
        onTaskClick={handleTaskClick}
        expandedTaskId={expandedTaskId}
        handlers={columnHandlers}
        isActiveDroppable={activeDroppableId}
        urgencyRange={[4, 5]}
        icon={ExclamationCircleIcon}
        colorClasses={{
          text: 'text-red-700',
          icon: 'text-red-500'
        }}
      />
      
      {/* Medium Urgency column */}
      <MemoizedUrgencyColumn 
        title="Medium Priority"
        tasks={groupedTasks.medium}
        containerId={URGENCY_COLUMN_IDS.MEDIUM}
        onTaskClick={handleTaskClick}
        expandedTaskId={expandedTaskId}
        handlers={columnHandlers}
        isActiveDroppable={activeDroppableId}
        urgencyRange={[2.5, 3.9]}
        icon={ExclamationTriangleIcon}
        colorClasses={{
          text: 'text-yellow-700',
          icon: 'text-yellow-500'
        }}
      />
      
      {/* Low Urgency column */}
      <MemoizedUrgencyColumn 
        title="Low Priority"
        tasks={groupedTasks.low}
        containerId={URGENCY_COLUMN_IDS.LOW}
        onTaskClick={handleTaskClick}
        expandedTaskId={expandedTaskId}
        handlers={columnHandlers}
        isActiveDroppable={activeDroppableId}
        urgencyRange={[1, 2.4]}
        icon={FlagIcon}
        colorClasses={{
          text: 'text-green-700',
          icon: 'text-green-500'
        }}
      />
    </div>
  )
}

// Export column IDs for use in Todo.jsx
export { URGENCY_COLUMN_IDS };
