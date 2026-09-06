import { describe, it, expect, beforeEach } from 'vitest'
import { createMemoryStorage } from '../storage/memoryStorage.js'
import { createIndexedDbStorage } from '../storage/indexedDbStorage.js'
import { createRepositories } from './index.js'
import { deleteDatabase, resetDatabaseConnection, openDatabase, STORES, DB_VERSION } from '../database.js'

describe.each([
  ['memory', () => createMemoryStorage()],
  ['indexeddb', () => createIndexedDbStorage()],
])('task repository (%s)', (name, makeStorage) => {
  let repos
  beforeEach(async () => {
    if (name === 'indexeddb') {
      await deleteDatabase()
      resetDatabaseConnection()
    }
    repos = createRepositories(makeStorage())
  })

  it('creates, reads, updates and soft deletes tasks', async () => {
    const task = await repos.tasks.create({ title: 'Ship it', priority: 2 })
    expect(task.id).toBeTruthy()
    expect(task.status).toBe('inbox')
    const updated = await repos.tasks.update(task.id, { dueDate: '2026-09-10' })
    expect(updated.status).toBe('planned')
    expect(updated.updatedAt >= task.updatedAt).toBe(true)
    await repos.tasks.softDelete(task.id)
    const { tasks } = await repos.tasks.getAll()
    expect(tasks[0].deletedAt).toBeTruthy()
    await repos.tasks.restore(task.id)
    expect((await repos.tasks.getById(task.id)).deletedAt).toBeNull()
    await repos.tasks.hardDelete(task.id)
    expect(await repos.tasks.getById(task.id)).toBeNull()
  })

  it('completes a one-off task with a timestamp and can reopen it', async () => {
    const task = await repos.tasks.create({ title: 'Once' })
    const { completed, next } = await repos.tasks.complete(task.id)
    expect(completed.status).toBe('completed')
    expect(completed.completedAt).toBeTruthy()
    expect(next).toBeNull()
    const reopened = await repos.tasks.reopen(task.id)
    expect(reopened.status).toBe('inbox')
    expect(reopened.completedAt).toBeNull()
  })

  it('rolls a recurring task forward and archives the completed instance', async () => {
    const task = await repos.tasks.create({ title: 'Standup', dueDate: '2026-09-07', dueTime: '09:00', recurrence: { frequency: 'daily', interval: 1 }, subtasks: [{ id: 's1', title: 'Notes', completed: true }] })
    const { completed, next } = await repos.tasks.complete(task.id)
    expect(next.id).toBe(task.id)
    expect(next.dueDate).toBe('2026-09-08')
    expect(next.status).toBe('planned')
    expect(next.subtasks[0].completed).toBe(false)
    expect(next.recurrenceCompletedCount).toBe(1)
    expect(completed.id).not.toBe(task.id)
    expect(completed.recurrenceParentId).toBe(task.id)
    expect(completed.recurrence).toBeNull()
    const { tasks } = await repos.tasks.getAll()
    expect(tasks).toHaveLength(2)
  })

  it('stops recurring after the count is exhausted', async () => {
    const task = await repos.tasks.create({ title: 'Twice', dueDate: '2026-01-01', recurrence: { frequency: 'daily', interval: 1, count: 2 } })
    const first = await repos.tasks.complete(task.id)
    expect(first.next.dueDate).toBe('2026-01-02')
    const second = await repos.tasks.complete(task.id)
    expect(second.next).toBeNull()
    expect(second.completed.recurrence).toBeNull()
  })

  it('skips corrupt rows instead of failing', async () => {
    await repos.storage.put(STORES.TASKS, { id: 'broken', title: '' })
    await repos.storage.put(STORES.TASKS, { id: 'weird', title: 'ok', dueDate: 'not-a-date', priority: 99, status: 'nonsense', tagIds: 'x' })
    const { tasks, corrupt } = await repos.tasks.getAll()
    expect(corrupt).toBe(1)
    expect(tasks).toHaveLength(1)
    expect(tasks[0]).toMatchObject({ dueDate: null, priority: 0, status: 'inbox', tagIds: [] })
  })
})

describe('indexeddb migrations', () => {
  it('opens the latest schema with every store and index', async () => {
    await deleteDatabase()
    resetDatabaseConnection()
    const db = await openDatabase()
    expect(db.version).toBe(DB_VERSION)
    for (const store of Object.values(STORES)) expect(db.objectStoreNames.contains(store)).toBe(true)
    const tx = db.transaction(STORES.TASKS)
    expect(tx.store.indexNames.contains('completedAt')).toBe(true)
    db.close()
  })

  it('upgrades a version 1 database in place without losing data', async () => {
    await deleteDatabase()
    resetDatabaseConnection()
    const { openDB } = await import('idb')
    const { MIGRATIONS } = await import('../database.js')
    const v1 = await openDB('harshtodo', 1, { upgrade: (db, o, n, tx) => MIGRATIONS[0].apply(db, tx) })
    await v1.put(STORES.TASKS, { id: 'legacy', title: 'Legacy task', createdAt: '2025-01-01T00:00:00.000Z' })
    v1.close()
    const db = await openDatabase()
    expect(db.version).toBe(DB_VERSION)
    expect(db.objectStoreNames.contains(STORES.FOCUS_SESSIONS)).toBe(true)
    const legacy = await db.get(STORES.TASKS, 'legacy')
    expect(legacy.title).toBe('Legacy task')
    db.close()
  })
})
