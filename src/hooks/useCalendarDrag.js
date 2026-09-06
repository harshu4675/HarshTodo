import { useCallback, useState } from 'react'
import { useAppActions } from '../store/AppStore.jsx'
import { useToast } from '../components/ui/Toast.jsx'
import { formatRelativeDate, formatTimeKey } from '../lib/dates.js'

export function useCalendarDrag() {
  const actions = useAppActions()
  const toast = useToast()
  const [dragging, setDragging] = useState(null)
  const [overKey, setOverKey] = useState(null)

  const onDragStart = useCallback((event, occurrence) => {
    event.dataTransfer.effectAllowed = 'move'
    event.dataTransfer.setData('text/task-id', occurrence.task.id)
    setDragging({ taskId: occurrence.task.id, fromDate: occurrence.dateKey, fromTime: occurrence.timeKey, isVirtual: occurrence.isVirtual })
  }, [])

  const onDragEnd = useCallback(() => {
    setDragging(null)
    setOverKey(null)
  }, [])

  const dropTargetProps = useCallback(
    (dateKey, timeKey) => {
      const key = timeKey ? `${dateKey}T${timeKey}` : dateKey
      return {
        onDragOver: (e) => {
          if (!dragging && !e.dataTransfer.types.includes('text/task-id')) return
          e.preventDefault()
          e.dataTransfer.dropEffect = 'move'
          if (overKey !== key) setOverKey(key)
        },
        onDragLeave: (e) => {
          if (!e.currentTarget.contains(e.relatedTarget)) setOverKey((k) => (k === key ? null : k))
        },
        onDrop: async (e) => {
          e.preventDefault()
          const taskId = e.dataTransfer.getData('text/task-id') || dragging?.taskId
          const source = dragging
          setDragging(null)
          setOverKey(null)
          if (!taskId) return
          if (source && source.fromDate === dateKey && (timeKey === undefined || source.fromTime === timeKey)) return
          const nextTime = timeKey === undefined ? source?.fromTime ?? undefined : timeKey
          const restore = source ? () => actions.rescheduleTask(taskId, source.fromDate, source.fromTime) : null
          if (source?.isVirtual) {
            toast.info('Repeating tasks move from their next occurrence', { description: 'The whole series was rescheduled.' })
          }
          await actions.rescheduleTask(taskId, dateKey, nextTime)
          toast.success(`Moved to ${formatRelativeDate(dateKey)}${nextTime ? `, ${formatTimeKey(nextTime)}` : ''}`, { action: restore ? { label: 'Undo', onClick: restore } : undefined })
        },
      }
    },
    [dragging, overKey, actions, toast],
  )

  const isOver = useCallback((dateKey, timeKey) => overKey === (timeKey ? `${dateKey}T${timeKey}` : dateKey), [overKey])

  return { dragging, onDragStart, onDragEnd, dropTargetProps, isOver }
}
