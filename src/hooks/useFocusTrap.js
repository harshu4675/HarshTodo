import { useEffect } from 'react'

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

export function useFocusTrap(ref, active, { initialFocus = true, restoreFocus = true } = {}) {
  useEffect(() => {
    if (!active || !ref.current) return undefined
    const container = ref.current
    const previouslyFocused = document.activeElement
    const focusables = () => Array.from(container.querySelectorAll(FOCUSABLE)).filter((el) => el.offsetParent !== null || el === document.activeElement)
    if (initialFocus) {
      const target = container.querySelector('[data-autofocus]') || focusables()[0] || container
      requestAnimationFrame(() => target.focus?.({ preventScroll: true }))
    }
    function onKeyDown(event) {
      if (event.key !== 'Tab') return
      const items = focusables()
      if (!items.length) {
        event.preventDefault()
        return
      }
      const first = items[0]
      const last = items[items.length - 1]
      if (event.shiftKey && (document.activeElement === first || !container.contains(document.activeElement))) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }
    container.addEventListener('keydown', onKeyDown)
    return () => {
      container.removeEventListener('keydown', onKeyDown)
      if (restoreFocus && previouslyFocused && typeof previouslyFocused.focus === 'function' && document.contains(previouslyFocused)) {
        previouslyFocused.focus({ preventScroll: true })
      }
    }
  }, [ref, active, initialFocus, restoreFocus])
}
