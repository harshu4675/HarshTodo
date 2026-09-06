import { openDB } from 'idb'

export const DB_NAME = 'harshtodo'
export const DB_VERSION = 2

export const STORES = Object.freeze({
  TASKS: 'tasks',
  PROJECTS: 'projects',
  LISTS: 'lists',
  TAGS: 'tags',
  SETTINGS: 'settings',
  SAVED_FILTERS: 'savedFilters',
  FOCUS_SESSIONS: 'focusSessions',
  ATTACHMENT_BLOBS: 'attachmentBlobs',
  META: 'meta',
})

export const MIGRATIONS = [
  {
    version: 1,
    apply(db) {
      const tasks = db.createObjectStore(STORES.TASKS, { keyPath: 'id' })
      tasks.createIndex('status', 'status')
      tasks.createIndex('dueDate', 'dueDate')
      tasks.createIndex('projectId', 'projectId')
      tasks.createIndex('listId', 'listId')
      tasks.createIndex('updatedAt', 'updatedAt')
      tasks.createIndex('deletedAt', 'deletedAt')
      db.createObjectStore(STORES.PROJECTS, { keyPath: 'id' })
      db.createObjectStore(STORES.LISTS, { keyPath: 'id' })
      db.createObjectStore(STORES.TAGS, { keyPath: 'id' })
      db.createObjectStore(STORES.SETTINGS, { keyPath: 'key' })
      db.createObjectStore(STORES.META, { keyPath: 'key' })
    },
  },
  {
    version: 2,
    apply(db, transaction) {
      db.createObjectStore(STORES.SAVED_FILTERS, { keyPath: 'id' })
      const focus = db.createObjectStore(STORES.FOCUS_SESSIONS, { keyPath: 'id' })
      focus.createIndex('taskId', 'taskId')
      focus.createIndex('startedAt', 'startedAt')
      db.createObjectStore(STORES.ATTACHMENT_BLOBS, { keyPath: 'id' })
      const tasks = transaction.objectStore(STORES.TASKS)
      if (!tasks.indexNames.contains('completedAt')) tasks.createIndex('completedAt', 'completedAt')
    },
  },
]

export function runMigrations(db, oldVersion, newVersion, transaction) {
  for (const migration of MIGRATIONS) {
    if (migration.version > oldVersion && migration.version <= newVersion) {
      migration.apply(db, transaction)
    }
  }
}

export function isIndexedDbAvailable() {
  try {
    return typeof indexedDB !== 'undefined' && indexedDB !== null
  } catch {
    return false
  }
}

let dbPromise = null

export function openDatabase(name = DB_NAME) {
  if (dbPromise) return dbPromise
  dbPromise = openDB(name, DB_VERSION, {
    upgrade(db, oldVersion, newVersion, transaction) {
      runMigrations(db, oldVersion, newVersion ?? DB_VERSION, transaction)
    },
    blocked() {},
    blocking() {
      if (dbPromise) {
        dbPromise.then((db) => db.close()).catch(() => {})
        dbPromise = null
      }
    },
    terminated() {
      dbPromise = null
    },
  }).catch((error) => {
    dbPromise = null
    throw error
  })
  return dbPromise
}

export function resetDatabaseConnection() {
  dbPromise = null
}

export async function deleteDatabase(name = DB_NAME) {
  if (dbPromise) {
    const db = await dbPromise.catch(() => null)
    if (db) db.close()
    dbPromise = null
  }
  await new Promise((resolve, reject) => {
    const request = indexedDB.deleteDatabase(name)
    request.onsuccess = () => resolve()
    request.onerror = () => reject(request.error)
    request.onblocked = () => resolve()
  })
}
