import { cloneElement, useId, useRef, useState, useLayoutEffect } from 'react'
import { createPortal } from 'react-dom'

export function Tooltip({ content, children, side = 'top', delay = 400 }) {
  const [visible, setVisible] = useState(false)
  const [pos, setPos] = useState(null)
  const anchorRef = useRef(null)
  const timer = useRef(null)
  const id = useId()

  function show() {
    clearTimeout(timer.current)
    timer.current = setTimeout(() => setVisible(true), delay)
  }
  function hide() {
    clearTimeout(timer.current)
    setVisible(false)
  }

  useLayoutEffect(() => {
    if (!visible || !anchorRef.current) return
    const r = anchorRef.current.getBoundingClientRect()
    if (side === 'right') setPos({ top: r.top + r.height / 2, left: r.right + 8, transform: 'translateY(-50%)' })
    else if (side === 'bottom') setPos({ top: r.bottom + 6, left: r.left + r.width / 2, transform: 'translateX(-50%)' })
    else setPos({ top: r.top - 6, left: r.left + r.width / 2, transform: 'translate(-50%, -100%)' })
  }, [visible, side])

  if (!content) return children
  const child = cloneElement(children, {
    ref: (node) => {
      anchorRef.current = node
      const { ref } = children
      if (typeof ref === 'function') ref(node)
      else if (ref) ref.current = node
    },
    onMouseEnter: (e) => {
      children.props.onMouseEnter?.(e)
      show()
    },
    onMouseLeave: (e) => {
      children.props.onMouseLeave?.(e)
      hide()
    },
    onFocus: (e) => {
      children.props.onFocus?.(e)
      show()
    },
    onBlur: (e) => {
      children.props.onBlur?.(e)
      hide()
    },
    'aria-describedby': visible ? id : children.props['aria-describedby'],
  })
  return (
    <>
      {child}
      {visible && pos
        ? createPortal(
            <div
              id={id}
              role="tooltip"
              style={{ position: 'fixed', top: pos.top, left: pos.left, transform: pos.transform }}
              className="z-[60] pointer-events-none rounded-md bg-ink text-white text-xs px-2 py-1 shadow-md animate-fade-in whitespace-nowrap"
            >
              {content}
            </div>,
            document.body,
          )
        : null}
    </>
  )
}
