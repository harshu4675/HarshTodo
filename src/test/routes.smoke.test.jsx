// @vitest-environment jsdom
import { describe, it, expect, beforeAll, vi } from 'vitest'
import { render, screen, waitFor, fireEvent, act, cleanup } from '@testing-library/react'

vi.mock('virtual:pwa-register', () => ({ registerSW: () => () => {} }))

let App
beforeAll(async () => {
  window.matchMedia = window.matchMedia || ((q) => ({ matches: q.includes('min-width: 1024px'), addEventListener() {}, removeEventListener() {} }))
  window.scrollTo = () => {}
  Element.prototype.scrollIntoView = () => {}
  globalThis.__APP_VERSION__ = 'test'
  ;({ App } = await import('../app/App.jsx'))
})

const ROUTES = ['/', '/inbox', '/today', '/upcoming', '/tasks', '/calendar', '/calendar?view=week', '/calendar?view=day', '/calendar?view=agenda', '/projects', '/lists', '/tags', '/priorities', '/completed', '/trash', '/settings', '/statistics', '/search?q=test', '/focus', '/widget', '/nope']

describe('every route renders without crashing', () => {
  const errors = []
  const orig = console.error
  console.error = (...args) => {
    errors.push(args.join(' '))
    orig(...args)
  }
  for (const route of ROUTES) {
    it(`renders ${route}`, async () => {
      window.history.pushState({}, '', route)
      const { container, unmount } = render(<App />)
      await waitFor(() => expect(container.textContent).not.toContain('Loading your tasks'), { timeout: 5000 })
      expect(container.textContent).not.toContain('ran into a problem')
      unmount()
      cleanup()
    })
  }
  it('creates a task via quick add and shows it', async () => {
    window.history.pushState({}, '', '/inbox')
    render(<App />)
    const input = await screen.findByLabelText('Quick add task')
    fireEvent.change(input, { target: { value: 'Write launch notes tomorrow at 5pm #launch' } })
    expect(screen.getByText('Detected')).toBeTruthy()
    await act(async () => {
      fireEvent.submit(input.closest('form'))
    })
    await waitFor(() => expect(input.value).toBe(''))
    cleanup()
    window.history.pushState({}, '', '/upcoming')
    render(<App />)
    await waitFor(() => expect(screen.queryAllByText('Write launch notes').length).toBeGreaterThan(0))
    expect(errors.filter((e) => !e.includes('act(') && !e.includes('not wrapped'))).toEqual([])
  })
})
