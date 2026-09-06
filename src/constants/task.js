export const TASK_STATUS = Object.freeze({
  INBOX: 'inbox',
  PLANNED: 'planned',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  ARCHIVED: 'archived',
  CANCELLED: 'cancelled',
})

export const TASK_STATUS_LIST = [
  { value: TASK_STATUS.INBOX, label: 'Inbox' },
  { value: TASK_STATUS.PLANNED, label: 'Planned' },
  { value: TASK_STATUS.IN_PROGRESS, label: 'In progress' },
  { value: TASK_STATUS.COMPLETED, label: 'Completed' },
  { value: TASK_STATUS.ARCHIVED, label: 'Archived' },
  { value: TASK_STATUS.CANCELLED, label: 'Cancelled' },
]

export const OPEN_STATUSES = new Set([TASK_STATUS.INBOX, TASK_STATUS.PLANNED, TASK_STATUS.IN_PROGRESS])
export const CLOSED_STATUSES = new Set([TASK_STATUS.COMPLETED, TASK_STATUS.ARCHIVED, TASK_STATUS.CANCELLED])

export const PRIORITY = Object.freeze({
  NONE: 0,
  LOW: 1,
  MEDIUM: 2,
  HIGH: 3,
  URGENT: 4,
})

export const PRIORITY_LIST = [
  { value: PRIORITY.URGENT, label: 'Urgent', shortLabel: 'P1', token: 'urgent' },
  { value: PRIORITY.HIGH, label: 'High', shortLabel: 'P2', token: 'high' },
  { value: PRIORITY.MEDIUM, label: 'Medium', shortLabel: 'P3', token: 'medium' },
  { value: PRIORITY.LOW, label: 'Low', shortLabel: 'P4', token: 'low' },
  { value: PRIORITY.NONE, label: 'No priority', shortLabel: '', token: 'none' },
]

export const PRIORITY_BY_VALUE = Object.fromEntries(PRIORITY_LIST.map((p) => [p.value, p]))

export const RECURRENCE_FREQUENCY = Object.freeze({
  DAILY: 'daily',
  WEEKLY: 'weekly',
  MONTHLY: 'monthly',
  YEARLY: 'yearly',
})

export const WEEKDAYS = [
  { value: 0, label: 'Sunday', short: 'Sun', letter: 'S' },
  { value: 1, label: 'Monday', short: 'Mon', letter: 'M' },
  { value: 2, label: 'Tuesday', short: 'Tue', letter: 'T' },
  { value: 3, label: 'Wednesday', short: 'Wed', letter: 'W' },
  { value: 4, label: 'Thursday', short: 'Thu', letter: 'T' },
  { value: 5, label: 'Friday', short: 'Fri', letter: 'F' },
  { value: 6, label: 'Saturday', short: 'Sat', letter: 'S' },
]

export const REMINDER_OFFSETS = [
  { value: 0, label: 'At time of task' },
  { value: 5, label: '5 minutes before' },
  { value: 15, label: '15 minutes before' },
  { value: 30, label: '30 minutes before' },
  { value: 60, label: '1 hour before' },
  { value: 24 * 60, label: '1 day before' },
]

export const SNOOZE_OPTIONS = [
  { value: 10, label: '10 minutes' },
  { value: 30, label: '30 minutes' },
  { value: 60, label: '1 hour' },
  { value: 3 * 60, label: '3 hours' },
]

export const DURATION_PRESETS = [15, 30, 45, 60, 90, 120, 180, 240]

export const COLOR_SWATCHES = [
  { id: 'slate', label: 'Slate', hex: '#64748b' },
  { id: 'blue', label: 'Blue', hex: '#3056d3' },
  { id: 'teal', label: 'Teal', hex: '#0f766e' },
  { id: 'green', label: 'Green', hex: '#15803d' },
  { id: 'amber', label: 'Amber', hex: '#b45309' },
  { id: 'orange', label: 'Orange', hex: '#c2410c' },
  { id: 'red', label: 'Red', hex: '#b91c1c' },
  { id: 'pink', label: 'Pink', hex: '#be185d' },
  { id: 'violet', label: 'Violet', hex: '#6d28d9' },
  { id: 'indigo', label: 'Indigo', hex: '#4338ca' },
]

export const COLOR_BY_ID = Object.fromEntries(COLOR_SWATCHES.map((c) => [c.id, c]))

export const PROJECT_ICONS = ['folder', 'briefcase', 'home', 'book-open', 'heart', 'graduation-cap', 'code', 'dumbbell', 'plane', 'shopping-cart', 'palette', 'users']

export const PROJECT_STATUS = Object.freeze({
  ACTIVE: 'active',
  ON_HOLD: 'on_hold',
  COMPLETED: 'completed',
  ARCHIVED: 'archived',
})

export const PROJECT_STATUS_LIST = [
  { value: PROJECT_STATUS.ACTIVE, label: 'Active' },
  { value: PROJECT_STATUS.ON_HOLD, label: 'On hold' },
  { value: PROJECT_STATUS.COMPLETED, label: 'Completed' },
  { value: PROJECT_STATUS.ARCHIVED, label: 'Archived' },
]

export const MAX_TITLE_LENGTH = 500
export const MAX_TEXT_LENGTH = 20000
export const MAX_ATTACHMENT_BYTES = 2 * 1024 * 1024
export const MAX_ATTACHMENTS_PER_TASK = 5
