import {
  FIXED_REMINDERS,
  normalizeReminder,
  reminderFromValue,
  reminderOptions,
  reminderToValue,
  type ReminderMin,
} from '@/lib/reminders'
import { SelectField } from './Field'

interface Props {
  value: ReminderMin
  onChange: (v: ReminderMin) => void
  /** Feste Uhrzeiten ("-1@15:00" …) */
  fixed: string[]
  onFixedChange: (codes: string[]) => void
  allDay: boolean
  /** z. B. Aufgabe ohne Datum: keine Erinnerung möglich */
  disabled?: boolean
}

/** Auswahl „Erinnerung“ für Aufgaben und Termine: relativ zum Beginn plus feste Uhrzeiten zum Ankreuzen */
export function ReminderField({ value, onChange, fixed, onFixedChange, allDay, disabled }: Props) {
  const shown = normalizeReminder(value, allDay)

  function toggle(code: string) {
    onFixedChange(fixed.includes(code) ? fixed.filter((c) => c !== code) : [...fixed, code])
  }

  const chips = (group: 'before' | 'day') =>
    FIXED_REMINDERS.filter((r) => r.group === group).map((r) => {
      const on = fixed.includes(r.code)
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
    <div className="space-y-3">
      <div>
        <SelectField
          label="Erinnerung"
          value={reminderToValue(shown)}
          onChange={(e) => onChange(reminderFromValue(e.target.value))}
          disabled={disabled}
        >
          {reminderOptions(allDay, shown).map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </SelectField>
        <p className="mt-1 text-xs text-slate-500">
          {disabled
            ? 'Erinnerungen gibt es nur für Einträge mit Datum.'
            : value === undefined
              ? 'Standard: jedes Gerät erinnert nach seiner Einstellung unter Benachrichtigungen.'
              : 'Gilt für alle, die beteiligt sind und Erinnerungen eingeschaltet haben.'}
        </p>
      </div>
      <fieldset disabled={disabled}>
        <legend className="mb-1 text-sm font-medium text-slate-700">Zusätzlich zu festen Uhrzeiten</legend>
        <p className="mb-1 text-xs text-slate-500">Vorher</p>
        <div className="mb-2 flex flex-wrap gap-2">{chips('before')}</div>
        <p className="mb-1 text-xs text-slate-500">Am Tag selbst</p>
        <div className="flex flex-wrap gap-2">{chips('day')}</div>
      </fieldset>
    </div>
  )
}
