import { createId } from '../lib/id.js'
import { nowIso, isValidDateKey, isValidTimeKey } from '../lib/dates.js'
import { normalizeText, sanitizeUrl } from '../lib/sanitize.js'
import {
  TASK_STATUS,
  PRIORITY,
  MAX_TITLE_LENGTH,
  MAX_TEXT_LENGTH,
  PROJECT_STATUS,
  COLOR_BY_ID,
  PROJECT_ICONS,
} from '../constants/task.js'
import { normalizeRecurrence } from './recurrence.js'

const STATUS_VALUES = new Set(Object.values(TASK_STATUS))
const PROJECT_STATUS_VALUES = new Set(Object.values(PROJECT_STATUS))

function asString(value, max) {
  return typeof value === 'string' ? normalizeText(value, max) : ''
}

function asNullableString(value, max) {
  const s = asString(value, max)
  return s ? s : null
}

function asIso(value, fallback = null) {
  if (typeof value !== 'string') return fallback
  const t = Date.parse(value)
  return Number.isNaN(t) ? fallback : new Date(t).toISOString()
}

function asDateKey(value) {
  return isValidDateKey(value) ? value : null
}

function asTimeKey(value) {
  return isValidTimeKey(value) ? value : null
}

function asPositiveInt(value, max = 100000) {
  const n = Number(value)
  if (!Number.isFinite(n) || n < 0) return null
  return Math.min(max, Math.round(n))
}

function asIdArray(value) {
  if (!Array.isArray(value)) return []
  return Array.from(new Set(value.filter((v) => typeof v === 'string' && v.length > 0)))
}

function asColorId(value, fallback = 'blue') {
  return typeof value === 'string' && COLOR_BY_ID[value] ? value : fallback
}

export function normalizeSubtask(raw) {
  if (!raw || typeof raw !== 'object') return null
  const title = asString(raw.title, MAX_TITLE_LENGTH)
  if (!title) return null
  return {
    id: typeof raw.id === 'string' && raw.id ? raw.id : createId(),
    title,
    completed: Boolean(raw.completed),
    order: Number.isFinite(raw.order) ? raw.order : 0,
  }
}

export function normalizeAttachment(raw) {
  if (!raw || typeof raw !== 'object') return null
  const name = asString(raw.name, 255)
  if (!name) return null
  return {
    id: typeof raw.id === 'string' && raw.id ? raw.id : createId(),
    name,
    type: asString(raw.type, 128),
    size: asPositiveInt(raw.size, Number.MAX_SAFE_INTEGER) ?? 0,
    createdAt: asIso(raw.createdAt, nowIso()),
  }
}

export function createTask(input = {}) {
  const now = nowIso()
  return normalizeTask({
    id: createId(),
    createdAt: now,
    updatedAt: now,
    status: TASK_STATUS.INBOX,
    priority: PRIORITY.NONE,
    ...input,
  })
}

export function normalizeTask(raw) {
  if (!raw || typeof raw !== 'object') return null
  const title = asString(raw.title, MAX_TITLE_LENGTH)
  const id = typeof raw.id === 'string' && raw.id ? raw.id : null
  if (!id || !title) return null

  const createdAt = asIso(raw.createdAt, nowIso())
  const status = STATUS_VALUES.has(raw.status) ? raw.status : TASK_STATUS.INBOX
  const priorityRaw = Number(raw.priority)
  const priority = Number.isInteger(priorityRaw) && priorityRaw >= PRIORITY.NONE && priorityRaw <= PRIORITY.URGENT ? priorityRaw : PRIORITY.NONE

  const subtasks = Array.isArray(raw.subtasks) ? raw.subtasks.map(normalizeSubtask).filter(Boolean) : []
  subtasks.sort((a, b) => a.order - b.order).forEach((s, i) => (s.order = i))

  const dueDate = asDateKey(raw.dueDate)
  let startDate = asDateKey(raw.startDate)
  let endDate = asDateKey(raw.endDate)
  if (startDate && endDate && startDate > endDate) endDate = startDate

  const completedAt = status === TASK_STATUS.COMPLETED ? asIso(raw.completedAt, nowIso()) : null
  const inferredStatus = status === TASK_STATUS.INBOX && (dueDate || startDate) ? TASK_STATUS.PLANNED : status

  return {
    id,
    title,
    description: asString(raw.description, MAX_TEXT_LENGTH),
    notes: asString(raw.notes, MAX_TEXT_LENGTH),
    status: inferredStatus,
    priority,
    projectId: asNullableString(raw.projectId, 128),
    listId: asNullableString(raw.listId, 128),
    tagIds: asIdArray(raw.tagIds),
    dueDate,
    dueTime: dueDate ? asTimeKey(raw.dueTime) : null,
    startDate,
    endDate,
    allDay: raw.allDay === undefined ? !asTimeKey(raw.dueTime) : Boolean(raw.allDay),
    estimatedMinutes: asPositiveInt(raw.estimatedMinutes, 24 * 60 * 30),
    actualMinutes: asPositiveInt(raw.actualMinutes, 24 * 60 * 365),
    recurrence: normalizeRecurrence(raw.recurrence),
    recurrenceParentId: asNullableString(raw.recurrenceParentId, 128),
    recurrenceAnchor: asDateKey(raw.recurrenceAnchor) || (raw.recurrence ? dueDate : null),
    recurrenceCompletedCount: asPositiveInt(raw.recurrenceCompletedCount, 100000) ?? 0,
    reminderMinutesBefore: asPositiveInt(raw.reminderMinutesBefore, 60 * 24 * 30),
    reminderSnoozedUntil: asIso(raw.reminderSnoozedUntil, null),
    reminderFiredAt: asIso(raw.reminderFiredAt, null),
    subtasks,
    attachments: Array.isArray(raw.attachments) ? raw.attachments.map(normalizeAttachment).filter(Boolean) : [],
    location: asString(raw.location, 500),
    url: sanitizeUrl(raw.url),
    color: typeof raw.color === 'string' && COLOR_BY_ID[raw.color] ? raw.color : null,
    order: Number.isFinite(raw.order) ? raw.order : Date.parse(createdAt),
    createdAt,
    updatedAt: asIso(raw.updatedAt, createdAt),
    completedAt,
    deletedAt: asIso(raw.deletedAt, null),
    focusSessions: asPositiveInt(raw.focusSessions, 1000000) ?? 0,
  }
}

export function createProject(input = {}) {
  const now = nowIso()
  return normalizeProject({ id: createId(), createdAt: now, updatedAt: now, ...input })
}

export function normalizeProject(raw) {
  if (!raw || typeof raw !== 'object') return null
  const id = typeof raw.id === 'string' && raw.id ? raw.id : null
  const name = asString(raw.name, 200)
  if (!id || !name) return null
  const createdAt = asIso(raw.createdAt, nowIso())
  return {
    id,
    name,
    description: asString(raw.description, MAX_TEXT_LENGTH),
    color: asColorId(raw.color, 'blue'),
    icon: PROJECT_ICONS.includes(raw.icon) ? raw.icon : 'folder',
    dueDate: asDateKey(raw.dueDate),
    status: PROJECT_STATUS_VALUES.has(raw.status) ? raw.status : PROJECT_STATUS.ACTIVE,
    order: Number.isFinite(raw.order) ? raw.order : Date.parse(createdAt),
    createdAt,
    updatedAt: asIso(raw.updatedAt, createdAt),
  }
}

export function createList(input = {}) {
  const now = nowIso()
  return normalizeList({ id: createId(), createdAt: now, updatedAt: now, ...input })
}

export function normalizeList(raw) {
  if (!raw || typeof raw !== 'object') return null
  const id = typeof raw.id === 'string' && raw.id ? raw.id : null
  const name = asString(raw.name, 200)
  if (!id || !name) return null
  const createdAt = asIso(raw.createdAt, nowIso())
  return {
    id,
    name,
    color: asColorId(raw.color, 'slate'),
    order: Number.isFinite(raw.order) ? raw.order : Date.parse(createdAt),
    createdAt,
    updatedAt: asIso(raw.updatedAt, createdAt),
  }
}

export function createTag(input = {}) {
  const now = nowIso()
  return normalizeTag({ id: createId(), createdAt: now, ...input })
}

export function normalizeTag(raw) {
  if (!raw || typeof raw !== 'object') return null
  const id = typeof raw.id === 'string' && raw.id ? raw.id : null
  const name = asString(raw.name, 60).replace(/^#/, '').trim()
  if (!id || !name) return null
  return {
    id,
    name,
    color: asColorId(raw.color, 'slate'),
    createdAt: asIso(raw.createdAt, nowIso()),
  }
}

export function createSavedFilter(input = {}) {
  return normalizeSavedFilter({ id: createId(), createdAt: nowIso(), ...input })
}

export function normalizeSavedFilter(raw) {
  if (!raw || typeof raw !== 'object') return null
  const id = typeof raw.id === 'string' && raw.id ? raw.id : null
  const name = asString(raw.name, 100)
  if (!id || !name) return null
  return {
    id,
    name,
    criteria: raw.criteria && typeof raw.criteria === 'object' ? raw.criteria : {},
    createdAt: asIso(raw.createdAt, nowIso()),
  }
}

export function createFocusSession(input = {}) {
  return normalizeFocusSession({ id: createId(), ...input })
}

export function normalizeFocusSession(raw) {
  if (!raw || typeof raw !== 'object') return null
  const id = typeof raw.id === 'string' && raw.id ? raw.id : null
  const startedAt = asIso(raw.startedAt, null)
  if (!id || !startedAt) return null
  return {
    id,
    taskId: asNullableString(raw.taskId, 128),
    startedAt,
    endedAt: asIso(raw.endedAt, null),
    durationSeconds: asPositiveInt(raw.durationSeconds, 60 * 60 * 24) ?? 0,
    completed: Boolean(raw.completed),
  }
}

export const DEFAULT_SETTINGS = Object.freeze({
  weekStartsOn: 1,
  timeFormat: '12h',
  defaultReminderMinutes: null,
  notificationsEnabled: false,
  dayStartHour: 6,
  dayEndHour: 22,
  focusDefaultMinutes: 25,
  showCompletedInLists: false,
  confirmBeforeDelete: true,
  displayName: '',
  onboardingDismissed: false,
})

export function normalizeSettings(raw) {
  const base = { ...DEFAULT_SETTINGS }
  if (!raw || typeof raw !== 'object') return base
  if (raw.weekStartsOn === 0 || raw.weekStartsOn === 1 || raw.weekStartsOn === 6) base.weekStartsOn = raw.weekStartsOn
  if (raw.timeFormat === '12h' || raw.timeFormat === '24h') base.timeFormat = raw.timeFormat
  const reminder = asPositiveInt(raw.defaultReminderMinutes, 60 * 24 * 30)
  base.defaultReminderMinutes = raw.defaultReminderMinutes === null ? null : reminder
  base.notificationsEnabled = Boolean(raw.notificationsEnabled)
  const dayStart = asPositiveInt(raw.dayStartHour, 23)
  const dayEnd = asPositiveInt(raw.dayEndHour, 24)
  if (dayStart !== null && dayEnd !== null && dayStart < dayEnd) {
    base.dayStartHour = dayStart
    base.dayEndHour = dayEnd
  }
  const focus = asPositiveInt(raw.focusDefaultMinutes, 240)
  if (focus) base.focusDefaultMinutes = focus
  base.showCompletedInLists = Boolean(raw.showCompletedInLists)
  base.confirmBeforeDelete = raw.confirmBeforeDelete === undefined ? true : Boolean(raw.confirmBeforeDelete)
  base.displayName = asString(raw.displayName, 80)
  base.onboardingDismissed = Boolean(raw.onboardingDismissed)
  return base
}
