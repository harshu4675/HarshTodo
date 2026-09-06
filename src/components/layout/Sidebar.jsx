import { NavLink, useNavigate } from 'react-router-dom'
import { cn } from '../../lib/cn.js'
import { Icon } from '../ui/Icon.jsx'
import { IconButton, Button } from '../ui/Button.jsx'
import { Tooltip } from '../ui/Tooltip.jsx'
import { ColorDot } from '../ui/Badge.jsx'
import { PRIMARY_NAV, ORGANIZE_NAV, SECONDARY_NAV, ROUTES } from '../../constants/navigation.js'
import { useNavCounts } from '../../hooks/useCounts.js'
import { useAppState } from '../../store/AppStore.jsx'
import { useUI } from '../../app/UIContext.jsx'
import { PROJECT_STATUS } from '../../constants/task.js'
import { projectProgress } from '../../lib/taskQueries.js'
import { Logo } from './Logo.jsx'

function NavItem({ to, label, icon, count, end, collapsed, color, onNavigate }) {
  const link = (
    <NavLink
      to={to}
      end={end}
      onClick={onNavigate}
      className={({ isActive }) =>
        cn(
          'group flex items-center gap-2.5 rounded-md h-9 text-sm font-medium transition-colors duration-fast outline-none',
          'focus-visible:ring-2 focus-visible:ring-primary/40',
          collapsed ? 'justify-center w-9 mx-auto' : 'px-2.5',
          isActive ? 'bg-surface text-ink shadow-xs border border-line' : 'text-ink-secondary hover:bg-surface/70 hover:text-ink border border-transparent',
        )
      }
    >
      {color ? <ColorDot color={color} size={8} className={cn(collapsed ? '' : 'ml-1 mr-1')} /> : <Icon name={icon} size={17} className="shrink-0 text-ink-muted group-[.active]:text-primary" />}
      {!collapsed ? <span className="flex-1 truncate">{label}</span> : <span className="sr-only">{label}</span>}
      {!collapsed && count ? <span className="text-xs tabular text-ink-muted">{count}</span> : null}
    </NavLink>
  )
  return collapsed ? (
    <Tooltip content={label} side="right">
      {link}
    </Tooltip>
  ) : (
    link
  )
}

function Section({ title, collapsed, children, action }) {
  return (
    <div className="flex flex-col gap-0.5">
      {!collapsed && title ? (
        <div className="flex items-center justify-between px-2.5 mt-4 mb-1">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-ink-muted">{title}</span>
          {action}
        </div>
      ) : collapsed ? (
        <div className="my-2 h-px bg-line mx-2" />
      ) : null}
      {children}
    </div>
  )
}

export function Sidebar({ collapsed = false, onNavigate, className, mobile = false }) {
  const counts = useNavCounts()
  const { projects, tasks } = useAppState()
  const { openTaskEditor, toggleSidebar } = useUI()
  const navigate = useNavigate()
  const activeProjects = projects.filter((p) => p.status === PROJECT_STATUS.ACTIVE).sort((a, b) => a.order - b.order).slice(0, 8)

  return (
    <nav aria-label="Main navigation" className={cn('flex flex-col h-full bg-canvas', className)}>
      <div className={cn('flex items-center h-14 shrink-0', collapsed ? 'justify-center px-2' : 'justify-between px-4')}>
        {!collapsed ? <Logo /> : <Logo compact />}
        {!mobile ? <IconButton icon={collapsed ? 'panel-left' : 'panel-left-close'} label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'} size="sm" onClick={toggleSidebar} className={cn(collapsed && 'hidden')} /> : null}
      </div>
      <div className={cn('px-3 pb-2', collapsed && 'px-2')}>
        {collapsed ? (
          <Tooltip content="New task (N)" side="right">
            <IconButton icon="plus" label="New task" variant="primary" onClick={() => openTaskEditor()} className="w-9 mx-auto" />
          </Tooltip>
        ) : (
          <Button variant="primary" icon="plus" className="w-full justify-start" onClick={() => openTaskEditor()}>
            New task
            <kbd className="ml-auto bg-white/15 border-white/20 text-white shadow-none">N</kbd>
          </Button>
        )}
      </div>
      <div className={cn('flex-1 overflow-y-auto scrollbar-thin px-3 pb-4', collapsed && 'px-2')}>
        <Section collapsed={collapsed}>
          {PRIMARY_NAV.map((item) => (
            <NavItem key={item.to} {...item} count={item.countKey ? counts[item.countKey] : 0} collapsed={collapsed} onNavigate={onNavigate} />
          ))}
        </Section>
        <Section title="Organize" collapsed={collapsed}>
          {ORGANIZE_NAV.map((item) => (
            <NavItem key={item.to} {...item} collapsed={collapsed} onNavigate={onNavigate} />
          ))}
        </Section>
        {activeProjects.length ? (
          <Section
            title="Projects"
            collapsed={collapsed}
            action={<IconButton icon="plus" label="New project" size="xs" onClick={() => navigate(`${ROUTES.PROJECTS}?new=1`)} />}
          >
            {activeProjects.map((p) => (
              <NavItem key={p.id} to={`/projects/${p.id}`} label={p.name} color={p.color} count={projectProgress(tasks, p.id).open} collapsed={collapsed} onNavigate={onNavigate} />
            ))}
          </Section>
        ) : null}
        <Section title="More" collapsed={collapsed}>
          {SECONDARY_NAV.map((item) => (
            <NavItem key={item.to} {...item} collapsed={collapsed} onNavigate={onNavigate} />
          ))}
        </Section>
      </div>
      {collapsed ? (
        <div className="p-2 border-t border-line">
          <Tooltip content="Expand sidebar" side="right">
            <IconButton icon="panel-left" label="Expand sidebar" size="sm" onClick={toggleSidebar} className="mx-auto" />
          </Tooltip>
        </div>
      ) : null}
    </nav>
  )
}
