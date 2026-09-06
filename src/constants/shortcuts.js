export const SHORTCUT_GROUPS = [
  {
    title: 'General',
    items: [
      { keys: ['N'], description: 'New task' },
      { keys: ['/'], description: 'Focus search' },
      { keys: ['Ctrl', 'K'], description: 'Open command palette' },
      { keys: ['?'], description: 'Show keyboard shortcuts' },
      { keys: ['Esc'], description: 'Close dialog, panel or selection' },
    ],
  },
  {
    title: 'Navigation',
    items: [
      { keys: ['G', 'D'], description: 'Go to dashboard' },
      { keys: ['T'], description: 'Go to today' },
      { keys: ['C'], description: 'Go to calendar' },
      { keys: ['I'], description: 'Go to inbox' },
      { keys: ['U'], description: 'Go to upcoming' },
      { keys: ['A'], description: 'Go to all tasks' },
      { keys: ['F'], description: 'Go to focus mode' },
    ],
  },
  {
    title: 'Task list',
    items: [
      { keys: ['J'], description: 'Select next task' },
      { keys: ['K'], description: 'Select previous task' },
      { keys: ['Enter'], description: 'Open selected task' },
      { keys: ['E'], description: 'Edit selected task' },
      { keys: ['Space'], description: 'Complete selected task' },
      { keys: ['Delete'], description: 'Move selected task to trash' },
      { keys: ['X'], description: 'Toggle bulk selection' },
      { keys: ['1', '2', '3', '4'], description: 'Set priority of selected task' },
    ],
  },
  {
    title: 'Calendar',
    items: [
      { keys: ['Left', 'Right'], description: 'Previous or next period' },
      { keys: ['Shift', 'T'], description: 'Jump to today' },
      { keys: ['M'], description: 'Month view' },
      { keys: ['W'], description: 'Week view' },
      { keys: ['D'], description: 'Day view' },
    ],
  },
]
