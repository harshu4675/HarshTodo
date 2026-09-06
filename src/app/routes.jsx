import { lazy } from 'react'
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { AppShell } from '../components/layout/AppShell.jsx'
import { ROUTES } from '../constants/navigation.js'
import { useAppState } from '../store/AppStore.jsx'
import { BootScreen } from './BootScreen.jsx'
import { ErrorBoundary } from './ErrorBoundary.jsx'

const DashboardPage = lazy(() => import('../pages/DashboardPage.jsx'))
const InboxPage = lazy(() => import('../pages/InboxPage.jsx'))
const TodayPage = lazy(() => import('../pages/TodayPage.jsx'))
const UpcomingPage = lazy(() => import('../pages/UpcomingPage.jsx'))
const TasksPage = lazy(() => import('../pages/TasksPage.jsx'))
const CalendarPage = lazy(() => import('../pages/CalendarPage.jsx'))
const ProjectsPage = lazy(() => import('../pages/ProjectsPage.jsx'))
const ProjectPage = lazy(() => import('../pages/ProjectPage.jsx'))
const ListsPage = lazy(() => import('../pages/ListsPage.jsx'))
const ListPage = lazy(() => import('../pages/ListPage.jsx'))
const TagsPage = lazy(() => import('../pages/TagsPage.jsx'))
const TagPage = lazy(() => import('../pages/TagPage.jsx'))
const PrioritiesPage = lazy(() => import('../pages/PrioritiesPage.jsx'))
const CompletedPage = lazy(() => import('../pages/CompletedPage.jsx'))
const TrashPage = lazy(() => import('../pages/TrashPage.jsx'))
const SettingsPage = lazy(() => import('../pages/SettingsPage.jsx'))
const StatisticsPage = lazy(() => import('../pages/StatisticsPage.jsx'))
const SearchPage = lazy(() => import('../pages/SearchPage.jsx'))
const FocusPage = lazy(() => import('../pages/FocusPage.jsx'))
const WidgetPage = lazy(() => import('../pages/WidgetPage.jsx'))
const NotFoundPage = lazy(() => import('../pages/NotFoundPage.jsx'))

function Boundary({ children }) {
  const location = useLocation()
  return <ErrorBoundary resetKey={location.pathname}>{children}</ErrorBoundary>
}

export function AppRoutes() {
  const { status, bootError } = useAppState()
  if (status !== 'ready') return <BootScreen failed={status === 'failed'} error={bootError} />
  return (
    <Routes>
      <Route path={ROUTES.WIDGET} element={<Boundary><WidgetPage /></Boundary>} />
      <Route element={<AppShell />}>
        <Route path={ROUTES.DASHBOARD} element={<Boundary><DashboardPage /></Boundary>} />
        <Route path={ROUTES.INBOX} element={<Boundary><InboxPage /></Boundary>} />
        <Route path={ROUTES.TODAY} element={<Boundary><TodayPage /></Boundary>} />
        <Route path={ROUTES.UPCOMING} element={<Boundary><UpcomingPage /></Boundary>} />
        <Route path={ROUTES.TASKS} element={<Boundary><TasksPage /></Boundary>} />
        <Route path={ROUTES.CALENDAR} element={<Boundary><CalendarPage /></Boundary>} />
        <Route path={ROUTES.PROJECTS} element={<Boundary><ProjectsPage /></Boundary>} />
        <Route path={ROUTES.PROJECT} element={<Boundary><ProjectPage /></Boundary>} />
        <Route path={ROUTES.LISTS} element={<Boundary><ListsPage /></Boundary>} />
        <Route path={ROUTES.LIST} element={<Boundary><ListPage /></Boundary>} />
        <Route path={ROUTES.TAGS} element={<Boundary><TagsPage /></Boundary>} />
        <Route path={ROUTES.TAG} element={<Boundary><TagPage /></Boundary>} />
        <Route path={ROUTES.PRIORITIES} element={<Boundary><PrioritiesPage /></Boundary>} />
        <Route path={ROUTES.COMPLETED} element={<Boundary><CompletedPage /></Boundary>} />
        <Route path={ROUTES.TRASH} element={<Boundary><TrashPage /></Boundary>} />
        <Route path={ROUTES.SETTINGS} element={<Boundary><SettingsPage /></Boundary>} />
        <Route path={ROUTES.STATISTICS} element={<Boundary><StatisticsPage /></Boundary>} />
        <Route path={ROUTES.SEARCH} element={<Boundary><SearchPage /></Boundary>} />
        <Route path={ROUTES.FOCUS} element={<Boundary><FocusPage /></Boundary>} />
        <Route path={ROUTES.SHORTCUTS} element={<Navigate to={ROUTES.SETTINGS} replace />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  )
}
