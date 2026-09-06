import { Modal } from '../ui/Modal.jsx'
import { KeyCombo } from '../ui/Kbd.jsx'
import { SHORTCUT_GROUPS } from '../../constants/shortcuts.js'
import { useUI } from '../../app/UIContext.jsx'

export function ShortcutsDialog() {
  const { shortcutsOpen, setShortcutsOpen } = useUI()
  return (
    <Modal open={shortcutsOpen} onClose={() => setShortcutsOpen(false)} title="Keyboard shortcuts" description="Shortcuts are inactive while typing in a text field." size="lg">
      <div className="grid sm:grid-cols-2 gap-x-8 gap-y-6 pb-2">
        {SHORTCUT_GROUPS.map((group) => (
          <section key={group.title}>
            <h3 className="text-xs font-semibold uppercase tracking-wide text-ink-muted mb-2">{group.title}</h3>
            <ul className="flex flex-col divide-y divide-line">
              {group.items.map((item) => (
                <li key={item.description} className="flex items-center justify-between gap-4 py-2 text-sm">
                  <span className="text-ink-secondary">{item.description}</span>
                  <KeyCombo keys={item.keys} />
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </Modal>
  )
}
