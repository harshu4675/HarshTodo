import { useState } from 'react'
import { Button, IconButton } from '../ui/Button.jsx'
import { Dropdown, MenuItem, MenuSeparator } from '../ui/Dropdown.jsx'
import { Input } from '../ui/Input.jsx'
import { Badge, ColorDot, PriorityFlag } from '../ui/Badge.jsx'
import { Modal } from '../ui/Modal.jsx'
import { useAppState, useAppActions } from '../../store/AppStore.jsx'
import { useToast } from '../ui/Toast.jsx'
import { EMPTY_FILTER, DATE_RANGE_OPTIONS, COMPLETION_OPTIONS, activeFilterCount, isFilterEmpty } from '../../lib/filters.js'
import { PRIORITY_LIST, TASK_STATUS_LIST } from '../../constants/task.js'
import { cn } from '../../lib/cn.js'

function toggleIn(list, value) {
  return list.includes(value) ? list.filter((v) => v !== value) : [...list, value]
}

export function FilterBar({ filter, onChange, showSearch = true, className, allowSave = true }) {
  const { projects, tags, lists, savedFilters } = useAppState()
  const actions = useAppActions()
  const toast = useToast()
  const [saveOpen, setSaveOpen] = useState(false)
  const [saveName, setSaveName] = useState('')
  const count = activeFilterCount(filter)
  const set = (patch) => onChange({ ...filter, ...patch })

  const chips = []
  if (filter.completion !== 'open') chips.push({ key: 'completion', label: COMPLETION_OPTIONS.find((o) => o.value === filter.completion)?.label, clear: () => set({ completion: 'open' }) })
  if (filter.dateRange) chips.push({ key: 'date', label: DATE_RANGE_OPTIONS.find((o) => o.value === filter.dateRange)?.label, clear: () => set({ dateRange: null }) })
  filter.priorities.forEach((p) => chips.push({ key: `p-${p}`, label: PRIORITY_LIST.find((x) => x.value === p)?.label, clear: () => set({ priorities: filter.priorities.filter((x) => x !== p) }) }))
  filter.statuses.forEach((s) => chips.push({ key: `s-${s}`, label: TASK_STATUS_LIST.find((x) => x.value === s)?.label, clear: () => set({ statuses: filter.statuses.filter((x) => x !== s) }) }))
  filter.projectIds.forEach((id) => chips.push({ key: `pr-${id}`, label: projects.find((p) => p.id === id)?.name || 'Project', clear: () => set({ projectIds: filter.projectIds.filter((x) => x !== id) }) }))
  filter.listIds.forEach((id) => chips.push({ key: `l-${id}`, label: lists.find((l) => l.id === id)?.name || 'List', clear: () => set({ listIds: filter.listIds.filter((x) => x !== id) }) }))
  filter.tagIds.forEach((id) => chips.push({ key: `t-${id}`, label: tags.find((t) => t.id === id)?.name || 'Tag', clear: () => set({ tagIds: filter.tagIds.filter((x) => x !== id) }) }))
  if (filter.overdueOnly) chips.push({ key: 'overdue', label: 'Overdue', clear: () => set({ overdueOnly: false }) })
  if (filter.recurringOnly) chips.push({ key: 'recurring', label: 'Repeating', clear: () => set({ recurringOnly: false }) })

  async function saveCurrent() {
    const name = saveName.trim()
    if (!name) return
    const { query, ...criteria } = filter
    await actions.saveFilter({ name, criteria })
    setSaveOpen(false)
    setSaveName('')
    toast.success(`Saved filter "${name}"`)
  }

  return (
    <div className={cn('flex flex-col gap-2', className)}>
      <div className="flex items-center gap-2 flex-wrap">
        {showSearch ? <Input icon="search" value={filter.query} onChange={(e) => set({ query: e.target.value })} placeholder="Filter by keyword" aria-label="Filter by keyword" size="sm" className="w-full sm:w-56" /> : null}
        <Dropdown title="Show" trigger={({ toggle, props }) => <Button size="sm" variant={filter.completion !== 'open' ? 'soft' : 'secondary'} icon="eye" onClick={toggle} {...props}>{COMPLETION_OPTIONS.find((o) => o.value === filter.completion)?.label}</Button>}>
          {COMPLETION_OPTIONS.map((o) => (
            <MenuItem key={o.value} checked={filter.completion === o.value} onSelect={() => set({ completion: o.value })}>{o.label}</MenuItem>
          ))}
        </Dropdown>
        <Dropdown title="Date" trigger={({ toggle, props }) => <Button size="sm" variant={filter.dateRange ? 'soft' : 'secondary'} icon="calendar" onClick={toggle} {...props}>{filter.dateRange ? DATE_RANGE_OPTIONS.find((o) => o.value === filter.dateRange)?.label : 'Date'}</Button>}>
          {DATE_RANGE_OPTIONS.map((o) => (
            <MenuItem key={String(o.value)} checked={filter.dateRange === o.value} onSelect={() => set({ dateRange: o.value })}>{o.label}</MenuItem>
          ))}
        </Dropdown>
        <Dropdown title="Priority" trigger={({ toggle, props }) => <Button size="sm" variant={filter.priorities.length ? 'soft' : 'secondary'} icon="flag" onClick={toggle} {...props}>Priority{filter.priorities.length ? ` (${filter.priorities.length})` : ''}</Button>}>
          {PRIORITY_LIST.map((p) => (
            <MenuItem key={p.value} keepOpen checked={filter.priorities.includes(p.value)} onSelect={() => set({ priorities: toggleIn(filter.priorities, p.value) })}>
              <span className="inline-flex items-center gap-2">{p.value > 0 ? <PriorityFlag priority={p.value} /> : null}{p.label}</span>
            </MenuItem>
          ))}
        </Dropdown>
        {projects.length ? (
          <Dropdown title="Project" trigger={({ toggle, props }) => <Button size="sm" variant={filter.projectIds.length ? 'soft' : 'secondary'} icon="folder" onClick={toggle} {...props}>Project{filter.projectIds.length ? ` (${filter.projectIds.length})` : ''}</Button>}>
            {projects.map((p) => (
              <MenuItem key={p.id} keepOpen checked={filter.projectIds.includes(p.id)} onSelect={() => set({ projectIds: toggleIn(filter.projectIds, p.id) })}>
                <span className="inline-flex items-center gap-2"><ColorDot color={p.color} />{p.name}</span>
              </MenuItem>
            ))}
          </Dropdown>
        ) : null}
        {tags.length ? (
          <Dropdown title="Tags" trigger={({ toggle, props }) => <Button size="sm" variant={filter.tagIds.length ? 'soft' : 'secondary'} icon="tag" onClick={toggle} {...props}>Tags{filter.tagIds.length ? ` (${filter.tagIds.length})` : ''}</Button>}>
            {tags.map((t) => (
              <MenuItem key={t.id} keepOpen checked={filter.tagIds.includes(t.id)} onSelect={() => set({ tagIds: toggleIn(filter.tagIds, t.id) })}>
                <span className="inline-flex items-center gap-2"><ColorDot color={t.color} />{t.name}</span>
              </MenuItem>
            ))}
          </Dropdown>
        ) : null}
        <Dropdown title="More" trigger={({ toggle, props }) => <Button size="sm" variant={filter.statuses.length || filter.overdueOnly || filter.recurringOnly || filter.listIds.length ? 'soft' : 'secondary'} icon="sliders" onClick={toggle} {...props}>More</Button>}>
          <MenuItem keepOpen checked={filter.overdueOnly} onSelect={() => set({ overdueOnly: !filter.overdueOnly })}>Overdue only</MenuItem>
          <MenuItem keepOpen checked={filter.recurringOnly} onSelect={() => set({ recurringOnly: !filter.recurringOnly })}>Repeating only</MenuItem>
          <MenuSeparator />
          {TASK_STATUS_LIST.map((s) => (
            <MenuItem key={s.value} keepOpen checked={filter.statuses.includes(s.value)} onSelect={() => set({ statuses: toggleIn(filter.statuses, s.value), completion: 'all' })}>{s.label}</MenuItem>
          ))}
          {lists.length ? <MenuSeparator /> : null}
          {lists.map((l) => (
            <MenuItem key={l.id} keepOpen checked={filter.listIds.includes(l.id)} onSelect={() => set({ listIds: toggleIn(filter.listIds, l.id) })}>
              <span className="inline-flex items-center gap-2"><ColorDot color={l.color} />{l.name}</span>
            </MenuItem>
          ))}
        </Dropdown>
        {savedFilters.length || (allowSave && count) ? (
          <Dropdown title="Saved filters" align="end" trigger={({ toggle, props }) => <Button size="sm" variant="ghost" icon="bookmark" onClick={toggle} {...props}>Saved</Button>}>
            {savedFilters.map((f) => (
              <MenuItem key={f.id} icon="bookmark" onSelect={() => onChange({ ...EMPTY_FILTER, ...f.criteria, query: filter.query })} trailing={<IconButton icon="x" label={`Delete saved filter ${f.name}`} size="xs" onClick={(e) => { e.stopPropagation(); actions.deleteSavedFilter(f.id) }} />}>
                {f.name}
              </MenuItem>
            ))}
            {savedFilters.length && allowSave && count ? <MenuSeparator /> : null}
            {allowSave && count ? <MenuItem icon="bookmark-plus" onSelect={() => setSaveOpen(true)}>Save current filter</MenuItem> : null}
          </Dropdown>
        ) : null}
        {!isFilterEmpty(filter) ? (
          <Button size="sm" variant="ghost" icon="x" onClick={() => onChange({ ...EMPTY_FILTER })}>
            Clear
          </Button>
        ) : null}
      </div>
      {chips.length ? (
        <div className="flex items-center gap-1.5 flex-wrap">
          {chips.map((c) => (
            <Badge key={c.key} tone="primary" className="pr-1">
              {c.label}
              <button type="button" onClick={c.clear} aria-label={`Remove filter ${c.label}`} className="ml-0.5 rounded-xs p-0.5 hover:bg-primary/10">
                <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden="true"><path d="M2 2l6 6M8 2l-6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
              </button>
            </Badge>
          ))}
        </div>
      ) : null}
      <Modal open={saveOpen} onClose={() => setSaveOpen(false)} title="Save filter" size="sm" footer={<><Button variant="ghost" onClick={() => setSaveOpen(false)}>Cancel</Button><Button variant="primary" onClick={saveCurrent} disabled={!saveName.trim()}>Save</Button></>}>
        <Input value={saveName} onChange={(e) => setSaveName(e.target.value)} placeholder="Filter name" aria-label="Filter name" data-autofocus onKeyDown={(e) => e.key === 'Enter' && saveCurrent()} />
      </Modal>
    </div>
  )
}
