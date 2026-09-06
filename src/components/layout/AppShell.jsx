import { useState, useCallback, Suspense } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { cn } from '../../lib/cn.js'
import { Sidebar } from './Sidebar.jsx'
import { MobileNav } from './MobileNav.jsx'
import { TopBar } from './TopBar.jsx'
import { Drawer } from '../ui/Drawer.jsx'
import { LoadingState } from '../ui/States.jsx'
import { useUI } from '../../app/UIContext.jsx'
import { useBreakpoint } from '../../hooks/useMediaQuery.js'
import { TaskEditorDialog } from '../tasks/TaskEditorDialog.jsx'
import { TaskDetailsDrawer } from '../tasks/TaskDetailsDrawer.jsx'
import { CommandPalette } from '../search/CommandPalette.jsx'
import { ShortcutsDialog } from './ShortcutsDialog.jsx'
import { useGlobalShortcuts } from '../../hooks/useGlobalShortcuts.js'
import { ReminderScheduler } from '../../services/ReminderScheduler.jsx'
import { UpdatePrompt } from '../../pwa/UpdatePrompt.jsx'
import { StorageNotice } from './StorageNotice.jsx'

export function AppShell() {
  const [menuOpen, setMenuOpen] = useState(false)
  const { sidebarCollapsed } = useUI()
  const { isDesktop } = useBreakpoint()
  const location = useLocation()
  const closeMenu = useCallback(() => setMenuOpen(false), [])
  useGlobalShortcuts()
  const focusRoute = location.pathname.startsWith('/focus')

  return (
    <div className="flex min-h-dvh w-full">
      {isDesktop ? (
        <aside className={cn('sticky top-0 h-dvh shrink-0 border-r border-line transition-[width] duration-base', sidebarCollapsed ? 'w-14' : 'w-60 xl:w-64')}>
          <Sidebar collapsed={sidebarCollapsed} />
        </aside>
      ) : null}
      <div className="flex-1 min-w-0 flex flex-col">
        {!focusRoute ? <TopBar onOpenMenu={() => setMenuOpen(true)} /> : null}
        <StorageNotice />
        <main id="main" className={cn('flex-1 min-w-0 flex flex-col', !isDesktop && !focusRoute && 'pb-20')}>
          <Suspense fallback={<LoadingState className="max-w-3xl mx-auto w-full pt-6" />}>
            <Outlet />
          </Suspense>
        </main>
      </div>
      {!isDesktop && !focusRoute ? <MobileNav onOpenMenu={() => setMenuOpen(true)} /> : null}
      {!isDesktop ? (
        <Drawer open={menuOpen} onClose={closeMenu} side="left" width="sm:max-w-xs" hideHeader>
          <Sidebar onNavigate={closeMenu} mobile />
        </Drawer>
      ) : null}
      <TaskEditorDialog />
      <TaskDetailsDrawer />
      <CommandPalette />
      <ShortcutsDialog />
      <ReminderScheduler />
      <UpdatePrompt />
    </div>
  )
}
