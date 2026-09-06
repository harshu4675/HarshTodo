import { createContext, useContext, useEffect, useMemo, useReducer, useRef, useCallback } from 'react'
import { createStorage } from '../data/storage/index.js'
import { createRepositories } from '../data/repositories/index.js'
import { reducer, initialState } from './reducer.js'
import { createTaskActions } from './actions/taskActions.js'
import { createEntityActions } from './actions/entityActions.js'
import { createSettingsActions } from './actions/settingsActions.js'
import { createDataActions } from './actions/dataActions.js'
import { normalizeSettings } from '../data/models.js'

const StateContext = createContext(null)
const ActionsContext = createContext(null)

export function AppStoreProvider({ children, onError }) {
  const [state, dispatch] = useReducer(reducer, initialState)
  const reposRef = useRef(null)
  const stateRef = useRef(state)
  stateRef.current = state

  const reportError = useCallback(
    (error, context) => {
      if (onError) onError(error, context)
    },
    [onError],
  )

  useEffect(() => {
    let cancelled = false
    async function boot() {
      try {
        const { storage, persistent, reason } = await createStorage()
        const repos = createRepositories(storage)
        reposRef.current = repos
        const [{ tasks, corrupt }, projects, lists, tags, savedFilters, focusSessions, settings] = await Promise.all([
          repos.tasks.getAll(),
          repos.projects.getAll(),
          repos.lists.getAll(),
          repos.tags.getAll(),
          repos.savedFilters.getAll(),
          repos.focusSessions.getAll(),
          repos.settings.get(),
        ])
        repos.tasks.purgeOlderThan(30).then((ids) => {
          if (ids.length && !cancelled) dispatch({ type: 'tasks/remove', ids })
        }).catch(() => {})
        if (cancelled) return
        dispatch({
          type: 'boot/success',
          payload: {
            tasks,
            projects,
            lists,
            tags,
            savedFilters,
            focusSessions,
            settings: normalizeSettings(settings),
            persistent,
            storageNotice: reason,
            corruptCount: corrupt,
          },
        })
      } catch (error) {
        if (cancelled) return
        dispatch({ type: 'boot/failure', error: error?.message || 'The app could not load its local database.' })
      }
    }
    boot()
    return () => {
      cancelled = true
    }
  }, [])

  const actions = useMemo(() => {
    const getRepos = () => {
      if (!reposRef.current) throw new Error('Storage is not ready yet.')
      return reposRef.current
    }
    const getState = () => stateRef.current
    const ctx = { getRepos, getState, dispatch, reportError }
    return {
      ...createTaskActions(ctx),
      ...createEntityActions(ctx),
      ...createSettingsActions(ctx),
      ...createDataActions(ctx),
    }
  }, [reportError])

  return (
    <StateContext.Provider value={state}>
      <ActionsContext.Provider value={actions}>{children}</ActionsContext.Provider>
    </StateContext.Provider>
  )
}

export function useAppState() {
  const ctx = useContext(StateContext)
  if (!ctx) throw new Error('useAppState must be used inside AppStoreProvider')
  return ctx
}

export function useAppActions() {
  const ctx = useContext(ActionsContext)
  if (!ctx) throw new Error('useAppActions must be used inside AppStoreProvider')
  return ctx
}
