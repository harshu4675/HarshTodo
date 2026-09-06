export function createMemoryStorage() {
  const stores = new Map()
  const table = (name) => {
    if (!stores.has(name)) stores.set(name, new Map())
    return stores.get(name)
  }
  const keyOf = (name, value) => (name === 'settings' || name === 'meta' ? value.key : value.id)
  return {
    kind: 'memory',
    async getAll(store) {
      return Array.from(table(store).values())
    },
    async get(store, key) {
      return table(store).get(key)
    },
    async put(store, value) {
      table(store).set(keyOf(store, value), value)
      return keyOf(store, value)
    },
    async putMany(store, values) {
      for (const v of values) table(store).set(keyOf(store, v), v)
    },
    async delete(store, key) {
      table(store).delete(key)
    },
    async deleteMany(store, keys) {
      for (const k of keys) table(store).delete(k)
    },
    async clear(store) {
      table(store).clear()
    },
    async clearAll() {
      stores.clear()
    },
    async count(store) {
      return table(store).size
    },
  }
}
