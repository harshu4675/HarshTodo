import { useMemo, useRef, useState } from 'react'
import { TagChip } from '../ui/Badge.jsx'
import { Icon } from '../ui/Icon.jsx'
import { useAppActions, useAppState } from '../../store/AppStore.jsx'
import { cn } from '../../lib/cn.js'

export function TagPicker({ value, onChange }) {
  const { tags } = useAppState()
  const actions = useAppActions()
  const [query, setQuery] = useState('')
  const [active, setActive] = useState(0)
  const [focused, setFocused] = useState(false)
  const inputRef = useRef(null)
  const selected = value.map((id) => tags.find((t) => t.id === id)).filter(Boolean)
  const q = query.trim().toLowerCase().replace(/^#/, '')
  const suggestions = useMemo(() => tags.filter((t) => !value.includes(t.id) && (!q || t.name.toLowerCase().includes(q))).slice(0, 6), [tags, value, q])
  const canCreate = q && !tags.some((t) => t.name.toLowerCase() === q)
  const options = [...suggestions.map((t) => ({ type: 'tag', tag: t })), ...(canCreate ? [{ type: 'create', name: q }] : [])]

  async function choose(option) {
    if (option.type === 'tag') onChange([...value, option.tag.id])
    else {
      const tag = await actions.addTag({ name: option.name })
      if (tag && !value.includes(tag.id)) onChange([...value, tag.id])
    }
    setQuery('')
    setActive(0)
    inputRef.current?.focus()
  }

  return (
    <div className="relative">
      <div className="flex items-center gap-1.5 flex-wrap min-h-9 rounded-md border border-line-strong bg-surface px-2 py-1.5 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20" onClick={() => inputRef.current?.focus()}>
        {selected.map((t) => (
          <TagChip key={t.id} tag={t} onRemove={() => onChange(value.filter((id) => id !== t.id))} />
        ))}
        <input
          ref={inputRef}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            setActive(0)
          }}
          onFocus={() => setFocused(true)}
          onBlur={() => setTimeout(() => setFocused(false), 120)}
          onKeyDown={(e) => {
            if (e.key === 'ArrowDown') {
              e.preventDefault()
              setActive((a) => Math.min(options.length - 1, a + 1))
            } else if (e.key === 'ArrowUp') {
              e.preventDefault()
              setActive((a) => Math.max(0, a - 1))
            } else if (e.key === 'Enter' && options.length) {
              e.preventDefault()
              choose(options[active])
            } else if (e.key === 'Backspace' && !query && value.length) {
              onChange(value.slice(0, -1))
            } else if (e.key === 'Escape' && query) {
              e.stopPropagation()
              setQuery('')
            }
          }}
          placeholder={selected.length ? '' : 'Add tags'}
          aria-label="Add tags"
          aria-autocomplete="list"
          aria-expanded={focused && options.length > 0}
          className="flex-1 min-w-24 bg-transparent text-sm outline-none h-6"
        />
      </div>
      {focused && options.length ? (
        <ul role="listbox" className="absolute z-20 mt-1 w-full rounded-md border border-line bg-elevated shadow-md p-1 max-h-48 overflow-y-auto">
          {options.map((opt, i) => (
            <li
              key={opt.type === 'tag' ? opt.tag.id : 'create'}
              role="option"
              aria-selected={i === active}
              onMouseDown={(e) => {
                e.preventDefault()
                choose(opt)
              }}
              onMouseEnter={() => setActive(i)}
              className={cn('flex items-center gap-2 rounded-sm px-2 h-8 text-sm cursor-pointer', i === active ? 'bg-sunken' : '')}
            >
              {opt.type === 'tag' ? (
                <TagChip tag={opt.tag} size="xs" />
              ) : (
                <>
                  <Icon name="plus" size={14} className="text-ink-muted" />
                  Create tag "{opt.name}"
                </>
              )}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  )
}
