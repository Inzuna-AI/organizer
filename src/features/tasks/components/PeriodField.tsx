import { SelectField } from '@/components/ui/Field'
import {
  describePeriodRepeat,
  PERIOD_UNITS,
  periodLabel,
  periodRange,
  periodStartOf,
  type PeriodUnit,
} from '@/lib/periods'
import { periodChoices } from '../utils'

export interface PeriodValue {
  unit: PeriodUnit
  /** erster Tag des (ersten) Zeitraums */
  from: string
  /** alle n Wochen/Monate/Quartale …; null = einmalig */
  repeat: number | null
  rotation: boolean
}

interface Props {
  value: PeriodValue
  onChange: (v: PeriodValue) => void
  today: string
  canRotate: boolean
}

const REPEATS: Record<PeriodUnit, number[]> = {
  week: [1, 2, 3, 4],
  month: [1, 2],
  quarter: [1, 2],
  half: [1],
  year: [1, 2],
}

/** So viele Zeiträume stehen zur Auswahl */
const CHOICES: Record<PeriodUnit, number> = { week: 8, month: 12, quarter: 6, half: 4, year: 3 }

const WHICH: Record<PeriodUnit, string> = {
  week: 'Welche Woche',
  month: 'Welcher Monat',
  quarter: 'Welches Quartal',
  half: 'Welches Halbjahr',
  year: 'Welches Jahr',
}

const chip = (active: boolean) =>
  `min-h-10 rounded-xl border text-sm ${active ? 'border-brand-700 bg-brand-50 font-semibold' : 'border-slate-300'}`

/** Zeitraum einer Aufgabe: Woche oder Monat, welcher, ob wiederkehrend */
export function PeriodField({ value, onChange, today, canRotate }: Props) {
  const { unit, from, repeat, rotation } = value
  const choices = periodChoices(unit, today, CHOICES[unit])
  // Gespeicherter Beginn, der nicht (mehr) in der Auswahl steht, z. B. Serienstart in der Vergangenheit
  if (!choices.some((c) => c.from === from)) {
    const range = periodRange({ period: unit, recurrenceRule: null, startAt: from }, from)
    choices.unshift({ from, label: periodLabel(range, unit, today) })
  }
  const options = REPEATS[unit].includes(repeat ?? 1) ? REPEATS[unit] : [...REPEATS[unit], repeat!].sort((a, b) => a - b)

  function setUnit(u: PeriodUnit) {
    if (u === unit) return
    onChange({ ...value, unit: u, from: periodStartOf(today, u), repeat: repeat ? 1 : null })
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-5 gap-1" role="group" aria-label="Zeitraum">
        {PERIOD_UNITS.map((u) => (
          <button
            key={u.unit}
            type="button"
            aria-pressed={unit === u.unit}
            onClick={() => setUnit(u.unit)}
            className={`${chip(unit === u.unit)} px-0.5`}
          >
            {u.label}
          </button>
        ))}
      </div>
      <SelectField
        label={repeat ? 'Erster Zeitraum' : WHICH[unit]}
        value={from}
        onChange={(e) => onChange({ ...value, from: e.target.value })}
      >
        {choices.map((c) => (
          <option key={c.from} value={c.from}>
            {c.label}
          </option>
        ))}
      </SelectField>
      <SelectField
        label="Wiederholen"
        value={repeat ? String(repeat) : ''}
        onChange={(e) => onChange({ ...value, repeat: e.target.value ? Number(e.target.value) : null })}
      >
        <option value="">Einmalig</option>
        {options.map((n) => (
          <option key={n} value={n}>
            {describePeriodRepeat(unit, n)}
          </option>
        ))}
      </SelectField>
      {repeat && (
        <label className={`flex min-h-10 items-center gap-3 text-sm ${canRotate ? '' : 'text-slate-400'}`}>
          <input
            type="checkbox"
            className="h-5 w-5 accent-brand-700"
            checked={rotation && canRotate}
            disabled={!canRotate}
            onChange={(e) => onChange({ ...value, rotation: e.target.checked })}
          />
          <span>
            Reihum zuständig (jeder Zeitraum die nächste Person)
            {!canRotate && <span className="block text-xs">Dafür mindestens zwei Personen auswählen.</span>}
          </span>
        </label>
      )}
      <p className="text-xs text-slate-500">
        {repeat
          ? `Einmal pro Zeitraum erledigen, an welchem Tag ist egal. Nicht Erledigtes verfällt, wenn der nächste Zeitraum beginnt.`
          : 'Irgendwann in diesem Zeitraum erledigen, an welchem Tag ist egal.'}
      </p>
    </div>
  )
}
