import { STORES } from '../database.js'
import { normalizeSettings } from '../models.js'

const SETTINGS_KEY = 'app'

export function createSettingsRepository(storage) {
  async function get() {
    const row = await storage.get(STORES.SETTINGS, SETTINGS_KEY)
    return normalizeSettings(row?.value)
  }
  async function save(settings) {
    const value = normalizeSettings(settings)
    await storage.put(STORES.SETTINGS, { key: SETTINGS_KEY, value })
    return value
  }
  async function getMeta(key) {
    const row = await storage.get(STORES.META, key)
    return row ? row.value : undefined
  }
  async function setMeta(key, value) {
    await storage.put(STORES.META, { key, value })
  }
  return { get, save, getMeta, setMeta }
}
