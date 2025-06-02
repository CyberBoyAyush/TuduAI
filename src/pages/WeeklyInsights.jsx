/**
 * File: WeeklyInsights.jsx
 * Purpose: Weekly productivity insights page with AI-powered analysis
 */
import { useState, useEffect, useMemo, useCallback } from 'react'
import useTasks from '../hooks/useTasks'
import {
  ChartBarIcon,
  CheckCircleIcon,
  ArrowTrendingUpIcon,
  CalendarDaysIcon
} from '@heroicons/react/24/outline'

export default function WeeklyInsights() {
  const { tasks } = useTasks()

  const [insights, setInsights] = useState(null)

  // Memoized week period calculation
  const weekPeriod = useMemo(() => {
    const now = new Date()
    const startOfWeek = new Date(now)
    startOfWeek.setDate(now.getDate() - now.getDay())
    startOfWeek.setHours(0, 0, 0, 0)

    const endOfWeek = new Date(startOfWeek)
    endOfWeek.setDate(startOfWeek.getDate() + 6)
    endOfWeek.setHours(23, 59, 59, 999)

    return { start: startOfWeek, end: endOfWeek }
  }, [])

  // Memoized weekly statistics calculation
  const weeklyStats = useMemo(() => {
    if (!tasks || tasks.length === 0) return null

    const { start: startOfWeek, end: endOfWeek } = weekPeriod
    const now = new Date()

    // Filter tasks created this week
    const weeklyCreatedTasks = tasks.filter(task => {
      if (!task.createdAt) return false
      const createdDate = new Date(task.createdAt)
      return createdDate >= startOfWeek && createdDate <= endOfWeek
    })

    // Filter tasks due this week
    const weeklyDueTasks = tasks.filter(task => {
      if (!task.dueDate) return false
      const dueDate = new Date(task.dueDate)
      return dueDate >= startOfWeek && dueDate <= endOfWeek
    })

    // Combine and deduplicate tasks
    const weeklyTaskIds = new Set([
      ...weeklyCreatedTasks.map(t => t.$id),
      ...weeklyDueTasks.map(t => t.$id)
    ])
    const weeklyTasks = tasks.filter(task => weeklyTaskIds.has(task.$id))

    // Calculate completed tasks this week
    const completedTasks = weeklyTasks.filter(task => task.completed)
    const completedThisWeek = completedTasks.filter(task => {
      if (!task.completedAt && !task.updatedAt) return task.completed
      const completedDate = new Date(task.completedAt || task.updatedAt)
      return completedDate >= startOfWeek && completedDate <= endOfWeek
    })

    // Calculate overdue tasks
    const overdueTasks = weeklyDueTasks.filter(task => {
      if (task.completed) return false
      const dueDate = new Date(task.dueDate)
      return dueDate < now
    })

    // Quick calculations
    const completionRate = weeklyTasks.length > 0
      ? Math.round((completedThisWeek.length / weeklyTasks.length) * 100)
      : 0

    const totalUrgency = weeklyTasks.reduce((sum, task) => sum + (task.urgency || 3), 0)
    const averageUrgency = weeklyTasks.length > 0
      ? Math.round((totalUrgency / weeklyTasks.length) * 10) / 10
      : 3

    const productivityScore = Math.round(
      (completionRate * 0.6) +
      (Math.max(0, 100 - (overdueTasks.length / Math.max(weeklyTasks.length, 1)) * 100) * 0.3) +
      (Math.max(0, (5 - averageUrgency) / 4 * 100) * 0.1)
    )

    return {
      totalTasks: weeklyTasks.length,
      createdTasks: weeklyCreatedTasks.length,
      dueTasks: weeklyDueTasks.length,
      completedTasks: completedThisWeek.length,
      pendingTasks: weeklyTasks.length - completedThisWeek.length,
      overdueTasks: overdueTasks.length,
      completionRate,
      averageUrgency,
      productivityScore,
      weekPeriod
    }
  }, [tasks, weekPeriod])

  // Generate fast local insights (no AI call for speed)
  const generateInsights = useCallback((stats) => {
    if (!stats) return null

    const { completionRate, totalTasks, overdueTasks } = stats

    // Fast local analysis
    const trend = completionRate >= 70 ? "improving" :
                  completionRate >= 40 ? "stable" : "declining"

    const summary = totalTasks === 0
      ? "No tasks this week. Consider setting some goals!"
      : `You managed ${totalTasks} tasks this week with a ${completionRate}% completion rate.`

    const recommendations = completionRate < 50
      ? ["Focus on completing existing tasks", "Break large tasks into smaller steps"]
      : completionRate < 80
      ? ["Maintain your current pace", "Consider prioritizing urgent tasks"]
      : ["Excellent work! Keep up the momentum", "Consider taking on new challenges"]

    return {
      summary,
      recommendations,
      trend,
      focus_area: overdueTasks > 0 ? "time_management" : "task_prioritization"
    }
  }, [])

  // Generate insights when stats change
  useEffect(() => {
    if (weeklyStats) {
      const insights = generateInsights(weeklyStats)
      setInsights(insights)
    } else {
      setInsights(null)
    }
  }, [weeklyStats, generateInsights])

  // Show empty state if no data
  if (!weeklyStats || weeklyStats.totalTasks === 0) {
    return (
      <div className="max-w-6xl mx-auto font-sans">
        <div className="text-center py-12">
          <h2 className="text-lg font-medium text-primary-700 mb-2">
            No Data Available
          </h2>
          <p className="text-primary-800">
            Create some tasks to see your weekly insights.
          </p>
        </div>
      </div>
    )
  }



  return (
    <div className="max-w-6xl mx-auto font-sans">
      {/* Simple Header */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-primary-700">Weekly Insights</h2>
        {weeklyStats?.weekPeriod && (
          <div className="flex items-center px-3 py-1 bg-primary-100 rounded-md border border-primary-300">
            <CalendarDaysIcon className="w-4 h-4 text-primary-700 mr-2" />
            <span className="text-sm font-medium text-primary-700">
              {weeklyStats.weekPeriod.start.toLocaleDateString()} - {weeklyStats.weekPeriod.end.toLocaleDateString()}
            </span>
          </div>
        )}
      </div>

      {/* Modern Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Total Tasks */}
        <div className="group bg-primary-100 rounded-lg p-6 border border-primary-300 hover:shadow-md transition-all duration-200 hover:border-primary-500">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-primary-200 rounded-lg group-hover:bg-primary-300 transition-colors">
              <CalendarDaysIcon className="w-5 h-5 text-primary-700" />
            </div>
            <span className="text-xs font-medium text-primary-700 bg-primary-200 px-2 py-1 rounded-full">
              This Week
            </span>
          </div>
          <div className="space-y-1">
            <p className="text-2xl font-bold text-primary-700">
              {weeklyStats.totalTasks}
            </p>
            <p className="text-sm text-primary-800">Total Tasks</p>
            <div className="flex items-center text-xs text-primary-800 mt-2">
              <span>Created: {weeklyStats.createdTasks}</span>
              <span className="mx-2">•</span>
              <span>Due: {weeklyStats.dueTasks}</span>
            </div>
          </div>
        </div>

        {/* Completed Tasks */}
        <div className="group bg-primary-100 rounded-lg p-6 border border-primary-300 hover:shadow-md transition-all duration-200 hover:border-primary-500">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-primary-200 rounded-lg group-hover:bg-primary-300 transition-colors">
              <CheckCircleIcon className="w-5 h-5 text-primary-700" />
            </div>
            <span className="text-xs font-medium text-primary-700 bg-primary-200 px-2 py-1 rounded-full">
              ✓ Done
            </span>
          </div>
          <div className="space-y-1">
            <p className="text-2xl font-bold text-primary-700">
              {weeklyStats.completedTasks}
            </p>
            <p className="text-sm text-primary-800">Completed</p>
            <div className="flex items-center text-xs text-primary-800 mt-2">
              <span>Pending: {weeklyStats.pendingTasks}</span>
            </div>
          </div>
        </div>

        {/* Completion Rate */}
        <div className="group bg-primary-100 rounded-lg p-6 border border-primary-300 hover:shadow-md transition-all duration-200 hover:border-primary-500">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-primary-200 rounded-lg group-hover:bg-primary-300 transition-colors">
              <ChartBarIcon className="w-5 h-5 text-primary-700" />
            </div>
            <span className="text-xs font-medium text-primary-700 bg-primary-200 px-2 py-1 rounded-full">
              Rate
            </span>
          </div>
          <div className="space-y-1">
            <p className="text-2xl font-bold text-primary-700">
              {weeklyStats.completionRate}%
            </p>
            <p className="text-sm text-primary-800">Completion Rate</p>
            {/* Progress bar */}
            <div className="w-full bg-primary-200 rounded-full h-2 mt-3">
              <div
                className="bg-primary-500 h-2 rounded-full transition-all duration-500"
                style={{ width: `${weeklyStats.completionRate}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Productivity Score */}
        <div className="group bg-primary-500 rounded-lg p-6 hover:shadow-lg transition-all duration-200 hover:bg-primary-600">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-primary-600 rounded-lg group-hover:bg-primary-700 transition-colors">
              <ArrowTrendingUpIcon className="w-5 h-5 text-primary-50" />
            </div>
            <span className="text-xs font-medium text-primary-50 bg-primary-600 px-2 py-1 rounded-full">
              Score
            </span>
          </div>
          <div className="space-y-1">
            <p className="text-2xl font-bold text-primary-50">
              {weeklyStats.productivityScore}
            </p>
            <p className="text-sm text-primary-100">Productivity Score</p>
            <div className="flex items-center text-xs text-primary-100 mt-2">
              <span>Avg Urgency: {weeklyStats.averageUrgency}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced AI Summary */}
      {insights && (
        <div className="bg-primary-100 rounded-lg p-6 border border-primary-300 mb-8 hover:shadow-md transition-all duration-200">
          <div className="flex items-start space-x-4 mb-6">
            <div className="p-3 bg-primary-500 rounded-lg">
              <ChartBarIcon className="w-6 h-6 text-primary-50" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-semibold text-primary-700">
                  Weekly Summary
                </h3>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                  insights.trend === 'improving' ? 'bg-primary-200 text-primary-700' :
                  insights.trend === 'declining' ? 'bg-primary-200 text-primary-700' :
                  'bg-primary-200 text-primary-700'
                }`}>
                  {insights.trend === 'improving' ? '📈 Improving' :
                   insights.trend === 'declining' ? '📉 Declining' :
                   '📊 Stable'}
                </span>
              </div>
              <p className="text-primary-800 leading-relaxed">
                {insights?.summary || "Your weekly productivity analysis is ready."}
              </p>
            </div>
          </div>

          {/* Key Recommendations */}
          {insights.recommendations && insights.recommendations.length > 0 && (
            <div className="bg-primary-50 rounded-lg p-4 border border-primary-200">
              <h4 className="text-sm font-semibold text-primary-700 mb-3 flex items-center">
                <span className="w-2 h-2 bg-primary-500 rounded-full mr-2"></span>
                Key Recommendations
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {insights.recommendations.slice(0, 2).map((recommendation, index) => (
                  <div key={index} className="flex items-start space-x-3 p-3 bg-primary-100 rounded-lg">
                    <div className="w-1.5 h-1.5 bg-primary-500 rounded-full mt-2 flex-shrink-0" />
                    <span className="text-sm text-primary-800 leading-relaxed">{recommendation}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Quick Actions & Trends */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* Quick Stats */}
        <div className="bg-primary-100 rounded-lg p-6 border border-primary-300">
          <h3 className="text-lg font-semibold text-primary-700 mb-4">Quick Stats</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-primary-800">Tasks per day</span>
              <span className="font-medium text-primary-700">
                {(weeklyStats.totalTasks / 7).toFixed(1)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-primary-800">Completion per day</span>
              <span className="font-medium text-primary-700">
                {(weeklyStats.completedTasks / 7).toFixed(1)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-primary-800">Focus area</span>
              <span className="font-medium text-primary-700 capitalize">
                {insights?.focus_area?.replace('_', ' ') || 'Task management'}
              </span>
            </div>
            {weeklyStats.overdueTasks > 0 && (
              <div className="flex justify-between items-center pt-2 border-t border-primary-200">
                <span className="text-sm text-primary-800">Overdue tasks</span>
                <span className="font-medium text-primary-700">
                  {weeklyStats.overdueTasks}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Weekly Progress */}
        <div className="bg-primary-100 rounded-lg p-6 border border-primary-300">
          <h3 className="text-lg font-semibold text-primary-700 mb-4">Weekly Progress</h3>
          <div className="space-y-4">
            {/* Completion Progress */}
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-primary-800">Completion Rate</span>
                <span className="font-medium text-primary-700">{weeklyStats.completionRate}%</span>
              </div>
              <div className="w-full bg-primary-200 rounded-full h-3">
                <div
                  className="bg-primary-500 h-3 rounded-full transition-all duration-700"
                  style={{ width: `${weeklyStats.completionRate}%` }}
                ></div>
              </div>
            </div>

            {/* Productivity Score */}
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-primary-800">Productivity Score</span>
                <span className="font-medium text-primary-700">{weeklyStats.productivityScore}/100</span>
              </div>
              <div className="w-full bg-primary-200 rounded-full h-3">
                <div
                  className="bg-primary-500 h-3 rounded-full transition-all duration-700"
                  style={{ width: `${weeklyStats.productivityScore}%` }}
                ></div>
              </div>
            </div>

            {/* Goal indicator */}
            <div className="pt-2 border-t border-primary-200">
              <div className="flex items-center justify-between">
                <span className="text-sm text-primary-800">Weekly Goal</span>
                <span className={`text-sm font-medium ${
                  weeklyStats.completionRate >= 80 ? 'text-primary-700' :
                  weeklyStats.completionRate >= 60 ? 'text-primary-700' :
                  'text-primary-700'
                }`}>
                  {weeklyStats.completionRate >= 80 ? '🎯 Excellent' :
                   weeklyStats.completionRate >= 60 ? '👍 Good' :
                   '📈 Keep going'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

    </div>
  )
}
