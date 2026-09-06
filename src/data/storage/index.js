import { isIndexedDbAvailable, openDatabase } from '../database.js'
import { createIndexedDbStorage } from './indexedDbStorage.js'
import { createMemoryStorage } from './memoryStorage.js'

export async function createStorage() {
  if (!isIndexedDbAvailable()) {
    return { storage: createMemoryStorage(), persistent: false, reason: 'IndexedDB is not available in this browser.' }
  }
  try {
    await openDatabase()
    return { storage: createIndexedDbStorage(), persistent: true, reason: null }
  } catch (error) {
    return {
      storage: createMemoryStorage(),
      persistent: false,
      reason: error?.message ? `IndexedDB could not be opened: ${error.message}` : 'IndexedDB could not be opened.',
    }
  }
}
