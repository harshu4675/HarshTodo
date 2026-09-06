import { memo, useState, useRef, useEffect } from 'react'
import { cn } from '../../lib/cn.js'
import { TaskCheckbox } from './TaskCheckbox.jsx'
import { TaskMeta } from './TaskMeta.jsx'
import { TaskActionsMenu } from './TaskActionsMenu.jsx'
import { PriorityFlag } from '../ui/Badge.jsx'
import { Checkbox } from '../ui/Input.jsx'
import { Icon } from '../ui/Icon.jsx'
import { TASK_STATUS } from '../../constants/task.js'
import { useBreakpoint } from '../../hooks/useMediaQuery.js'

export const TaskRow = memo(function TaskRow({
  task,
  selected = false,
  bulkMode = false,
  checked = false,
  onToggleComplete,
  onOpen,
  onSelect,
  onToggleChecked,
  onRename,
  draggable = false,
  dragProps = {},
  dropIndicator = null,
  showProject = true,
  compact = false,
  now,
  onSwipeComplete,
  onSwipeSchedule,
}) {
  const completed = task.status === TASK_STATUS.COMPLETED
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(task.title)
  const inputRef = useRef(null)
  const { isMobile } = useBreakpoint()
  const swipe = useRef({ startX: 0, startY: 0, dx: 0, active: false })
  const [swipeX, setSwipeX] = useState(0)

  useEffect(() => {
    if (editing) {
      inputRef.current?.focus()
      inputRef.current?.select()
    }
  }, [editing])

  function commitRename() {
    const value = draft.trim()
    setEditing(false)
    if (value && value !== task.title) onRename?.(task.id, value)
    else setDraft(task.title)
  }

  function onTouchStart(e) {
    if (!isMobile || bulkMode || editing) return
    const t = e.touches[0]
    swipe.current = { startX: t.clientX, startY: t.clientY, dx: 0, active: true }
  }
  function onTouchMove(e) {
    if (!swipe.current.active) return
    const t = e.touches[0]
    const dx = t.clientX - swipe.current.startX
    const dy = t.clientY - swipe.current.startY
    if (Math.abs(dy) > Math.abs(dx) && Math.abs(dy) > 8) {
      swipe.current.active = false
      setSwipeX(0)
      return
    }
    if (Math.abs(dx) > 8) {
      swipe.current.dx = dx
      setSwipeX(Math.max(-96, Math.min(96, dx)))
    }
  }
  function onTouchEnd() {
    if (!swipe.current.active) return
    const dx = swipe.current.dx
    swipe.current.active = false
    setSwipeX(0)
    if (dx > 72 && onSwipeComplete) onSwipeComplete(task)
    else if (dx < -72 && onSwipeSchedule) onSwipeSchedule(task)
  }

  return (
    <div className="relative overflow-hidden rounded-md">
      {isMobile && swipeX !== 0 ? (
        <div aria-hidden="true" className={cn('absolute inset-0 flex items-center px-4 text-white text-xs font-semibold', swipeX > 0 ? 'bg-success justify-start' : 'bg-primary justify-end')}>
          <Icon name={swipeX > 0 ? 'check' : 'calendar'} size={18} />
        </div>
      ) : null}
      <li
        role="option"
        aria-selected={selected}
        data-task-id={task.id}
        tabIndex={selected ? 0 : -1}
        draggable={draggable && !editing && !isMobile}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        style={swipeX ? { transform: `translateX(${swipeX}px)` } : undefined}
        onClick={(e) => {
          if (editing) return
          if (bulkMode) {
            onToggleChecked?.(task.id, e.shiftKey)
            return
          }
          onSelect?.(task.id)
          onOpen?.(task.id)
        }}
        onFocus={() => onSelect?.(task.id)}
        onDoubleClick={(e) => {
          if (bulkMode || completed) return
          e.preventDefault()
          setEditing(true)
        }}
        className={cn(
          'group relative list-none flex items-start gap-3 bg-surface border border-line rounded-md transition-[background-color,box-shadow,transform] duration-fast outline-none cursor-pointer',
          compact ? 'px-3 py-2' : 'px-3 sm:px-3.5 py-2.5 sm:py-3',
          'hover:border-line-strong',
          selected && !bulkMode && 'border-primary/50 ring-2 ring-primary/15 bg-primary-soft/30',
          checked && 'bg-primary-soft/40 border-primary/40',
          dropIndicator === 'before' && 'drop-before',
          dropIndicator === 'after' && 'drop-after',
          swipeX ? 'transition-none' : '',
        )}
        {...dragProps}
      >
        {draggable && !isMobile ? (
          <span aria-hidden="true" className="absolute -left-4 top-1/2 -translate-y-1/2 h-6 w-4 hidden lg:flex items-center justify-center text-ink-faint opacity-0 group-hover:opacity-100 cursor-grab">
            <Icon name="grip-vertical" size={14} />
          </span>
        ) : null}
        <div className="pt-0.5">
          {bulkMode ? (
            <Checkbox checked={checked} onChange={() => onToggleChecked?.(task.id)} aria-label={`Select ${task.title}`} onClick={(e) => e.stopPropagation()} />
          ) : (
            <TaskCheckbox checked={completed} priority={task.priority} title={task.title} onToggle={() => onToggleComplete?.(task.id)} />
          )}
        </div>
        <div className="flex-1 min-w-0">
          {editing ? (
            <input
              ref={inputRef}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onBlur={commitRename}
              onKeyDown={(e) => {
                if (e.key === 'Enter') commitRename()
                if (e.key === 'Escape') {
                  setDraft(task.title)
                  setEditing(false)
                }
                e.stopPropagation()
              }}
              onClick={(e) => e.stopPropagation()}
              aria-label="Task title"
              className="w-full bg-transparent text-sm text-ink outline-none border-b border-primary pb-0.5"
            />
          ) : (
            <p className={cn('text-sm leading-5 break-words', completed ? 'text-ink-muted line-through decoration-ink-faint' : 'text-ink', compact && 'truncate')}>{task.title}</p>
          )}
          <TaskMeta task={task} compact={compact} showProject={showProject} className={cn('mt-1', compact && 'mt-0.5')} now={now} />
        </div>
        <div className="flex items-center gap-1 shrink-0 self-center">
          {task.priority > 0 ? <PriorityFlag priority={task.priority} className={cn(!isMobile && 'group-hover:hidden group-focus-within:hidden')} /> : null}
          {!bulkMode ? (
            <div className={cn('lg:opacity-0 lg:group-hover:opacity-100 lg:group-focus-within:opacity-100 transition-opacity duration-fast')} onClick={(e) => e.stopPropagation()}>
              <TaskActionsMenu task={task} />
            </div>
          ) : null}
        </div>
      </li>
    </div>
  )
})
