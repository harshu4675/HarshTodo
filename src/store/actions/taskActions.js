import { TASK_STATUS, PRIORITY } from '../../constants/task.js'
import { nowIso, todayKey, shiftDateKey } from '../../lib/dates.js'
import { createId } from '../../lib/id.js'

export function createTaskActions({ getRepos, getState, dispatch, reportError }) {
  async function persistTasks(tasks) {
    const saved = await getRepos().tasks.saveMany(tasks)
    dispatch({ type: 'tasks/upsert', tasks: saved })
    return saved
  }

  function findTasks(ids) {
    const set = new Set(ids)
    return getState().tasks.filter((t) => set.has(t.id))
  }

  async function guarded(operation, context) {
    try {
      return await operation()
    } catch (error) {
      reportError(error, context)
      throw error
    }
  }

  function nextOrder(tasks, scope) {
    const scoped = scope ? tasks.filter(scope) : tasks
    const min = scoped.reduce((acc, t) => Math.min(acc, t.order), Number.POSITIVE_INFINITY)
    return Number.isFinite(min) ? min - 1 : Date.now()
  }

  async function addTask(input) {
    return guarded(async () => {
      const settings = getState().settings
      const reminder = input.reminderMinutesBefore === undefined && input.dueTime ? settings?.defaultReminderMinutes ?? null : input.reminderMinutesBefore ?? null
      const order = input.order ?? nextOrder(getState().tasks)
      const task = await getRepos().tasks.create({ ...input, reminderMinutesBefore: reminder, order })
      dispatch({ type: 'tasks/upsert', tasks: [task] })
      return task
    }, 'add task')
  }

  async function updateTask(id, patch) {
    return guarded(async () => {
      const current = getState().tasks.find((t) => t.id === id)
      if (!current) return null
      const merged = { ...current, ...patch }
      if (patch.dueDate !== undefined || patch.dueTime !== undefined) {
        merged.reminderFiredAt = null
        merged.reminderSnoozedUntil = null
      }
      if (merged.status === TASK_STATUS.INBOX && (merged.dueDate || merged.startDate)) merged.status = TASK_STATUS.PLANNED
      const [saved] = await persistTasks([merged])
      return saved
    }, 'update task')
  }

  async function updateTasks(ids, patchOrFn) {
    return guarded(async () => {
      const tasks = findTasks(ids)
      const updated = tasks.map((t) => {
        const patch = typeof patchOrFn === 'function' ? patchOrFn(t) : patchOrFn
        return { ...t, ...patch }
      })
      return persistTasks(updated)
    }, 'update tasks')
  }

  async function completeTask(id) {
    return guarded(async () => {
      const result = await getRepos().tasks.complete(id)
      if (!result) return null
      const toUpsert = result.next ? [result.completed, result.next] : [result.completed]
      dispatch({ type: 'tasks/upsert', tasks: toUpsert })
      return result
    }, 'complete task')
  }

  async function completeTasks(ids) {
    return guarded(async () => {
      const tasks = findTasks(ids).filter((t) => t.status !== TASK_STATUS.COMPLETED)
      const stamp = nowIso()
      const repo = getRepos().tasks
      const batch = []
      for (const task of tasks) {
        const { completed, next } = repo.buildCompletion(task, stamp)
        batch.push(completed)
        if (next) batch.push(next)
      }
      return persistTasks(batch)
    }, 'complete tasks')
  }

  async function reopenTask(id) {
    return guarded(async () => {
      const task = await getRepos().tasks.reopen(id)
      if (task) dispatch({ type: 'tasks/upsert', tasks: [task] })
      return task
    }, 'reopen task')
  }

  async function toggleTask(id) {
    const task = getState().tasks.find((t) => t.id === id)
    if (!task) return null
    return task.status === TASK_STATUS.COMPLETED ? reopenTask(id) : completeTask(id)
  }

  async function trashTasks(ids) {
    return guarded(async () => {
      const list = Array.isArray(ids) ? ids : [ids]
      const saved = await getRepos().tasks.softDelete(list)
      dispatch({ type: 'tasks/upsert', tasks: saved })
      return saved
    }, 'move to trash')
  }

  async function restoreTasks(ids) {
    return guarded(async () => {
      const list = Array.isArray(ids) ? ids : [ids]
      const saved = await getRepos().tasks.restore(list)
      dispatch({ type: 'tasks/upsert', tasks: saved })
      return saved
    }, 'restore tasks')
  }

  async function deleteTasksForever(ids) {
    return guarded(async () => {
      const list = Array.isArray(ids) ? ids : [ids]
      const tasks = findTasks(list)
      const blobIds = tasks.flatMap((t) => t.attachments.map((a) => a.id))
      await getRepos().attachments.deleteBlobs(blobIds)
      await getRepos().tasks.hardDelete(list)
      dispatch({ type: 'tasks/remove', ids: list })
      return list
    }, 'delete forever')
  }

  async function emptyTrash() {
    return guarded(async () => {
      const trashed = getState().tasks.filter((t) => t.deletedAt)
      return deleteTasksForever(trashed.map((t) => t.id))
    }, 'empty trash')
  }

  async function archiveTasks(ids) {
    return updateTasks(ids, { status: TASK_STATUS.ARCHIVED })
  }

  async function unarchiveTasks(ids) {
    return updateTasks(ids, (t) => ({ status: t.dueDate ? TASK_STATUS.PLANNED : TASK_STATUS.INBOX }))
  }

  async function setPriority(ids, priority) {
    return updateTasks(ids, { priority })
  }

  async function setProject(ids, projectId) {
    return updateTasks(ids, (t) => ({ projectId, status: t.status === TASK_STATUS.INBOX && projectId ? TASK_STATUS.PLANNED : t.status }))
  }

  async function setList(ids, listId) {
    return updateTasks(ids, { listId })
  }

  async function setDueDate(ids, dueDate, dueTime) {
    return updateTasks(ids, (t) => ({
      dueDate,
      dueTime: dueDate ? (dueTime === undefined ? t.dueTime : dueTime) : null,
      allDay: dueDate ? !(dueTime === undefined ? t.dueTime : dueTime) : true,
      status: dueDate && t.status === TASK_STATUS.INBOX ? TASK_STATUS.PLANNED : t.status,
      reminderFiredAt: null,
      reminderSnoozedUntil: null,
    }))
  }

  async function rescheduleTask(id, dueDate, dueTime) {
    return setDueDate([id], dueDate, dueTime)
  }

  async function postponeTasks(ids, days) {
    return updateTasks(ids, (t) => {
      const base = t.dueDate && t.dueDate > todayKey() ? t.dueDate : todayKey()
      return { dueDate: shiftDateKey(base, days), status: t.status === TASK_STATUS.INBOX ? TASK_STATUS.PLANNED : t.status, reminderFiredAt: null, reminderSnoozedUntil: null }
    })
  }

  async function addTagToTasks(ids, tagId) {
    return updateTasks(ids, (t) => ({ tagIds: t.tagIds.includes(tagId) ? t.tagIds : [...t.tagIds, tagId] }))
  }

  async function removeTagFromTasks(ids, tagId) {
    return updateTasks(ids, (t) => ({ tagIds: t.tagIds.filter((id) => id !== tagId) }))
  }

  async function setStatus(ids, status) {
    return updateTasks(ids, (t) => ({
      status,
      completedAt: status === TASK_STATUS.COMPLETED ? t.completedAt || nowIso() : null,
    }))
  }

  async function reorderTasks(orderedIds) {
    return guarded(async () => {
      const tasks = findTasks(orderedIds)
      const byId = new Map(tasks.map((t) => [t.id, t]))
      const existing = orderedIds.map((id) => byId.get(id)).filter(Boolean)
      const orders = existing.map((t) => t.order).sort((a, b) => a - b)
      const updated = existing.map((t, i) => ({ ...t, order: orders[i] ?? i }))
      const changed = updated.filter((t) => byId.get(t.id).order !== t.order)
      if (!changed.length) return []
      return persistTasks(changed)
    }, 'reorder tasks')
  }

  async function moveTaskBefore(taskId, targetId, siblings) {
    const ids = siblings.map((t) => t.id).filter((id) => id !== taskId)
    const idx = targetId ? ids.indexOf(targetId) : ids.length
    ids.splice(idx === -1 ? ids.length : idx, 0, taskId)
    return reorderTasks(ids)
  }

  async function addSubtask(taskId, title) {
    const task = getState().tasks.find((t) => t.id === taskId)
    if (!task) return null
    const subtask = { id: createId(), title, completed: false, order: task.subtasks.length }
    return updateTask(taskId, { subtasks: [...task.subtasks, subtask] })
  }

  async function updateSubtask(taskId, subtaskId, patch) {
    const task = getState().tasks.find((t) => t.id === taskId)
    if (!task) return null
    return updateTask(taskId, { subtasks: task.subtasks.map((s) => (s.id === subtaskId ? { ...s, ...patch } : s)) })
  }

  async function removeSubtask(taskId, subtaskId) {
    const task = getState().tasks.find((t) => t.id === taskId)
    if (!task) return null
    return updateTask(taskId, { subtasks: task.subtasks.filter((s) => s.id !== subtaskId) })
  }

  async function reorderSubtasks(taskId, orderedIds) {
    const task = getState().tasks.find((t) => t.id === taskId)
    if (!task) return null
    const byId = new Map(task.subtasks.map((s) => [s.id, s]))
    const subtasks = orderedIds.map((id, i) => ({ ...byId.get(id), order: i })).filter((s) => s.id)
    return updateTask(taskId, { subtasks })
  }

  async function addAttachment(taskId, file) {
    return guarded(async () => {
      const task = getState().tasks.find((t) => t.id === taskId)
      if (!task) return null
      const id = createId()
      await getRepos().attachments.putBlob(id, file)
      const attachment = { id, name: file.name, type: file.type, size: file.size, createdAt: nowIso() }
      return updateTask(taskId, { attachments: [...task.attachments, attachment] })
    }, 'add attachment')
  }

  async function removeAttachment(taskId, attachmentId) {
    return guarded(async () => {
      const task = getState().tasks.find((t) => t.id === taskId)
      if (!task) return null
      await getRepos().attachments.deleteBlobs([attachmentId])
      return updateTask(taskId, { attachments: task.attachments.filter((a) => a.id !== attachmentId) })
    }, 'remove attachment')
  }

  async function getAttachmentBlob(attachmentId) {
    return getRepos().attachments.getBlob(attachmentId)
  }

  async function duplicateTask(id) {
    const task = getState().tasks.find((t) => t.id === id)
    if (!task) return null
    const { id: _id, createdAt, updatedAt, completedAt, deletedAt, attachments, focusSessions, ...rest } = task
    return addTask({ ...rest, title: `${task.title} (copy)`, status: task.status === TASK_STATUS.COMPLETED ? TASK_STATUS.PLANNED : task.status, subtasks: task.subtasks.map((s) => ({ ...s, id: createId(), completed: false })) })
  }

  async function markReminderFired(id, firedAt = nowIso()) {
    return updateTask(id, { reminderFiredAt: firedAt, reminderSnoozedUntil: null })
  }

  async function snoozeReminder(id, minutes) {
    const until = new Date(Date.now() + minutes * 60000).toISOString()
    return updateTask(id, { reminderSnoozedUntil: until, reminderFiredAt: null })
  }

  async function recordFocusTime(id, seconds, completedSession) {
    const task = getState().tasks.find((t) => t.id === id)
    if (!task) return null
    const minutes = Math.round(seconds / 60)
    return updateTask(id, {
      actualMinutes: (task.actualMinutes || 0) + minutes,
      focusSessions: task.focusSessions + (completedSession ? 1 : 0),
      status: task.status === TASK_STATUS.INBOX || task.status === TASK_STATUS.PLANNED ? TASK_STATUS.IN_PROGRESS : task.status,
    })
  }

  return {
    addTask,
    updateTask,
    updateTasks,
    completeTask,
    completeTasks,
    reopenTask,
    toggleTask,
    trashTasks,
    restoreTasks,
    deleteTasksForever,
    emptyTrash,
    archiveTasks,
    unarchiveTasks,
    setPriority,
    setProject,
    setList,
    setDueDate,
    rescheduleTask,
    postponeTasks,
    addTagToTasks,
    removeTagFromTasks,
    setStatus,
    reorderTasks,
    moveTaskBefore,
    addSubtask,
    updateSubtask,
    removeSubtask,
    reorderSubtasks,
    addAttachment,
    removeAttachment,
    getAttachmentBlob,
    duplicateTask,
    markReminderFired,
    snoozeReminder,
    recordFocusTime,
    PRIORITY,
  }
}
