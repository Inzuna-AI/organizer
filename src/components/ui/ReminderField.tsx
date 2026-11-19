import { FIXED_REMINDERS } from '@/lib/reminders'

interface Props {
  /** Angekreuzte Zeiten ("-1@15:00" …) */
  value: string[]
  onChange: (codes: string[]) => void
  /** z. B. Aufgabe ohne Datum: keine Erinnerung möglich */
  disabled?: boolean
}

/** „Erinnerung“ für Aufgaben und Termine: feste Uhrzeiten zum Ankreuzen */
export function ReminderField({ value, onChange, disabled }: Props) {
  function toggle(code: string) {
    onChange(value.includes(code) ? value.filter((c) => c !== code) : [...value, code])
  }

  const chips = (group: 'before' | 'day') =>
    FIXED_REMINDERS.filter((r) => r.group === group).map((r) => {
      const on = value.includes(r.code)
      return (
        <button
          key={r.code}
          type="button"
          onClick={() => toggle(r.code)}
          aria-pressed={on}
          disabled={disabled}
          className={`min-h-10 rounded-full border-2 px-3 text-sm disabled:opacity-50 ${
            on ? 'border-brand-700 bg-brand-50 font-semibold' : 'border-slate-200'
          }`}
        >
          {on ? '✓ ' : ''}
          {r.label}
        </button>
      )
    })

  return (
    <fieldset disabled={disabled}>
      <legend className="mb-1 text-sm font-medium text-slate-700">Erinnerung</legend>
      <p className="mb-1 text-xs text-slate-500">Vorher</p>
      <div className="mb-2 flex flex-wrap gap-2">{chips('before')}</div>
      <p className="mb-1 text-xs text-slate-500">Am Tag selbst</p>
      <div className="flex flex-wrap gap-2">{chips('day')}</div>
      <p className="mt-2 text-xs text-slate-500">
        {disabled
          ? 'Erinnerungen gibt es nur für Einträge mit Datum.'
          : value.length === 0
            ? 'Nichts angekreuzt = keine Erinnerung.'
            : 'Gilt für alle, die beteiligt sind und Erinnerungen eingeschaltet haben.'}
      </p>
    </fieldset>
  )
}
