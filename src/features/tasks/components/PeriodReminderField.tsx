import { PERIOD_REMINDERS } from '@/lib/periods'

interface Props {
  value: string[]
  onChange: (codes: string[]) => void
}

/** „Erinnerung“ für Zeitraum-Aufgaben: zum Start und/oder kurz vor Ablauf */
export function PeriodReminderField({ value, onChange }: Props) {
  function toggle(code: string) {
    onChange(value.includes(code) ? value.filter((c) => c !== code) : [...value, code])
  }

  return (
    <fieldset>
      <legend className="mb-1 text-sm font-medium text-slate-700">Erinnerung</legend>
      <div className="flex flex-wrap gap-2">
        {PERIOD_REMINDERS.map((r) => {
          const on = value.includes(r.code)
          return (
            <button
              key={r.code}
              type="button"
              onClick={() => toggle(r.code)}
              aria-pressed={on}
              className={`min-h-10 rounded-full border-2 px-3 text-sm ${
                on ? 'border-brand-700 bg-brand-50 font-semibold' : 'border-slate-200'
              }`}
            >
              {on ? '✓ ' : ''}
              {r.label}
            </button>
          )
        })}
      </div>
      <p className="mt-2 text-xs text-slate-500">
        {value.length === 0
          ? 'Nichts angekreuzt = keine Erinnerung.'
          : '„Kurz vor Ablauf“: Woche freitags, Monat 7 Tage, Quartal 14 Tage, Halbjahr/Jahr 1 Monat vor Ende – nur, wenn noch offen. An die Person, die gerade zuständig ist.'}
      </p>
    </fieldset>
  )
}
