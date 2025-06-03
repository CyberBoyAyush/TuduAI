/**
 * File: Todo.jsx
 * Purpose: Main dashboard with all task logic, UI, and columns
 */
import { useState, useEffect, useCallback } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuth } from '../context/AuthContext'
import { useWorkspace } from '../context/WorkspaceContext'
import useTasks from '../hooks/useTasks'
import TaskInput from '../components/TaskInput'
import TaskList, { COLUMN_IDS } from '../components/TaskList'
import TaskListByUrgency, { URGENCY_COLUMN_IDS } from '../components/TaskListByUrgency'
import { PlusIcon, ArrowPathIcon, CalendarDaysIcon, FlagIcon, ChartBarIcon } from '@heroicons/react/24/outline'
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  TouchSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  closestCenter,
  pointerWithin,
  getFirstCollision,
  rectIntersection
} from '@dnd-kit/core'
import {
  arrayMove,
  sortableKeyboardCoordinates
} from '@dnd-kit/sortable'
import { restrictToWindowEdges } from '@dnd-kit/modifiers'
import TaskCard from '../components/TaskCard'

export default function Todo({ showCompletedTasks }) {
  const { currentUser, loading: authLoading } = useAuth()
  const { resetWorkspaces } = useWorkspace()
  const {
    tasks,
    loading: tasksLoading,
    refreshing,
    refreshTasks,
    addTask,
    updateTask,
    deleteTask,
    addComment,
    deleteComment,
    toggleTaskCompletion
  } = useTasks()

  const [isAddingTask, setIsAddingTask] = useState(false)
  const [addingTaskStatus, setAddingTaskStatus] = useState(null)
  const [activeDragId, setActiveDragId] = useState(null)
  const [activeDroppableId, setActiveDroppableId] = useState(null)
  const [viewMode, setViewMode] = useState('date') // 'date' or 'urgency'
  const [taskOrders, setTaskOrders] = useState({
    today: [],
    upcoming: [],
    future: [],
    high: [],
    medium: [],
    low: []
  })
  const navigate = useNavigate()

  // Create all sensors needed for different input methods
  const sensors = useSensors(
    // For mouse and touch on desktop devices
    useSensor(PointerSensor, {
      // Require the mouse to move by 8px before activating
      activationConstraint: {
        distance: 8,
      },
    }),
    // For touch devices like mobile
    useSensor(TouchSensor, {
      // Press delay of 250ms, with tolerance of 5px of movement
      activationConstraint: {
        delay: 250,
        tolerance: 5,
      },
    }),
    // For keyboard navigation (accessibility)
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Custom collision detection strategy that combines multiple algorithms
  const collisionDetectionStrategy = useCallback((args) => {
    // First check if we're over a droppable with rectangle intersection (faster)
    const rectIntersectionCollisions = rectIntersection(args);

    // If we have collisions with rectangle intersection, return them
    if (rectIntersectionCollisions.length) {
      return rectIntersectionCollisions;
    }

    // If we don't have any collisions with rectangle intersection, use closestCenter
    // This provides a better user experience for empty columns
    return closestCenter(args);
  }, []);

  // Cache the last active dropzone to prevent flickering
  const [lastOverId, setLastOverId] = useState(null);

  // Handle drag over with debouncing to prevent flickering
  const handleDragOver = useCallback((event) => {
    const { over } = event;
    const overId = over ? over.id : null;

    // Only update if the over target has changed
    if (overId !== lastOverId) {
      setLastOverId(overId);
      setActiveDroppableId(overId);
    }
  }, [lastOverId]);

  // Find active task item being dragged
  const getActiveTask = useCallback((taskId) => {
    return tasks?.find(task => task.$id === taskId) || null;
  }, [tasks]);

  // Handle drag start
  const handleDragStart = (event) => {
    const { active } = event;
    setActiveDragId(active.id);
  };

  // Calculate new due date for task when moved to a different column
  const calculateNewDueDate = (columnId, originalDate = null) => {
    const today = new Date();
    let newDate;

    switch(columnId) {
      case COLUMN_IDS.TODAY:
        newDate = new Date(today);
        break;

      case COLUMN_IDS.UPCOMING:
        newDate = new Date(today);
        newDate.setDate(today.getDate() + 3); // 3 days from now
        break;

      case COLUMN_IDS.FUTURE:
        newDate = new Date(today);
        newDate.setDate(today.getDate() + 14); // 14 days from now
        break;

      default:
        newDate = new Date(today);
    }

    // If we have an original date, preserve its time
    if (originalDate) {
      const originalDateTime = new Date(originalDate);
      newDate.setHours(
        originalDateTime.getHours(),
        originalDateTime.getMinutes(),
        originalDateTime.getSeconds(),
        originalDateTime.getMilliseconds()
      );
    }

    return newDate;
  };

  // Calculate new urgency for task when moved to urgency column
  const calculateNewUrgency = (columnId) => {
    switch(columnId) {
      case URGENCY_COLUMN_IDS.HIGH:
        return 4.5;
      case URGENCY_COLUMN_IDS.MEDIUM:
        return 3.0;
      case URGENCY_COLUMN_IDS.LOW:
        return 1.5;
      default:
        return 3.0;
    }
  };

  // Get the column ID for a task
  const getTaskColumn = (task) => {
    if (!task.dueDate) {
      return COLUMN_IDS.TODAY;
    }

    const dueDate = new Date(task.dueDate);
    const today = new Date();
    const sevenDaysFromNow = new Date(today);
    sevenDaysFromNow.setDate(today.getDate() + 7);

    // Check if due date is today or past
    if (dueDate <= today || dueDate.toDateString() === today.toDateString()) {
      return COLUMN_IDS.TODAY;
    }
    // Check if due date is within next 7 days
    else if (dueDate <= sevenDaysFromNow) {
      return COLUMN_IDS.UPCOMING;
    }
    // Due date is beyond 7 days
    else {
      return COLUMN_IDS.FUTURE;
    }
  };

  // Handle task reordering
  const handleTaskReorder = useCallback((columnId, newOrder) => {
    setTaskOrders(prev => ({
      ...prev,
      [columnId]: newOrder
    }));
  }, []);

  // Get the urgency level for a task
  const getTaskUrgencyLevel = (task) => {
    const urgency = task.urgency || 3;
    if (urgency >= 4) return URGENCY_COLUMN_IDS.HIGH;
    if (urgency >= 2.5) return URGENCY_COLUMN_IDS.MEDIUM;
    return URGENCY_COLUMN_IDS.LOW;
  };

  // Handle drag end
  const handleDragEnd = useCallback((event) => {
    const { active, over } = event;

    if (!over) {
      setActiveDragId(null);
      setActiveDroppableId(null);
      return;
    }

    // Get the task being dragged
    const draggedTask = getActiveTask(active.id);

    if (!draggedTask) {
      setActiveDragId(null);
      setActiveDroppableId(null);
      return;
    }

    // Check if we're dropping onto an urgency column in priority view
    if (viewMode === 'urgency' && Object.values(URGENCY_COLUMN_IDS).includes(over.id)) {
      const newUrgency = calculateNewUrgency(over.id);
      updateTask(draggedTask.$id, { urgency: newUrgency });
    }
    // Check if we're dropping directly onto a date column in date view
    else if (viewMode === 'date' && Object.values(COLUMN_IDS).includes(over.id)) {
      const newDueDate = calculateNewDueDate(over.id, draggedTask.dueDate);
      updateTask(draggedTask.$id, { dueDate: newDueDate });
    }
    // If we're dropping onto another task
    else if (over.id !== active.id) {
      const overTask = getActiveTask(over.id);

      if (overTask) {
        if (viewMode === 'date') {
          // Get the columns of both tasks
          const activeColumn = getTaskColumn(draggedTask);
          const overColumn = getTaskColumn(overTask);

          // If the tasks are in different columns, move the active task to the over task's column
          if (activeColumn !== overColumn) {
            // Update the task with a new due date based on the over task's column
            const newDueDate = new Date(overTask.dueDate);

            // Only copy the date part (year, month, day), preserve the original task's time
            if (draggedTask.dueDate) {
              const originalDateTime = new Date(draggedTask.dueDate);
              newDueDate.setHours(
                originalDateTime.getHours(),
                originalDateTime.getMinutes(),
                originalDateTime.getSeconds(),
                originalDateTime.getMilliseconds()
              );
            }

            updateTask(draggedTask.$id, { dueDate: newDueDate });
          }
          // If they're in the same column, handle reordering and time adjustment
          else {
            // Get all tasks in this column sorted by due date
            const columnTasks = tasks
              .filter(task => getTaskColumn(task) === activeColumn)
              .sort((a, b) => {
                if (!a.dueDate && !b.dueDate) return 0;
                if (!a.dueDate) return 1;
                if (!b.dueDate) return -1;

                // Sort by complete due date/time ascending (not just time)
                const dateA = new Date(a.dueDate);
                const dateB = new Date(b.dueDate);

                // Ensure we're comparing the full timestamp
                const timeA = dateA.getTime();
                const timeB = dateB.getTime();

                return timeA - timeB;
              });

            // Find the indices of the active and over tasks
            const activeIndex = columnTasks.findIndex(task => task.$id === active.id);
            const overIndex = columnTasks.findIndex(task => task.$id === over.id);

            if (activeIndex !== -1 && overIndex !== -1 && activeIndex !== overIndex) {
              // Reorder the tasks
              const reorderedTasks = arrayMove(columnTasks, activeIndex, overIndex);

              // Update the task order state
              const newOrder = reorderedTasks.map(task => task.$id);
              handleTaskReorder(activeColumn, newOrder);

              // Adjust the dragged task's time based on its new position
              const draggedTaskNewIndex = reorderedTasks.findIndex(task => task.$id === active.id);
              const taskAbove = draggedTaskNewIndex > 0 ? reorderedTasks[draggedTaskNewIndex - 1] : null;
              const taskBelow = draggedTaskNewIndex < reorderedTasks.length - 1 ? reorderedTasks[draggedTaskNewIndex + 1] : null;

              // Calculate new time for the dragged task
              let newDueDate = null;

              if (taskAbove && taskAbove.dueDate) {
                const aboveDate = new Date(taskAbove.dueDate);

                if (taskBelow && taskBelow.dueDate) {
                  // Task is between two tasks - set time between them
                  const belowDate = new Date(taskBelow.dueDate);
                  const timeDiff = belowDate.getTime() - aboveDate.getTime();

                  // If tasks are very close (less than 30 minutes apart), use 15 minutes
                  if (timeDiff < 30 * 60 * 1000) {
                    newDueDate = new Date(aboveDate.getTime() + 15 * 60 * 1000);
                  } else {
                    newDueDate = new Date(aboveDate.getTime() + timeDiff / 2);
                  }
                } else {
                  // Task is after the above task - add 30 minutes
                  newDueDate = new Date(aboveDate.getTime() + 30 * 60 * 1000);
                }
              } else if (taskBelow && taskBelow.dueDate) {
                // Task is before the below task - subtract 30 minutes
                const belowDate = new Date(taskBelow.dueDate);
                newDueDate = new Date(belowDate.getTime() - 30 * 60 * 1000);
              }

              // Update the task's due date if we calculated a new one
              // Only adjust time in date view and if the task has a due date
              if (newDueDate && draggedTask.dueDate && viewMode === 'date') {
                // When dragging within the same column, use the date from the surrounding tasks
                // This allows tasks to move between different dates within the same column
                if (taskAbove && taskAbove.dueDate) {
                  const aboveDate = new Date(taskAbove.dueDate);
                  newDueDate.setFullYear(aboveDate.getFullYear());
                  newDueDate.setMonth(aboveDate.getMonth());
                  newDueDate.setDate(aboveDate.getDate());
                } else if (taskBelow && taskBelow.dueDate) {
                  const belowDate = new Date(taskBelow.dueDate);
                  newDueDate.setFullYear(belowDate.getFullYear());
                  newDueDate.setMonth(belowDate.getMonth());
                  newDueDate.setDate(belowDate.getDate());
                } else {
                  // Fallback: preserve the original date
                  const originalDate = new Date(draggedTask.dueDate);
                  newDueDate.setFullYear(originalDate.getFullYear());
                  newDueDate.setMonth(originalDate.getMonth());
                  newDueDate.setDate(originalDate.getDate());
                }

                updateTask(draggedTask.$id, { dueDate: newDueDate });
              }
            }
          }
        } else if (viewMode === 'urgency') {
          // In priority view, dropping on another task within the same urgency level should only reorder
          // without changing dates

          // Get the urgency level for both tasks
          const activeUrgencyLevel = getTaskUrgencyLevel(draggedTask);
          const overUrgencyLevel = getTaskUrgencyLevel(overTask);

          // If they're in different urgency levels, update the urgency only
          if (activeUrgencyLevel !== overUrgencyLevel) {
            // Set urgency similar to the over task
            updateTask(draggedTask.$id, { urgency: overTask.urgency });
          }
          // If in the same urgency level, handle reordering
          else {
            // Get all tasks in this urgency level
            const urgencyLevelTasks = tasks.filter(task => getTaskUrgencyLevel(task) === activeUrgencyLevel);

            // Find the indices of the active and over tasks
            const activeIndex = urgencyLevelTasks.findIndex(task => task.$id === active.id);
            const overIndex = urgencyLevelTasks.findIndex(task => task.$id === over.id);

            if (activeIndex !== -1 && overIndex !== -1 && activeIndex !== overIndex) {
              // Reorder the tasks
              const reorderedTasks = arrayMove(urgencyLevelTasks, activeIndex, overIndex);

              // Update the task order state
              const newOrder = reorderedTasks.map(task => task.$id);
              handleTaskReorder(activeUrgencyLevel, newOrder);
            }
          }
        }
      }
    }

    // Reset active drag state
    setActiveDragId(null);
    setActiveDroppableId(null);
  }, [getActiveTask, updateTask, tasks, handleTaskReorder, viewMode]);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !currentUser) {
      navigate('/login')
    }
  }, [currentUser, authLoading, navigate])

  const handleAddTask = async (taskData) => {
    setIsAddingTask(true);
    setAddingTaskStatus('Adding task...');

    try {
      const newTaskId = await addTask(taskData);
      setAddingTaskStatus('Task added successfully!');
      setTimeout(() => {
        setAddingTaskStatus(null);
      }, 2000);
      return newTaskId;
    } catch (error) {
      console.error("Error adding task:", error);
      setAddingTaskStatus('Failed to add task');
      setTimeout(() => {
        setAddingTaskStatus(null);
      }, 2000);
      return null;
    } finally {
      setIsAddingTask(false);
    }
  }

  if (authLoading || tasksLoading) {
    return (
      <div className="flex items-center justify-center h-64 font-sans">
        <div className="flex flex-col items-center">
          <ArrowPathIcon className="w-10 h-10 text-primary-700 animate-spin" />
          <p className="mt-4 text-primary-800">Loading your tasks...</p>
        </div>
      </div>
    )
  }

  // Get the active task for the drag overlay
  const activeTask = activeDragId ? getActiveTask(activeDragId) : null;

  return (
    <div className="max-w-7xl mx-auto font-sans">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="mb-8"
      >
        {/* Show task input at the top, always visible like in the screenshot */}
        <div className="mt-4">
          <TaskInput onAddTask={handleAddTask} />
          {addingTaskStatus && (
            <p className={`text-sm mt-2 ${addingTaskStatus.includes('Failed') ? 'text-red-500' : 'text-green-500'}`}>
              {addingTaskStatus}
            </p>
          )}
        </div>
      </motion.div>

      {/* View toggle and refresh button */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center space-x-4">
          <h2 className="text-xl font-bold text-primary-700">Your Tasks</h2>

          {/* View Mode Toggle */}
          <div className="flex bg-primary-100 rounded-md border border-primary-300 p-1">
            <motion.button
              onClick={() => setViewMode('date')}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              title="View by Date"
              className={`flex items-center justify-center p-1.5 md:p-2 rounded-sm transition-colors ${
                viewMode === 'date'
                  ? 'bg-primary-500 text-white'
                  : 'text-primary-700 hover:bg-primary-200'
              }`}
            >
              <CalendarDaysIcon className="w-4 h-4 md:w-5 md:h-5" />
            </motion.button>
            <motion.button
              onClick={() => setViewMode('urgency')}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              title="View by Priority"
              className={`flex items-center justify-center p-1.5 md:p-2 rounded-sm transition-colors ${
                viewMode === 'urgency'
                  ? 'bg-primary-500 text-white'
                  : 'text-primary-700 hover:bg-primary-200'
              }`}
            >
              <FlagIcon className="w-4 h-4 md:w-5 md:h-5" />
            </motion.button>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Link to="/insights">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="flex items-center justify-center w-10 h-10 sm:w-auto sm:h-auto sm:px-3 sm:py-2 bg-primary-100 text-primary-700 rounded-lg border border-primary-300 hover:bg-primary-200 transition-colors shadow-sm"
            >
              <ChartBarIcon className="w-5 h-5 sm:mr-2" />
              <span className="text-sm font-medium hidden sm:inline">Insights</span>
            </motion.button>
          </Link>

          <motion.button
            onClick={refreshTasks}
            disabled={refreshing}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="flex items-center justify-center w-10 h-10 sm:w-auto sm:h-auto sm:px-3 sm:py-2 bg-primary-100 text-primary-700 rounded-lg border border-primary-300 hover:bg-primary-200 transition-colors shadow-sm disabled:opacity-50"
          >
            <ArrowPathIcon className={`w-5 h-5 sm:mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            <span className="text-sm font-medium hidden sm:inline">Refresh Tasks</span>
          </motion.button>
        </div>
      </div>

      {/* Task list with DnD context */}
      <DndContext
        sensors={sensors}
        collisionDetection={collisionDetectionStrategy}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
        modifiers={[restrictToWindowEdges]}
        measuring={{
          droppable: {
            strategy: 'always',
          },
        }}
        autoScroll={{
          threshold: {
            x: 0.1,
            y: 0.2
          },
          acceleration: 10,
          interval: 10
        }}
        cancelDrop={{
          dropAnimation: {
            duration: 150,
            easing: 'cubic-bezier(0.25, 1, 0.5, 1)',
          },
        }}
      >
        {viewMode === 'date' ? (
          <TaskList
            tasks={tasks}
            onUpdate={updateTask}
            onDelete={deleteTask}
            onAddComment={addComment}
            onDeleteComment={deleteComment}
            showCompletedTasks={showCompletedTasks}
            activeDroppableId={activeDroppableId}
            taskOrders={taskOrders}
            onTaskReorder={handleTaskReorder}
          />
        ) : (
          <TaskListByUrgency
            tasks={tasks}
            onUpdate={updateTask}
            onDelete={deleteTask}
            onAddComment={addComment}
            onDeleteComment={deleteComment}
            showCompletedTasks={showCompletedTasks}
            activeDroppableId={activeDroppableId}
            taskOrders={taskOrders}
            onTaskReorder={handleTaskReorder}
          />
        )}

        {/* Drag overlay to show the task being dragged */}
        <DragOverlay
          adjustScale={false}
          zIndex={1000}
          dropAnimation={{
            duration: 150,
            easing: 'cubic-bezier(0.18, 0.67, 0.6, 1.22)',
          }}
          transition={{
            duration: 100,
            easing: 'cubic-bezier(0.25, 1, 0.5, 1)',
          }}
        >
          {activeTask ? (
            <div className="opacity-95 shadow-lg rounded-md overflow-hidden w-full max-w-[420px]" style={{
              transform: 'translateZ(0)',
              backfaceVisibility: 'hidden',
              willChange: 'transform'
            }}>
              <TaskCard
                task={activeTask}
                isExpanded={false}
                onClick={() => {}}
                onUpdate={() => {}}
                onDelete={() => {}}
                onAddComment={() => {}}
                onDeleteComment={() => {}}
                isDragOverlay={true}
              />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  )
}
