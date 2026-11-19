import { useState } from 'react'
import type { RecurrenceMode } from '@/types/data'
import {
  buildRule,
  defaultSpec,
  describeRule,
  isLastOfMonth,
  monthlyLabel,
  nthOfMonth,
  WEEKDAY_SHORT,
  type Freq,
  type MonthlyMode,
  type RecurrenceSpec,
} from '@/lib/recurrence'
import { TextField } from '@/components/ui/TextField'

export interface RecurrenceValue {
  spec: RecurrenceSpec | null
  mode: RecurrenceMode
  rotation: boolean
}

interface Props {
  value: RecurrenceValue
  onChange: (v: RecurrenceValue) => void
  /** Starttermin der Serie (JJJJ-MM-TT), liefert Wochentag/Tag für die Beschreibung */
  date: string
  /** Rotation erst ab zwei Zuständigen */
  canRotate: boolean
}

const FREQS: Array<{ key: Freq | ''; label: string }> = [
  { key: '', label: 'Nie' },
  { key: 'daily', label: 'Täglich' },
  { key: 'weekdays', label: 'Werktags (Mo–Fr)' },
  { key: 'weekly', label: 'Wöchentlich' },
  { key: 'monthly', label: 'Monatlich' },
  { key: 'yearly', label: 'Jährlich' },
]

const UNITS: Record<Freq, [string, string]> = {
  daily: ['Tag', 'Tage'],
  weekdays: ['Tag', 'Tage'],
  weekly: ['Woche', 'Wochen'],
  monthly: ['Monat', 'Monate'],
  yearly: ['Jahr', 'Jahre'],
}

const chip = (active: boolean) =>
  `min-h-10 rounded-xl border text-sm ${active ? 'border-brand-700 bg-brand-50 font-semibold' : 'border-slate-300'}`

export function RecurrenceEditor({ value, onChange, date, canRotate }: Props) {
  const { spec, mode, rotation } = value
  const afterCompletion = mode === 'after_completion'
  /** Eingabe im Intervall-Feld, solange es fokussiert ist (darf kurz leer sein) */
  const [intervalDraft, setIntervalDraft] = useState<string | null>(null)

  function setFreq(freq: Freq | '') {
    if (!freq) return onChange({ ...value, spec: null })
    const base = defaultSpec(freq, date)
    onChange({
      ...value,
      // Intervall und Ende beim Wechsel behalten
      spec: spec ? { ...base, interval: freq === 'weekdays' ? 1 : spec.interval, until: spec.until } : base,
      mode: freq === 'weekdays' ? 'fixed' : mode,
    })
  }

  const setSpec = (s: Partial<RecurrenceSpec>) => spec && onChange({ ...value, spec: { ...spec, ...s } })

  function toggleDay(i: number) {
    if (!spec) return
    const days = spec.byWeekday.includes(i) ? spec.byWeekday.filter((d) => d !== i) : [...spec.byWeekday, i]
    if (days.length) setSpec({ byWeekday: days.sort() })
  }

  const monthlyOptions: MonthlyMode[] = ['day']
  if (nthOfMonth(date) <= 4) monthlyOptions.push('nth')
  if (isLastOfMonth(date)) monthlyOptions.push('last')

  const unit = spec ? UNITS[spec.freq] : UNITS.daily
  const summary = spec ? describeRule(buildRule(spec, date, mode), date, mode) : ''

  return (
    <div className="space-y-3">
      <label className="block">
        <span className="mb-1 block text-sm font-medium text-slate-700">Wiederholen</span>
        <select
          className="block min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-base outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-100"
          value={spec?.freq ?? ''}
          onChange={(e) => setFreq(e.target.value as Freq | '')}
        >
          {FREQS.map((f) => (
            <option key={f.key} value={f.key} disabled={afterCompletion && f.key === 'weekdays'}>
              {f.label}
            </option>
          ))}
        </select>
      </label>

      {spec && (
        <>
          {spec.freq !== 'weekdays' && (
            <div className="grid grid-cols-2 gap-2" role="group" aria-label="Art der Wiederholung">
              <button
                type="button"
                aria-pressed={!afterCompletion}
                onClick={() => onChange({ ...value, mode: 'fixed' })}
                className={chip(!afterCompletion)}
              >
                Fester Rhythmus
              </button>
              <button
                type="button"
                aria-pressed={afterCompletion}
                onClick={() => onChange({ ...value, mode: 'after_completion' })}
                className={chip(afterCompletion)}
              >
                Nach Erledigung
              </button>
            </div>
          )}

          {spec.freq !== 'weekdays' && (
            <div className="flex items-center gap-2 text-sm">
              <span>{afterCompletion ? '' : 'Alle'}</span>
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                enterKeyHint="done"
                aria-label="Intervall"
                value={intervalDraft ?? String(spec.interval)}
                // Beim Antippen markieren, damit man die Zahl direkt überschreibt
                onFocus={(e) => e.target.select()}
                onChange={(e) => {
                  // Leeres Feld beim Tippen erlauben; gespeichert wird nur eine gültige Zahl
                  const text = e.target.value.replace(/\D/g, '').slice(0, 2)
                  setIntervalDraft(text)
                  const n = Number(text)
                  if (n >= 1) setSpec({ interval: n })
                }}
                onBlur={() => setIntervalDraft(null)}
                className="min-h-11 w-16 rounded-xl border border-slate-300 bg-white px-2 text-center text-base"
              />
              <span>
                {spec.interval === 1 ? unit[0] : unit[1]}
                {afterCompletion ? ' nach dem Abhaken' : ''}
              </span>
            </div>
          )}

          {spec.freq === 'weekly' && !afterCompletion && (
            <div className="grid grid-cols-7 gap-1" role="group" aria-label="Wochentage">
              {WEEKDAY_SHORT.map((d, i) => (
                <button
                  key={d}
                  type="button"
                  aria-pressed={spec.byWeekday.includes(i)}
                  onClick={() => toggleDay(i)}
                  className={chip(spec.byWeekday.includes(i))}
                >
                  {d}
                </button>
              ))}
            </div>
          )}

          {spec.freq === 'monthly' && !afterCompletion && monthlyOptions.length > 1 && (
            <div className="space-y-1" role="radiogroup" aria-label="Tag im Monat">
              {monthlyOptions.map((m) => (
                <label key={m} className="flex min-h-10 items-center gap-3 text-sm">
                  <input
                    type="radio"
                    name="monthly"
                    className="h-5 w-5 accent-brand-700"
                    checked={spec.monthly === m}
                    onChange={() => setSpec({ monthly: m })}
                  />
                  {monthlyLabel(m, date)}
                </label>
              ))}
            </div>
          )}

          {!afterCompletion && (
            <TextField
              label="Endet am (optional)"
              type="date"
              value={spec.until ?? ''}
              min={date}
              onChange={(e) => setSpec({ until: e.target.value || null })}
            />
          )}

          <label className={`flex min-h-10 items-center gap-3 text-sm ${canRotate ? '' : 'text-slate-400'}`}>
            <input
              type="checkbox"
              className="h-5 w-5 accent-brand-700"
              checked={rotation && canRotate}
              disabled={!canRotate}
              onChange={(e) => onChange({ ...value, rotation: e.target.checked })}
            />
            <span>
              Zuständigkeit wechselt reihum
              {!canRotate && <span className="block text-xs">Dafür mindestens zwei Personen auswählen.</span>}
            </span>
          </label>

          <p className="rounded-xl bg-slate-100 px-3 py-2 text-sm text-slate-700">↻ {summary}</p>
        </>
      )}
    </div>
  )
}
