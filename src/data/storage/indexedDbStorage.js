import { openDatabase, STORES } from '../database.js'
import { toStorageError } from '../errors.js'

async function run(operation) {
  try {
    const db = await openDatabase()
    return await operation(db)
  } catch (error) {
    throw toStorageError(error)
  }
}

export function createIndexedDbStorage() {
  return {
    kind: 'indexeddb',
    getAll(store) {
      return run((db) => db.getAll(store))
    },
    get(store, key) {
      return run((db) => db.get(store, key))
    },
    put(store, value) {
      return run((db) => db.put(store, value))
    },
    putMany(store, values) {
      return run(async (db) => {
        const tx = db.transaction(store, 'readwrite')
        await Promise.all([...values.map((v) => tx.store.put(v)), tx.done])
      })
    },
    delete(store, key) {
      return run((db) => db.delete(store, key))
    },
    deleteMany(store, keys) {
      return run(async (db) => {
        const tx = db.transaction(store, 'readwrite')
        await Promise.all([...keys.map((k) => tx.store.delete(k)), tx.done])
      })
    },
    clear(store) {
      return run((db) => db.clear(store))
    },
    clearAll() {
      return run(async (db) => {
        const names = Object.values(STORES)
        const tx = db.transaction(names, 'readwrite')
        await Promise.all([...names.map((n) => tx.objectStore(n).clear()), tx.done])
      })
    },
    count(store) {
      return run((db) => db.count(store))
    },
  }
}
