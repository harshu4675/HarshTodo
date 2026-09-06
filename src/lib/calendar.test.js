import { describe, it, expect } from 'vitest'
import { occurrencesInRange, groupOccurrencesByDate, layoutTimedOccurrences } from './calendar.js'
import { createTask } from '../data/models.js'
import { isOverdue, combineDateAndTime, getMonthGrid, toDateKey, shiftDateKey } from './dates.js'
import { dueReminders, reminderTime } from '../services/notifications.js'

describe('calendar scheduling', () => {
  it('expands recurring tasks into virtual occurrences within the range', () => {
    const task = createTask({ title: 'Daily', dueDate: '2026-09-01', recurrence: { frequency: 'daily', interval: 1 } })
    const occ = occurrencesInRange([task], '2026-09-05', '2026-09-07')
    expect(occ.map((o) => o.dateKey)).toEqual(['2026-09-05', '2026-09-06', '2026-09-07'])
    expect(occ.every((o) => o.isVirtual)).toBe(true)
  })

  it('spans multi-day tasks across every day they cover', () => {
    const task = createTask({ title: 'Conference', startDate: '2026-09-03', endDate: '2026-09-05' })
    const map = groupOccurrencesByDate(occurrencesInRange([task], '2026-09-01', '2026-09-30'))
    expect([...map.keys()].sort()).toEqual(['2026-09-03', '2026-09-04', '2026-09-05'])
  })

  it('lays out overlapping timed tasks into columns', () => {
    const a = createTask({ title: 'A', dueDate: '2026-09-06', dueTime: '09:00', estimatedMinutes: 60 })
    const b = createTask({ title: 'B', dueDate: '2026-09-06', dueTime: '09:30', estimatedMinutes: 60 })
    const c = createTask({ title: 'C', dueDate: '2026-09-06', dueTime: '12:00' })
    const occ = occurrencesInRange([a, b, c], '2026-09-06', '2026-09-06')
    const layout = layoutTimedOccurrences(occ)
    const byTitle = Object.fromEntries(layout.map((l) => [l.occ.task.title, l]))
    expect(byTitle.A.columns).toBe(2)
    expect(byTitle.B.column).toBe(1)
    expect(byTitle.C.columns).toBe(1)
  })

  it('excludes archived and cancelled tasks', () => {
    const t = createTask({ title: 'Gone', dueDate: '2026-09-06', status: 'cancelled' })
    expect(occurrencesInRange([t], '2026-09-01', '2026-09-30')).toHaveLength(0)
  })
})

describe('date helpers', () => {
  it('detects overdue by date and time', () => {
    const now = new Date(2026, 8, 6, 15, 0)
    expect(isOverdue('2026-09-05', null, now)).toBe(true)
    expect(isOverdue('2026-09-06', '14:00', now)).toBe(true)
    expect(isOverdue('2026-09-06', '16:00', now)).toBe(false)
    expect(isOverdue('2026-09-06', null, now)).toBe(false)
  })
  it('builds a 42-cell month grid honoring week start', () => {
    const grid = getMonthGrid(new Date(2026, 8, 1), 1)
    expect(grid).toHaveLength(42)
    expect(grid[0].date.getDay()).toBe(1)
    expect(getMonthGrid(new Date(2026, 8, 1), 0)[0].date.getDay()).toBe(0)
  })
  it('combines date keys and times in local time', () => {
    const d = combineDateAndTime('2026-03-29', '02:30')
    expect(toDateKey(d)).toBe('2026-03-29')
    expect(shiftDateKey('2026-01-31', 1, 'month')).toBe('2026-02-28')
  })
})

describe('reminders', () => {
  it('computes reminder time and finds due reminders once', () => {
    const task = createTask({ title: 'Meet', dueDate: '2026-09-06', dueTime: '10:00', reminderMinutesBefore: 15 })
    const at = reminderTime(task)
    expect(new Date(at).getHours()).toBe(9)
    expect(new Date(at).getMinutes()).toBe(45)
    expect(dueReminders([task], at + 1000)).toHaveLength(1)
    expect(dueReminders([task], at - 1000)).toHaveLength(0)
    expect(dueReminders([{ ...task, reminderFiredAt: new Date().toISOString() }], at + 1000)).toHaveLength(0)
    const snoozed = { ...task, reminderFiredAt: new Date().toISOString(), reminderSnoozedUntil: new Date(at + 600000).toISOString() }
    expect(dueReminders([snoozed], at + 700000)).toHaveLength(1)
  })
})
