import { useEffect } from 'react'

const stack = []

export function useEscape(active, handler) {
  useEffect(() => {
    if (!active) return undefined
    const entry = { handler }
    stack.push(entry)
    function onKeyDown(event) {
      if (event.key !== 'Escape') return
      if (stack[stack.length - 1] !== entry) return
      event.preventDefault()
      event.stopPropagation()
      handler()
    }
    document.addEventListener('keydown', onKeyDown, true)
    return () => {
      document.removeEventListener('keydown', onKeyDown, true)
      const index = stack.indexOf(entry)
      if (index !== -1) stack.splice(index, 1)
    }
  }, [active, handler])
}
