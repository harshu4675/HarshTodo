import { useEffect, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'

export function RouteAnnouncer() {
  const location = useLocation()
  const [message, setMessage] = useState('')
  const first = useRef(true)

  useEffect(() => {
    if (first.current) {
      first.current = false
      return
    }
    const id = window.setTimeout(() => {
      const title = document.title.replace(/ - HarshTodo$/, '')
      setMessage(`Navigated to ${title}`)
      const main = document.getElementById('main')
      if (main) {
        main.setAttribute('tabindex', '-1')
        main.focus({ preventScroll: true })
      }
    }, 80)
    return () => window.clearTimeout(id)
  }, [location.pathname, location.search])

  return (
    <div aria-live="polite" aria-atomic="true" className="sr-only">
      {message}
    </div>
  )
}
