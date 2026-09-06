import { useSyncExternalStore } from 'react'

function subscribe(query, callback) {
  if (typeof window === 'undefined' || !window.matchMedia) return () => {}
  const mql = window.matchMedia(query)
  mql.addEventListener('change', callback)
  return () => mql.removeEventListener('change', callback)
}

export function useMediaQuery(query) {
  return useSyncExternalStore(
    (cb) => subscribe(query, cb),
    () => (typeof window !== 'undefined' && window.matchMedia ? window.matchMedia(query).matches : false),
    () => false,
  )
}

export function useBreakpoint() {
  const isDesktop = useMediaQuery('(min-width: 1024px)')
  const isTablet = useMediaQuery('(min-width: 640px) and (max-width: 1023px)')
  return { isDesktop, isTablet, isMobile: !isDesktop && !isTablet }
}

export function usePrefersReducedMotion() {
  return useMediaQuery('(prefers-reduced-motion: reduce)')
}
