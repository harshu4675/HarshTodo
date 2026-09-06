import { nowIso } from '../../lib/dates.js'

export function createEntityRepository(storage, storeName, { normalize, create }) {
  async function getAll() {
    const rows = await storage.getAll(storeName)
    return rows.map(normalize).filter(Boolean)
  }
  async function getById(id) {
    const row = await storage.get(storeName, id)
    return row ? normalize(row) : null
  }
  async function add(input) {
    const entity = create(input)
    if (!entity) throw new Error('Name is required.')
    await storage.put(storeName, entity)
    return entity
  }
  async function save(entity) {
    const normalized = normalize({ ...entity, updatedAt: nowIso() })
    if (!normalized) throw new Error('Name is required.')
    await storage.put(storeName, normalized)
    return normalized
  }
  async function saveMany(entities) {
    const normalized = entities.map((e) => normalize(e)).filter(Boolean)
    await storage.putMany(storeName, normalized)
    return normalized
  }
  async function remove(id) {
    await storage.delete(storeName, id)
  }
  return { getAll, getById, add, save, saveMany, remove }
}
