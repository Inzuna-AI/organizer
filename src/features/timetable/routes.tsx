import { useEffect, useState } from 'react'
import { berlinDateString } from '@/lib/dates'
import { timetableActions, useTimetableTexts } from './store'
import { cellText, DAYS, defaultDay, defaultText, HEADER_ROW, ROWS, type TimetableColumn } from './utils'

/** Stundenplan Mo–Fr: 9 Stunden ab 8 Uhr, zwei Spalten. Uhrzeiten und Spaltenköpfe sind voreingestellt, aber änderbar. */
export function TimetableView() {
  const today = berlinDateString()
  const todayDay = defaultDay(today)
  // Öffnet immer beim heutigen Wochentag (am Wochenende Montag)
  const [day, setDay] = useState(todayDay)
  const texts = useTimetableTexts()
  const text = (row: number, column: TimetableColumn) => cellText(texts, day, row, column)

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-5 gap-1.5" role="tablist" aria-label="Wochentag">
        {DAYS.map((d) => (
          <button
            key={d.day}
            type="button"
            role="tab"
            aria-selected={day === d.day}
            onClick={() => setDay(d.day)}
            className={`min-h-10 rounded-xl border text-sm font-medium ${
              day === d.day ? 'border-brand-600 bg-brand-700 text-white' : 'border-slate-300 bg-white text-slate-700'
            }`}
          >
            {d.label}
            {d.day === todayDay && day !== d.day ? ' •' : ''}
          </button>
        ))}
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <div className="grid grid-cols-[4.25rem_minmax(0,1fr)_minmax(0,1fr)] border-b border-slate-200 bg-slate-50">
          <span className="flex items-center px-2 text-xs font-medium text-slate-500">Uhrzeit</span>
          {(['a', 'b'] as const).map((col) => (
            <Cell
              key={col}
              value={text(HEADER_ROW, col)}
              placeholder={defaultText(HEADER_ROW, col)}
              label={`Spaltenkopf ${col === 'a' ? 'links' : 'rechts'}`}
              onSave={(v) => timetableActions.set(day, HEADER_ROW, col, v)}
              className="font-semibold"
            />
          ))}
        </div>
        {ROWS.map((row) => (
          <div
            key={row}
            className="grid grid-cols-[4.25rem_minmax(0,1fr)_minmax(0,1fr)] border-b border-slate-100 last:border-b-0"
          >
            <Cell
              value={text(row, 'time')}
              placeholder={defaultText(row, 'time')}
              label={`Uhrzeit Zeile ${row + 1}`}
              onSave={(v) => timetableActions.set(day, row, 'time', v)}
              className="text-xs text-slate-500 tabular-nums"
            />
            {(['a', 'b'] as const).map((col) => (
              <Cell
                key={col}
                value={text(row, col)}
                label={`${text(HEADER_ROW, col)}, ${text(row, 'time')}`}
                onSave={(v) => timetableActions.set(day, row, col, v)}
                className="border-l border-slate-100"
              />
            ))}
          </div>
        ))}
      </div>
      <p className="text-center text-xs text-slate-500">
        Felder antippen zum Ändern. Uhrzeiten und Spaltenköpfe gelten für alle Tage; leeren stellt die Voreinstellung wieder her.
      </p>
    </div>
  )
}

interface CellProps {
  value: string
  label: string
  placeholder?: string
  onSave: (value: string) => void
  className?: string
}

/** Eingabefeld, das beim Verlassen (oder Enter) speichert */
function Cell({ value, label, placeholder, onSave, className = '' }: CellProps) {
  const [draft, setDraft] = useState(value)
  const [focused, setFocused] = useState(false)
  // Änderungen vom anderen Gerät übernehmen, solange hier nicht getippt wird
  useEffect(() => {
    if (!focused) setDraft(value)
  }, [value, focused])

  return (
    <input
      value={draft}
      onChange={(e) => setDraft(e.target.value)}
      onFocus={() => setFocused(true)}
      onBlur={() => {
        setFocused(false)
        if (draft.trim() !== value.trim()) onSave(draft)
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter') e.currentTarget.blur()
      }}
      placeholder={placeholder}
      aria-label={label}
      enterKeyHint="done"
      autoCapitalize="sentences"
      className={`block min-h-11 w-full min-w-0 bg-transparent px-2 text-sm outline-none focus:bg-brand-50 focus:ring-2 focus:ring-brand-600 focus:ring-inset ${className}`}
    />
  )
}
