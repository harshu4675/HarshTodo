import { useMemo } from 'react'
import { useAppState } from '../store/AppStore.jsx'
import { selectInbox, selectToday, selectOverdue } from '../lib/taskQueries.js'
import { useNow } from './useNow.js'

export function useNavCounts() {
  const { tasks } = useAppState()
  const now = useNow(60000)
  return useMemo(
    () => ({
      inbox: selectInbox(tasks).length,
      today: selectToday(tasks, now).length,
      overdue: selectOverdue(tasks, now).length,
    }),
    [tasks, now],
  )
}
