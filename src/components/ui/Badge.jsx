import { cn } from '../../lib/cn.js'
import { COLOR_BY_ID, PRIORITY_BY_VALUE } from '../../constants/task.js'
import { Icon } from './Icon.jsx'

const TONES = {
  neutral: 'bg-sunken text-ink-secondary border-line',
  primary: 'bg-primary-soft text-primary border-transparent',
  success: 'bg-success-soft text-success border-transparent',
  warning: 'bg-warning-soft text-warning border-transparent',
  error: 'bg-error-soft text-error border-transparent',
  info: 'bg-info-soft text-info border-transparent',
}

export function Badge({ tone = 'neutral', icon, children, className, size = 'sm' }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 font-medium rounded-sm border whitespace-nowrap',
        size === 'xs' ? 'h-5 px-1.5 text-[11px]' : 'h-6 px-2 text-xs',
        TONES[tone],
        className,
      )}
    >
      {icon ? <Icon name={icon} size={size === 'xs' ? 11 : 12} /> : null}
      {children}
    </span>
  )
}

export function ColorDot({ color, size = 8, className }) {
  const hex = COLOR_BY_ID[color]?.hex || COLOR_BY_ID.slate.hex
  return <span aria-hidden="true" className={cn('inline-block rounded-full shrink-0', className)} style={{ width: size, height: size, backgroundColor: hex }} />
}

export function TagChip({ tag, onRemove, size = 'sm', className, interactive = false, onClick }) {
  const hex = COLOR_BY_ID[tag.color]?.hex || COLOR_BY_ID.slate.hex
  const Component = onClick ? 'button' : 'span'
  return (
    <Component
      type={onClick ? 'button' : undefined}
      onClick={onClick}
      className={cn(
        'inline-flex items-center gap-1 rounded-sm border border-line bg-surface font-medium whitespace-nowrap max-w-full',
        size === 'xs' ? 'h-5 px-1.5 text-[11px]' : 'h-6 px-2 text-xs',
        (interactive || onClick) && 'hover:bg-sunken transition-colors duration-fast',
        className,
      )}
    >
      <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full shrink-0" style={{ backgroundColor: hex }} />
      <span className="truncate">{tag.name}</span>
      {onRemove ? (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            onRemove()
          }}
          aria-label={`Remove tag ${tag.name}`}
          className="ml-0.5 -mr-0.5 rounded-xs text-ink-muted hover:text-ink hover:bg-line p-0.5"
        >
          <Icon name="x" size={10} strokeWidth={2.5} />
        </button>
      ) : null}
    </Component>
  )
}

export function PriorityFlag({ priority, showLabel = false, size = 14, className }) {
  const meta = PRIORITY_BY_VALUE[priority]
  if (!meta || priority === 0) return showLabel ? <span className={cn('text-ink-muted text-xs', className)}>No priority</span> : null
  return (
    <span className={cn('inline-flex items-center gap-1 text-xs font-medium', className)} style={{ color: `var(--color-priority-${meta.token})` }}>
      <Icon name="flag" size={size} strokeWidth={2} fill="currentColor" />
      {showLabel ? meta.label : <span className="sr-only">{meta.label} priority</span>}
    </span>
  )
}
