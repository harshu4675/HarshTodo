# HarshTodo

A local-first task manager that installs like an app, works fully offline, and keeps every byte of your data on your own device.

HarshTodo is a progressive web app built with React 19, Tailwind CSS 4 and IndexedDB. It has a calendar with drag-and-drop rescheduling, a recurrence engine, natural-language quick add, reminders, a focus timer, statistics, projects, lists, tags, saved filters, global search and a compact widget-style view. There is no server, no account and no analytics.

## Contents

- [Features](#features)
- [Tech stack](#tech-stack)
- [Getting started](#getting-started)
- [Scripts](#scripts)
- [Project structure](#project-structure)
- [Architecture](#architecture)
- [Data model](#data-model)
- [Recurrence engine](#recurrence-engine)
- [Natural-language quick add](#natural-language-quick-add)
- [Calendar](#calendar)
- [Reminders and notifications](#reminders-and-notifications)
- [Offline, PWA and updates](#offline-pwa-and-updates)
- [Widget-style compact view](#widget-style-compact-view)
- [Keyboard shortcuts](#keyboard-shortcuts)
- [Accessibility](#accessibility)
- [Responsive behaviour](#responsive-behaviour)
- [Error handling](#error-handling)
- [Performance](#performance)
- [Privacy](#privacy)
- [Backup, export and import](#backup-export-and-import)
- [Testing](#testing)
- [Deployment](#deployment)
- [Adding a backend or sync later](#adding-a-backend-or-sync-later)
- [Known limitations](#known-limitations)
- [Roadmap](#roadmap)
- [License](#license)

## Features

Sections

- Dashboard with today's progress, overdue items, upcoming days, project health and the current streak
- Inbox, Today, Upcoming, All tasks, Priorities, Completed, Trash
- Calendar with month, week, day and agenda views
- Projects, Lists, Tags with their own pages and counts
- Saved filters built from the filter bar
- Global search page and command palette
- Focus mode with a persistent timer
- Statistics
- Settings
- Compact widget-style view at `/widget`

Tasks

- Title, description, notes, due date, due time, start and end dates, priority (none to urgent), status (inbox, planned, in progress, completed, archived, cancelled), project, list, tags, subtasks, recurrence, reminder, attachments (stored as blobs in IndexedDB), location, URL, colour, estimated and actual duration, created, updated and completed timestamps
- Inline rename, drag to reorder, swipe on touch, bulk selection with bulk actions
- Soft delete to Trash with restore and permanent delete
- Undo for completion and deletion

Scheduling

- Recurrence rules: daily, weekly, monthly, yearly, weekdays, custom intervals, specific weekdays, specific days of month, end date, occurrence count
- Recurring completions roll the task to the next occurrence and keep a completed copy for history
- Drag tasks between days in month, week and day views, and between time slots in week and day views
- Reminders with browser notifications, in-app fallback and snooze

Productivity

- Quick add with natural-language parsing; every detected value is shown as a removable chip before saving
- Keyboard shortcuts for navigation, creation, selection, completion and deletion
- Context menus and quick actions on each task
- Recent searches and highlighted matches

## Tech stack

Every dependency has a job. Nothing was added because it is popular.

| Package | Why it is here |
| --- | --- |
| react, react-dom | UI runtime |
| react-router-dom | Client routing with lazy-loaded pages |
| idb | Thin promise wrapper over IndexedDB, used by the storage adapter |
| date-fns | Correct local-time date arithmetic for recurrence, calendar grids and formatting |
| lucide-react | Icon set, tree-shaken per icon |
| tailwindcss, @tailwindcss/vite | Styling with design tokens defined in `src/styles/globals.css` |
| vite, @vitejs/plugin-react | Build tool and dev server |
| vite-plugin-pwa, workbox-* | Manifest generation and precache manifest injection into the custom service worker |
| vitest, fake-indexeddb, jsdom, @testing-library/react | Tests, including a real IndexedDB implementation in Node |

## Getting started

Requirements: Node 20 or newer and npm 10 or newer.

```bash
git clone https://github.com/harshu4675/HarshTodo.git
cd HarshTodo
npm install
npm run dev
```

Open the printed URL. The service worker is only registered in production builds, so to try installation and offline behaviour run:

```bash
npm run build
npm run preview
```

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Start the Vite dev server on all interfaces |
| `npm run build` | Production build into `dist/` including the service worker and manifest |
| `npm run preview` | Serve `dist/` locally to test the PWA |
| `npm test` | Run the whole test suite once |
| `npm run test:watch` | Run tests in watch mode |

## Project structure

```
src/
  app/            App composition: providers, routes, error boundary, boot screen, UI context
  components/
    ui/           Design-system primitives: Button, Input, Modal, Drawer, Dropdown, Toast, DatePicker, states
    layout/       AppShell, Sidebar, TopBar, MobileNav, PageHeader, StorageNotice, ShortcutsDialog
    tasks/        TaskRow, TaskList, QuickAdd, TaskEditorDialog, TaskDetailsDrawer, FilterBar, BulkActionBar
    calendar/     MonthView, TimeGridView (week and day), AgendaView, CalendarEvent
    projects/     ProjectCard and entity editors shared by projects, lists and tags
    search/       CommandPalette
  constants/      Task enums, navigation, keyboard shortcut definitions
  data/
    models.js     Normalisers that turn any object into a valid task, project, list, tag or settings record
    recurrence.js Recurrence engine
    database.js   IndexedDB schema, versioned migrations, open and delete helpers
    storage/      Storage adapters: IndexedDB and in-memory, behind one interface
    repositories/ Domain repositories that sit on top of a storage adapter
  store/          Reducer, AppStore provider and action creators grouped by domain
  lib/            Pure helpers: dates, filters, search, natural language, calendar layout, statistics
  hooks/          Reusable hooks: media queries, focus trap, shortcuts, drag and drop, timers
  services/       Reminder scheduler and notification helpers
  pwa/            Service worker source, registration, update and install helpers
  pages/          One component per route
  styles/         Tailwind theme tokens and base styles
  test/           Test setup and integration tests
public/
  icons/          App icons
  offline.html    Fallback document served when a navigation is not cached
```

## Architecture

The app is layered so that each layer only knows about the one below it.

1. Storage adapter. `src/data/storage` defines a small interface: `get`, `getAll`, `put`, `putMany`, `delete`, `clear`, `count`, plus transaction helpers. There are two implementations, `indexedDbStorage` and `memoryStorage`. The memory adapter is used automatically when IndexedDB is missing or fails to open, and the UI shows a persistent notice explaining that data will not survive a reload.
2. Repositories. `src/data/repositories` contain the domain rules: soft delete, restore, recurring completion, attachment blobs, settings defaults, data export and import. They never touch React.
3. Store. `src/store` is a reducer plus a context provider. Action creators call the repositories, then dispatch the resulting records. All lists in the UI derive from the store with memoised selectors in `src/lib/taskQueries.js` and `src/lib/filters.js`.
4. UI. Pages compose components and read from the store. Cross-cutting UI state (open editor, open details drawer, selected row, command palette) lives in `src/app/UIContext.jsx`. Keyboard shortcuts publish events on a tiny event bus so that any mounted task list can respond.

Design system tokens live in `src/styles/globals.css` under `@theme`. Colours, radii, shadows, durations and animations are referenced by utility class so the visual language stays consistent without a component library.

## Data model

Dates are stored as `yyyy-MM-dd` strings, times as `HH:mm`, and timestamps as ISO strings. All date logic runs in local time.

Task

| Field | Type | Notes |
| --- | --- | --- |
| id | string | Generated with `crypto.randomUUID` when available |
| title | string | Required, trimmed, max 500 characters |
| description, notes | string | Optional |
| status | enum | inbox, planned, in_progress, completed, archived, cancelled |
| priority | 0 to 4 | 0 none, 1 low, 2 medium, 3 high, 4 urgent |
| dueDate, dueTime | date key, time key | Optional |
| startDate, endDate | date key | Multi-day span shown on the calendar |
| projectId, listId | string or null | |
| tagIds | string[] | |
| subtasks | { id, title, completed }[] | |
| recurrence | rule or null | See below |
| reminderMinutesBefore | number or null | Relative to due date and time |
| reminderFiredAt, reminderSnoozedUntil | ISO or null | Reminder state |
| attachments | { id, name, type, size, createdAt }[] | Blob data lives in a separate store |
| location, url, color | string | |
| estimatedMinutes, actualMinutes | number or null | actualMinutes accumulates from focus sessions |
| sortOrder | number | Manual ordering |
| recurrenceParentId, recurrenceCompletedCount | | History links for recurring tasks |
| createdAt, updatedAt, completedAt, deletedAt | ISO | deletedAt set means the task is in Trash |

Other stores: projects, lists, tags, savedFilters, focusSessions, attachments (blobs), settings, meta.

IndexedDB schema is versioned in `src/data/database.js`. Each version has an `apply` function; opening an older database runs every missing migration in order inside the upgrade transaction. A test covers upgrading a version 1 database.

Every record read from storage passes through a normaliser in `src/data/models.js`. Unknown fields are dropped, invalid values fall back to safe defaults, and rows that cannot be repaired (for example a task with no title) are counted and skipped rather than crashing the app. The count is shown in a notice under the top bar.

## Recurrence engine

`src/data/recurrence.js` is pure and fully tested.

Rule shape:

```js
{
  frequency: 'daily' | 'weekly' | 'monthly' | 'yearly',
  interval: 1,
  weekdays: [1, 3, 5],
  monthDays: [1, 15],
  month: null,
  count: null,
  until: null
}
```

- `nextOccurrence(rule, fromDateKey, anchorDateKey)` returns the next date key strictly after `fromDateKey`, or null when the rule has ended.
- `expandOccurrences(rule, anchor, rangeStart, rangeEnd)` lists occurrences inside a window. The calendar uses this to show future instances without creating records.
- Monthly rules clamp to the last day of short months and return to the anchor day afterwards (31 Jan, 28 Feb, 31 Mar).
- Yearly rules handle 29 February.
- `count` and `until` are enforced; `count` is compared with the completed occurrence count stored on the task.
- `describeRecurrence` produces the human text used across the UI.

Completing a recurring task does not delete history. The original record keeps its id and moves to the next date; a completed copy with `recurrenceParentId` is written so Completed, statistics and undo keep working. When the rule ends, the task simply completes.

## Natural-language quick add

`src/lib/naturalLanguage.js` parses the quick add input. Supported patterns:

- Dates: today, tomorrow, day after tomorrow, next week, weekday names, next Monday, 15 March, March 15, 2026-03-15, 15/03
- Times: 7pm, 7:30 PM, 19:00, at noon, at midnight
- Recurrence: every day, daily, every weekday, every Monday, every Monday and Friday, every 2 weeks, every month on the 1st, every year, weekly, monthly
- Priority: p1 to p4, `!!!`, urgent, high priority
- Tags: `#tag`, project: `@Project name`
- Duration: for 45 min, for 2 hours

The parser never invents values. Anything it detects appears as a chip under the input; removing a chip returns that text to the title. Pressing Enter saves, and the full editor can be opened with the parsed values prefilled for adjustment.

## Calendar

- Month view shows a 42-cell grid with overflow counts and a day panel.
- Week and day views share `TimeGridView`. Untimed tasks sit in an all-day row; timed tasks are laid out into columns when they overlap; a current-time line updates every minute.
- Agenda view groups the next weeks by day.
- Drag a task to another day or time slot to reschedule it. Dragging a future occurrence of a recurring task reschedules the series from its next occurrence, and the app says so.
- Arrow keys move between periods; `M`, `W`, `D` switch views; `Shift + T` returns to today.
- Day start and end hours and the first day of the week are configurable in Settings.

## Reminders and notifications

`src/services/ReminderScheduler.jsx` computes the next reminder time from the loaded tasks and sets a single timer for it, re-checking whenever tasks change or the tab becomes visible. When a reminder is due:

- If the Notification API is available and permission was granted, a system notification is shown with the task title, its due time and a badge icon. Clicking it focuses the app and opens the task.
- Otherwise an in-app toast is shown with Complete and Snooze actions.

Snooze options are 10 minutes, 30 minutes, 1 hour and 3 hours and are stored on the task. Permission is only requested when the user turns notifications on in Settings; if the browser has blocked notifications the setting explains how to unblock them rather than pretending it worked.

The app does not use push messaging, so reminders fire only while HarshTodo is open in a tab or installed window. This is stated in Settings.

## Offline, PWA and updates

- `vite-plugin-pwa` generates the manifest with icons, shortcuts and maskable icon.
- The service worker is a custom Workbox script at `src/pwa/sw.js`. It precaches the built app shell, serves navigations from the precache, falls back to `offline.html` when a navigation is not cached, and caches fonts at runtime.
- Updates use the prompt strategy. When a new version is waiting, a toast offers Reload. Settings also has a Check for updates button that calls `registration.update()` and reports the outcome. If activation fails or times out an error is shown with recovery instructions instead of hanging.
- Online and offline transitions are announced with a toast and an indicator in the top bar.
- Install: the `beforeinstallprompt` event is captured and exposed as an Install button in Settings on browsers that support it. On iOS the setting explains Share, then Add to Home Screen.
- Persistent storage: Settings shows usage and quota via `navigator.storage.estimate()` and lets the user call `navigator.storage.persist()`. The result is shown truthfully.

Everything the app needs is precached on first visit, so after that first load the whole app, including every route, works offline. Data lives in IndexedDB and never needs a network.

## Widget-style compact view

Web apps cannot place widgets on the OS home screen. Instead `/widget` is a deliberately compact page that shows today's progress, the next task, quick add, and tabs for today and overdue tasks. It is registered as an app shortcut in the manifest so it can be pinned or opened from the installed app icon menu, and it works in a small window.

## Keyboard shortcuts

Press `?` anywhere to open the full list. Shortcuts are ignored while typing in a field.

| Keys | Action |
| --- | --- |
| N | New task |
| / | Focus search |
| Ctrl or Cmd + K | Command palette |
| T, C, I, U, A, F | Today, Calendar, Inbox, Upcoming, All tasks, Focus |
| G then D | Dashboard |
| J, K or arrow keys | Move selection in a task list |
| Enter | Open selected task |
| E | Edit selected task |
| Space | Complete or reopen selected task |
| Delete or Backspace | Move selected task to Trash |
| X | Toggle bulk selection |
| 1, 2, 3, 4 | Set priority urgent, high, medium, low |
| Esc | Close dialog, panel or selection |
| Left, Right, M, W, D, Shift + T | Calendar navigation, views and jump to today |

## Accessibility

- Semantic landmarks: labelled navigation, `main`, skip link, headings on every page
- Dialogs and drawers use `role="dialog"`, `aria-modal`, a focus trap, Escape to close and focus restoration
- Task lists are `listbox` and `option` with roving focus so keyboard users move without tabbing through every control
- Live regions announce toasts and route changes
- All icon-only buttons have accessible names; form fields have labels
- Colour is never the only signal for priority or status
- `prefers-reduced-motion` disables non-essential animation
- Touch targets are at least 40 px on mobile

## Responsive behaviour

- Mobile: bottom navigation, bottom sheets instead of centred dialogs, swipe actions on rows, sticky quick add
- Tablet: two-pane where useful, side panels instead of sheets
- Desktop: collapsible sidebar, keyboard shortcuts, right-hand task details drawer, hover quick actions
- Breakpoints are handled with `useBreakpoint` and Tailwind responsive classes; no separate mobile app

## Error handling

| Situation | Behaviour |
| --- | --- |
| IndexedDB unavailable or blocked | Falls back to in-memory storage, shows a persistent notice, keeps the app usable |
| Quota exceeded when saving | The action fails with a toast that explains it; nothing is half-written |
| Corrupt or unknown records | Normalised where possible, otherwise skipped and counted; a notice reports how many were skipped |
| Attachment too large | Rejected before writing with the limit stated |
| Service worker registration or update failure | Reported in a toast and in Settings; the app still runs |
| Notification permission denied | Setting shows the state and instructions; in-app reminders continue |
| Render error | Error boundary around each route with a retry button; the shell and navigation keep working |
| Unknown route | Not found page with navigation |

## Performance

- Pages are lazy loaded per route; vendor, icon and date chunks are split
- Lists derive from memoised selectors; rows are memoised components
- Filtering, searching, calendar expansion and statistics are measured in `src/test/performance.test.js` with 5,000 tasks and stay well under 200 ms each
- The service worker precaches the app, so repeat loads do not hit the network

## Privacy

- No analytics, no telemetry, no crash reporting
- No network requests except fetching the app's own files
- All data is in IndexedDB and localStorage in your browser profile
- Export gives you a plain JSON file; Erase all data clears every IndexedDB store including attachments and settings

## Backup, export and import

Settings, Data section.

- Export downloads `harshtodo-backup-YYYY-MM-DD.json` containing tasks, projects, lists, tags, saved filters, focus sessions and settings. Attachments are not included in the JSON because of size; they stay in the browser.
- Import accepts that file. Merge keeps existing records and adds or updates by id; Replace erases first. The file is validated and normalised before anything is written.

## Testing

```bash
npm test
```

The suite runs in Vitest. Repository tests run against both the in-memory adapter and IndexedDB via `fake-indexeddb`, so persistence paths are exercised for real. Integration tests render the whole app in jsdom.

Coverage includes:

- Task creation, update, soft delete, restore and permanent delete
- Completion and reopening, recurring roll-forward, count and until limits
- Recurrence engine edge cases: month-end clamping, leap years, weekday sets, intervals
- Natural-language parsing including negative cases where nothing must be invented
- Filters, search ranking, token matching and highlighting
- Calendar occurrence expansion, multi-day spans, overlap layout, overdue detection, month grid
- Reminder timing and snooze
- IndexedDB schema and migration from version 1
- Corrupt record handling
- Every route rendering without errors
- Quick add persisting across a remount
- Keyboard shortcuts, dialog focus behaviour, skip link and live regions
- Performance budgets with 5,000 tasks

## Deployment

Any static host works. Build with `npm run build` and serve the `dist/` folder over HTTPS (required for service workers and notifications). Configure the host to serve `index.html` for unknown paths so deep links work:

- Netlify: add `_redirects` with `/* /index.html 200`
- Vercel: add a rewrite of `/(.*)` to `/index.html`
- Nginx: `try_files $uri /index.html;`

Cache `sw.js` and `index.html` with `no-cache` so updates are detected; hashed assets in `assets/` can be cached forever.

## Adding a backend or sync later

The storage adapter and repository layers were designed so a backend can be added without touching the UI:

1. Implement the storage interface in a new adapter (for example one that writes to IndexedDB and queues changes for a server).
2. Or keep IndexedDB as the source of truth and add a sync service that reads `updatedAt` and `deletedAt` to reconcile with a remote store. Every record already carries the timestamps needed for last-write-wins or vector-clock strategies.
3. Repositories return plain objects, so a remote repository can implement the same methods.

No component imports IndexedDB directly.

## Known limitations

- Reminders fire only while the app is open or installed and running; there is no push server.
- Attachments are excluded from JSON export.
- The recurrence engine supports days of week and days of month but not "second Tuesday" style ordinal rules.
- Natural-language parsing is English only.
- OS home-screen widgets are not possible for web apps; the compact view is the honest alternative.

## Roadmap

- Ordinal recurrence rules
- Optional end-to-end encrypted sync
- Import from common CSV formats
- Additional languages for the parser and the UI

## License

MIT
