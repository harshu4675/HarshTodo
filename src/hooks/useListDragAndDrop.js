import { useCallback, useRef, useState } from 'react'

export function useListDragAndDrop({ enabled, items, onReorder }) {
  const [dragId, setDragId] = useState(null)
  const [over, setOver] = useState(null)
  const idsRef = useRef(items.map((t) => t.id))
  idsRef.current = items.map((t) => t.id)

  const reset = useCallback(() => {
    setDragId(null)
    setOver(null)
  }, [])

  const getDragProps = useCallback(
    (id) => {
      if (!enabled) return {}
      return {
        onDragStart: (e) => {
          setDragId(id)
          e.dataTransfer.effectAllowed = 'move'
          e.dataTransfer.setData('text/task-id', id)
          e.currentTarget.classList.add('drag-ghost')
        },
        onDragEnd: (e) => {
          e.currentTarget.classList.remove('drag-ghost')
          reset()
        },
        onDragOver: (e) => {
          const current = dragId || e.dataTransfer.types.includes('text/task-id')
          if (!current || dragId === id) return
          e.preventDefault()
          e.dataTransfer.dropEffect = 'move'
          const rect = e.currentTarget.getBoundingClientRect()
          const position = e.clientY - rect.top < rect.height / 2 ? 'before' : 'after'
          setOver((prev) => (prev?.id === id && prev.position === position ? prev : { id, position }))
        },
        onDragLeave: (e) => {
          if (!e.currentTarget.contains(e.relatedTarget)) setOver((prev) => (prev?.id === id ? null : prev))
        },
        onDrop: (e) => {
          e.preventDefault()
          const sourceId = e.dataTransfer.getData('text/task-id') || dragId
          if (!sourceId || sourceId === id) return reset()
          const ids = idsRef.current.filter((x) => x !== sourceId)
          const targetIndex = ids.indexOf(id)
          if (targetIndex === -1) return reset()
          const insertAt = over?.position === 'after' ? targetIndex + 1 : targetIndex
          ids.splice(insertAt, 0, sourceId)
          onReorder(ids)
          reset()
        },
      }
    },
    [enabled, dragId, over, onReorder, reset],
  )

  const indicatorFor = useCallback((id) => (over?.id === id ? over.position : null), [over])

  return { getDragProps, indicatorFor, dragging: Boolean(dragId) }
}
