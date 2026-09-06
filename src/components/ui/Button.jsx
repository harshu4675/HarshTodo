import { forwardRef } from 'react'
import { cn } from '../../lib/cn.js'
import { Icon } from './Icon.jsx'

const VARIANTS = {
  primary: 'bg-primary text-white hover:bg-primary-hover active:bg-primary-active shadow-xs',
  secondary: 'bg-surface text-ink border border-line-strong hover:bg-sunken active:bg-line shadow-xs',
  ghost: 'text-ink-secondary hover:bg-sunken hover:text-ink active:bg-line',
  soft: 'bg-primary-soft text-primary hover:bg-primary-soft-hover',
  danger: 'bg-error text-white hover:brightness-95 active:brightness-90 shadow-xs',
  'danger-ghost': 'text-error hover:bg-error-soft',
}

const SIZES = {
  xs: 'h-7 px-2 text-xs gap-1 rounded-sm',
  sm: 'h-8 px-2.5 text-sm gap-1.5 rounded-md',
  md: 'h-9 px-3.5 text-sm gap-2 rounded-md',
  lg: 'h-11 px-4 text-[15px] gap-2 rounded-lg',
}

export const Button = forwardRef(function Button(
  { variant = 'secondary', size = 'md', icon, iconRight, className, children, loading = false, disabled, type = 'button', ...rest },
  ref,
) {
  const iconSize = size === 'xs' ? 14 : size === 'lg' ? 18 : 16
  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={cn(
        'inline-flex items-center justify-center font-medium whitespace-nowrap select-none transition-colors duration-fast',
        'disabled:opacity-50 disabled:pointer-events-none',
        VARIANTS[variant],
        SIZES[size],
        className,
      )}
      {...rest}
    >
      {loading ? <Icon name="refresh" size={iconSize} className="animate-spin" /> : icon ? <Icon name={icon} size={iconSize} /> : null}
      {children}
      {iconRight ? <Icon name={iconRight} size={iconSize} /> : null}
    </button>
  )
})

export const IconButton = forwardRef(function IconButton(
  { icon, label, size = 'md', variant = 'ghost', className, active = false, type = 'button', ...rest },
  ref,
) {
  const dims = size === 'xs' ? 'h-7 w-7' : size === 'sm' ? 'h-8 w-8' : size === 'lg' ? 'h-11 w-11' : 'h-9 w-9'
  const iconSize = size === 'xs' ? 14 : size === 'sm' ? 16 : size === 'lg' ? 20 : 18
  return (
    <button
      ref={ref}
      type={type}
      aria-label={label}
      title={label}
      className={cn(
        'inline-flex items-center justify-center rounded-md transition-colors duration-fast disabled:opacity-50 disabled:pointer-events-none shrink-0',
        VARIANTS[variant],
        active && 'bg-sunken text-ink',
        dims,
        className,
      )}
      {...rest}
    >
      <Icon name={icon} size={iconSize} />
    </button>
  )
})
