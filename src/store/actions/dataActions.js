import { normalizeTask, normalizeProject, normalizeList, normalizeTag, normalizeSettings } from '../../data/models.js'

export const EXPORT_VERSION = 1

export function createDataActions({ getRepos, getState, dispatch, reportError }) {
  function exportData() {
    const { tasks, projects, lists, tags, savedFilters, focusSessions, settings } = getState()
    return {
      app: 'harshtodo',
      version: EXPORT_VERSION,
      exportedAt: new Date().toISOString(),
      tasks,
      projects,
      lists,
      tags,
      savedFilters,
      focusSessions,
      settings,
    }
  }

  async function importData(payload, { mode = 'merge' } = {}) {
    try {
      if (!payload || typeof payload !== 'object' || payload.app !== 'harshtodo') {
        throw new Error('This file is not a HarshTodo export.')
      }
      const repos = getRepos()
      const tasks = (payload.tasks || []).map(normalizeTask).filter(Boolean)
      const projects = (payload.projects || []).map(normalizeProject).filter(Boolean)
      const lists = (payload.lists || []).map(normalizeList).filter(Boolean)
      const tags = (payload.tags || []).map(normalizeTag).filter(Boolean)
      if (mode === 'replace') {
        await repos.storage.clearAll()
        dispatch({ type: 'data/reset' })
      }
      await Promise.all([
        repos.tasks.saveMany(tasks),
        repos.projects.saveMany(projects),
        repos.lists.saveMany(lists),
        repos.tags.saveMany(tags),
      ])
      dispatch({ type: 'tasks/upsert', tasks })
      dispatch({ type: 'projects/upsert', projects })
      dispatch({ type: 'lists/upsert', lists })
      dispatch({ type: 'tags/upsert', tags })
      if (payload.settings) {
        const settings = await repos.settings.save(normalizeSettings(payload.settings))
        dispatch({ type: 'settings/set', settings })
      }
      return { tasks: tasks.length, projects: projects.length, lists: lists.length, tags: tags.length }
    } catch (error) {
      reportError(error, 'import data')
      throw error
    }
  }

  async function eraseAllData() {
    try {
      const repos = getRepos()
      await repos.storage.clearAll()
      dispatch({ type: 'data/reset' })
      const settings = await repos.settings.save({})
      dispatch({ type: 'settings/set', settings })
    } catch (error) {
      reportError(error, 'erase data')
      throw error
    }
  }

  async function storageEstimate() {
    if (typeof navigator === 'undefined' || !navigator.storage?.estimate) return null
    try {
      const { usage, quota } = await navigator.storage.estimate()
      return { usage: usage || 0, quota: quota || 0 }
    } catch {
      return null
    }
  }

  async function requestPersistentStorage() {
    if (typeof navigator === 'undefined' || !navigator.storage?.persist) return { supported: false, granted: false }
    try {
      const already = await navigator.storage.persisted()
      if (already) return { supported: true, granted: true }
      const granted = await navigator.storage.persist()
      return { supported: true, granted }
    } catch {
      return { supported: true, granted: false }
    }
  }

  return { exportData, importData, eraseAllData, storageEstimate, requestPersistentStorage }
}
