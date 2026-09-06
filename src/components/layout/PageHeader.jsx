import { cn } from '../../lib/cn.js'

export function PageHeader({ title, subtitle, actions, className, children, eyebrow }) {
  return (
    <div className={cn('flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between mb-5', className)}>
      <div className="min-w-0">
        {eyebrow ? <p className="text-xs font-medium text-ink-muted uppercase tracking-wide mb-1">{eyebrow}</p> : null}
        <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-ink truncate">{title}</h1>
        {subtitle ? <p className="text-sm text-ink-muted mt-0.5">{subtitle}</p> : null}
        {children}
      </div>
      {actions ? <div className="flex items-center gap-2 flex-wrap shrink-0">{actions}</div> : null}
    </div>
  )
}

export function Page({ children, className, width = 'max-w-4xl' }) {
  return <div className={cn('w-full mx-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-6 lg:py-8 flex-1 flex flex-col', width, className)}>{children}</div>
}

export function Card({ children, className, as: Component = 'section', padded = true, ...rest }) {
  return (
    <Component className={cn('bg-surface border border-line rounded-lg shadow-xs', padded && 'p-4 sm:p-5', className)} {...rest}>
      {children}
    </Component>
  )
}

export function SectionTitle({ children, action, className }) {
  return (
    <div className={cn('flex items-center justify-between mb-3', className)}>
      <h2 className="text-sm font-semibold text-ink">{children}</h2>
      {action}
    </div>
  )
}
