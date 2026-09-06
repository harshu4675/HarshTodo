import { STORES } from '../database.js'
import { createId } from '../../lib/id.js'
import { normalizeTask, createTask } from '../models.js'
import { nowIso, todayKey } from '../../lib/dates.js'
import { TASK_STATUS } from '../../constants/task.js'
import { nextOccurrence, hasRemainingOccurrences } from '../recurrence.js'

export function createTaskRepository(storage) {
  const store = STORES.TASKS

  async function getAll() {
    const rows = await storage.getAll(store)
    const valid = []
    let corrupt = 0
    for (const row of rows) {
      const task = normalizeTask(row)
      if (task) valid.push(task)
      else corrupt += 1
    }
    return { tasks: valid, corrupt }
  }

  async function getById(id) {
    const row = await storage.get(store, id)
    return row ? normalizeTask(row) : null
  }

  async function save(task) {
    const normalized = normalizeTask({ ...task, updatedAt: nowIso() })
    if (!normalized) throw new Error('Task is missing a title.')
    await storage.put(store, normalized)
    return normalized
  }

  async function saveMany(tasks) {
    const stamp = nowIso()
    const normalized = tasks.map((t) => normalizeTask({ ...t, updatedAt: stamp })).filter(Boolean)
    await storage.putMany(store, normalized)
    return normalized
  }

  async function create(input) {
    const task = createTask(input)
    if (!task) throw new Error('Task is missing a title.')
    await storage.put(store, task)
    return task
  }

  async function update(id, patch) {
    const current = await getById(id)
    if (!current) return null
    return save({ ...current, ...patch, id })
  }

  function buildCompletion(task, completedAt = nowIso()) {
    const completed = {
      ...task,
      status: TASK_STATUS.COMPLETED,
      completedAt,
      reminderSnoozedUntil: null,
    }
    if (!task.recurrence || !task.dueDate) return { completed, next: null }
    const anchor = task.recurrenceAnchor || task.dueDate
    const nextDate = nextOccurrence(task.recurrence, task.dueDate, anchor)
    const completedCount = (task.recurrenceCompletedCount ?? 0) + 1
    if (!nextDate || !hasRemainingOccurrences(task.recurrence, anchor, completedCount)) {
      return { completed: { ...completed, recurrence: null }, next: null }
    }
    const rolled = {
      ...task,
      dueDate: nextDate,
      status: TASK_STATUS.PLANNED,
      completedAt: null,
      reminderFiredAt: null,
      reminderSnoozedUntil: null,
      subtasks: task.subtasks.map((s) => ({ ...s, completed: false })),
      actualMinutes: null,
      recurrenceAnchor: anchor,
      recurrenceCompletedCount: completedCount,
    }
    const archivedInstance = {
      ...completed,
      id: createId(),
      recurrence: null,
      recurrenceParentId: task.id,
      order: task.order - 0.001,
    }
    return { completed: archivedInstance, next: rolled }
  }

  async function complete(id) {
    const task = await getById(id)
    if (!task) return null
    const { completed, next } = buildCompletion(task)
    const toSave = next ? [completed, next] : [completed]
    const saved = await saveMany(toSave)
    return { completed: saved[0], next: next ? saved[1] : null }
  }

  async function reopen(id) {
    const task = await getById(id)
    if (!task) return null
    const status = task.dueDate || task.startDate ? TASK_STATUS.PLANNED : TASK_STATUS.INBOX
    return save({ ...task, status, completedAt: null })
  }

  async function softDelete(ids) {
    const list = Array.isArray(ids) ? ids : [ids]
    const stamp = nowIso()
    const tasks = (await Promise.all(list.map(getById))).filter(Boolean)
    return saveMany(tasks.map((t) => ({ ...t, deletedAt: stamp })))
  }

  async function restore(ids) {
    const list = Array.isArray(ids) ? ids : [ids]
    const tasks = (await Promise.all(list.map(getById))).filter(Boolean)
    return saveMany(tasks.map((t) => ({ ...t, deletedAt: null })))
  }

  async function hardDelete(ids) {
    const list = Array.isArray(ids) ? ids : [ids]
    await storage.deleteMany(store, list)
    return list
  }

  async function emptyTrash() {
    const { tasks } = await getAll()
    const ids = tasks.filter((t) => t.deletedAt).map((t) => t.id)
    if (ids.length) await storage.deleteMany(store, ids)
    return ids
  }

  async function purgeOlderThan(days) {
    const cutoff = Date.now() - days * 24 * 60 * 60 * 1000
    const { tasks } = await getAll()
    const ids = tasks.filter((t) => t.deletedAt && Date.parse(t.deletedAt) < cutoff).map((t) => t.id)
    if (ids.length) await storage.deleteMany(store, ids)
    return ids
  }

  async function count() {
    return storage.count(store)
  }

  return {
    getAll,
    getById,
    save,
    saveMany,
    create,
    update,
    complete,
    reopen,
    softDelete,
    restore,
    hardDelete,
    emptyTrash,
    purgeOlderThan,
    count,
    buildCompletion,
    todayKey,
  }
}
