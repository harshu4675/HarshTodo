import { describe, it, expect } from 'vitest'
import { createTask } from '../data/models.js'
import { applyFilter, EMPTY_FILTER } from '../lib/filters.js'
import { searchTasks } from '../lib/search.js'
import { occurrencesInRange } from '../lib/calendar.js'
import { completionsByDay, computeStreak, overdueAnalysis, priorityBreakdown } from '../lib/statistics.js'

function makeTasks(n) {
  const out = []
  for (let i = 0; i < n; i++) {
    const day = 1 + (i % 28)
    out.push(
      createTask({
        title: `Task number ${i} about ${['billing', 'design', 'travel', 'health'][i % 4]}`,
        dueDate: i % 3 === 0 ? null : `2026-${String(1 + (i % 12)).padStart(2, '0')}-${String(day).padStart(2, '0')}`,
        dueTime: i % 5 === 0 ? '09:30' : null,
        priority: i % 5,
        status: i % 7 === 0 ? 'completed' : 'inbox',
        completedAt: i % 7 === 0 ? '2026-09-01T10:00:00.000Z' : null,
        recurrence: i % 50 === 0 ? { frequency: 'weekly', interval: 1, weekdays: [1, 3] } : null,
      }),
    )
  }
  return out
}

describe('performance with thousands of tasks', () => {
  const tasks = makeTasks(5000)
  const now = new Date(2026, 8, 6, 12)

  it('filters 5000 tasks quickly', () => {
    const t0 = performance.now()
    const result = applyFilter(tasks, { ...EMPTY_FILTER, priorities: [3, 4], dateRange: 'month' }, now)
    expect(result.length).toBeGreaterThan(0)
    expect(performance.now() - t0).toBeLessThan(150)
  })

  it('searches 5000 tasks quickly', () => {
    const t0 = performance.now()
    const result = searchTasks(tasks, 'design 12', { limit: 50 })
    expect(result.length).toBeGreaterThan(0)
    expect(performance.now() - t0).toBeLessThan(150)
  })

  it('expands a month of calendar occurrences quickly', () => {
    const t0 = performance.now()
    const occ = occurrencesInRange(tasks, '2026-09-01', '2026-10-12')
    expect(occ.length).toBeGreaterThan(0)
    expect(performance.now() - t0).toBeLessThan(200)
  })

  it('computes statistics quickly', () => {
    const t0 = performance.now()
    expect(completionsByDay(tasks, 30, now)).toHaveLength(30)
    expect(typeof computeStreak(tasks, now)).toBe('number')
    expect(overdueAnalysis(tasks, now)).toBeTruthy()
    expect(priorityBreakdown(tasks)).toBeTruthy()
    expect(performance.now() - t0).toBeLessThan(200)
  })
})
