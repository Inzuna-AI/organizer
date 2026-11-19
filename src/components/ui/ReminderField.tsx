import { normalizeReminder, reminderFromValue, reminderOptions, reminderToValue, type ReminderMin } from '@/lib/reminders'
import { SelectField } from './Field'

interface Props {
  value: ReminderMin
  onChange: (v: ReminderMin) => void
  allDay: boolean
  /** z. B. Aufgabe ohne Datum: keine Erinnerung möglich */
  disabled?: boolean
}

/** Auswahl „Erinnerung“ für Aufgaben und Termine */
export function ReminderField({ value, onChange, allDay, disabled }: Props) {
  const shown = normalizeReminder(value, allDay)
  return (
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
  )
}
