import { addDays, toDateKey, minutesToTimeKey, startOfDay } from './dates.js'
import { PRIORITY, WEEKDAYS } from '../constants/task.js'

const WEEKDAY_NAMES = {
  sunday: 0, sun: 0,
  monday: 1, mon: 1,
  tuesday: 2, tue: 2, tues: 2,
  wednesday: 3, wed: 3,
  thursday: 4, thu: 4, thur: 4, thurs: 4,
  friday: 5, fri: 5,
  saturday: 6, sat: 6,
}

const MONTH_NAMES = {
  january: 1, jan: 1, february: 2, feb: 2, march: 3, mar: 3, april: 4, apr: 4, may: 5,
  june: 6, jun: 6, july: 7, jul: 7, august: 8, aug: 8, september: 9, sep: 9, sept: 9,
  october: 10, oct: 10, november: 11, nov: 11, december: 12, dec: 12,
}

const PRIORITY_WORDS = [
  { pattern: /\b(?:p1|!!!|urgent priority|priority urgent)\b/i, value: PRIORITY.URGENT },
  { pattern: /\b(?:p2|!!|high priority|priority high)\b/i, value: PRIORITY.HIGH },
  { pattern: /\b(?:p3|medium priority|priority medium)\b/i, value: PRIORITY.MEDIUM },
  { pattern: /\b(?:p4|low priority|priority low)\b/i, value: PRIORITY.LOW },
]

const TIME_PATTERN = /\b(?:at\s+)?((?:[01]?\d|2[0-3])(?::([0-5]\d))?\s*(am|pm|a\.m\.|p\.m\.)|(?:[01]?\d|2[0-3]):([0-5]\d))\b/i
const NOON_PATTERN = /\b(?:at\s+)?(noon|midnight|midday)\b/i
const RELATIVE_DAY_PATTERN = /\b(today|tomorrow|tmrw|tonight|day after tomorrow)\b/i
const IN_PATTERN = /\bin\s+(\d{1,3})\s+(day|days|week|weeks|month|months)\b/i
const NEXT_WEEK_PATTERN = /\bnext\s+(week|month)\b/i
const WEEKDAY_PATTERN = new RegExp(`\\b(?:(on|next|this)\\s+)?(${Object.keys(WEEKDAY_NAMES).join('|')})\\b`, 'i')
const MONTH_DAY_PATTERN = new RegExp(`\\b(?:on\\s+)?(?:(\\d{1,2})(?:st|nd|rd|th)?\\s+(${Object.keys(MONTH_NAMES).join('|')})|(${Object.keys(MONTH_NAMES).join('|')})\\s+(\\d{1,2})(?:st|nd|rd|th)?)(?:,?\\s+(\\d{4}))?\\b`, 'i')
const NUMERIC_DATE_PATTERN = /\b(\d{4})-(\d{2})-(\d{2})\b/
const EVERY_PATTERN = new RegExp(
  `\\bevery\\s+(?:(\\d{1,3})\\s+)?(day|days|weekday|weekdays|week|weeks|month|months|year|years|${Object.keys(WEEKDAY_NAMES).join('|')})((?:\\s*(?:,|and|&)\\s*(?:${Object.keys(WEEKDAY_NAMES).join('|')}))*)(?:\\s+on\\s+the\\s+(\\d{1,2})(?:st|nd|rd|th)?)?`,
  'i',
)
const DAILY_PATTERN = /\b(daily|weekly|monthly|yearly|annually)\b/i
const TAG_PATTERN = /(?:^|\s)#([\p{L}\p{N}_-]{1,40})/gu
const PROJECT_PATTERN = /(?:^|\s)@([\p{L}\p{N}_-]{1,40})/gu
const DURATION_PATTERN = /\bfor\s+(\d{1,3})\s*(m|min|mins|minutes|h|hr|hrs|hours)\b/i

function cleanTitle(text) {
  return text
    .replace(/\s{2,}/g, ' ')
    .replace(/\s+([,.;:])/g, '$1')
    .replace(/^[\s,.;:-]+|[\s,.;:-]+$/g, '')
    .trim()
}

function parseTime(text) {
  const noon = NOON_PATTERN.exec(text)
  if (noon) {
    const word = noon[1].toLowerCase()
    const minutes = word === 'midnight' ? 0 : 12 * 60
    return { timeKey: minutesToTimeKey(minutes), match: noon[0] }
  }
  const m = TIME_PATTERN.exec(text)
  if (!m) return null
  let hours
  let mins = 0
  if (m[3]) {
    const [h, mm] = m[1].replace(/\s*(am|pm|a\.m\.|p\.m\.)/i, '').split(':')
    hours = Number(h)
    mins = Number(mm || 0)
    const meridiem = m[3].toLowerCase().replace(/\./g, '')
    if (meridiem === 'pm' && hours < 12) hours += 12
    if (meridiem === 'am' && hours === 12) hours = 0
  } else {
    const [h, mm] = m[1].split(':')
    hours = Number(h)
    mins = Number(mm)
  }
  if (hours > 23 || mins > 59) return null
  return { timeKey: minutesToTimeKey(hours * 60 + mins), match: m[0] }
}

function nextWeekday(from, weekday, forceNextWeek = false) {
  const current = from.getDay()
  let delta = (weekday - current + 7) % 7
  if (delta === 0) delta = 7
  if (forceNextWeek && delta < 7) delta += 7 - ((delta + 7) % 7 === 0 ? 7 : 0)
  return addDays(from, delta)
}

function parseDate(text, now) {
  const today = startOfDay(now)
  const numeric = NUMERIC_DATE_PATTERN.exec(text)
  if (numeric) {
    const date = new Date(Number(numeric[1]), Number(numeric[2]) - 1, Number(numeric[3]))
    if (date.getMonth() === Number(numeric[2]) - 1) return { dateKey: toDateKey(date), match: numeric[0], evening: false }
  }
  const relative = RELATIVE_DAY_PATTERN.exec(text)
  if (relative) {
    const word = relative[1].toLowerCase()
    if (word === 'today') return { dateKey: toDateKey(today), match: relative[0], evening: false }
    if (word === 'tonight') return { dateKey: toDateKey(today), match: relative[0], evening: true }
    if (word === 'day after tomorrow') return { dateKey: toDateKey(addDays(today, 2)), match: relative[0], evening: false }
    return { dateKey: toDateKey(addDays(today, 1)), match: relative[0], evening: false }
  }
  const inMatch = IN_PATTERN.exec(text)
  if (inMatch) {
    const n = Number(inMatch[1])
    const unit = inMatch[2].toLowerCase()
    const days = unit.startsWith('week') ? n * 7 : unit.startsWith('month') ? n * 30 : n
    return { dateKey: toDateKey(addDays(today, days)), match: inMatch[0], evening: false }
  }
  const nextMatch = NEXT_WEEK_PATTERN.exec(text)
  if (nextMatch) {
    const unit = nextMatch[1].toLowerCase()
    const days = unit === 'week' ? 7 : 30
    return { dateKey: toDateKey(addDays(today, days)), match: nextMatch[0], evening: false }
  }
  const monthDay = MONTH_DAY_PATTERN.exec(text)
  if (monthDay) {
    const day = Number(monthDay[1] || monthDay[4])
    const month = MONTH_NAMES[(monthDay[2] || monthDay[3]).toLowerCase()]
    let year = monthDay[5] ? Number(monthDay[5]) : today.getFullYear()
    let date = new Date(year, month - 1, day)
    if (!monthDay[5] && date < today) date = new Date(year + 1, month - 1, day)
    if (date.getMonth() === month - 1) return { dateKey: toDateKey(date), match: monthDay[0], evening: false }
  }
  const weekday = WEEKDAY_PATTERN.exec(text)
  if (weekday) {
    const before = text.slice(0, weekday.index)
    if (/\bevery\s*$/i.test(before)) return null
    const dow = WEEKDAY_NAMES[weekday[2].toLowerCase()]
    const modifier = (weekday[1] || '').toLowerCase()
    const date = nextWeekday(today, dow, modifier === 'next')
    return { dateKey: toDateKey(date), match: weekday[0], evening: false }
  }
  return null
}

function parseRecurrence(text) {
  const every = EVERY_PATTERN.exec(text)
  if (every) {
    const interval = every[1] ? Number(every[1]) : 1
    const unit = every[2].toLowerCase()
    const extraDays = every[3] || ''
    const monthDay = every[4] ? Number(every[4]) : null
    let rule = null
    if (unit.startsWith('day')) rule = { frequency: 'daily', interval }
    else if (unit.startsWith('weekday')) rule = { frequency: 'weekly', interval, weekdays: [1, 2, 3, 4, 5] }
    else if (unit.startsWith('week')) rule = { frequency: 'weekly', interval }
    else if (unit.startsWith('month')) rule = { frequency: 'monthly', interval, monthDays: monthDay ? [monthDay] : [] }
    else if (unit.startsWith('year')) rule = { frequency: 'yearly', interval }
    else if (WEEKDAY_NAMES[unit] !== undefined) {
      const days = [WEEKDAY_NAMES[unit]]
      const re = new RegExp(`(${Object.keys(WEEKDAY_NAMES).join('|')})`, 'gi')
      let m
      while ((m = re.exec(extraDays))) days.push(WEEKDAY_NAMES[m[1].toLowerCase()])
      rule = { frequency: 'weekly', interval, weekdays: Array.from(new Set(days)).sort((a, b) => a - b) }
    }
    if (rule) return { rule, match: every[0] }
  }
  const simple = DAILY_PATTERN.exec(text)
  if (simple) {
    const word = simple[1].toLowerCase()
    const frequency = word === 'daily' ? 'daily' : word === 'weekly' ? 'weekly' : word === 'monthly' ? 'monthly' : 'yearly'
    return { rule: { frequency, interval: 1 }, match: simple[0] }
  }
  return null
}

function firstOccurrenceForRule(rule, now) {
  const today = startOfDay(now)
  if (rule.frequency === 'weekly' && rule.weekdays?.length) {
    for (let i = 0; i < 7; i += 1) {
      const candidate = addDays(today, i)
      if (rule.weekdays.includes(candidate.getDay())) return toDateKey(candidate)
    }
  }
  if (rule.frequency === 'monthly' && rule.monthDays?.length) {
    const day = rule.monthDays[0]
    const candidate = new Date(today.getFullYear(), today.getMonth(), Math.min(day, 28))
    if (candidate >= today) return toDateKey(candidate)
    return toDateKey(new Date(today.getFullYear(), today.getMonth() + 1, Math.min(day, 28)))
  }
  return toDateKey(today)
}

export function parseTaskInput(input, options = {}) {
  const now = options.now || new Date()
  const original = typeof input === 'string' ? input : ''
  let working = original
  const result = {
    title: '',
    dueDate: null,
    dueTime: null,
    recurrence: null,
    priority: null,
    tagNames: [],
    projectName: null,
    estimatedMinutes: null,
    detected: [],
  }

  const recurrence = parseRecurrence(working)
  if (recurrence) {
    result.recurrence = recurrence.rule
    working = working.replace(recurrence.match, ' ')
    result.detected.push('recurrence')
  }

  const date = parseDate(working, now)
  if (date) {
    result.dueDate = date.dateKey
    working = working.replace(date.match, ' ')
    result.detected.push('date')
  }

  const time = parseTime(working)
  if (time) {
    result.dueTime = time.timeKey
    working = working.replace(time.match, ' ')
    result.detected.push('time')
    if (!result.dueDate && !result.recurrence) {
      result.dueDate = toDateKey(now)
      result.detected.push('date')
    }
  } else if (date?.evening) {
    result.dueTime = '20:00'
    result.detected.push('time')
  }

  if (result.recurrence && !result.dueDate) {
    result.dueDate = firstOccurrenceForRule(result.recurrence, now)
    result.detected.push('date')
  }

  for (const { pattern, value } of PRIORITY_WORDS) {
    const m = pattern.exec(working)
    if (m) {
      result.priority = value
      working = working.replace(m[0], ' ')
      result.detected.push('priority')
      break
    }
  }

  const duration = DURATION_PATTERN.exec(working)
  if (duration) {
    const n = Number(duration[1])
    const unit = duration[2].toLowerCase()
    result.estimatedMinutes = unit.startsWith('h') ? n * 60 : n
    working = working.replace(duration[0], ' ')
    result.detected.push('duration')
  }

  working = working.replace(TAG_PATTERN, (full, name) => {
    result.tagNames.push(name)
    return ' '
  })
  working = working.replace(PROJECT_PATTERN, (full, name) => {
    if (!result.projectName) result.projectName = name
    return ' '
  })

  result.title = cleanTitle(working)
  if (!result.title) result.title = cleanTitle(original)
  return result
}

export function describeWeekday(value) {
  return WEEKDAYS[value]?.label || ''
}
