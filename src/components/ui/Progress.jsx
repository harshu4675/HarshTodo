import { cn } from '../../lib/cn.js'

export function ProgressBar({ value = 0, label, className, tone = 'primary', size = 'md' }) {
  const percent = Math.max(0, Math.min(100, Math.round(value)))
  const color = tone === 'success' ? 'bg-success' : tone === 'warning' ? 'bg-warning' : 'bg-primary'
  return (
    <div
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={percent}
      aria-label={label}
      className={cn('w-full rounded-full bg-line overflow-hidden', size === 'sm' ? 'h-1' : 'h-1.5', className)}
    >
      <div className={cn('h-full rounded-full transition-[width] duration-slow ease-out-quart', color)} style={{ width: `${percent}%` }} />
    </div>
  )
}

export function ProgressRing({ value = 0, size = 56, stroke = 5, label, children, className }) {
  const percent = Math.max(0, Math.min(100, value))
  const radius = (size - stroke) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (percent / 100) * circumference
  return (
    <div className={cn('relative inline-flex items-center justify-center shrink-0', className)} style={{ width: size, height: size }}>
      <svg width={size} height={size} role="img" aria-label={label || `${Math.round(percent)} percent`} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="var(--color-line)" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--color-primary)"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-[stroke-dashoffset] duration-slow ease-out-quart"
        />
      </svg>
      {children ? <div className="absolute inset-0 flex items-center justify-center">{children}</div> : null}
    </div>
  )
}
