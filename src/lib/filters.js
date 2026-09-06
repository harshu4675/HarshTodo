import { isOpen, isCompleted, isTaskOverdue } from './taskQueries.js'
import { todayKey, shiftDateKey } from './dates.js'

export const EMPTY_FILTER = Object.freeze({
  statuses: [],
  priorities: [],
  projectIds: [],
  listIds: [],
  tagIds: [],
  dateRange: null,
  completion: 'open',
  overdueOnly: false,
  recurringOnly: false,
  query: '',
})

export const DATE_RANGE_OPTIONS = [
  { value: null, label: 'Any date' },
  { value: 'today', label: 'Today' },
  { value: 'tomorrow', label: 'Tomorrow' },
  { value: 'week', label: 'Next 7 days' },
  { value: 'month', label: 'Next 30 days' },
  { value: 'overdue', label: 'Overdue' },
  { value: 'unscheduled', label: 'No date' },
]

export const COMPLETION_OPTIONS = [
  { value: 'open', label: 'Open' },
  { value: 'completed', label: 'Completed' },
  { value: 'all', label: 'All' },
]

export function isFilterEmpty(filter) {
  return (
    !filter.statuses.length &&
    !filter.priorities.length &&
    !filter.projectIds.length &&
    !filter.listIds.length &&
    !filter.tagIds.length &&
    !filter.dateRange &&
    filter.completion === 'open' &&
    !filter.overdueOnly &&
    !filter.recurringOnly &&
    !filter.query
  )
}

export function activeFilterCount(filter) {
  let count = 0
  if (filter.statuses.length) count += 1
  if (filter.priorities.length) count += 1
  if (filter.projectIds.length) count += 1
  if (filter.listIds.length) count += 1
  if (filter.tagIds.length) count += 1
  if (filter.dateRange) count += 1
  if (filter.completion !== 'open') count += 1
  if (filter.overdueOnly) count += 1
  if (filter.recurringOnly) count += 1
  return count
}

function matchesDateRange(task, range, now) {
  if (!range) return true
  const today = todayKey(now)
  switch (range) {
    case 'today':
      return task.dueDate === today
    case 'tomorrow':
      return task.dueDate === shiftDateKey(today, 1)
    case 'week':
      return Boolean(task.dueDate) && task.dueDate >= today && task.dueDate <= shiftDateKey(today, 7)
    case 'month':
      return Boolean(task.dueDate) && task.dueDate >= today && task.dueDate <= shiftDateKey(today, 30)
    case 'overdue':
      return isTaskOverdue(task, now)
    case 'unscheduled':
      return !task.dueDate
    default:
      return true
  }
}

export function applyFilter(tasks, filter, now = new Date()) {
  const f = { ...EMPTY_FILTER, ...filter }
  const query = f.query.trim().toLowerCase()
  return tasks.filter((task) => {
    if (task.deletedAt) return false
    if (f.completion === 'open' && !isOpen(task)) return false
    if (f.completion === 'completed' && !isCompleted(task)) return false
    if (f.statuses.length && !f.statuses.includes(task.status)) return false
    if (f.priorities.length && !f.priorities.includes(task.priority)) return false
    if (f.projectIds.length && !f.projectIds.includes(task.projectId)) return false
    if (f.listIds.length && !f.listIds.includes(task.listId)) return false
    if (f.tagIds.length && !f.tagIds.every((id) => task.tagIds.includes(id))) return false
    if (f.overdueOnly && !isTaskOverdue(task, now)) return false
    if (f.recurringOnly && !task.recurrence) return false
    if (!matchesDateRange(task, f.dateRange, now)) return false
    if (query) {
      const haystack = `${task.title}\n${task.description}\n${task.notes}`.toLowerCase()
      if (!haystack.includes(query)) return false
    }
    return true
  })
}
