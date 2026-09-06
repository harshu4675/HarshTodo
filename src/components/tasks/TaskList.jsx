import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { cn } from '../../lib/cn.js'
import { TaskRow } from './TaskRow.jsx'
import { BulkActionBar } from './BulkActionBar.jsx'
import { EmptyState } from '../ui/States.jsx'
import { useAppActions } from '../../store/AppStore.jsx'
import { useUI } from '../../app/UIContext.jsx'
import { useToast } from '../ui/Toast.jsx'
import { useListDragAndDrop } from '../../hooks/useListDragAndDrop.js'
import { on, EVENTS } from '../../lib/eventBus.js'
import { TASK_STATUS } from '../../constants/task.js'
import { useConfirmDelete } from '../../hooks/useConfirmDelete.js'
import { useNow } from '../../hooks/useNow.js'
import { todayKey, shiftDateKey } from '../../lib/dates.js'
import { Button } from '../ui/Button.jsx'

const PAGE_SIZE = 60

export function TaskList({
  tasks,
  emptyState,
  reorderable = false,
  showProject = true,
  compact = false,
  className,
  groups,
  ariaLabel = 'Tasks',
  bulkEnabled = true,
  onAfterComplete,
}) {
  const actions = useAppActions()
  const { openTaskDetails, openTaskEditor, selectedTaskId, setSelectedTaskId } = useUI()
  const toast = useToast()
  const confirmDelete = useConfirmDelete()
  const now = useNow()
  const [bulkMode, setBulkMode] = useState(false)
  const [checked, setChecked] = useState(() => new Set())
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)
  const lastCheckedRef = useRef(null)
  const listRef = useRef(null)

  const flat = useMemo(() => (groups ? groups.flatMap((g) => g.tasks) : tasks), [groups, tasks])
  const ids = useMemo(() => flat.map((t) => t.id), [flat])

  useEffect(() => {
    setChecked((prev) => {
      const next = new Set(Array.from(prev).filter((id) => ids.includes(id)))
      return next.size === prev.size ? prev : next
    })
  }, [ids])

  useEffect(() => {
    setVisibleCount(PAGE_SIZE)
  }, [groups, tasks])

  const handleReorder = useCallback((orderedIds) => actions.reorderTasks(orderedIds), [actions])
  const dnd = useListDragAndDrop({ enabled: reorderable && !bulkMode, items: flat, onReorder: handleReorder })

  const toggleComplete = useCallback(
    async (id) => {
      const task = flat.find((t) => t.id === id)
      if (!task) return
      if (task.status === TASK_STATUS.COMPLETED) {
        await actions.reopenTask(id)
        return
      }
      const result = await actions.completeTask(id)
      onAfterComplete?.(task)
      if (result?.next) {
        toast.success('Completed. Next occurrence scheduled.', {
          action: { label: 'Undo', onClick: () => actions.deleteTasksForever([result.completed.id]).then(() => actions.updateTask(task.id, task)) },
        })
      } else {
        toast.success('Task completed', { duration: 4000, action: { label: 'Undo', onClick: () => actions.reopenTask(id) } })
      }
    },
    [actions, flat, toast, onAfterComplete],
  )

  const toggleChecked = useCallback(
    (id, shift) => {
      setChecked((prev) => {
        const next = new Set(prev)
        if (shift && lastCheckedRef.current) {
          const a = ids.indexOf(lastCheckedRef.current)
          const b = ids.indexOf(id)
          if (a !== -1 && b !== -1) {
            const [from, to] = a < b ? [a, b] : [b, a]
            for (let i = from; i <= to; i += 1) next.add(ids[i])
            return next
          }
        }
        if (next.has(id)) next.delete(id)
        else next.add(id)
        lastCheckedRef.current = id
        return next
      })
    },
    [ids],
  )

  const exitBulk = useCallback(() => {
    setBulkMode(false)
    setChecked(new Set())
  }, [])

  const focusRow = useCallback((id) => {
    requestAnimationFrame(() => {
      const el = listRef.current?.querySelector(`[data-task-id="${id}"]`)
      el?.focus({ preventScroll: false })
      el?.scrollIntoView({ block: 'nearest' })
    })
  }, [])

  useEffect(() => {
    const move = (delta) => {
      if (!ids.length) return
      const idx = ids.indexOf(selectedTaskId)
      const nextIdx = idx === -1 ? (delta > 0 ? 0 : ids.length - 1) : Math.max(0, Math.min(ids.length - 1, idx + delta))
      const id = ids[nextIdx]
      setSelectedTaskId(id)
      focusRow(id)
    }
    const selected = () => flat.find((t) => t.id === selectedTaskId)
    const unsubs = [
      on(EVENTS.LIST_NEXT, () => move(1)),
      on(EVENTS.LIST_PREV, () => move(-1)),
      on(EVENTS.LIST_OPEN, () => selected() && openTaskDetails(selectedTaskId)),
      on(EVENTS.LIST_EDIT, () => selected() && openTaskEditor(selected())),
      on(EVENTS.LIST_COMPLETE, () => selected() && toggleComplete(selectedTaskId)),
      on(EVENTS.LIST_DELETE, () => {
        const t = selected()
        if (!t) return
        confirmDelete([t.id], () => actions.trashTasks([t.id]).then(() => toast.success('Moved to trash', { action: { label: 'Undo', onClick: () => actions.restoreTasks([t.id]) } })))
      }),
      on(EVENTS.LIST_PRIORITY, (priority) => selected() && actions.setPriority([selectedTaskId], priority)),
      on(EVENTS.LIST_TOGGLE_BULK, () => {
        if (!bulkEnabled) return
        if (!bulkMode) {
          setBulkMode(true)
          if (selectedTaskId) setChecked(new Set([selectedTaskId]))
        } else if (selectedTaskId) toggleChecked(selectedTaskId)
      }),
      on(EVENTS.LIST_ESCAPE, () => {
        if (bulkMode) exitBulk()
        else setSelectedTaskId(null)
      }),
    ]
    return () => unsubs.forEach((u) => u())
  }, [ids, flat, selectedTaskId, setSelectedTaskId, focusRow, openTaskDetails, openTaskEditor, toggleComplete, actions, confirmDelete, toast, bulkMode, bulkEnabled, toggleChecked, exitBulk])

  const rename = useCallback((id, title) => actions.updateTask(id, { title }), [actions])
  const swipeComplete = useCallback((task) => toggleComplete(task.id), [toggleComplete])
  const swipeSchedule = useCallback(
    (task) => {
      const next = task.dueDate && task.dueDate >= todayKey() ? shiftDateKey(task.dueDate, 1) : shiftDateKey(todayKey(), 1)
      actions.rescheduleTask(task.id, next).then(() => toast.info('Rescheduled to tomorrow', { action: { label: 'Undo', onClick: () => actions.rescheduleTask(task.id, task.dueDate, task.dueTime) } }))
    },
    [actions, toast],
  )

  if (!flat.length) return emptyState || <EmptyState title="No tasks" />

  let rendered = 0
  const renderRow = (task) => {
    if (rendered >= visibleCount) return null
    rendered += 1
    return (
      <TaskRow
        key={task.id}
        task={task}
        now={now}
        selected={selectedTaskId === task.id}
        bulkMode={bulkMode}
        checked={checked.has(task.id)}
        onToggleComplete={toggleComplete}
        onOpen={openTaskDetails}
        onSelect={setSelectedTaskId}
        onToggleChecked={toggleChecked}
        onRename={rename}
        draggable={reorderable && !bulkMode}
        dragProps={dnd.getDragProps(task.id)}
        dropIndicator={dnd.indicatorFor(task.id)}
        showProject={showProject}
        compact={compact}
        onSwipeComplete={swipeComplete}
        onSwipeSchedule={swipeSchedule}
      />
    )
  }

  return (
    <div className={cn('flex flex-col', className)}>
      {bulkEnabled ? (
        <div className="flex items-center justify-between mb-2 min-h-8">
          <p className="text-xs text-ink-muted tabular">
            {flat.length} {flat.length === 1 ? 'task' : 'tasks'}
          </p>
          <Button
            size="xs"
            variant="ghost"
            icon={bulkMode ? 'x' : 'check-square'}
            onClick={() => (bulkMode ? exitBulk() : setBulkMode(true))}
            aria-pressed={bulkMode}
          >
            {bulkMode ? 'Done' : 'Select'}
          </Button>
        </div>
      ) : null}
      <div ref={listRef} role="listbox" aria-label={ariaLabel} aria-multiselectable={bulkMode} className="flex flex-col gap-1.5">
        {groups
          ? groups.map((group) =>
              group.tasks.length ? (
                <section key={group.key} aria-labelledby={`group-${group.key}`} className="flex flex-col gap-1.5 not-first:mt-4">
                  <h3 id={`group-${group.key}`} className={cn('flex items-baseline gap-2 text-[13px] font-semibold px-0.5', group.tone === 'error' ? 'text-error' : 'text-ink')}>
                    {group.label}
                    {group.sublabel ? <span className="text-xs font-normal text-ink-muted">{group.sublabel}</span> : null}
                    <span className="text-xs font-normal text-ink-muted tabular ml-auto">{group.tasks.length}</span>
                  </h3>
                  {group.tasks.map(renderRow)}
                </section>
              ) : null,
            )
          : flat.map(renderRow)}
      </div>
      {flat.length > visibleCount ? (
        <div className="flex justify-center mt-3">
          <Button variant="ghost" size="sm" onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}>
            Show {Math.min(PAGE_SIZE, flat.length - visibleCount)} more
          </Button>
        </div>
      ) : null}
      {bulkMode ? (
        <BulkActionBar
          selectedIds={Array.from(checked)}
          allIds={ids}
          onSelectAll={() => setChecked(new Set(ids))}
          onClear={() => setChecked(new Set())}
          onExit={exitBulk}
        />
      ) : null}
    </div>
  )
}
