import { useCallback, useEffect, useLayoutEffect, useRef, useState, createContext, useContext, useId } from 'react'
import { createPortal } from 'react-dom'
import { cn } from '../../lib/cn.js'
import { useClickOutside } from '../../hooks/useClickOutside.js'
import { useEscape } from '../../hooks/useEscape.js'
import { useBreakpoint } from '../../hooks/useMediaQuery.js'
import { BottomSheet } from './Drawer.jsx'
import { Icon } from './Icon.jsx'

const MenuContext = createContext(null)

function usePosition(anchorRef, panelRef, open, align) {
  const [style, setStyle] = useState({ visibility: 'hidden' })
  const compute = useCallback(() => {
    const anchor = anchorRef.current
    const panel = panelRef.current
    if (!anchor || !panel) return
    const a = anchor.getBoundingClientRect()
    const p = panel.getBoundingClientRect()
    const margin = 8
    const vw = window.innerWidth
    const vh = window.innerHeight
    let top = a.bottom + 4
    if (top + p.height > vh - margin && a.top - p.height - 4 > margin) top = a.top - p.height - 4
    top = Math.max(margin, Math.min(top, vh - p.height - margin))
    let left = align === 'end' ? a.right - p.width : a.left
    left = Math.max(margin, Math.min(left, vw - p.width - margin))
    setStyle({ position: 'fixed', top, left, visibility: 'visible' })
  }, [anchorRef, panelRef, align])
  useLayoutEffect(() => {
    if (!open) return undefined
    compute()
    window.addEventListener('resize', compute)
    window.addEventListener('scroll', compute, true)
    return () => {
      window.removeEventListener('resize', compute)
      window.removeEventListener('scroll', compute, true)
    }
  }, [open, compute])
  return style
}

export function Dropdown({ trigger, children, align = 'start', title, width = 'w-56', sheetOnMobile = true, onOpenChange }) {
  const [open, setOpen] = useState(false)
  const anchorRef = useRef(null)
  const panelRef = useRef(null)
  const { isMobile } = useBreakpoint()
  const menuId = useId()
  const close = useCallback(() => setOpen(false), [])
  const style = usePosition(anchorRef, panelRef, open && !(isMobile && sheetOnMobile), align)
  useClickOutside([anchorRef, panelRef], open && !(isMobile && sheetOnMobile), close)
  useEscape(open && !(isMobile && sheetOnMobile), close)

  useEffect(() => {
    onOpenChange?.(open)
  }, [open, onOpenChange])

  useEffect(() => {
    if (!open || (isMobile && sheetOnMobile)) return undefined
    const first = panelRef.current?.querySelector('[role="menuitem"], [role="menuitemcheckbox"], input')
    requestAnimationFrame(() => first?.focus())
  }, [open, isMobile, sheetOnMobile])

  function onKeyDown(event) {
    const items = Array.from(panelRef.current?.querySelectorAll('[role^="menuitem"]:not([disabled])') || [])
    if (!items.length) return
    const index = items.indexOf(document.activeElement)
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      items[(index + 1) % items.length].focus()
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      items[(index - 1 + items.length) % items.length].focus()
    } else if (event.key === 'Home') {
      event.preventDefault()
      items[0].focus()
    } else if (event.key === 'End') {
      event.preventDefault()
      items[items.length - 1].focus()
    } else if (event.key === 'Tab') {
      close()
    }
  }

  const content = <MenuContext.Provider value={{ close }}>{typeof children === 'function' ? children({ close }) : children}</MenuContext.Provider>

  return (
    <>
      <span ref={anchorRef} className="inline-flex">
        {trigger({
          open,
          toggle: (e) => {
            e?.stopPropagation?.()
            setOpen((v) => !v)
          },
          props: { 'aria-haspopup': 'menu', 'aria-expanded': open, 'aria-controls': open ? menuId : undefined },
        })}
      </span>
      {open && isMobile && sheetOnMobile ? (
        <BottomSheet open onClose={close} title={title}>
          <div role="menu" id={menuId} onKeyDown={onKeyDown} className="flex flex-col">
            {content}
          </div>
        </BottomSheet>
      ) : open
        ? createPortal(
            <div
              ref={panelRef}
              id={menuId}
              role="menu"
              style={style}
              onKeyDown={onKeyDown}
              onClick={(e) => e.stopPropagation()}
              className={cn('z-50 rounded-lg border border-line bg-elevated shadow-md p-1 animate-scale-in max-h-[70vh] overflow-y-auto scrollbar-thin', width)}
            >
              {title ? <div className="px-2 pt-1.5 pb-1 text-[11px] font-semibold uppercase tracking-wide text-ink-muted">{title}</div> : null}
              {content}
            </div>,
            document.body,
          )
        : null}
    </>
  )
}

export function MenuItem({ icon, children, onSelect, danger = false, disabled = false, shortcut, checked, keepOpen = false, className, trailing }) {
  const ctx = useContext(MenuContext)
  const role = checked === undefined ? 'menuitem' : 'menuitemcheckbox'
  return (
    <button
      type="button"
      role={role}
      aria-checked={checked === undefined ? undefined : checked}
      disabled={disabled}
      onClick={(e) => {
        e.stopPropagation()
        onSelect?.(e)
        if (!keepOpen) ctx?.close()
      }}
      className={cn(
        'flex w-full items-center gap-2.5 rounded-md px-2 py-2 sm:py-1.5 text-left text-sm transition-colors duration-fast outline-none',
        'focus-visible:bg-sunken hover:bg-sunken disabled:opacity-50 disabled:pointer-events-none',
        danger ? 'text-error hover:bg-error-soft focus-visible:bg-error-soft' : 'text-ink',
        className,
      )}
    >
      {icon ? <Icon name={icon} size={16} className={cn('shrink-0', danger ? 'text-error' : 'text-ink-muted')} /> : null}
      <span className="flex-1 truncate">{children}</span>
      {trailing}
      {shortcut ? <kbd className="ml-2">{shortcut}</kbd> : null}
      {checked ? <Icon name="check" size={14} className="text-primary shrink-0" /> : null}
    </button>
  )
}

export function MenuSeparator() {
  return <div role="separator" className="my-1 h-px bg-line" />
}

export function MenuLabel({ children }) {
  return <div className="px-2 pt-2 pb-1 text-[11px] font-semibold uppercase tracking-wide text-ink-muted">{children}</div>
}

export function useMenuClose() {
  return useContext(MenuContext)?.close
}
