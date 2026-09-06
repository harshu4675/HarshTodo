import { createContext, useCallback, useContext, useMemo, useState } from 'react'

const UIContext = createContext(null)

export function UIProvider({ children }) {
  const [editor, setEditor] = useState(null)
  const [detailsTaskId, setDetailsTaskId] = useState(null)
  const [paletteOpen, setPaletteOpen] = useState(false)
  const [shortcutsOpen, setShortcutsOpen] = useState(false)
  const [quickAddOpen, setQuickAddOpen] = useState(false)
  const [selectedTaskId, setSelectedTaskId] = useState(null)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    try {
      return localStorage.getItem('harshtodo.sidebar') === 'collapsed'
    } catch {
      return false
    }
  })

  const openTaskEditor = useCallback((draft = {}) => setEditor({ mode: draft?.id ? 'edit' : 'create', draft }), [])
  const closeTaskEditor = useCallback(() => setEditor(null), [])
  const openTaskDetails = useCallback((id) => setDetailsTaskId(id), [])
  const closeTaskDetails = useCallback(() => setDetailsTaskId(null), [])
  const toggleSidebar = useCallback(() => {
    setSidebarCollapsed((v) => {
      try {
        localStorage.setItem('harshtodo.sidebar', v ? 'expanded' : 'collapsed')
      } catch {}
      return !v
    })
  }, [])

  const value = useMemo(
    () => ({
      editor,
      openTaskEditor,
      closeTaskEditor,
      detailsTaskId,
      openTaskDetails,
      closeTaskDetails,
      paletteOpen,
      setPaletteOpen,
      shortcutsOpen,
      setShortcutsOpen,
      quickAddOpen,
      setQuickAddOpen,
      selectedTaskId,
      setSelectedTaskId,
      sidebarCollapsed,
      toggleSidebar,
    }),
    [editor, openTaskEditor, closeTaskEditor, detailsTaskId, openTaskDetails, closeTaskDetails, paletteOpen, shortcutsOpen, quickAddOpen, selectedTaskId, sidebarCollapsed, toggleSidebar],
  )

  return <UIContext.Provider value={value}>{children}</UIContext.Provider>
}

export function useUI() {
  const ctx = useContext(UIContext)
  if (!ctx) throw new Error('useUI must be used inside UIProvider')
  return ctx
}
