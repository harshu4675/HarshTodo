// @vitest-environment jsdom
import { describe, it, expect, beforeAll, afterEach, vi } from 'vitest'
import { render, screen, waitFor, fireEvent, act, cleanup } from '@testing-library/react'

vi.mock('virtual:pwa-register', () => ({ registerSW: () => () => {} }))

let App
beforeAll(async () => {
  window.matchMedia = (q) => ({ matches: q.includes('min-width: 1024px'), addEventListener() {}, removeEventListener() {} })
  window.scrollTo = () => {}
  Element.prototype.scrollIntoView = () => {}
  globalThis.__APP_VERSION__ = 'test'
  ;({ App } = await import('../app/App.jsx'))
})

afterEach(() => cleanup())

async function boot(path) {
  window.history.pushState({}, '', path)
  const utils = render(<App />)
  await waitFor(() => expect(utils.container.textContent).not.toContain('Loading your tasks'))
  return utils
}

describe('keyboard shortcuts and accessibility', () => {
  it('opens the task editor with N and closes it with Escape, restoring focus', async () => {
    await boot('/inbox')
    const input = await screen.findByLabelText('Quick add task')
    input.blur()
    document.body.focus()
    fireEvent.keyDown(document.body, { key: 'n' })
    const dialog = await screen.findByRole('dialog')
    expect(dialog.getAttribute('aria-modal')).toBe('true')
    await waitFor(() => expect(dialog.contains(document.activeElement)).toBe(true))
    fireEvent.keyDown(document.activeElement, { key: 'Escape' })
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
    cleanup()
  })

  it('navigates with single-key shortcuts and shows the shortcut help', async () => {
    await boot('/inbox')
    await screen.findByLabelText('Quick add task')
    document.activeElement?.blur()
    fireEvent.keyDown(document.body, { key: 't' })
    await waitFor(() => expect(document.title).toContain('Today'))
    fireEvent.keyDown(document.body, { key: 'c' })
    await waitFor(() => expect(document.title).toContain('Calendar'))
    fireEvent.keyDown(document.body, { key: '?' })
    const dialog = await screen.findByRole('dialog', { name: /keyboard shortcuts/i })
    expect(dialog.textContent).toContain('Complete selected task')
    cleanup()
  })

  it('completes a task via Space on the selected row and can undo', async () => {
    await boot('/inbox')
    const input = await screen.findByLabelText('Quick add task')
    fireEvent.change(input, { target: { value: 'Keyboard driven task' } })
    await act(async () => {
      fireEvent.submit(input.closest('form'))
    })
    const row = await screen.findByRole('option', { name: /Keyboard driven task/ })
    await act(async () => {
      row.focus()
    })
    await act(async () => {
      fireEvent.keyDown(row, { key: ' ' })
    })
    await waitFor(() => expect(screen.queryByRole('option', { name: /Keyboard driven task/ })).toBeNull())
    const undo = await screen.findByRole('button', { name: 'Undo' })
    await act(async () => {
      fireEvent.click(undo)
    })
    await screen.findByRole('option', { name: /Keyboard driven task/ })
    cleanup()
  })

  it('has a skip link, a labelled main navigation and a live region', async () => {
    const { container } = await boot('/today')
    expect(screen.getByText('Skip to content').getAttribute('href')).toBe('#main')
    expect(screen.getByRole('navigation', { name: 'Main navigation' })).toBeTruthy()
    expect(container.querySelector('[aria-live="polite"]')).toBeTruthy()
    cleanup()
  })
})
