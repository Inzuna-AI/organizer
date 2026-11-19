import { useState, type FormEvent } from 'react'
import type { DataFile } from '@/types/data'
import { alive } from '@/lib/records'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { TextField } from '@/components/ui/TextField'
import { testConnection, useAppStore, writeInitialData } from '@/store'
import { cleanOwner, guessDeviceName } from '../utils'

type Step = 'connect' | 'persons' | 'me'

export function SetupPage() {
  const existingConfig = useAppStore((s) => s.config)
  const existingDevice = useAppStore((s) => s.device)
  const reconfiguring = useAppStore((s) => s.reconfiguring)
  const completeSetup = useAppStore((s) => s.completeSetup)
  const cancelReconfigure = useAppStore((s) => s.cancelReconfigure)

  const [step, setStep] = useState<Step>('connect')
  const [owner, setOwner] = useState(existingConfig?.owner ?? '')
  const [repo, setRepo] = useState(existingConfig?.repo ?? 'organizer-data')
  const [token, setToken] = useState('')
  const [deviceName, setDeviceName] = useState(existingDevice?.deviceName ?? guessDeviceName())
  const [names, setNames] = useState(['Lena', ''])
  const [personId, setPersonId] = useState(existingDevice?.personId ?? '')

  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [data, setData] = useState<DataFile | null>(null)
  const [sha, setSha] = useState<string | null>(null)

  // Beim Ändern der Verbindung darf das Token-Feld leer bleiben (= bisheriger Token)
  const effectiveToken = token.trim() || existingConfig?.token || ''
  const config = { owner: cleanOwner(owner), repo: repo.trim(), token: effectiveToken }

  async function onConnect(e: FormEvent) {
    e.preventDefault()
    setError(null)
    if (!config.owner || !config.repo || !config.token) {
      setError('Bitte Owner, Repo-Name und Token ausfüllen.')
      return
    }
    setBusy(true)
    try {
      const res = await testConnection(config)
      if (res.kind === 'existing') {
        setData(res.data)
        setSha(res.sha)
        setStep(alive(res.data.persons).length > 0 ? 'me' : 'persons')
      } else {
        setData(null)
        setSha(res.sha)
        setStep('persons')
      }
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setBusy(false)
    }
  }

  async function onCreatePersons(e: FormEvent) {
    e.preventDefault()
    setError(null)
    if (names.every((n) => !n.trim())) {
      setError('Bitte mindestens einen Namen eintragen.')
      return
    }
    setBusy(true)
    try {
      const res = await writeInitialData({ config, base: data, names, sha, deviceName })
      setData(res.data)
      setSha(res.sha)
      setStep('me')
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setBusy(false)
    }
  }

  function onFinish(e: FormEvent) {
    e.preventDefault()
    if (!data || !personId) {
      setError('Bitte auswählen, wer du bist.')
      return
    }
    completeSetup({
      config,
      device: { personId, deviceName: deviceName.trim() || guessDeviceName() },
      data,
      sha,
    })
  }

  const persons = data ? alive(data.persons) : []

  return (
    <div className="pt-safe pb-safe mx-auto min-h-full max-w-md px-4 py-8">
      <div className="mb-6 text-center">
        <img src={`${import.meta.env.BASE_URL}favicon.svg`} alt="" className="mx-auto mb-3 h-16 w-16" />
        <h1 className="text-2xl font-semibold">Organizer einrichten</h1>
        <p className="mt-1 text-sm text-slate-500">Einmal pro Gerät. Alle Angaben bleiben nur auf diesem Gerät.</p>
      </div>

      <ol className="mb-6 flex justify-center gap-2 text-xs" aria-label="Schritte">
        {(['connect', 'persons', 'me'] as Step[]).map((s, i) => (
          <li
            key={s}
            className={`rounded-full px-3 py-1 ${step === s ? 'bg-brand-700 text-white' : 'bg-slate-200 text-slate-600'}`}
          >
            {i + 1}. {s === 'connect' ? 'Verbindung' : s === 'persons' ? 'Personen' : 'Das bin ich'}
          </li>
        ))}
      </ol>

      {error && (
        <div role="alert" className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">
          {error}
        </div>
      )}

      {step === 'connect' && (
        <form onSubmit={onConnect} className="space-y-4">
          <Card>
            <div className="space-y-4">
              <TextField
                label="GitHub-Benutzername (Owner)"
                value={owner}
                onChange={(e) => setOwner(e.target.value)}
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                placeholder="z. B. lena-mueller"
                required
              />
              <TextField
                label="Name des Daten-Repos"
                value={repo}
                onChange={(e) => setRepo(e.target.value)}
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                required
              />
              <TextField
                label="Token"
                type="password"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                autoComplete="off"
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                placeholder={existingConfig?.token ? 'leer lassen = bisheriger Token' : 'github_pat_…'}
                hint="Fine-grained Token, nur für das Daten-Repo, Berechtigung „Contents: Read and write“."
              />
            </div>
          </Card>
          <details className="rounded-xl bg-slate-100 p-3 text-sm text-slate-700">
            <summary className="cursor-pointer font-medium">Wie bekomme ich einen Token?</summary>
            <ol className="mt-2 list-decimal space-y-1 pl-5">
              <li>
                Auf GitHub:{' '}
                <a
                  className="text-brand-700 underline"
                  href="https://github.com/settings/personal-access-tokens/new"
                  target="_blank"
                  rel="noreferrer"
                >
                  Settings → Developer settings → Fine-grained tokens → Generate new token
                </a>
              </li>
              <li>Name z. B. „Organizer“, Ablaufdatum nach Wunsch</li>
              <li>Repository access: „Only select repositories“ → das Daten-Repo</li>
              <li>Permissions → Repository permissions → Contents: „Read and write“</li>
              <li>Token erzeugen, kopieren und hier einfügen</li>
            </ol>
          </details>
          <Button type="submit" block disabled={busy}>
            {busy ? 'Teste Verbindung…' : 'Verbindung testen'}
          </Button>
          {reconfiguring && (
            <Button variant="ghost" block onClick={cancelReconfigure}>
              Abbrechen
            </Button>
          )}
        </form>
      )}

      {step === 'persons' && (
        <form onSubmit={onCreatePersons} className="space-y-4">
          <Card>
            <p className="mb-4 text-sm text-slate-600">
              {data
                ? 'In den Daten sind noch keine Personen eingetragen.'
                : 'Die Datei data.json ist noch leer. Sie wird jetzt mit Beispielräumen und einer Einkaufsliste angelegt.'}{' '}
              Wer nutzt den Organizer?
            </p>
            <div className="space-y-3">
              {names.map((n, i) => (
                <TextField
                  key={i}
                  label={`Person ${i + 1}`}
                  value={n}
                  onChange={(e) => setNames(names.map((x, j) => (j === i ? e.target.value : x)))}
                  placeholder={i === 0 ? 'Lena' : 'Dein Name'}
                />
              ))}
            </div>
          </Card>
          <Button type="submit" block disabled={busy}>
            {busy ? 'Lege an…' : 'Anlegen'}
          </Button>
          <Button variant="ghost" block onClick={() => setStep('connect')}>
            Zurück
          </Button>
        </form>
      )}

      {step === 'me' && (
        <form onSubmit={onFinish} className="space-y-4">
          <Card title="Das bin ich">
            <div className="grid grid-cols-2 gap-3">
              {persons.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setPersonId(p.id)}
                  aria-pressed={personId === p.id}
                  className={`flex min-h-20 flex-col items-center justify-center gap-1 rounded-2xl border-2 p-3 ${
                    personId === p.id ? 'border-brand-700 bg-brand-50' : 'border-slate-200 bg-white'
                  }`}
                >
                  <span
                    className="flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold text-white"
                    style={{ backgroundColor: p.color }}
                  >
                    {p.kuerzel}
                  </span>
                  <span className="font-medium">{p.name}</span>
                </button>
              ))}
            </div>
          </Card>
          <Card>
            <TextField
              label="Name dieses Geräts"
              value={deviceName}
              onChange={(e) => setDeviceName(e.target.value)}
              hint="Erscheint in der Änderungshistorie, z. B. „Lenas iPhone“."
            />
          </Card>
          <Button type="submit" block disabled={!personId}>
            Fertig
          </Button>
        </form>
      )}
    </div>
  )
}
