import { useMemo, useState, type ReactNode } from 'react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Chip } from '@/components/ui/Chip'
import { formatDateTime } from '@/lib/dates'
import { isIos, permission, pushSupport } from '@/lib/push'
import { alive } from '@/lib/records'
import { useAppStore } from '@/store'
import type { NotifySettings } from '@/types/data'
import { notificationActions, useMyDevice } from './store'
import { REMINDER_OPTIONS, reminderPatch, reminderValue, toggleRoom } from './utils'

function Toggle({ label, hint, checked, onChange }: { label: string; hint?: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex min-h-12 cursor-pointer items-center justify-between gap-3 py-1">
      <span>
        <span className="block">{label}</span>
        {hint && <span className="block text-xs text-slate-500">{hint}</span>}
      </span>
      <input
        type="checkbox"
        role="switch"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="h-6 w-6 shrink-0 accent-brand-700"
      />
    </label>
  )
}

function Note({ children, tone = 'info' }: { children: ReactNode; tone?: 'info' | 'warn' | 'error' }) {
  const cls =
    tone === 'error'
      ? 'bg-red-50 text-red-800'
      : tone === 'warn'
        ? 'bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200'
        : 'bg-slate-100 text-slate-700'
  return <div className={`rounded-lg p-3 text-sm ${cls}`}>{children}</div>
}

const timeInput = 'min-h-11 rounded-lg border border-slate-300 bg-white px-2 text-base'

function SupportNote() {
  switch (pushSupport()) {
    case 'dev':
      return (
        <Note tone="warn">
          In der Entwicklungsversion (<code>npm run dev</code>) läuft kein Service Worker. Push lässt sich nur in der
          gebauten App testen (<code>npm run build</code> + <code>npm run preview</code> auf localhost) oder online.
        </Note>
      )
    case 'no-key':
      return (
        <Note tone="warn">
          Diese Version wurde ohne öffentlichen Push-Schlüssel gebaut. Bitte im Code-Repo die Variable{' '}
          <code>VITE_VAPID_PUBLIC_KEY</code> anlegen und neu deployen (siehe README im Daten-Repo).
        </Note>
      )
    case 'ios-not-installed':
      return (
        <Note tone="warn">
          <p className="mb-2 font-medium">Auf dem iPhone geht Push nur aus der Home-Bildschirm-App (ab iOS 16.4):</p>
          <ol className="list-decimal space-y-1 pl-5">
            <li>In Safari unten auf „Teilen“ (Quadrat mit Pfeil) tippen</li>
            <li>„Zum Home-Bildschirm“ wählen und „Hinzufügen“</li>
            <li>Die App vom Home-Bildschirm öffnen und hier „Aktivieren“ tippen</li>
          </ol>
        </Note>
      )
    case 'unsupported':
      return (
        <Note tone="warn">
          Dieser Browser unterstützt keine Push-Benachrichtigungen. Auf Android Chrome oder Samsung Internet verwenden,
          auf dem iPhone die Home-Bildschirm-App.
          {isIos() ? '' : ' Im WLAN über http:// geht Push ebenfalls nicht, nur über https oder localhost.'}
        </Note>
      )
    default:
      return null
  }
}

export function NotificationsPage() {
  const me = useMyDevice()
  const data = useAppStore((s) => s.data)
  const readonly = useAppStore((s) => s.sync.status === 'readonly')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [testSent, setTestSent] = useState(false)
  const rooms = useMemo(() => (data ? alive(data.rooms).sort((a, b) => a.sortOrder - b.sortOrder) : []), [data])

  const support = pushSupport()
  const blocked = support === 'ok' && permission() === 'denied'
  const n = me?.notify
  const set = (patch: Partial<NotifySettings>) => notificationActions.update(patch)

  async function onEnable() {
    setBusy(true)
    setError(null)
    try {
      await notificationActions.enable()
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setBusy(false)
    }
  }

  async function onDisable() {
    if (!window.confirm('Benachrichtigungen auf diesem Gerät ausschalten?')) return
    setBusy(true)
    await notificationActions.disable()
    setBusy(false)
  }

  function onTest() {
    notificationActions.requestTest()
    setTestSent(true)
  }

  return (
    <div className="space-y-4 p-4">
      <Card title="Dieses Gerät">
        <div className="space-y-3">
          <SupportNote />
          {blocked && (
            <Note tone="error">
              Benachrichtigungen sind für diese App blockiert. Bitte in den Einstellungen des Browsers bzw. Handys
              wieder erlauben.
            </Note>
          )}
          {me ? (
            <>
              <p className="text-sm">
                ✅ Benachrichtigungen sind auf <strong>{me.name}</strong> aktiv.
              </p>
              <Button block disabled={readonly} onClick={onTest}>
                🔔 Testbenachrichtigung senden
              </Button>
              {testSent && (
                <p role="status" className="text-sm text-slate-500">
                  Wird gespeichert und über GitHub verschickt. Sie kommt in ca. 30–60 Sekunden.
                  {me.testRequestedAt ? ` (angefordert ${formatDateTime(me.testRequestedAt)})` : ''}
                </p>
              )}
              <Button variant="ghost" block disabled={busy} onClick={() => void onDisable()}>
                Benachrichtigungen ausschalten
              </Button>
            </>
          ) : (
            <>
              <p className="text-sm text-slate-600">
                Erhalte eine Nachricht, wenn die andere Person etwas ändert, vor fälligen Aufgaben und als
                Tageszusammenfassung.
              </p>
              <Button block disabled={support !== 'ok' || blocked || busy || readonly} onClick={() => void onEnable()}>
                {busy ? 'Wird aktiviert …' : 'Benachrichtigungen aktivieren'}
              </Button>
            </>
          )}
          {error && <Note tone="error">{error}</Note>}
        </div>
      </Card>

      {me && n && (
        <>
          <Card title="Bei Änderungen der anderen Person">
            <div className="-my-1 divide-y divide-slate-100">
              <Toggle label="Neue Aufgabe angelegt" checked={n.newTask} onChange={(v) => set({ newTask: v })} />
              <Toggle
                label="Aufgabe mir zugewiesen"
                hint="auch durch Rotation"
                checked={n.assignedToMe}
                onChange={(v) => set({ assignedToMe: v })}
              />
              <Toggle label="Aufgabe erledigt" checked={n.completedByOther} onChange={(v) => set({ completedByOther: v })} />
              <Toggle
                label="Aufgabe geändert oder verschoben"
                checked={n.changedOrMoved}
                onChange={(v) => set({ changedOrMoved: v })}
              />
              <Toggle
                label="Neuer oder geänderter Termin"
                hint="nur Termine, bei denen du dabei bist"
                checked={n.newEvent ?? true}
                onChange={(v) => set({ newEvent: v })}
              />
              <Toggle
                label="Neuer Artikel auf dem Einkaufszettel"
                hint="gebündelt pro Speichern"
                checked={n.newShoppingItem}
                onChange={(v) => set({ newShoppingItem: v })}
              />
            </div>
          </Card>

          <Card title="Filter">
            <div className="-my-1 divide-y divide-slate-100">
              <Toggle
                label="Nur Aufgaben, die mir zugewiesen sind"
                checked={n.onlyMyTasks}
                onChange={(v) => set({ onlyMyTasks: v })}
              />
              <div className="py-3">
                <p className="mb-2 text-sm">Nur diese Räume {n.rooms.length === 0 && <span className="text-slate-500">(alle)</span>}</p>
                <div className="flex flex-wrap gap-2">
                  {rooms.map((r) => (
                    <Chip key={r.id} color={r.color} active={n.rooms.includes(r.id)} onClick={() => set({ rooms: toggleRoom(n.rooms, r.id) })}>
                      {r.icon} {r.name}
                    </Chip>
                  ))}
                </div>
              </div>
            </div>
          </Card>

          <Card title="Erinnerungen">
            <div className="-my-1 divide-y divide-slate-100">
              <label className="flex min-h-12 items-center justify-between gap-3 py-2">
                <span>
                  <span className="block whitespace-nowrap">Erinnerung (Standard)</span>
                  <span className="block text-xs text-slate-500">für Einträge ohne eigene Erinnerung</span>
                </span>
                <select
                  value={reminderValue(n)}
                  onChange={(e) => set(reminderPatch(e.target.value))}
                  className="min-h-11 min-w-0 rounded-lg border border-slate-300 bg-white px-2 text-base"
                >
                  {REMINDER_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </label>
              <div className="py-1">
                <Toggle
                  label="Tägliche Zusammenfassung"
                  hint="„Heute: 2 Termine, 4 Aufgaben, 1 überfällig“"
                  checked={n.dailySummary}
                  onChange={(v) => set({ dailySummary: v })}
                />
                {n.dailySummary && (
                  <div className="flex items-center gap-2 pb-2">
                    <span className="text-sm text-slate-500">um</span>
                    <input
                      type="time"
                      aria-label="Uhrzeit der Zusammenfassung"
                      value={n.dailySummaryTime}
                      onChange={(e) => e.target.value && set({ dailySummaryTime: e.target.value })}
                      className={timeInput}
                    />
                  </div>
                )}
              </div>
              <div className="py-1">
                <Toggle
                  label="Ruhezeiten"
                  hint="In dieser Zeit wird nichts verschickt"
                  checked={!!n.quietHours}
                  onChange={(v) => set({ quietHours: v ? { from: '22:00', to: '07:00' } : null })}
                />
                {n.quietHours && (
                  <div className="flex items-center gap-2 pb-2">
                    <span className="text-sm text-slate-500">von</span>
                    <input
                      type="time"
                      aria-label="Ruhezeit von"
                      value={n.quietHours.from}
                      onChange={(e) => e.target.value && set({ quietHours: { ...n.quietHours!, from: e.target.value } })}
                      className={timeInput}
                    />
                    <span className="text-sm text-slate-500">bis</span>
                    <input
                      type="time"
                      aria-label="Ruhezeit bis"
                      value={n.quietHours.to}
                      onChange={(e) => e.target.value && set({ quietHours: { ...n.quietHours!, to: e.target.value } })}
                      className={timeInput}
                    />
                  </div>
                )}
              </div>
            </div>
            <p className="mt-3 text-xs text-slate-500">
              Bei jeder Aufgabe und jedem Termin lässt sich unter „Erinnerung“ ein eigener Zeitpunkt wählen. „Aus“
              schaltet alle Erinnerungen für dieses Gerät ab. GitHub prüft zwischen 6 und 23 Uhr alle 30 Minuten, ob
              etwas fällig ist. Erinnerungen kommen daher auf etwa eine Viertelstunde genau, nachts fällige um 6 Uhr.
            </p>
          </Card>
        </>
      )}
    </div>
  )
}
