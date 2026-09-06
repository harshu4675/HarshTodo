import { PROJECT_STATUS } from '../../constants/task.js'

export function createEntityActions({ getRepos, getState, dispatch, reportError }) {
  async function guarded(operation, context) {
    try {
      return await operation()
    } catch (error) {
      reportError(error, context)
      throw error
    }
  }

  async function addProject(input) {
    return guarded(async () => {
      const project = await getRepos().projects.add(input)
      dispatch({ type: 'projects/upsert', projects: [project] })
      return project
    }, 'add project')
  }

  async function updateProject(id, patch) {
    return guarded(async () => {
      const current = getState().projects.find((p) => p.id === id)
      if (!current) return null
      const saved = await getRepos().projects.save({ ...current, ...patch })
      dispatch({ type: 'projects/upsert', projects: [saved] })
      return saved
    }, 'update project')
  }

  async function archiveProject(id) {
    return updateProject(id, { status: PROJECT_STATUS.ARCHIVED })
  }

  async function deleteProject(id, { deleteTasks = false } = {}) {
    return guarded(async () => {
      const tasks = getState().tasks.filter((t) => t.projectId === id)
      if (deleteTasks) {
        const stamp = new Date().toISOString()
        const saved = await getRepos().tasks.saveMany(tasks.map((t) => ({ ...t, deletedAt: stamp })))
        dispatch({ type: 'tasks/upsert', tasks: saved })
      } else if (tasks.length) {
        const saved = await getRepos().tasks.saveMany(tasks.map((t) => ({ ...t, projectId: null })))
        dispatch({ type: 'tasks/upsert', tasks: saved })
      }
      await getRepos().projects.remove(id)
      dispatch({ type: 'projects/remove', ids: [id] })
    }, 'delete project')
  }

  async function reorderProjects(orderedIds) {
    return guarded(async () => {
      const byId = new Map(getState().projects.map((p) => [p.id, p]))
      const updated = orderedIds.map((id, i) => ({ ...byId.get(id), order: i })).filter((p) => p.id)
      const saved = await getRepos().projects.saveMany(updated)
      dispatch({ type: 'projects/upsert', projects: saved })
    }, 'reorder projects')
  }

  async function addList(input) {
    return guarded(async () => {
      const list = await getRepos().lists.add(input)
      dispatch({ type: 'lists/upsert', lists: [list] })
      return list
    }, 'add list')
  }

  async function updateList(id, patch) {
    return guarded(async () => {
      const current = getState().lists.find((l) => l.id === id)
      if (!current) return null
      const saved = await getRepos().lists.save({ ...current, ...patch })
      dispatch({ type: 'lists/upsert', lists: [saved] })
      return saved
    }, 'update list')
  }

  async function deleteList(id) {
    return guarded(async () => {
      const tasks = getState().tasks.filter((t) => t.listId === id)
      if (tasks.length) {
        const saved = await getRepos().tasks.saveMany(tasks.map((t) => ({ ...t, listId: null })))
        dispatch({ type: 'tasks/upsert', tasks: saved })
      }
      await getRepos().lists.remove(id)
      dispatch({ type: 'lists/remove', ids: [id] })
    }, 'delete list')
  }

  async function addTag(input) {
    return guarded(async () => {
      const name = String(input.name || '').replace(/^#/, '').trim().toLowerCase()
      const existing = getState().tags.find((t) => t.name.toLowerCase() === name)
      if (existing) return existing
      const tag = await getRepos().tags.add({ ...input, name })
      dispatch({ type: 'tags/upsert', tags: [tag] })
      return tag
    }, 'add tag')
  }

  async function updateTag(id, patch) {
    return guarded(async () => {
      const current = getState().tags.find((t) => t.id === id)
      if (!current) return null
      const saved = await getRepos().tags.save({ ...current, ...patch })
      dispatch({ type: 'tags/upsert', tags: [saved] })
      return saved
    }, 'update tag')
  }

  async function deleteTag(id) {
    return guarded(async () => {
      const tasks = getState().tasks.filter((t) => t.tagIds.includes(id))
      if (tasks.length) {
        const saved = await getRepos().tasks.saveMany(tasks.map((t) => ({ ...t, tagIds: t.tagIds.filter((x) => x !== id) })))
        dispatch({ type: 'tasks/upsert', tasks: saved })
      }
      await getRepos().tags.remove(id)
      dispatch({ type: 'tags/remove', ids: [id] })
    }, 'delete tag')
  }

  async function ensureTagsByName(names) {
    const ids = []
    for (const name of names) {
      const tag = await addTag({ name })
      if (tag) ids.push(tag.id)
    }
    return ids
  }

  async function saveFilter(input) {
    return guarded(async () => {
      const filter = await getRepos().savedFilters.add(input)
      dispatch({ type: 'savedFilters/upsert', savedFilters: [filter] })
      return filter
    }, 'save filter')
  }

  async function deleteSavedFilter(id) {
    return guarded(async () => {
      await getRepos().savedFilters.remove(id)
      dispatch({ type: 'savedFilters/remove', ids: [id] })
    }, 'delete filter')
  }

  async function recordFocusSession(input) {
    return guarded(async () => {
      const session = await getRepos().focusSessions.add(input)
      dispatch({ type: 'focusSessions/upsert', focusSessions: [session] })
      return session
    }, 'record focus session')
  }

  return {
    addProject,
    updateProject,
    archiveProject,
    deleteProject,
    reorderProjects,
    addList,
    updateList,
    deleteList,
    addTag,
    updateTag,
    deleteTag,
    ensureTagsByName,
    saveFilter,
    deleteSavedFilter,
    recordFocusSession,
  }
}
