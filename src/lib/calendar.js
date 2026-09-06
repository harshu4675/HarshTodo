import { expandOccurrences } from '../data/recurrence.js'
import { isOpen, isActive } from './taskQueries.js'
import { timeKeyToMinutes } from './dates.js'

export function occurrencesInRange(tasks, startKey, endKey, options = {}) {
  const includeCompleted = options.includeCompleted ?? true
  const out = []
  for (const task of tasks) {
    if (task.deletedAt) continue
    if (!includeCompleted && !isOpen(task)) continue
    if (!isActive(task) && !includeCompleted) continue
    if (task.status === 'archived' || task.status === 'cancelled') continue
    if (task.dueDate) {
      if (task.recurrence && isOpen(task)) {
        const anchor = task.dueDate
        const keys = expandOccurrences(task.recurrence, anchor, startKey, endKey, { limit: 400 })
        for (const key of keys) out.push({ id: `${task.id}@${key}`, task, dateKey: key, isVirtual: key !== task.dueDate, allDay: !task.dueTime, timeKey: task.dueTime })
      } else if (task.dueDate >= startKey && task.dueDate <= endKey) {
        out.push({ id: task.id, task, dateKey: task.dueDate, isVirtual: false, allDay: !task.dueTime, timeKey: task.dueTime })
      }
    } else if (task.startDate && task.startDate <= endKey && (task.endDate || task.startDate) >= startKey) {
      out.push({ id: task.id, task, dateKey: task.startDate, endDateKey: task.endDate || task.startDate, isVirtual: false, allDay: true, timeKey: null, span: true })
    }
  }
  return out
}

export function groupOccurrencesByDate(occurrences) {
  const map = new Map()
  for (const occ of occurrences) {
    if (occ.span) {
      let key = occ.dateKey
      const end = occ.endDateKey
      let guard = 0
      while (key <= end && guard < 366) {
        if (!map.has(key)) map.set(key, [])
        map.get(key).push(occ)
        const d = new Date(key)
        d.setDate(d.getDate() + 1)
        key = d.toISOString().slice(0, 10)
        guard += 1
      }
      continue
    }
    if (!map.has(occ.dateKey)) map.set(occ.dateKey, [])
    map.get(occ.dateKey).push(occ)
  }
  for (const list of map.values()) list.sort(occurrenceComparator)
  return map
}

export function occurrenceComparator(a, b) {
  if (a.allDay !== b.allDay) return a.allDay ? -1 : 1
  if (a.timeKey && b.timeKey && a.timeKey !== b.timeKey) return a.timeKey < b.timeKey ? -1 : 1
  if (b.task.priority !== a.task.priority) return b.task.priority - a.task.priority
  return a.task.order - b.task.order
}

export function layoutTimedOccurrences(occurrences, options = {}) {
  const defaultDuration = options.defaultDuration ?? 30
  const items = occurrences
    .filter((o) => !o.allDay && o.timeKey)
    .map((o) => {
      const start = timeKeyToMinutes(o.timeKey)
      const duration = Math.max(15, o.task.estimatedMinutes || defaultDuration)
      return { occ: o, start, end: Math.min(24 * 60, start + duration) }
    })
    .sort((a, b) => a.start - b.start || b.end - a.end)

  const columns = []
  let clusterEnd = -1
  let cluster = []
  const out = []

  function flush() {
    const width = columns.length
    for (const item of cluster) out.push({ ...item, column: item.column, columns: width })
    cluster = []
    columns.length = 0
  }

  for (const item of items) {
    if (item.start >= clusterEnd && cluster.length) flush()
    let placed = false
    for (let c = 0; c < columns.length; c += 1) {
      if (columns[c] <= item.start) {
        columns[c] = item.end
        item.column = c
        placed = true
        break
      }
    }
    if (!placed) {
      columns.push(item.end)
      item.column = columns.length - 1
    }
    cluster.push(item)
    clusterEnd = Math.max(clusterEnd, item.end)
  }
  if (cluster.length) flush()
  return out
}

export function snapMinutes(minutes, step = 15) {
  return Math.max(0, Math.min(24 * 60 - step, Math.round(minutes / step) * step))
}
