import { TASK_STATUS, OPEN_STATUSES } from '../constants/task.js'
import { todayKey, isOverdue, shiftDateKey, compareDateKeys } from './dates.js'

export function isOpen(task) {
  return !task.deletedAt && OPEN_STATUSES.has(task.status)
}

export function isActive(task) {
  return !task.deletedAt && task.status !== TASK_STATUS.ARCHIVED && task.status !== TASK_STATUS.CANCELLED
}

export function isCompleted(task) {
  return !task.deletedAt && task.status === TASK_STATUS.COMPLETED
}

export function isTrashed(task) {
  return Boolean(task.deletedAt)
}

export function isTaskOverdue(task, now = new Date()) {
  return isOpen(task) && isOverdue(task.dueDate, task.dueTime, now)
}

export function isDueToday(task, now = new Date()) {
  return task.dueDate === todayKey(now)
}

export function isInbox(task) {
  return isOpen(task) && !task.dueDate && !task.startDate && !task.projectId
}

export function isScheduledOn(task, dateKey) {
  if (task.dueDate === dateKey) return true
  if (task.startDate && task.endDate) return task.startDate <= dateKey && task.endDate >= dateKey
  return task.startDate === dateKey
}

export function subtaskProgress(task) {
  const total = task.subtasks.length
  if (!total) return null
  const done = task.subtasks.filter((s) => s.completed).length
  return { done, total, percent: Math.round((done / total) * 100) }
}

export function priorityThenDateComparator(a, b) {
  if (b.priority !== a.priority) return b.priority - a.priority
  const byDate = compareDateKeys(a.dueDate, b.dueDate)
  if (byDate !== 0) return byDate
  return compareDateKeys(a.dueTime, b.dueTime)
}

export function dateThenOrderComparator(a, b) {
  const byDate = compareDateKeys(a.dueDate, b.dueDate)
  if (byDate !== 0) return byDate
  const byTime = compareDateKeys(a.dueTime, b.dueTime)
  if (byTime !== 0) return byTime
  return a.order - b.order
}

export function orderComparator(a, b) {
  return a.order - b.order
}

export function completedAtDescComparator(a, b) {
  return (Date.parse(b.completedAt || 0) || 0) - (Date.parse(a.completedAt || 0) || 0)
}

export function selectToday(tasks, now = new Date()) {
  const key = todayKey(now)
  return tasks.filter((t) => isOpen(t) && (t.dueDate === key || isTaskOverdue(t, now) || (t.startDate && t.startDate <= key && (!t.endDate || t.endDate >= key) && t.dueDate !== key)))
}

export function selectOverdue(tasks, now = new Date()) {
  return tasks.filter((t) => isTaskOverdue(t, now))
}

export function selectUpcoming(tasks, days = 14, now = new Date()) {
  const start = shiftDateKey(todayKey(now), 1)
  const end = shiftDateKey(todayKey(now), days)
  return tasks.filter((t) => isOpen(t) && t.dueDate && t.dueDate >= start && t.dueDate <= end)
}

export function selectInbox(tasks) {
  return tasks.filter(isInbox)
}

export function selectCompleted(tasks) {
  return tasks.filter(isCompleted)
}

export function selectTrash(tasks) {
  return tasks.filter(isTrashed)
}

export function selectByProject(tasks, projectId) {
  return tasks.filter((t) => t.projectId === projectId && !t.deletedAt)
}

export function selectByList(tasks, listId) {
  return tasks.filter((t) => t.listId === listId && !t.deletedAt)
}

export function selectByTag(tasks, tagId) {
  return tasks.filter((t) => t.tagIds.includes(tagId) && !t.deletedAt)
}

export function groupByDate(tasks) {
  const groups = new Map()
  for (const task of tasks) {
    const key = task.dueDate || 'unscheduled'
    if (!groups.has(key)) groups.set(key, [])
    groups.get(key).push(task)
  }
  return Array.from(groups.entries())
    .sort(([a], [b]) => compareDateKeys(a === 'unscheduled' ? null : a, b === 'unscheduled' ? null : b))
    .map(([dateKey, items]) => ({ dateKey, tasks: items.sort(dateThenOrderComparator) }))
}

export function projectProgress(tasks, projectId) {
  const items = tasks.filter((t) => t.projectId === projectId && !t.deletedAt && t.status !== TASK_STATUS.CANCELLED && t.status !== TASK_STATUS.ARCHIVED)
  const total = items.length
  const done = items.filter((t) => t.status === TASK_STATUS.COMPLETED).length
  return { total, done, open: total - done, percent: total ? Math.round((done / total) * 100) : 0 }
}
