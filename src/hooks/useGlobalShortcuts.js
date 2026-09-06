import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useUI } from '../app/UIContext.jsx'
import { ROUTES } from '../constants/navigation.js'
import { emit, EVENTS } from '../lib/eventBus.js'

export function isTypingTarget(target) {
  if (!target) return false
  const tag = target.tagName
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || target.isContentEditable
}

export function useGlobalShortcuts() {
  const navigate = useNavigate()
  const ui = useUI()
  const pendingG = useRef(false)
  const uiRef = useRef(ui)
  uiRef.current = ui

  useEffect(() => {
    function onKeyDown(event) {
      const { editor, detailsTaskId, paletteOpen, shortcutsOpen, setPaletteOpen, setShortcutsOpen, openTaskEditor } = uiRef.current
      const overlayOpen = Boolean(editor) || Boolean(detailsTaskId) || paletteOpen || shortcutsOpen
      const meta = event.ctrlKey || event.metaKey

      if (meta && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        setPaletteOpen(true)
        return
      }
      if (isTypingTarget(event.target) || event.altKey || meta) return
      if (document.querySelector('[role="dialog"][aria-modal="true"]') && !overlayOpen) return
      if (overlayOpen) return

      const key = event.key
      if (pendingG.current) {
        pendingG.current = false
        if (key.toLowerCase() === 'd') {
          event.preventDefault()
          navigate(ROUTES.DASHBOARD)
        }
        return
      }
      switch (key) {
        case 'n':
        case 'N':
          event.preventDefault()
          openTaskEditor()
          break
        case '/':
          event.preventDefault()
          setPaletteOpen(true)
          break
        case '?':
          event.preventDefault()
          setShortcutsOpen(true)
          break
        case 't':
          event.preventDefault()
          navigate(ROUTES.TODAY)
          break
        case 'T':
          if (event.shiftKey) {
            event.preventDefault()
            emit(EVENTS.CALENDAR_NAV, 'today')
          }
          break
        case 'c':
          event.preventDefault()
          navigate(ROUTES.CALENDAR)
          break
        case 'i':
          event.preventDefault()
          navigate(ROUTES.INBOX)
          break
        case 'u':
          event.preventDefault()
          navigate(ROUTES.UPCOMING)
          break
        case 'a':
          event.preventDefault()
          navigate(ROUTES.TASKS)
          break
        case 'f':
          event.preventDefault()
          navigate(ROUTES.FOCUS)
          break
        case 'g':
          pendingG.current = true
          setTimeout(() => (pendingG.current = false), 800)
          break
        case 'j':
        case 'ArrowDown':
          if (key === 'j' || document.activeElement?.getAttribute('role') === 'option') {
            event.preventDefault()
            emit(EVENTS.LIST_NEXT)
          }
          break
        case 'k':
        case 'ArrowUp':
          if (key === 'k' || document.activeElement?.getAttribute('role') === 'option') {
            event.preventDefault()
            emit(EVENTS.LIST_PREV)
          }
          break
        case 'Enter':
          if (document.activeElement?.getAttribute('role') === 'option') {
            event.preventDefault()
            emit(EVENTS.LIST_OPEN)
          }
          break
        case 'e':
          event.preventDefault()
          emit(EVENTS.LIST_EDIT)
          break
        case ' ':
          if (document.activeElement?.getAttribute('role') === 'option' || document.activeElement === document.body) {
            event.preventDefault()
            emit(EVENTS.LIST_COMPLETE)
          }
          break
        case 'Delete':
        case 'Backspace':
          if (document.activeElement?.getAttribute('role') === 'option' || document.activeElement === document.body) {
            event.preventDefault()
            emit(EVENTS.LIST_DELETE)
          }
          break
        case 'x':
          event.preventDefault()
          emit(EVENTS.LIST_TOGGLE_BULK)
          break
        case '1':
        case '2':
        case '3':
        case '4':
          event.preventDefault()
          emit(EVENTS.LIST_PRIORITY, 5 - Number(key))
          break
        case 'Escape':
          emit(EVENTS.LIST_ESCAPE)
          break
        case 'ArrowLeft':
          emit(EVENTS.CALENDAR_NAV, 'prev')
          break
        case 'ArrowRight':
          emit(EVENTS.CALENDAR_NAV, 'next')
          break
        case 'm':
        case 'w':
        case 'd':
          emit(EVENTS.CALENDAR_NAV, key === 'm' ? 'month' : key === 'w' ? 'week' : 'day')
          break
        default:
          break
      }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [navigate])
}
