import { useState } from 'react'
import { cn } from '../../lib/cn.js'
import { Icon } from '../ui/Icon.jsx'
import { PRIORITY_BY_VALUE } from '../../constants/task.js'

export function TaskCheckbox({ checked, onToggle, priority = 0, title, size = 'md' }) {
  const [pop, setPop] = useState(false)
  const token = PRIORITY_BY_VALUE[priority]?.token || 'none'
  const dims = size === 'sm' ? 'h-4.5 w-4.5' : 'h-5 w-5'
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      aria-label={checked ? `Mark "${title}" as not completed` : `Complete "${title}"`}
      onClick={(e) => {
        e.stopPropagation()
        if (!checked) setPop(true)
        onToggle()
      }}
      onAnimationEnd={() => setPop(false)}
      className={cn(
        'group/check relative shrink-0 rounded-full border-[1.5px] flex items-center justify-center transition-colors duration-fast outline-none',
        'focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-1',
        dims,
        checked ? 'bg-primary border-primary text-white' : 'bg-surface hover:bg-primary-soft',
        pop && 'animate-check-pop',
      )}
      style={!checked ? { borderColor: priority > 0 ? `var(--color-priority-${token})` : 'var(--color-line-strong)' } : undefined}
    >
      <Icon name="check" size={size === 'sm' ? 11 : 12} strokeWidth={3} className={cn('transition-opacity duration-fast', checked ? 'opacity-100' : 'opacity-0 group-hover/check:opacity-60 text-primary')} />
    </button>
  )
}
