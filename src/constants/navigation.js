export const ROUTES = Object.freeze({
  DASHBOARD: '/',
  TASKS: '/tasks',
  TODAY: '/today',
  UPCOMING: '/upcoming',
  CALENDAR: '/calendar',
  INBOX: '/inbox',
  PROJECTS: '/projects',
  PROJECT: '/projects/:projectId',
  LISTS: '/lists',
  LIST: '/lists/:listId',
  TAGS: '/tags',
  TAG: '/tags/:tagId',
  PRIORITIES: '/priorities',
  COMPLETED: '/completed',
  TRASH: '/trash',
  SETTINGS: '/settings',
  STATISTICS: '/statistics',
  SEARCH: '/search',
  FOCUS: '/focus',
  WIDGET: '/widget',
  SHORTCUTS: '/shortcuts',
})

export const PRIMARY_NAV = [
  { to: ROUTES.DASHBOARD, label: 'Dashboard', icon: 'layout-dashboard', shortcut: 'D', end: true },
  { to: ROUTES.INBOX, label: 'Inbox', icon: 'inbox', shortcut: 'I', countKey: 'inbox' },
  { to: ROUTES.TODAY, label: 'Today', icon: 'sun', shortcut: 'T', countKey: 'today' },
  { to: ROUTES.UPCOMING, label: 'Upcoming', icon: 'calendar-clock', shortcut: 'U' },
  { to: ROUTES.CALENDAR, label: 'Calendar', icon: 'calendar', shortcut: 'C' },
  { to: ROUTES.TASKS, label: 'All tasks', icon: 'list-checks', shortcut: 'A' },
]

export const ORGANIZE_NAV = [
  { to: ROUTES.PROJECTS, label: 'Projects', icon: 'folder-kanban' },
  { to: ROUTES.LISTS, label: 'Lists', icon: 'list' },
  { to: ROUTES.TAGS, label: 'Tags', icon: 'tag' },
  { to: ROUTES.PRIORITIES, label: 'Priorities', icon: 'flag' },
]

export const SECONDARY_NAV = [
  { to: ROUTES.STATISTICS, label: 'Statistics', icon: 'bar-chart-3' },
  { to: ROUTES.FOCUS, label: 'Focus', icon: 'timer' },
  { to: ROUTES.COMPLETED, label: 'Completed', icon: 'check-circle-2' },
  { to: ROUTES.TRASH, label: 'Trash', icon: 'trash-2' },
  { to: ROUTES.SETTINGS, label: 'Settings', icon: 'settings' },
]

export const MOBILE_NAV = [
  { to: ROUTES.TODAY, label: 'Today', icon: 'sun' },
  { to: ROUTES.INBOX, label: 'Inbox', icon: 'inbox' },
  { to: ROUTES.CALENDAR, label: 'Calendar', icon: 'calendar' },
  { to: ROUTES.SEARCH, label: 'Search', icon: 'search' },
]
