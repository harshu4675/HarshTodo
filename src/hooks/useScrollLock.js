import { useEffect } from 'react'

let lockCount = 0

export function useScrollLock(active) {
  useEffect(() => {
    if (!active) return undefined
    lockCount += 1
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      lockCount -= 1
      if (lockCount === 0) document.body.style.overflow = previous
    }
  }, [active])
}
