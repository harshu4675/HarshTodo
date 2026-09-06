import { cn } from '../../lib/cn.js'
import { Icon } from './Icon.jsx'
import { Button } from './Button.jsx'

export function EmptyState({ icon = 'inbox', title, description, action, secondaryAction, className, compact = false }) {
  return (
    <div className={cn('flex flex-col items-center justify-center text-center', compact ? 'py-8 px-4' : 'py-16 px-6', className)}>
      <div className="h-11 w-11 rounded-lg bg-sunken border border-line flex items-center justify-center text-ink-muted mb-4">
        <Icon name={icon} size={20} />
      </div>
      <h3 className="text-sm font-semibold text-ink">{title}</h3>
      {description ? <p className="mt-1 text-sm text-ink-muted max-w-xs leading-relaxed">{description}</p> : null}
      {action || secondaryAction ? (
        <div className="mt-4 flex items-center gap-2">
          {action ? (
            <Button variant="primary" size="sm" icon={action.icon} onClick={action.onClick}>
              {action.label}
            </Button>
          ) : null}
          {secondaryAction ? (
            <Button variant="ghost" size="sm" icon={secondaryAction.icon} onClick={secondaryAction.onClick}>
              {secondaryAction.label}
            </Button>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}

export function LoadingState({ label = 'Loading', className, rows = 4 }) {
  return (
    <div role="status" aria-live="polite" aria-label={label} className={cn('flex flex-col gap-2 p-4', className)}>
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="h-12 rounded-md bg-sunken animate-pulse" style={{ opacity: 1 - i * 0.15 }} />
      ))}
      <span className="sr-only">{label}</span>
    </div>
  )
}

export function ErrorState({ title = 'Something went wrong', description, onRetry, retryLabel = 'Try again', className }) {
  return (
    <div role="alert" className={cn('flex flex-col items-center text-center py-12 px-6', className)}>
      <div className="h-11 w-11 rounded-lg bg-error-soft flex items-center justify-center text-error mb-4">
        <Icon name="alert-triangle" size={20} />
      </div>
      <h3 className="text-sm font-semibold text-ink">{title}</h3>
      {description ? <p className="mt-1 text-sm text-ink-muted max-w-sm leading-relaxed">{description}</p> : null}
      {onRetry ? (
        <Button variant="secondary" size="sm" icon="refresh" className="mt-4" onClick={onRetry}>
          {retryLabel}
        </Button>
      ) : null}
    </div>
  )
}

export function InlineNotice({ tone = 'info', children, action, className }) {
  const styles = {
    info: 'bg-info-soft text-info border-info/20',
    warning: 'bg-warning-soft text-warning border-warning/20',
    error: 'bg-error-soft text-error border-error/20',
    success: 'bg-success-soft text-success border-success/20',
  }
  const icons = { info: 'info', warning: 'alert-triangle', error: 'alert-circle', success: 'circle-check' }
  return (
    <div role={tone === 'error' ? 'alert' : 'status'} className={cn('flex items-start gap-2.5 rounded-md border px-3 py-2.5 text-sm', styles[tone], className)}>
      <Icon name={icons[tone]} size={16} className="mt-0.5 shrink-0" />
      <div className="flex-1 min-w-0 leading-relaxed">{children}</div>
      {action}
    </div>
  )
}
