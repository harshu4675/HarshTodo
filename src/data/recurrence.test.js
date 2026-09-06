import { describe, it, expect } from 'vitest'
import { nextOccurrence, expandOccurrences, describeRecurrence, normalizeRecurrence, validateRecurrence, occurrenceIndex } from './recurrence.js'

describe('recurrence engine', () => {
  it('advances daily with interval', () => {
    expect(nextOccurrence({ frequency: 'daily', interval: 1 }, '2026-01-31')).toBe('2026-02-01')
    expect(nextOccurrence({ frequency: 'daily', interval: 3 }, '2026-12-30')).toBe('2027-01-02')
  })

  it('handles leap years for yearly rules', () => {
    const rule = { frequency: 'yearly', interval: 1 }
    expect(nextOccurrence(rule, '2024-02-29', '2024-02-29')).toBe('2025-02-28')
    expect(nextOccurrence(rule, '2027-02-28', '2024-02-29')).toBe('2028-02-29')
  })

  it('clamps monthly rules to month length and restores the anchor day', () => {
    const rule = { frequency: 'monthly', interval: 1 }
    expect(nextOccurrence(rule, '2026-01-31', '2026-01-31')).toBe('2026-02-28')
    expect(nextOccurrence(rule, '2026-02-28', '2026-01-31')).toBe('2026-03-31')
  })

  it('supports specific days of month', () => {
    const rule = { frequency: 'monthly', interval: 1, monthDays: [15] }
    expect(nextOccurrence(rule, '2026-03-01')).toBe('2026-03-15')
    expect(nextOccurrence(rule, '2026-03-15')).toBe('2026-04-15')
  })

  it('supports weekday sets across week boundaries', () => {
    const rule = { frequency: 'weekly', interval: 1, weekdays: [1, 5] }
    expect(nextOccurrence(rule, '2026-09-07')).toBe('2026-09-11')
    expect(nextOccurrence(rule, '2026-09-11')).toBe('2026-09-14')
  })

  it('skips weeks for interval greater than one', () => {
    const rule = { frequency: 'weekly', interval: 2, weekdays: [3] }
    expect(nextOccurrence(rule, '2026-09-09')).toBe('2026-09-23')
  })

  it('respects until and count limits', () => {
    expect(nextOccurrence({ frequency: 'daily', interval: 1, until: '2026-01-02' }, '2026-01-02')).toBeNull()
    const keys = expandOccurrences({ frequency: 'daily', interval: 1, count: 3 }, '2026-01-01', '2025-12-01', '2026-02-01')
    expect(keys).toEqual(['2026-01-01', '2026-01-02', '2026-01-03'])
  })

  it('expands only within the requested range', () => {
    const keys = expandOccurrences({ frequency: 'weekly', interval: 1, weekdays: [1, 2, 3, 4, 5] }, '2026-09-01', '2026-09-07', '2026-09-13')
    expect(keys).toEqual(['2026-09-07', '2026-09-08', '2026-09-09', '2026-09-10', '2026-09-11'])
  })

  it('computes occurrence index', () => {
    expect(occurrenceIndex({ frequency: 'daily', interval: 2 }, '2026-01-01', '2026-01-07')).toBe(3)
    expect(occurrenceIndex({ frequency: 'daily', interval: 2 }, '2026-01-01', '2026-01-06')).toBe(-1)
  })

  it('describes rules in plain language', () => {
    expect(describeRecurrence({ frequency: 'weekly', interval: 1, weekdays: [1, 2, 3, 4, 5] })).toBe('Every weekday')
    expect(describeRecurrence({ frequency: 'monthly', interval: 1, monthDays: [15] })).toBe('Every month on the 15th')
    expect(describeRecurrence({ frequency: 'weekly', interval: 2 })).toBe('Every 2 weeks')
    expect(describeRecurrence(null)).toBe('Does not repeat')
  })

  it('rejects invalid rules and normalizes junk', () => {
    expect(normalizeRecurrence({ frequency: 'hourly' })).toBeNull()
    expect(normalizeRecurrence({ frequency: 'weekly', interval: -4, weekdays: [9, 1, 1] })).toEqual({ frequency: 'weekly', interval: 1, weekdays: [1], monthDays: [], month: null, count: null, until: null })
    expect(validateRecurrence({ frequency: 'daily', count: 3, until: '2026-01-01' }).valid).toBe(false)
  })
})
