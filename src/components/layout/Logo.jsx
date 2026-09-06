import { Link } from 'react-router-dom'
import { cn } from '../../lib/cn.js'

export function LogoMark({ size = 28, className }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true" className={cn('shrink-0', className)}>
      <rect x="1" y="1" width="30" height="30" rx="8" fill="var(--color-primary)" />
      <path d="M9.5 16.5l4.5 4.5 8.5-9" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function Logo({ compact = false }) {
  return (
    <Link to="/" className="inline-flex items-center gap-2.5 rounded-md outline-none focus-visible:ring-2 focus-visible:ring-primary/40" aria-label="HarshTodo home">
      <LogoMark />
      {!compact ? <span className="text-[15px] font-semibold tracking-tight text-ink">HarshTodo</span> : null}
    </Link>
  )
}
