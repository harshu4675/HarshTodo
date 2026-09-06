import { useCallback, useEffect, useRef, useState } from 'react'

const STORAGE_KEY = 'harshtodo.focusTimer'

function readPersisted() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

function persist(state) {
  try {
    if (!state) localStorage.removeItem(STORAGE_KEY)
    else localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch {}
}

export function useFocusTimer({ durationMinutes, onComplete }) {
  const [state, setState] = useState(() => {
    const saved = readPersisted()
    if (saved && saved.durationSeconds) return saved
    return { durationSeconds: durationMinutes * 60, elapsedBeforeStart: 0, startedAt: null, running: false, taskId: null, sessionStartedAt: null }
  })
  const [tick, setTick] = useState(0)
  const completedRef = useRef(false)

  useEffect(() => {
    if (!state.running) return undefined
    const id = setInterval(() => setTick((t) => t + 1), 500)
    return () => clearInterval(id)
  }, [state.running])

  useEffect(() => {
    persist(state.startedAt || state.elapsedBeforeStart ? state : null)
  }, [state])

  const elapsed = state.elapsedBeforeStart + (state.running && state.startedAt ? Math.floor((Date.now() - state.startedAt) / 1000) : 0)
  const remaining = Math.max(0, state.durationSeconds - elapsed)

  useEffect(() => {
    if (state.running && remaining === 0 && !completedRef.current) {
      completedRef.current = true
      const snapshot = { ...state, elapsedBeforeStart: state.durationSeconds, running: false, startedAt: null }
      setState(snapshot)
      onComplete?.({ taskId: state.taskId, durationSeconds: state.durationSeconds, sessionStartedAt: state.sessionStartedAt })
    }
  }, [remaining, state, onComplete])

  const start = useCallback((taskId) => {
    completedRef.current = false
    setState((s) => ({ ...s, running: true, startedAt: Date.now(), taskId: taskId ?? s.taskId, sessionStartedAt: s.sessionStartedAt || new Date().toISOString() }))
  }, [])

  const pause = useCallback(() => {
    setState((s) => {
      if (!s.running) return s
      const add = s.startedAt ? Math.floor((Date.now() - s.startedAt) / 1000) : 0
      return { ...s, running: false, startedAt: null, elapsedBeforeStart: s.elapsedBeforeStart + add }
    })
  }, [])

  const reset = useCallback((minutes) => {
    completedRef.current = false
    setState((s) => ({ durationSeconds: (minutes ?? s.durationSeconds / 60) * 60, elapsedBeforeStart: 0, startedAt: null, running: false, taskId: s.taskId, sessionStartedAt: null }))
  }, [])

  const setDuration = useCallback((minutes) => {
    completedRef.current = false
    setState((s) => ({ ...s, durationSeconds: minutes * 60, elapsedBeforeStart: 0, startedAt: s.running ? Date.now() : null, sessionStartedAt: s.running ? s.sessionStartedAt : null }))
  }, [])

  const setTask = useCallback((taskId) => setState((s) => ({ ...s, taskId })), [])

  const stop = useCallback(() => {
    const add = state.running && state.startedAt ? Math.floor((Date.now() - state.startedAt) / 1000) : 0
    const total = state.elapsedBeforeStart + add
    completedRef.current = false
    setState((s) => ({ durationSeconds: s.durationSeconds, elapsedBeforeStart: 0, startedAt: null, running: false, taskId: s.taskId, sessionStartedAt: null }))
    return { elapsedSeconds: total, taskId: state.taskId, sessionStartedAt: state.sessionStartedAt }
  }, [state])

  return { running: state.running, elapsed, remaining, durationSeconds: state.durationSeconds, taskId: state.taskId, start, pause, reset, stop, setDuration, setTask, tick }
}
