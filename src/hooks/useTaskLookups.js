import { useMemo } from 'react'
import { useAppState } from '../store/AppStore.jsx'

export function useTaskLookups() {
  const { projects, lists, tags } = useAppState()
  return useMemo(
    () => ({
      projectById: new Map(projects.map((p) => [p.id, p])),
      listById: new Map(lists.map((l) => [l.id, l])),
      tagById: new Map(tags.map((t) => [t.id, t])),
    }),
    [projects, lists, tags],
  )
}
