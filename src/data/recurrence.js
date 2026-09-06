import { RECURRENCE_FREQUENCY, WEEKDAYS } from '../constants/task.js'
import { fromDateKey, toDateKey, isValidDateKey, addDays, addMonths, addYears, getDaysInMonth, startOfDay } from '../lib/dates.js'

const FREQUENCIES = new Set(Object.values(RECURRENCE_FREQUENCY))
const MAX_ITERATIONS = 5000

export function normalizeRecurrence(raw) {
  if (!raw || typeof raw !== 'object') return null
  if (!FREQUENCIES.has(raw.frequency)) return null
  const interval = Number.isInteger(raw.interval) && raw.interval > 0 ? Math.min(raw.interval, 999) : 1
  const weekdays = Array.isArray(raw.weekdays)
    ? Array.from(new Set(raw.weekdays.filter((d) => Number.isInteger(d) && d >= 0 && d <= 6))).sort((a, b) => a - b)
    : []
  const monthDays = Array.isArray(raw.monthDays)
    ? Array.from(new Set(raw.monthDays.filter((d) => Number.isInteger(d) && d >= 1 && d <= 31))).sort((a, b) => a - b)
    : []
  const count = Number.isInteger(raw.count) && raw.count > 0 ? Math.min(raw.count, 10000) : null
  const until = isValidDateKey(raw.until) ? raw.until : null
  const month = Number.isInteger(raw.month) && raw.month >= 1 && raw.month <= 12 ? raw.month : null
  return {
    frequency: raw.frequency,
    interval,
    weekdays: raw.frequency === RECURRENCE_FREQUENCY.WEEKLY ? weekdays : [],
    monthDays: raw.frequency === RECURRENCE_FREQUENCY.MONTHLY ? monthDays : [],
    month: raw.frequency === RECURRENCE_FREQUENCY.YEARLY ? month : null,
    count,
    until,
  }
}

export function validateRecurrence(rule) {
  const normalized = normalizeRecurrence(rule)
  if (!normalized) return { valid: false, reason: 'A repeat frequency is required.' }
  if (normalized.count !== null && normalized.until) return { valid: false, reason: 'Choose either an end date or a number of occurrences, not both.' }
  return { valid: true, rule: normalized }
}

function clampDayOfMonth(year, monthIndex, day) {
  const date = new Date(year, monthIndex, 1)
  const days = getDaysInMonth(date)
  return new Date(year, monthIndex, Math.min(day, days))
}

function nextDaily(current, rule) {
  return addDays(current, rule.interval)
}

function nextWeekly(current, rule) {
  const days = rule.weekdays.length ? rule.weekdays : [current.getDay()]
  const currentDow = current.getDay()
  for (const dow of days) {
    if (dow > currentDow) return addDays(current, dow - currentDow)
  }
  const weekStart = addDays(current, -currentDow)
  const nextWeekStart = addDays(weekStart, 7 * rule.interval)
  return addDays(nextWeekStart, days[0])
}

function nextMonthly(current, rule, anchorDay) {
  const days = rule.monthDays.length ? rule.monthDays : [anchorDay]
  const year = current.getFullYear()
  const monthIndex = current.getMonth()
  const dim = getDaysInMonth(current)
  for (const d of days) {
    const effective = Math.min(d, dim)
    if (effective > current.getDate()) return new Date(year, monthIndex, effective)
  }
  const next = addMonths(new Date(year, monthIndex, 1), rule.interval)
  return clampDayOfMonth(next.getFullYear(), next.getMonth(), days[0])
}

function nextYearly(current, rule, anchor) {
  const next = addYears(new Date(current.getFullYear(), 0, 1), rule.interval)
  const monthIndex = rule.month ? rule.month - 1 : anchor.getMonth()
  return clampDayOfMonth(next.getFullYear(), monthIndex, anchor.getDate())
}

export function nextOccurrence(rule, fromDateKey, anchorDateKey = fromDateKey) {
  const normalized = normalizeRecurrence(rule)
  const current = fromDateKey ? fromDateKeySafe(fromDateKey) : null
  const anchor = fromDateKeySafe(anchorDateKey) || current
  if (!normalized || !current || !anchor) return null
  let next
  switch (normalized.frequency) {
    case RECURRENCE_FREQUENCY.DAILY:
      next = nextDaily(current, normalized)
      break
    case RECURRENCE_FREQUENCY.WEEKLY:
      next = nextWeekly(current, normalized)
      break
    case RECURRENCE_FREQUENCY.MONTHLY:
      next = nextMonthly(current, normalized, anchor.getDate())
      break
    case RECURRENCE_FREQUENCY.YEARLY:
      next = nextYearly(current, normalized, anchor)
      break
    default:
      return null
  }
  const key = toDateKey(next)
  if (normalized.until && key > normalized.until) return null
  return key
}

function fromDateKeySafe(key) {
  const d = fromDateKey(key)
  return d ? startOfDay(d) : null
}

export function expandOccurrences(rule, anchorDateKey, rangeStartKey, rangeEndKey, options = {}) {
  const normalized = normalizeRecurrence(rule)
  const anchor = fromDateKeySafe(anchorDateKey)
  if (!normalized || !anchor || !rangeStartKey || !rangeEndKey) return []
  const limit = options.limit ?? 500
  const results = []
  let currentKey = anchorDateKey
  let produced = 1
  let iterations = 0
  if (currentKey >= rangeStartKey && currentKey <= rangeEndKey) results.push(currentKey)
  while (iterations < MAX_ITERATIONS && results.length < limit) {
    iterations += 1
    if (normalized.count !== null && produced >= normalized.count) break
    const nextKey = nextOccurrence(normalized, currentKey, anchorDateKey)
    if (!nextKey || nextKey <= currentKey) break
    produced += 1
    currentKey = nextKey
    if (currentKey > rangeEndKey) break
    if (currentKey >= rangeStartKey) results.push(currentKey)
  }
  return results
}

export function occurrenceIndex(rule, anchorDateKey, targetDateKey) {
  const normalized = normalizeRecurrence(rule)
  if (!normalized || !anchorDateKey || !targetDateKey) return -1
  let currentKey = anchorDateKey
  let index = 0
  let iterations = 0
  while (currentKey && currentKey < targetDateKey && iterations < MAX_ITERATIONS) {
    iterations += 1
    currentKey = nextOccurrence(normalized, currentKey, anchorDateKey)
    index += 1
  }
  return currentKey === targetDateKey ? index : -1
}

export function hasRemainingOccurrences(rule, anchorDateKey, completedCount) {
  const normalized = normalizeRecurrence(rule)
  if (!normalized) return false
  if (normalized.count !== null && completedCount >= normalized.count) return false
  return true
}

export function describeRecurrence(rule) {
  const r = normalizeRecurrence(rule)
  if (!r) return 'Does not repeat'
  const every = (unit) => (r.interval === 1 ? `Every ${unit}` : `Every ${r.interval} ${unit}s`)
  let base
  switch (r.frequency) {
    case RECURRENCE_FREQUENCY.DAILY:
      base = every('day')
      break
    case RECURRENCE_FREQUENCY.WEEKLY: {
      const isWeekdays = r.weekdays.length === 5 && r.weekdays.every((d) => d >= 1 && d <= 5)
      if (isWeekdays && r.interval === 1) base = 'Every weekday'
      else if (r.weekdays.length) {
        const names = r.weekdays.map((d) => WEEKDAYS[d].short).join(', ')
        base = r.interval === 1 ? `Weekly on ${names}` : `Every ${r.interval} weeks on ${names}`
      } else base = every('week')
      break
    }
    case RECURRENCE_FREQUENCY.MONTHLY:
      base = r.monthDays.length ? `${every('month')} on the ${r.monthDays.map(ordinal).join(', ')}` : every('month')
      break
    case RECURRENCE_FREQUENCY.YEARLY:
      base = every('year')
      break
    default:
      base = 'Repeats'
  }
  if (r.until) base += ` until ${r.until}`
  else if (r.count) base += `, ${r.count} times`
  return base
}

export function ordinal(n) {
  const mod100 = n % 100
  if (mod100 >= 11 && mod100 <= 13) return `${n}th`
  switch (n % 10) {
    case 1:
      return `${n}st`
    case 2:
      return `${n}nd`
    case 3:
      return `${n}rd`
    default:
      return `${n}th`
  }
}

export const RECURRENCE_PRESETS = [
  { id: 'none', label: 'Does not repeat', rule: null },
  { id: 'daily', label: 'Every day', rule: { frequency: 'daily', interval: 1 } },
  { id: 'weekdays', label: 'Every weekday', rule: { frequency: 'weekly', interval: 1, weekdays: [1, 2, 3, 4, 5] } },
  { id: 'weekly', label: 'Every week', rule: { frequency: 'weekly', interval: 1 } },
  { id: 'biweekly', label: 'Every 2 weeks', rule: { frequency: 'weekly', interval: 2 } },
  { id: 'monthly', label: 'Every month', rule: { frequency: 'monthly', interval: 1 } },
  { id: 'yearly', label: 'Every year', rule: { frequency: 'yearly', interval: 1 } },
  { id: 'custom', label: 'Custom', rule: undefined },
]
