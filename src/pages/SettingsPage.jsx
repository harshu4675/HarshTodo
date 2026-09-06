import { useEffect, useRef, useState } from 'react'
import { Page, PageHeader, Card, SectionTitle } from '../components/layout/PageHeader.jsx'
import { Input, Select, Field, Switch } from '../components/ui/Input.jsx'
import { Button } from '../components/ui/Button.jsx'
import { InlineNotice } from '../components/ui/States.jsx'
import { ConfirmDialog, Modal } from '../components/ui/Modal.jsx'
import { KeyCombo } from '../components/ui/Kbd.jsx'
import { useAppState, useAppActions } from '../store/AppStore.jsx'
import { useToast } from '../components/ui/Toast.jsx'
import { useUI } from '../app/UIContext.jsx'
import { useDocumentTitle } from '../hooks/useDocumentTitle.js'
import { notificationSupport, requestNotificationPermission, showNotification } from '../services/notifications.js'
import { REMINDER_OFFSETS } from '../constants/task.js'
import { useCanInstall } from '../pwa/useCanInstall.js'
import { promptInstall, isStandalone, installPlatformHint } from '../pwa/installPrompt.js'
import { checkForUpdates, applyUpdate } from '../pwa/registerServiceWorker.js'
import { useServiceWorker } from '../pwa/useServiceWorker.js'

function formatBytes(bytes) {
  if (!bytes) return '0 KB'
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export default function SettingsPage() {
  useDocumentTitle('Settings')
  const { settings, persistent, tasks, projects, tags } = useAppState()
  const actions = useAppActions()
  const toast = useToast()
  const { setShortcutsOpen } = useUI()
  const [estimate, setEstimate] = useState(null)
  const [persisted, setPersisted] = useState(null)
  const [confirmErase, setConfirmErase] = useState(false)
  const [importPreview, setImportPreview] = useState(null)
  const fileRef = useRef(null)
  const canInstall = useCanInstall()
  const sw = useServiceWorker()
  const support = notificationSupport()
  const [permission, setPermission] = useState(support.permission || 'default')
  const platform = installPlatformHint()

  useEffect(() => {
    actions.storageEstimate().then(setEstimate)
    if (navigator.storage?.persisted) navigator.storage.persisted().then(setPersisted).catch(() => setPersisted(null))
  }, [actions])

  const update = (patch) => actions.updateSettings(patch)

  async function enableNotifications(next) {
    if (!next) return update({ notificationsEnabled: false })
    const result = await requestNotificationPermission()
    setPermission(result)
    if (result === 'granted') {
      await update({ notificationsEnabled: true })
      toast.success('Notifications enabled')
    } else if (result === 'denied') toast.warning('Notifications are blocked in your browser settings.')
    else if (result === 'unsupported') toast.warning(support.reason || 'Notifications are not supported here.')
  }

  async function testNotification() {
    const shown = await showNotification('HarshTodo reminders are working', { body: 'You will be notified before tasks with a reminder are due.', tag: 'test' })
    if (!shown) toast.warning('Could not show a notification. Check browser permissions.')
  }

  function exportJson() {
    const payload = actions.exportData()
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `harshtodo-backup-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    setTimeout(() => URL.revokeObjectURL(url), 5000)
    toast.success('Backup downloaded')
  }

  async function onImportFile(e) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    try {
      const text = await file.text()
      const payload = JSON.parse(text)
      if (payload?.app !== 'harshtodo') throw new Error('This file is not a HarshTodo backup.')
      setImportPreview({ payload, counts: { tasks: payload.tasks?.length || 0, projects: payload.projects?.length || 0, tags: payload.tags?.length || 0 } })
    } catch (error) {
      toast.error('Could not read the backup', { description: error.message })
    }
  }

  async function runImport(mode) {
    try {
      const result = await actions.importData(importPreview.payload, { mode })
      setImportPreview(null)
      toast.success(`Imported ${result.tasks} tasks, ${result.projects} projects and ${result.tags} tags`)
    } catch (error) {
      toast.error('Import failed', { description: error.message })
    }
  }

  async function requestPersist() {
    const result = await actions.requestPersistentStorage()
    setPersisted(result.granted)
    if (!result.supported) toast.info('This browser does not expose persistent storage controls.')
    else if (result.granted) toast.success('Storage is now marked persistent')
    else toast.info('The browser declined for now. Installing the app usually grants persistence.')
  }

  if (!settings) return null

  return (
    <Page width="max-w-3xl">
      <PageHeader title="Settings" subtitle="Preferences are stored on this device." />
      <div className="flex flex-col gap-4">
        <Card>
          <SectionTitle>General</SectionTitle>
          <div className="flex flex-col gap-4">
            <Field label="Your name" hint="Used in the dashboard greeting." inline htmlFor="display-name">
              <Input id="display-name" defaultValue={settings.displayName} onBlur={(e) => e.target.value !== settings.displayName && update({ displayName: e.target.value })} placeholder="Optional" maxLength={80} />
            </Field>
            <Field label="Week starts on" inline htmlFor="week-start">
              <Select id="week-start" value={settings.weekStartsOn} onChange={(e) => update({ weekStartsOn: Number(e.target.value) })}>
                <option value={1}>Monday</option>
                <option value={0}>Sunday</option>
                <option value={6}>Saturday</option>
              </Select>
            </Field>
            <Field label="Working hours" hint="Shaded outside this range in week and day views." inline>
              <div className="flex items-center gap-2">
                <Select aria-label="Day starts" value={settings.dayStartHour} onChange={(e) => update({ dayStartHour: Number(e.target.value) })}>
                  {Array.from({ length: 24 }, (_, h) => (
                    <option key={h} value={h} disabled={h >= settings.dayEndHour}>{`${String(h).padStart(2, '0')}:00`}</option>
                  ))}
                </Select>
                <span className="text-xs text-ink-muted">to</span>
                <Select aria-label="Day ends" value={settings.dayEndHour} onChange={(e) => update({ dayEndHour: Number(e.target.value) })}>
                  {Array.from({ length: 24 }, (_, h) => h + 1).map((h) => (
                    <option key={h} value={h} disabled={h <= settings.dayStartHour}>{`${String(h % 24).padStart(2, '0')}:00`}</option>
                  ))}
                </Select>
              </div>
            </Field>
            <Field label="Default focus session" inline htmlFor="focus-default">
              <Select id="focus-default" value={settings.focusDefaultMinutes} onChange={(e) => update({ focusDefaultMinutes: Number(e.target.value) })}>
                {[15, 25, 45, 60, 90].map((m) => (
                  <option key={m} value={m}>{m} minutes</option>
                ))}
              </Select>
            </Field>
            <Switch label="Confirm before moving tasks to trash" checked={settings.confirmBeforeDelete} onChange={(v) => update({ confirmBeforeDelete: v })} />
          </div>
        </Card>

        <Card>
          <SectionTitle>Reminders and notifications</SectionTitle>
          <div className="flex flex-col gap-4">
            {!support.supported ? (
              <InlineNotice tone="info">{support.reason} Reminders still appear inside the app while it is open.</InlineNotice>
            ) : permission === 'denied' ? (
              <InlineNotice tone="warning">Notifications are blocked for this site. Allow them in your browser's site settings, then reload. In-app reminder banners keep working.</InlineNotice>
            ) : null}
            <Switch
              label="System notifications"
              description="Show a browser notification when a reminder is due. Works only while the app is open or installed; browsers do not run timers in the background without a server push."
              checked={settings.notificationsEnabled && permission === 'granted'}
              onChange={enableNotifications}
              disabled={!support.supported || permission === 'denied'}
            />
            {settings.notificationsEnabled && permission === 'granted' ? (
              <div>
                <Button size="sm" variant="secondary" icon="bell" onClick={testNotification}>
                  Send test notification
                </Button>
              </div>
            ) : null}
            <Field label="Default reminder for timed tasks" inline htmlFor="default-reminder">
              <Select id="default-reminder" value={settings.defaultReminderMinutes ?? ''} onChange={(e) => update({ defaultReminderMinutes: e.target.value === '' ? null : Number(e.target.value) })}>
                <option value="">None</option>
                {REMINDER_OFFSETS.map((r) => (
                  <option key={r.value} value={r.value}>{r.label}</option>
                ))}
              </Select>
            </Field>
          </div>
        </Card>

        <Card>
          <SectionTitle>App and offline</SectionTitle>
          <div className="flex flex-col gap-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-ink">Install HarshTodo</p>
                <p className="text-xs text-ink-muted mt-0.5 leading-relaxed">
                  {isStandalone()
                    ? 'You are using the installed app.'
                    : platform === 'ios'
                      ? 'On iPhone and iPad: tap Share in Safari, then "Add to Home Screen".'
                      : canInstall
                        ? 'Adds an app icon and opens in its own window.'
                        : 'Use your browser menu and choose "Install app" or "Add to Home Screen".'}
                </p>
              </div>
              {canInstall && !isStandalone() ? (
                <Button size="sm" variant="primary" icon="download" onClick={() => promptInstall().then((o) => o === 'accepted' && toast.success('Installed'))}>
                  Install
                </Button>
              ) : null}
            </div>
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-ink">Offline cache</p>
                <p className="text-xs text-ink-muted mt-0.5">
                  {!import.meta.env.PROD ? 'The service worker is active in production builds only.' : sw.error ? `Unavailable: ${sw.error}` : sw.needRefresh ? 'An update is ready.' : 'The app shell is cached for offline use.'}
                </p>
              </div>
              {sw.needRefresh ? (
                <Button
                  size="sm"
                  variant="primary"
                  icon="refresh"
                  onClick={async () => {
                    const result = await applyUpdate()
                    if (!result.ok) toast.error('Update failed', { description: result.reason })
                  }}
                >
                  Update now
                </Button>
              ) : sw.registration ? (
                <Button
                  size="sm"
                  variant="secondary"
                  icon="refresh"
                  loading={sw.checking}
                  onClick={async () => {
                    const result = await checkForUpdates()
                    if (!result.ok) toast.warning('Could not check for updates', { description: result.reason })
                    else if (!result.needRefresh) toast.info('You are on the latest version')
                  }}
                >
                  Check for updates
                </Button>
              ) : null}
            </div>
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-ink">Storage</p>
                <p className="text-xs text-ink-muted mt-0.5">
                  {persistent ? 'IndexedDB' : 'In-memory fallback (data will not survive a reload)'}
                  {estimate ? ` using ${formatBytes(estimate.usage)} of ${formatBytes(estimate.quota)}` : ''}
                  {persisted === true ? '. Marked persistent by the browser.' : persisted === false ? '. Not yet marked persistent; the browser may evict data under storage pressure.' : ''}
                </p>
              </div>
              {persisted === false ? (
                <Button size="sm" variant="secondary" icon="shield-check" onClick={requestPersist}>
                  Request persistence
                </Button>
              ) : null}
            </div>
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-ink">Keyboard shortcuts</p>
                <p className="text-xs text-ink-muted mt-0.5">
                  <KeyCombo keys={['N']} /> new task, <KeyCombo keys={['/']} /> search, <KeyCombo keys={['?']} /> for the full list.
                </p>
              </div>
              <Button size="sm" variant="secondary" icon="keyboard" onClick={() => setShortcutsOpen(true)}>
                View all
              </Button>
            </div>
          </div>
        </Card>

        <Card>
          <SectionTitle>Your data</SectionTitle>
          <p className="text-xs text-ink-muted mb-4 leading-relaxed">
            {tasks.filter((t) => !t.deletedAt).length} tasks, {projects.length} projects and {tags.length} tags are stored only in this browser. Nothing is sent anywhere unless you export it.
          </p>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="secondary" icon="download" onClick={exportJson}>
              Export backup (JSON)
            </Button>
            <input ref={fileRef} type="file" accept="application/json,.json" className="sr-only" onChange={onImportFile} aria-label="Import backup file" />
            <Button size="sm" variant="secondary" icon="upload" onClick={() => fileRef.current?.click()}>
              Import backup
            </Button>
            <Button size="sm" variant="danger-ghost" icon="trash-2" onClick={() => setConfirmErase(true)} className="ml-auto">
              Erase all data
            </Button>
          </div>
        </Card>

        <p className="text-xs text-ink-faint text-center py-2">HarshTodo {__APP_VERSION__}</p>
      </div>

      <ConfirmDialog open={confirmErase} onClose={() => setConfirmErase(false)} title="Erase everything on this device?" message="All tasks, projects, tags, settings and attachments will be deleted permanently. Export a backup first if you might want them back." confirmLabel="Erase all data" onConfirm={() => actions.eraseAllData().then(() => { setConfirmErase(false); toast.success('All data erased') })} />

      <Modal
        open={Boolean(importPreview)}
        onClose={() => setImportPreview(null)}
        title="Import backup"
        size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => setImportPreview(null)}>Cancel</Button>
            <Button variant="secondary" onClick={() => runImport('merge')}>Merge</Button>
            <Button variant="danger" onClick={() => runImport('replace')}>Replace everything</Button>
          </>
        }
      >
        {importPreview ? (
          <div className="text-sm text-ink-secondary leading-relaxed">
            <p>
              This backup contains <strong className="text-ink">{importPreview.counts.tasks}</strong> tasks, <strong className="text-ink">{importPreview.counts.projects}</strong> projects and <strong className="text-ink">{importPreview.counts.tags}</strong> tags
              {importPreview.payload.exportedAt ? `, exported ${importPreview.payload.exportedAt.slice(0, 10)}` : ''}.
            </p>
            <p className="mt-2">Merge keeps your current data and updates matching items. Replace erases everything on this device first.</p>
          </div>
        ) : null}
      </Modal>
    </Page>
  )
}
