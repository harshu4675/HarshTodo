import { describe, it, expect } from 'vitest'
import { applyFilter, EMPTY_FILTER } from './filters.js'
import { searchTasks, highlightRanges } from './search.js'
import { createTask } from '../data/models.js'

const now = new Date(2026, 8, 6, 12, 0)
const tasks = [
  createTask({ title: 'Pay electricity bill', dueDate: '2026-09-06', priority: 3, tagIds: ['home'] }),
  createTask({ title: 'Write quarterly report', description: 'Include revenue charts', dueDate: '2026-09-01', priority: 4, projectId: 'p1' }),
  createTask({ title: 'Read a book', notes: 'Started chapter 3' }),
  createTask({ title: 'Old done thing', status: 'completed', completedAt: '2026-09-02T10:00:00.000Z' }),
  createTask({ title: 'Weekly review', dueDate: '2026-09-07', recurrence: { frequency: 'weekly', interval: 1 } }),
]

describe('filters', () => {
  it('returns only open tasks by default', () => {
    expect(applyFilter(tasks, EMPTY_FILTER, now).map((t) => t.title)).not.toContain('Old done thing')
  })
  it('filters by date range and overdue', () => {
    expect(applyFilter(tasks, { ...EMPTY_FILTER, dateRange: 'today' }, now).map((t) => t.title)).toEqual(['Pay electricity bill'])
    expect(applyFilter(tasks, { ...EMPTY_FILTER, overdueOnly: true }, now).map((t) => t.title)).toEqual(['Write quarterly report'])
    expect(applyFilter(tasks, { ...EMPTY_FILTER, dateRange: 'unscheduled' }, now).map((t) => t.title)).toEqual(['Read a book'])
  })
  it('combines priority, project, tag and recurrence', () => {
    expect(applyFilter(tasks, { ...EMPTY_FILTER, priorities: [4] }, now)).toHaveLength(1)
    expect(applyFilter(tasks, { ...EMPTY_FILTER, projectIds: ['p1'], priorities: [4] }, now)).toHaveLength(1)
    expect(applyFilter(tasks, { ...EMPTY_FILTER, projectIds: ['p1'], priorities: [3] }, now)).toHaveLength(0)
    expect(applyFilter(tasks, { ...EMPTY_FILTER, tagIds: ['home'] }, now)).toHaveLength(1)
    expect(applyFilter(tasks, { ...EMPTY_FILTER, recurringOnly: true }, now).map((t) => t.title)).toEqual(['Weekly review'])
  })
  it('shows completed when asked', () => {
    expect(applyFilter(tasks, { ...EMPTY_FILTER, completion: 'completed' }, now).map((t) => t.title)).toEqual(['Old done thing'])
  })
})

describe('search', () => {
  it('matches across title, description and notes with ranking', () => {
    const results = searchTasks(tasks, 'report')
    expect(results[0].task.title).toBe('Write quarterly report')
    expect(searchTasks(tasks, 'revenue')).toHaveLength(1)
    expect(searchTasks(tasks, 'chapter')).toHaveLength(1)
  })
  it('requires every token to be present', () => {
    expect(searchTasks(tasks, 'quarterly revenue')).toHaveLength(1)
    expect(searchTasks(tasks, 'quarterly banana')).toHaveLength(0)
  })
  it('highlights matched ranges', () => {
    const parts = highlightRanges('Pay electricity bill', 'bill pay')
    expect(parts.filter((p) => p.match).map((p) => p.text)).toEqual(['Pay', 'bill'])
  })
})
