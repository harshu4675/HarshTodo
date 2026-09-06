import { todayKey, shiftDateKey, formatDateKey, dateKeysInRange } from './dates.js'
import { isOpen, isTaskOverdue, isCompleted } from './taskQueries.js'
import { PRIORITY_LIST, TASK_STATUS } from '../constants/task.js'

export function completionsByDay(tasks, days, now = new Date()) {
  const today = todayKey(now)
  const start = shiftDateKey(today, -(days - 1))
  const keys = dateKeysInRange(start, today)
  const counts = new Map(keys.map((k) => [k, 0]))
  for (const t of tasks) {
    if (!isCompleted(t) || !t.completedAt) continue
    const key = t.completedAt.slice(0, 10)
    if (counts.has(key)) counts.set(key, counts.get(key) + 1)
  }
  return keys.map((key) => ({ key, label: formatDateKey(key, 'EEE'), shortLabel: formatDateKey(key, 'd'), count: counts.get(key) }))
}

export function computeStreak(tasks, now = new Date()) {
  const days = new Set()
  for (const t of tasks) if (isCompleted(t) && t.completedAt) days.add(t.completedAt.slice(0, 10))
  let streak = 0
  let cursor = todayKey(now)
  if (!days.has(cursor)) cursor = shiftDateKey(cursor, -1)
  while (days.has(cursor)) {
    streak += 1
    cursor = shiftDateKey(cursor, -1)
  }
  return streak
}

export function completionRate(tasks, days, now = new Date()) {
  const today = todayKey(now)
  const start = shiftDateKey(today, -(days - 1))
  const created = tasks.filter((t) => !t.deletedAt && t.createdAt.slice(0, 10) >= start && t.createdAt.slice(0, 10) <= today)
  const completed = tasks.filter((t) => isCompleted(t) && t.completedAt && t.completedAt.slice(0, 10) >= start && t.completedAt.slice(0, 10) <= today)
  return { created: created.length, completed: completed.length }
}

export function priorityBreakdown(tasks) {
  const open = tasks.filter(isOpen)
  return PRIORITY_LIST.map((p) => ({ ...p, count: open.filter((t) => t.priority === p.value).length }))
}

export function overdueAnalysis(tasks, now = new Date()) {
  const overdue = tasks.filter((t) => isTaskOverdue(t, now))
  const today = todayKey(now)
  const buckets = { '1-2 days': 0, '3-7 days': 0, '1-4 weeks': 0, 'Over a month': 0 }
  for (const t of overdue) {
    const diff = Math.round((Date.parse(today) - Date.parse(t.dueDate)) / 86400000)
    if (diff <= 2) buckets['1-2 days'] += 1
    else if (diff <= 7) buckets['3-7 days'] += 1
    else if (diff <= 28) buckets['1-4 weeks'] += 1
    else buckets['Over a month'] += 1
  }
  return { total: overdue.length, buckets: Object.entries(buckets).map(([label, count]) => ({ label, count })) }
}

export function statusBreakdown(tasks) {
  const live = tasks.filter((t) => !t.deletedAt)
  const counts = {}
  for (const t of live) counts[t.status] = (counts[t.status] || 0) + 1
  return counts
}

export function estimateAccuracy(tasks) {
  const withBoth = tasks.filter((t) => isCompleted(t) && t.estimatedMinutes && t.actualMinutes)
  if (!withBoth.length) return null
  const estimated = withBoth.reduce((s, t) => s + t.estimatedMinutes, 0)
  const actual = withBoth.reduce((s, t) => s + t.actualMinutes, 0)
  return { count: withBoth.length, estimated, actual, ratio: actual / estimated }
}

export function focusSummary(sessions, days, now = new Date()) {
  const today = todayKey(now)
  const start = shiftDateKey(today, -(days - 1))
  const inRange = sessions.filter((s) => s.startedAt.slice(0, 10) >= start)
  const seconds = inRange.reduce((sum, s) => sum + s.durationSeconds, 0)
  return { sessions: inRange.length, minutes: Math.round(seconds / 60), completed: inRange.filter((s) => s.completed).length }
}

export function busiestWeekday(tasks) {
  const counts = new Array(7).fill(0)
  for (const t of tasks) if (isCompleted(t) && t.completedAt) counts[new Date(t.completedAt).getDay()] += 1
  const max = Math.max(...counts)
  if (!max) return null
  return counts.indexOf(max)
}

export { TASK_STATUS }
