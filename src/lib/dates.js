import {
  addDays,
  addMonths,
  addWeeks,
  addYears,
  differenceInCalendarDays,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  getDaysInMonth,
  isAfter,
  isBefore,
  isSameDay,
  isSameMonth,
  isValid,
  parse,
  parseISO,
  startOfDay,
  startOfMonth,
  startOfWeek,
  subDays,
} from 'date-fns'

export const DATE_KEY_FORMAT = 'yyyy-MM-dd'
export const TIME_KEY_FORMAT = 'HH:mm'

export function toDateKey(date) {
  if (!date) return null
  const d = date instanceof Date ? date : new Date(date)
  return isValid(d) ? format(d, DATE_KEY_FORMAT) : null
}

export function fromDateKey(key) {
  if (!key || typeof key !== 'string') return null
  const parsed = parse(key, DATE_KEY_FORMAT, new Date())
  return isValid(parsed) ? parsed : null
}

export function isValidDateKey(key) {
  return fromDateKey(key) !== null
}

export function isValidTimeKey(key) {
  if (!key || typeof key !== 'string') return false
  const match = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(key)
  return match !== null
}

export function toTimeKey(date) {
  const d = date instanceof Date ? date : new Date(date)
  return isValid(d) ? format(d, TIME_KEY_FORMAT) : null
}

export function timeKeyToMinutes(key) {
  if (!isValidTimeKey(key)) return null
  const [h, m] = key.split(':').map(Number)
  return h * 60 + m
}

export function minutesToTimeKey(minutes) {
  const clamped = Math.max(0, Math.min(23 * 60 + 59, Math.round(minutes)))
  const h = Math.floor(clamped / 60)
  const m = clamped % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

export function combineDateAndTime(dateKey, timeKey) {
  const date = fromDateKey(dateKey)
  if (!date) return null
  const minutes = timeKeyToMinutes(timeKey)
  if (minutes === null) return startOfDay(date)
  const result = new Date(date)
  result.setHours(Math.floor(minutes / 60), minutes % 60, 0, 0)
  return result
}

export function todayKey(now = new Date()) {
  return toDateKey(now)
}

export function tomorrowKey(now = new Date()) {
  return toDateKey(addDays(now, 1))
}

export function yesterdayKey(now = new Date()) {
  return toDateKey(subDays(now, 1))
}

export function compareDateKeys(a, b) {
  if (a === b) return 0
  if (!a) return 1
  if (!b) return -1
  return a < b ? -1 : 1
}

export function isOverdue(dateKey, timeKey, now = new Date()) {
  if (!dateKey) return false
  const today = todayKey(now)
  if (dateKey < today) return true
  if (dateKey > today) return false
  if (!timeKey) return false
  const minutes = timeKeyToMinutes(timeKey)
  if (minutes === null) return false
  return minutes < now.getHours() * 60 + now.getMinutes()
}

export function daysUntil(dateKey, now = new Date()) {
  const date = fromDateKey(dateKey)
  if (!date) return null
  return differenceInCalendarDays(date, now)
}

export function formatDateKey(dateKey, pattern = 'EEE, MMM d') {
  const date = fromDateKey(dateKey)
  return date ? format(date, pattern) : ''
}

export function formatTimeKey(timeKey) {
  const minutes = timeKeyToMinutes(timeKey)
  if (minutes === null) return ''
  const date = new Date(2000, 0, 1, Math.floor(minutes / 60), minutes % 60)
  return format(date, 'h:mm a')
}

export function formatRelativeDate(dateKey, now = new Date()) {
  const diff = daysUntil(dateKey, now)
  if (diff === null) return ''
  if (diff === 0) return 'Today'
  if (diff === 1) return 'Tomorrow'
  if (diff === -1) return 'Yesterday'
  if (diff > 1 && diff < 7) return formatDateKey(dateKey, 'EEEE')
  const date = fromDateKey(dateKey)
  const sameYear = date.getFullYear() === now.getFullYear()
  return format(date, sameYear ? 'MMM d' : 'MMM d, yyyy')
}

export function formatTimestamp(iso, pattern = 'MMM d, yyyy h:mm a') {
  if (!iso) return ''
  const date = parseISO(iso)
  return isValid(date) ? format(date, pattern) : ''
}

export function formatDuration(minutes) {
  if (!minutes || minutes <= 0) return ''
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  if (h && m) return `${h}h ${m}m`
  if (h) return `${h}h`
  return `${m}m`
}

export function formatClock(totalSeconds) {
  const safe = Math.max(0, Math.floor(totalSeconds))
  const h = Math.floor(safe / 3600)
  const m = Math.floor((safe % 3600) / 60)
  const s = safe % 60
  const mm = String(m).padStart(2, '0')
  const ss = String(s).padStart(2, '0')
  return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`
}

export function getMonthGrid(monthDate, weekStartsOn = 1) {
  const start = startOfWeek(startOfMonth(monthDate), { weekStartsOn })
  const end = endOfWeek(endOfMonth(monthDate), { weekStartsOn })
  const days = eachDayOfInterval({ start, end })
  while (days.length < 42) days.push(addDays(days[days.length - 1], 1))
  return days.map((date) => ({
    date,
    key: toDateKey(date),
    inMonth: isSameMonth(date, monthDate),
  }))
}

export function getWeekDays(anchor, weekStartsOn = 1) {
  const start = startOfWeek(anchor, { weekStartsOn })
  return Array.from({ length: 7 }, (_, i) => {
    const date = addDays(start, i)
    return { date, key: toDateKey(date) }
  })
}

export function dateKeysInRange(startKey, endKey) {
  const start = fromDateKey(startKey)
  const end = fromDateKey(endKey)
  if (!start || !end || isAfter(start, end)) return []
  return eachDayOfInterval({ start, end }).map(toDateKey)
}

export function shiftDateKey(dateKey, amount, unit = 'day') {
  const date = fromDateKey(dateKey)
  if (!date) return null
  const shifted =
    unit === 'week' ? addWeeks(date, amount) : unit === 'month' ? addMonths(date, amount) : unit === 'year' ? addYears(date, amount) : addDays(date, amount)
  return toDateKey(shifted)
}

export function nowIso() {
  return new Date().toISOString()
}

export function greetingFor(now = new Date()) {
  const hour = now.getHours()
  if (hour < 5) return 'Working late'
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  if (hour < 21) return 'Good evening'
  return 'Good night'
}

export { addDays, addMonths, addWeeks, addYears, differenceInCalendarDays, endOfMonth, endOfWeek, format, getDaysInMonth, isAfter, isBefore, isSameDay, isSameMonth, isValid, parseISO, startOfDay, startOfMonth, startOfWeek, subDays }
