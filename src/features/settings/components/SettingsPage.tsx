import { useState } from 'react'
import { formatDateTime } from '@/lib/dates'
import { alive } from '@/lib/records'
import { maskToken } from '@/lib/storage'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { TextField } from '@/components/ui/TextField'
import { useAppStore } from '@/store'

const STATUS_TEXT: Record<string, string> = {
  idle: 'Synchronisiert',
  syncing: 'Aktualisiere…',
  saving: 'Wird gespeichert…',
  offline: 'Offline',
  error: 'Fehler',
  readonly: 'Nur lesen',
}

export function SettingsPage() {
  const config = useAppStore((s) => s.config)
  const device = useAppStore((s) => s.device)
  const data = useAppStore((s) => s.data)
  const sync = useAppStore((s) => s.sync)
  const syncNow = useAppStore((s) => s.syncNow)
  const setDevice = useAppStore((s) => s.setDevice)
  const reconfigure = useAppStore((s) => s.reconfigure)
  const removeToken = useAppStore((s) => s.removeToken)

  const [deviceName, setDeviceName] = useState(device?.deviceName ?? '')
  const persons = data ? alive(data.persons) : []

  function onRemoveToken() {
    if (window.confirm('Token von diesem Gerät entfernen? Danach musst du die Verbindung neu einrichten.')) {
      removeToken()
    }
  }

  return (
    <div className="space-y-4 p-4">
      <Card title="Synchronisation">
        <dl className="mb-4 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
          <dt className="text-slate-500">Status</dt>
          <dd>
            {STATUS_TEXT[sync.status] ?? sync.status}
            {sync.dirty && sync.status !== 'saving' ? ' (Änderungen warten)' : ''}
          </dd>
          <dt className="text-slate-500">Zuletzt</dt>
          <dd>{sync.lastSyncAt ? formatDateTime(sync.lastSyncAt) : '–'}</dd>
        </dl>
        {sync.error && <p className="mb-3 rounded-lg bg-red-50 p-2 text-sm text-red-800">{sync.error}</p>}
        <Button variant="secondary" block onClick={() => void syncNow()}>
          Jetzt synchronisieren
        </Button>
      </Card>

      <Card title="Dieses Gerät">
        <div className="space-y-4">
          <div>
            <p className="mb-2 text-sm font-medium text-slate-700">Das bin ich</p>
            <div className="flex flex-wrap gap-2">
              {persons.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  aria-pressed={device?.personId === p.id}
                  onClick={() => device && setDevice({ ...device, personId: p.id })}
                  className={`flex min-h-11 items-center gap-2 rounded-full border-2 px-3 ${
                    device?.personId === p.id ? 'border-brand-700 bg-brand-50' : 'border-slate-200'
                  }`}
                >
                  <span
                    className="flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold text-white"
                    style={{ backgroundColor: p.color }}
                  >
                    {p.kuerzel}
                  </span>
                  {p.name}
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-end gap-2">
            <TextField
              className="flex-1"
              label="Gerätename"
              value={deviceName}
              onChange={(e) => setDeviceName(e.target.value)}
            />
            <Button
              variant="secondary"
              disabled={!device || !deviceName.trim() || deviceName.trim() === device.deviceName}
              onClick={() => device && setDevice({ ...device, deviceName: deviceName.trim() })}
            >
              Speichern
            </Button>
          </div>
        </div>
      </Card>

      <Card title="Verbindung">
        <dl className="mb-4 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
          <dt className="text-slate-500">Repo</dt>
          <dd className="break-all">
            {config?.owner}/{config?.repo}
          </dd>
          <dt className="text-slate-500">Token</dt>
          <dd>{config?.token ? maskToken(config.token) : '–'}</dd>
        </dl>
        <div className="space-y-2">
          <Button variant="secondary" block onClick={reconfigure}>
            Verbindung ändern
          </Button>
          <Button variant="danger" block onClick={onRemoveToken}>
            Token entfernen
          </Button>
        </div>
      </Card>

      <Card title="Daten">
        <dl className="grid grid-cols-[1fr_auto] gap-y-1 text-sm">
          <dt className="text-slate-500">Personen</dt>
          <dd>{persons.length}</dd>
          <dt className="text-slate-500">Räume</dt>
          <dd>{data ? alive(data.rooms).length : 0}</dd>
          <dt className="text-slate-500">Aufgaben</dt>
          <dd>{data ? alive(data.tasks).length : 0}</dd>
          <dt className="text-slate-500">Einkaufslisten</dt>
          <dd>{data ? alive(data.shoppingLists).length : 0}</dd>
        </dl>
      </Card>

      <p className="pb-4 text-center text-xs text-slate-400">Organizer · Version {__APP_VERSION__}</p>
    </div>
  )
}
