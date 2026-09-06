export const initialState = {
  status: 'booting',
  bootError: null,
  persistent: true,
  storageNotice: null,
  corruptCount: 0,
  tasks: [],
  projects: [],
  lists: [],
  tags: [],
  savedFilters: [],
  focusSessions: [],
  settings: null,
}

function upsertMany(items, incoming) {
  const map = new Map(items.map((i) => [i.id, i]))
  for (const item of incoming) map.set(item.id, item)
  return Array.from(map.values())
}

function removeMany(items, ids) {
  const set = new Set(ids)
  return items.filter((i) => !set.has(i.id))
}

export function reducer(state, action) {
  switch (action.type) {
    case 'boot/success':
      return { ...state, status: 'ready', ...action.payload }
    case 'boot/failure':
      return { ...state, status: 'failed', bootError: action.error }
    case 'tasks/upsert':
      return { ...state, tasks: upsertMany(state.tasks, action.tasks) }
    case 'tasks/remove':
      return { ...state, tasks: removeMany(state.tasks, action.ids) }
    case 'tasks/replaceAll':
      return { ...state, tasks: action.tasks }
    case 'projects/upsert':
      return { ...state, projects: upsertMany(state.projects, action.projects) }
    case 'projects/remove':
      return { ...state, projects: removeMany(state.projects, action.ids) }
    case 'lists/upsert':
      return { ...state, lists: upsertMany(state.lists, action.lists) }
    case 'lists/remove':
      return { ...state, lists: removeMany(state.lists, action.ids) }
    case 'tags/upsert':
      return { ...state, tags: upsertMany(state.tags, action.tags) }
    case 'tags/remove':
      return { ...state, tags: removeMany(state.tags, action.ids) }
    case 'savedFilters/upsert':
      return { ...state, savedFilters: upsertMany(state.savedFilters, action.savedFilters) }
    case 'savedFilters/remove':
      return { ...state, savedFilters: removeMany(state.savedFilters, action.ids) }
    case 'focusSessions/upsert':
      return { ...state, focusSessions: upsertMany(state.focusSessions, action.focusSessions) }
    case 'settings/set':
      return { ...state, settings: action.settings }
    case 'storage/notice':
      return { ...state, storageNotice: action.notice }
    case 'data/reset':
      return { ...state, tasks: [], projects: [], lists: [], tags: [], savedFilters: [], focusSessions: [] }
    default:
      return state
  }
}
