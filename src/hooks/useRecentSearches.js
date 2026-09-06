import { useCallback, useState } from 'react'

const KEY = 'harshtodo.recentSearches'
const MAX = 6

function read() {
  try {
    const raw = localStorage.getItem(KEY)
    const parsed = raw ? JSON.parse(raw) : []
    return Array.isArray(parsed) ? parsed.filter((s) => typeof s === 'string').slice(0, MAX) : []
  } catch {
    return []
  }
}

export function useRecentSearches() {
  const [recent, setRecent] = useState(read)
  const remember = useCallback((query) => {
    const q = query.trim()
    if (!q) return
    setRecent((prev) => {
      const next = [q, ...prev.filter((x) => x.toLowerCase() !== q.toLowerCase())].slice(0, MAX)
      try {
        localStorage.setItem(KEY, JSON.stringify(next))
      } catch {}
      return next
    })
  }, [])
  const clear = useCallback(() => {
    setRecent([])
    try {
      localStorage.removeItem(KEY)
    } catch {}
  }, [])
  return { recent, remember, clear }
}
