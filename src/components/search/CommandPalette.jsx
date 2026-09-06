import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import { cn } from '../../lib/cn.js'
import { Icon } from '../ui/Icon.jsx'
import { ColorDot, PriorityFlag } from '../ui/Badge.jsx'
import { useUI } from '../../app/UIContext.jsx'
import { useAppState, useAppActions } from '../../store/AppStore.jsx'
import { useFocusTrap } from '../../hooks/useFocusTrap.js'
import { useScrollLock } from '../../hooks/useScrollLock.js'
import { useEscape } from '../../hooks/useEscape.js'
import { useRecentSearches } from '../../hooks/useRecentSearches.js'
import { searchTasks, searchNamed, highlightRanges } from '../../lib/search.js'
import { PRIMARY_NAV, ORGANIZE_NAV, SECONDARY_NAV, ROUTES } from '../../constants/navigation.js'
import { formatRelativeDate } from '../../lib/dates.js'
import { TASK_STATUS } from '../../constants/task.js'

export function Highlight({ text, query }) {
  const parts = highlightRanges(text, query)
  return (
    <>
      {parts.map((p, i) =>
        p.match ? (
          <mark key={i} className="bg-warning-soft text-ink rounded-xs px-px">
            {p.text}
          </mark>
        ) : (
          <span key={i}>{p.text}</span>
        ),
      )}
    </>
  )
}

export function CommandPalette() {
  const { paletteOpen, setPaletteOpen, openTaskEditor, openTaskDetails, setShortcutsOpen } = useUI()
  const { tasks, projects, tags } = useAppState()
  const actions = useAppActions()
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [active, setActive] = useState(0)
  const ref = useRef(null)
  const inputRef = useRef(null)
  const listRef = useRef(null)
  const { recent, remember, clear } = useRecentSearches()
  const close = () => setPaletteOpen(false)

  useFocusTrap(ref, paletteOpen)
  useScrollLock(paletteOpen)
  useEscape(paletteOpen, close)

  useEffect(() => {
    if (paletteOpen) {
      setQuery('')
      setActive(0)
      requestAnimationFrame(() => inputRef.current?.focus())
    }
  }, [paletteOpen])

  const q = query.trim()
  const isCommandMode = q.startsWith('>')
  const commandQuery = isCommandMode ? q.slice(1).trim() : q

  const commands = useMemo(() => {
    const nav = [...PRIMARY_NAV, ...ORGANIZE_NAV, ...SECONDARY_NAV].map((n) => ({
      id: `nav-${n.to}`,
      group: 'Go to',
      icon: n.icon,
      label: n.label,
      shortcut: n.shortcut,
      run: () => navigate(n.to),
    }))
    return [
      { id: 'new-task', group: 'Actions', icon: 'plus', label: 'New task', shortcut: 'N', run: () => openTaskEditor() },
      { id: 'new-project', group: 'Actions', icon: 'folder-kanban', label: 'New project', run: () => navigate(`${ROUTES.PROJECTS}?new=1`) },
      { id: 'focus', group: 'Actions', icon: 'timer', label: 'Start focus session', shortcut: 'F', run: () => navigate(ROUTES.FOCUS) },
      { id: 'shortcuts', group: 'Actions', icon: 'keyboard', label: 'Keyboard shortcuts', shortcut: '?', run: () => setShortcutsOpen(true) },
      { id: 'widget', group: 'Actions', icon: 'smartphone', label: 'Open compact view', run: () => navigate(ROUTES.WIDGET) },
      ...nav,
    ]
  }, [navigate, openTaskEditor, setShortcutsOpen])

  const sections = useMemo(() => {
    const out = []
    if (!q) {
      if (recent.length) out.push({ title: 'Recent searches', items: recent.map((r) => ({ id: `recent-${r}`, icon: 'clock', label: r, run: () => setQuery(r), keepOpen: true })) })
      out.push({ title: 'Suggestions', items: commands.slice(0, 6) })
      return out
    }
    const lower = commandQuery.toLowerCase()
    const matchedCommands = commands.filter((c) => c.label.toLowerCase().includes(lower)).slice(0, isCommandMode ? 20 : 4)
    if (isCommandMode) return matchedCommands.length ? [{ title: 'Commands', items: matchedCommands }] : []
    const taskResults = searchTasks(tasks, q, { limit: 8 }).map(({ task }) => ({
      id: `task-${task.id}`,
      icon: task.status === TASK_STATUS.COMPLETED ? 'circle-check' : 'circle',
      label: task.title,
      detail: task.dueDate ? formatRelativeDate(task.dueDate) : null,
      priority: task.priority,
      completed: task.status === TASK_STATUS.COMPLETED,
      run: () => openTaskDetails(task.id),
    }))
    const projectResults = searchNamed(projects, q, 4).map((p) => ({ id: `project-${p.id}`, color: p.color, label: p.name, detail: 'Project', run: () => navigate(`/projects/${p.id}`) }))
    const tagResults = searchNamed(tags, q, 4).map((t) => ({ id: `tag-${t.id}`, color: t.color, label: t.name, detail: 'Tag', run: () => navigate(`/tags/${t.id}`) }))
    if (taskResults.length) out.push({ title: 'Tasks', items: taskResults })
    if (projectResults.length) out.push({ title: 'Projects', items: projectResults })
    if (tagResults.length) out.push({ title: 'Tags', items: tagResults })
    if (matchedCommands.length) out.push({ title: 'Commands', items: matchedCommands })
    out.push({
      title: 'More',
      items: [
        { id: 'search-all', icon: 'search', label: `Search everywhere for "${q}"`, run: () => navigate(`${ROUTES.SEARCH}?q=${encodeURIComponent(q)}`) },
        { id: 'create-from-query', icon: 'plus', label: `Create task "${q}"`, run: () => actions.addTask({ title: q }).then((t) => openTaskDetails(t.id)) },
      ],
    })
    return out
  }, [q, commandQuery, isCommandMode, recent, commands, tasks, projects, tags, navigate, openTaskDetails, actions])

  const flat = sections.flatMap((s) => s.items)

  useEffect(() => setActive(0), [q])
  useEffect(() => {
    listRef.current?.querySelector(`[data-index="${active}"]`)?.scrollIntoView({ block: 'nearest' })
  }, [active])

  function run(item) {
    if (!item) return
    if (q && !item.id.startsWith('recent-') && !item.id.startsWith('nav-')) remember(q)
    item.run()
    if (!item.keepOpen) close()
  }

  if (!paletteOpen) return null
  let index = -1
  return createPortal(
    <div className="fixed inset-0 z-50 flex items-start justify-center p-3 sm:p-6 sm:pt-[12vh]" role="presentation">
      <div className="absolute inset-0 bg-ink/30 animate-fade-in" onClick={close} aria-hidden="true" />
      <div ref={ref} role="dialog" aria-modal="true" aria-label="Search and commands" className="relative w-full max-w-xl bg-elevated border border-line rounded-xl shadow-lg overflow-hidden animate-scale-in flex flex-col max-h-[80dvh]">
        <div className="flex items-center gap-2 px-3 h-12 border-b border-line">
          <Icon name={isCommandMode ? 'command' : 'search'} size={18} className="text-ink-muted" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'ArrowDown') {
                e.preventDefault()
                setActive((a) => Math.min(flat.length - 1, a + 1))
              } else if (e.key === 'ArrowUp') {
                e.preventDefault()
                setActive((a) => Math.max(0, a - 1))
              } else if (e.key === 'Enter') {
                e.preventDefault()
                run(flat[active])
              }
            }}
            placeholder="Search tasks, projects, tags. Type > for commands"
            aria-label="Search"
            role="combobox"
            aria-expanded="true"
            aria-controls="palette-results"
            aria-activedescendant={flat[active] ? `palette-item-${flat[active].id}` : undefined}
            autoComplete="off"
            className="flex-1 bg-transparent text-sm sm:text-[15px] outline-none placeholder:text-ink-faint"
          />
          <kbd>Esc</kbd>
        </div>
        <div ref={listRef} id="palette-results" role="listbox" className="overflow-y-auto scrollbar-thin p-1.5 flex-1">
          {flat.length === 0 ? <p className="px-3 py-8 text-center text-sm text-ink-muted">No matches. Press Enter to search everywhere.</p> : null}
          {sections.map((section) => (
            <div key={section.title} className="mb-1">
              <div className="flex items-center justify-between px-2 pt-2 pb-1">
                <span className="text-[11px] font-semibold uppercase tracking-wide text-ink-muted">{section.title}</span>
                {section.title === 'Recent searches' ? (
                  <button type="button" onClick={clear} className="text-[11px] text-ink-muted hover:text-ink">
                    Clear
                  </button>
                ) : null}
              </div>
              {section.items.map((item) => {
                index += 1
                const i = index
                return (
                  <button
                    key={item.id}
                    id={`palette-item-${item.id}`}
                    type="button"
                    role="option"
                    aria-selected={i === active}
                    data-index={i}
                    onMouseEnter={() => setActive(i)}
                    onClick={() => run(item)}
                    className={cn('flex w-full items-center gap-2.5 rounded-md px-2 h-10 text-sm text-left', i === active ? 'bg-sunken' : '')}
                  >
                    {item.color ? <ColorDot color={item.color} /> : <Icon name={item.icon} size={16} className={cn('shrink-0', item.completed ? 'text-success' : 'text-ink-muted')} />}
                    <span className={cn('flex-1 truncate', item.completed && 'line-through text-ink-muted')}>{q && !isCommandMode ? <Highlight text={item.label} query={q} /> : item.label}</span>
                    {item.priority ? <PriorityFlag priority={item.priority} /> : null}
                    {item.detail ? <span className="text-xs text-ink-muted shrink-0">{item.detail}</span> : null}
                    {item.shortcut ? <kbd>{item.shortcut}</kbd> : null}
                  </button>
                )
              })}
            </div>
          ))}
        </div>
        <div className="hidden sm:flex items-center gap-4 px-3 h-9 border-t border-line text-[11px] text-ink-muted bg-canvas">
          <span className="inline-flex items-center gap-1"><kbd>Up</kbd><kbd>Down</kbd> navigate</span>
          <span className="inline-flex items-center gap-1"><kbd>Enter</kbd> open</span>
          <span className="inline-flex items-center gap-1"><kbd>&gt;</kbd> commands</span>
        </div>
      </div>
    </div>,
    document.body,
  )
}
