const listeners = new Map()

export function emit(event, payload) {
  const set = listeners.get(event)
  if (!set) return
  for (const fn of Array.from(set)) fn(payload)
}

export function on(event, fn) {
  if (!listeners.has(event)) listeners.set(event, new Set())
  listeners.get(event).add(fn)
  return () => listeners.get(event)?.delete(fn)
}

export const EVENTS = Object.freeze({
  LIST_NEXT: 'list:next',
  LIST_PREV: 'list:prev',
  LIST_OPEN: 'list:open',
  LIST_EDIT: 'list:edit',
  LIST_COMPLETE: 'list:complete',
  LIST_DELETE: 'list:delete',
  LIST_TOGGLE_BULK: 'list:toggle-bulk',
  LIST_PRIORITY: 'list:priority',
  LIST_ESCAPE: 'list:escape',
  CALENDAR_NAV: 'calendar:nav',
  QUICK_ADD_FOCUS: 'quick-add:focus',
})
