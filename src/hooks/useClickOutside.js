import { useEffect } from 'react'

export function useClickOutside(refs, active, handler) {
  useEffect(() => {
    if (!active) return undefined
    const list = Array.isArray(refs) ? refs : [refs]
    function onPointerDown(event) {
      const inside = list.some((r) => r.current && r.current.contains(event.target))
      if (!inside) handler(event)
    }
    document.addEventListener('pointerdown', onPointerDown, true)
    return () => document.removeEventListener('pointerdown', onPointerDown, true)
  }, [refs, active, handler])
}
