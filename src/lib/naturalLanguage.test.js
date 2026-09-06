import { describe, it, expect } from 'vitest'
import { parseTaskInput } from './naturalLanguage.js'

const now = new Date(2026, 8, 6, 10, 0, 0)

describe('natural language task parsing', () => {
  it('extracts tomorrow with a time', () => {
    const r = parseTaskInput('Finish portfolio tomorrow at 7 PM', { now })
    expect(r.title).toBe('Finish portfolio')
    expect(r.dueDate).toBe('2026-09-07')
    expect(r.dueTime).toBe('19:00')
  })

  it('extracts the next weekday', () => {
    const r = parseTaskInput('Buy groceries Saturday', { now })
    expect(r.title).toBe('Buy groceries')
    expect(r.dueDate).toBe('2026-09-12')
    expect(r.dueTime).toBeNull()
  })

  it('extracts weekly recurrence with time', () => {
    const r = parseTaskInput('Submit assignment every Monday at 9 AM', { now })
    expect(r.title).toBe('Submit assignment')
    expect(r.recurrence).toEqual({ frequency: 'weekly', interval: 1, weekdays: [1] })
    expect(r.dueTime).toBe('09:00')
    expect(r.dueDate).toBe('2026-09-07')
  })

  it('keeps names that look like words intact', () => {
    const r = parseTaskInput('Call Rahul tomorrow', { now })
    expect(r.title).toBe('Call Rahul')
    expect(r.dueDate).toBe('2026-09-07')
  })

  it('parses multiple weekdays, intervals and month days', () => {
    expect(parseTaskInput('Gym every Monday and Friday', { now }).recurrence).toEqual({ frequency: 'weekly', interval: 1, weekdays: [1, 5] })
    expect(parseTaskInput('Sprint review every 2 weeks', { now }).recurrence).toEqual({ frequency: 'weekly', interval: 2 })
    expect(parseTaskInput('Pay rent every month on the 1st', { now }).recurrence).toEqual({ frequency: 'monthly', interval: 1, monthDays: [1] })
  })

  it('reads priority, tags, project and duration', () => {
    const r = parseTaskInput('Write report p1 #work @Website for 90 min', { now })
    expect(r.title).toBe('Write report')
    expect(r.priority).toBe(4)
    expect(r.tagNames).toEqual(['work'])
    expect(r.projectName).toBe('Website')
    expect(r.estimatedMinutes).toBe(90)
  })

  it('does not invent a date when none is given', () => {
    const r = parseTaskInput('Think about the roadmap', { now })
    expect(r.dueDate).toBeNull()
    expect(r.recurrence).toBeNull()
    expect(r.priority).toBeNull()
  })

  it('handles explicit dates and 24h times', () => {
    const r = parseTaskInput('Renew license on 15 March at 14:30', { now })
    expect(r.dueDate).toBe('2027-03-15')
    expect(r.dueTime).toBe('14:30')
    expect(r.title).toBe('Renew license')
  })
})
