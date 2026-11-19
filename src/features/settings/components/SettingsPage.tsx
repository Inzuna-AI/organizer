import { useRef, useState } from 'react'
import { Link } from 'react-router'
import { backupFileName, describeBackup, exportText, mergeImport, parseBackup, restoreImport } from '@/lib/backup'
import { berlinDateString, formatDateTime, nowIso } from '@/lib/dates'
import type { DataFile } from '@/types/data'
import { ChoiceDialog } from '@/components/ui/ChoiceDialog'
import { alive } from '@/lib/records'
import { maskToken } from '@/lib/storage'
import { getTheme, setTheme, type Theme } from '@/lib/theme'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { TextField } from '@/components/ui/TextField'
import { currentPersonId, updateData, useAppStore } from '@/store'

const STATUS_TEXT: Record<string, string> = {
  idle: 'Synchronisiert',
  syncing: 'Aktualisiere…',
  saving: 'Wird gespeichert…',
  offline: 'Offline',
  error: 'Fehler',
  readonly: 'Nur lesen',
}

const THEMES: Array<{ key: Theme; label: string }> = [
  { key: 'system', label: '⚙️ System' },
  { key: 'light', label: '☀️ Hell' },
  { key: 'dark', label: '🌙 Dunkel' },
]

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
  const [theme, setThemeState] = useState<Theme>(getTheme)
  const fileInput = useRef<HTMLInputElement>(null)
  const [pendingImport, setPendingImport] = useState<DataFile | null>(null)
  const [importMsg, setImportMsg] = useState<{ ok: boolean; text: string } | null>(null)

  function onExport() {
    if (!data) return
    const url = URL.createObjectURL(new Blob([exportText(data)], { type: 'application/json' }))
    const a = document.createElement('a')
    a.href = url
    a.download = backupFileName(berlinDateString())
    document.body.appendChild(a)
    a.click()
    a.remove()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
  }

  async function onFileChosen(file: File | undefined) {
    if (fileInput.current) fileInput.current.value = ''
    if (!file) return
    setImportMsg(null)
    const result = parseBackup(await file.text())
    if (result.ok) setPendingImport(result.data)
    else setImportMsg({ ok: false, text: result.error })
  }

  function onImportChoice(choice: 'merge' | 'restore' | null) {
    const backup = pendingImport
    setPendingImport(null)
    if (!choice || !backup) return
    const ok = updateData((d) =>
      choice === 'merge' ? mergeImport(d, backup) : restoreImport(d, backup, currentPersonId(), nowIso()),
    )
    setImportMsg(
      ok
        ? { ok: true, text: choice === 'merge' ? 'Sicherung wurde zusammengeführt.' : 'Sicherung wurde wiederhergestellt.' }
        : { ok: false, text: 'Import nicht möglich (Nur-Lesen-Modus).' },
    )
  }
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
        {sync.status === 'offline' && (
          <p className="mb-3 rounded-lg bg-slate-100 p-2 text-sm text-slate-700">
            Kein Netz. Du kannst normal weiterarbeiten: Änderungen bleiben auf dem Gerät und werden automatisch
            übertragen, sobald wieder eine Verbindung besteht.
          </p>
        )}
        {sync.error && <p className="mb-3 rounded-lg bg-red-50 p-2 text-sm text-red-800">{sync.error}</p>}
        <Button variant="secondary" block onClick={() => void syncNow()}>
          Jetzt synchronisieren
        </Button>
      </Card>

      <Card title="Verwalten">
        <ul className="-my-1 divide-y divide-slate-100">
          {[
            { to: '/einstellungen/raeume', label: '🏠 Räume', count: data ? alive(data.rooms).length : 0 },
            { to: '/einstellungen/personen', label: '👥 Personen', count: persons.length },
          ].map((l) => (
            <li key={l.to}>
              <Link to={l.to} className="flex min-h-12 items-center justify-between py-1">
                <span>{l.label}</span>
                <span className="text-sm text-slate-500">{l.count} ›</span>
              </Link>
            </li>
          ))}
        </ul>
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
          <div>
            <p className="mb-2 text-sm font-medium text-slate-700">Darstellung</p>
            <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-label="Darstellung">
              {THEMES.map((t) => (
                <button
                  key={t.key}
                  type="button"
                  role="radio"
                  aria-checked={theme === t.key}
                  onClick={() => {
                    setTheme(t.key)
                    setThemeState(t.key)
                  }}
                  className={`min-h-11 rounded-xl border-2 text-sm ${
                    theme === t.key ? 'border-brand-700 bg-brand-50 font-semibold' : 'border-slate-200'
                  }`}
                >
                  {t.label}
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
        <p className="mt-4 mb-2 text-sm text-slate-500">
          Zusätzliche Sicherung als Datei. Die komplette Historie steht außerdem im Daten-Repo auf GitHub.
        </p>
        <div className="grid grid-cols-2 gap-2">
          <Button variant="secondary" disabled={!data} onClick={onExport}>
            ⬇️ Exportieren
          </Button>
          <Button variant="secondary" onClick={() => fileInput.current?.click()}>
            ⬆️ Importieren
          </Button>
        </div>
        <input
          ref={fileInput}
          type="file"
          accept="application/json,.json"
          className="hidden"
          onChange={(e) => void onFileChosen(e.target.files?.[0])}
        />
        {importMsg && (
          <p
            role="status"
            className={`mt-3 rounded-lg p-2 text-sm ${importMsg.ok ? 'bg-brand-50 text-brand-700' : 'bg-red-50 text-red-800'}`}
          >
            {importMsg.text}
          </p>
        )}
      </Card>

      <ChoiceDialog
        open={!!pendingImport}
        title="Sicherung importieren"
        message={
          pendingImport
            ? `Die Datei enthält ${describeBackup(pendingImport)}. „Zusammenführen“ übernimmt pro Eintrag den neueren Stand. „Wiederherstellen“ setzt alles auf den Stand der Datei zurück, später Angelegtes wird gelöscht.`
            : undefined
        }
        choices={[
          { value: 'merge', label: 'Zusammenführen (Neueres gewinnt)' },
          { value: 'restore', label: 'Wiederherstellen (Stand der Datei)', variant: 'danger' },
        ]}
        onChoose={onImportChoice}
      />

      <p className="pb-4 text-center text-xs text-slate-400">Organizer · Version {__APP_VERSION__}</p>
    </div>
  )
}
