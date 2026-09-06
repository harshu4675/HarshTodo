import { useNavigate } from 'react-router-dom'
import { Icon } from '../ui/Icon.jsx'
import { IconButton } from '../ui/Button.jsx'
import { Tooltip } from '../ui/Tooltip.jsx'
import { useUI } from '../../app/UIContext.jsx'
import { useOnlineStatus } from '../../hooks/useOnlineStatus.js'
import { ROUTES } from '../../constants/navigation.js'
import { cn } from '../../lib/cn.js'
import { Logo } from './Logo.jsx'

export function TopBar({ onOpenMenu, title }) {
  const { setPaletteOpen, setShortcutsOpen } = useUI()
  const online = useOnlineStatus()
  const navigate = useNavigate()
  return (
    <header className="sticky top-0 z-30 h-14 flex items-center gap-2 px-3 sm:px-4 bg-canvas/90 backdrop-blur border-b border-line pt-safe">
      <IconButton icon="menu" label="Open navigation" onClick={onOpenMenu} className="lg:hidden" />
      <div className="lg:hidden">
        <Logo compact />
      </div>
      {title ? <h1 className="lg:hidden text-sm font-semibold text-ink truncate ml-1">{title}</h1> : null}
      <div className="flex-1" />
      <button
        type="button"
        onClick={() => setPaletteOpen(true)}
        className="hidden sm:flex items-center gap-2 h-9 w-64 lg:w-80 rounded-md border border-line bg-surface px-3 text-sm text-ink-muted hover:border-line-strong transition-colors duration-fast text-left"
        aria-label="Search and commands"
      >
        <Icon name="search" size={16} />
        <span className="flex-1">Search or run a command</span>
        <kbd>/</kbd>
      </button>
      <IconButton icon="search" label="Search" onClick={() => navigate(ROUTES.SEARCH)} className="sm:hidden" />
      {!online ? (
        <Tooltip content="You are offline. Changes are saved on this device.">
          <span className={cn('inline-flex items-center gap-1.5 h-7 px-2 rounded-md text-xs font-medium bg-warning-soft text-warning')}>
            <Icon name="wifi-off" size={14} />
            <span className="hidden sm:inline">Offline</span>
          </span>
        </Tooltip>
      ) : null}
      <Tooltip content="Keyboard shortcuts (?)">
        <IconButton icon="keyboard" label="Keyboard shortcuts" onClick={() => setShortcutsOpen(true)} className="hidden sm:inline-flex" />
      </Tooltip>
    </header>
  )
}
