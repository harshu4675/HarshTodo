import { NavLink } from 'react-router-dom'
import { cn } from '../../lib/cn.js'
import { Icon } from '../ui/Icon.jsx'
import { MOBILE_NAV } from '../../constants/navigation.js'
import { useUI } from '../../app/UIContext.jsx'
import { useNavCounts } from '../../hooks/useCounts.js'

export function MobileNav({ onOpenMenu }) {
  const { openTaskEditor } = useUI()
  const counts = useNavCounts()
  const items = [...MOBILE_NAV]
  return (
    <nav aria-label="Primary" className="fixed bottom-0 inset-x-0 z-40 bg-surface/95 backdrop-blur border-t border-line pb-safe lg:hidden">
      <div className="grid grid-cols-5 h-16 items-stretch">
        {items.slice(0, 2).map((item) => (
          <MobileNavLink key={item.to} {...item} count={item.to === '/inbox' ? counts.inbox : item.to === '/today' ? counts.today : 0} />
        ))}
        <div className="flex items-center justify-center">
          <button
            type="button"
            onClick={() => openTaskEditor()}
            aria-label="New task"
            className="h-12 w-12 -mt-5 rounded-full bg-primary text-white shadow-md flex items-center justify-center active:bg-primary-active transition-colors"
          >
            <Icon name="plus" size={24} strokeWidth={2.25} />
          </button>
        </div>
        {items.slice(2).map((item) => (
          <MobileNavLink key={item.to} {...item} />
        ))}
      </div>
      <button type="button" onClick={onOpenMenu} className="sr-only">
        Open navigation menu
      </button>
    </nav>
  )
}

function MobileNavLink({ to, label, icon, count }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        cn('relative flex flex-col items-center justify-center gap-0.5 text-[11px] font-medium transition-colors', isActive ? 'text-primary' : 'text-ink-muted active:text-ink')
      }
    >
      <Icon name={icon} size={22} />
      <span>{label}</span>
      {count ? <span className="absolute top-2 right-[calc(50%-18px)] min-w-4 h-4 px-1 rounded-full bg-primary text-white text-[10px] font-semibold flex items-center justify-center tabular">{count > 99 ? '99+' : count}</span> : null}
    </NavLink>
  )
}
