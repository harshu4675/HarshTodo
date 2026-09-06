import { forwardRef, useId } from 'react'
import { cn } from '../../lib/cn.js'
import { Icon } from './Icon.jsx'

const fieldBase =
  'w-full bg-surface border border-line-strong rounded-md text-sm text-ink placeholder:text-ink-faint transition-colors duration-fast hover:border-ink-faint focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:bg-sunken disabled:text-ink-muted'

export function Field({ label, hint, error, children, htmlFor, className, inline = false }) {
  return (
    <div className={cn('flex flex-col gap-1.5', inline && 'sm:flex-row sm:items-center sm:justify-between sm:gap-4', className)}>
      {label ? (
        <label htmlFor={htmlFor} className="text-[13px] font-medium text-ink-secondary">
          {label}
        </label>
      ) : null}
      <div className={cn('flex flex-col gap-1', inline && 'sm:w-64')}>
        {children}
        {error ? (
          <p className="text-xs text-error" role="alert">
            {error}
          </p>
        ) : hint ? (
          <p className="text-xs text-ink-muted">{hint}</p>
        ) : null}
      </div>
    </div>
  )
}

export const Input = forwardRef(function Input({ className, icon, size = 'md', invalid, ...rest }, ref) {
  const height = size === 'sm' ? 'h-8' : size === 'lg' ? 'h-11' : 'h-9'
  if (!icon) {
    return <input ref={ref} aria-invalid={invalid || undefined} className={cn(fieldBase, height, 'px-3', invalid && 'border-error', className)} {...rest} />
  }
  return (
    <div className="relative">
      <Icon name={icon} size={16} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-ink-muted pointer-events-none" />
      <input ref={ref} aria-invalid={invalid || undefined} className={cn(fieldBase, height, 'pl-8 pr-3', invalid && 'border-error', className)} {...rest} />
    </div>
  )
})

export const Textarea = forwardRef(function Textarea({ className, rows = 3, ...rest }, ref) {
  return <textarea ref={ref} rows={rows} className={cn(fieldBase, 'px-3 py-2 resize-y min-h-[2.25rem] leading-relaxed', className)} {...rest} />
})

export const Select = forwardRef(function Select({ className, children, size = 'md', ...rest }, ref) {
  const height = size === 'sm' ? 'h-8' : 'h-9'
  return (
    <div className="relative">
      <select ref={ref} className={cn(fieldBase, height, 'pl-3 pr-8 appearance-none cursor-pointer', className)} {...rest}>
        {children}
      </select>
      <Icon name="chevron-down" size={16} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-ink-muted pointer-events-none" />
    </div>
  )
})

export function Checkbox({ checked, onChange, label, indeterminate = false, className, id: providedId, disabled, ...rest }) {
  const autoId = useId()
  const id = providedId || autoId
  return (
    <label htmlFor={id} className={cn('inline-flex items-center gap-2 cursor-pointer select-none text-sm', disabled && 'opacity-50 cursor-not-allowed', className)}>
      <span className="relative inline-flex">
        <input
          id={id}
          type="checkbox"
          checked={checked}
          disabled={disabled}
          onChange={(e) => onChange?.(e.target.checked)}
          className="peer sr-only"
          ref={(el) => {
            if (el) el.indeterminate = indeterminate
          }}
          {...rest}
        />
        <span
          aria-hidden="true"
          className={cn(
            'h-4.5 w-4.5 rounded-xs border border-line-strong bg-surface flex items-center justify-center transition-colors duration-fast',
            'peer-focus-visible:ring-2 peer-focus-visible:ring-primary/30 peer-focus-visible:border-primary',
            (checked || indeterminate) && 'bg-primary border-primary text-white',
          )}
        >
          {indeterminate ? <span className="h-0.5 w-2.5 bg-white rounded" /> : checked ? <Icon name="check" size={12} strokeWidth={3} /> : null}
        </span>
      </span>
      {label ? <span>{label}</span> : null}
    </label>
  )
}

export function Switch({ checked, onChange, label, description, id: providedId, disabled }) {
  const autoId = useId()
  const id = providedId || autoId
  return (
    <div className="flex items-start justify-between gap-4">
      {label ? (
        <div className="flex flex-col gap-0.5">
          <label htmlFor={id} className="text-sm font-medium text-ink cursor-pointer">
            {label}
          </label>
          {description ? <p className="text-xs text-ink-muted leading-relaxed">{description}</p> : null}
        </div>
      ) : null}
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange?.(!checked)}
        className={cn(
          'relative inline-flex h-6 w-10 shrink-0 items-center rounded-full border transition-colors duration-base disabled:opacity-50',
          checked ? 'bg-primary border-primary' : 'bg-line border-line-strong',
        )}
      >
        <span
          aria-hidden="true"
          className={cn('inline-block h-4.5 w-4.5 rounded-full bg-white shadow-sm transition-transform duration-base', checked ? 'translate-x-[18px]' : 'translate-x-[2px]')}
        />
      </button>
    </div>
  )
}
