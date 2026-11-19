import { useState, type FormEvent } from 'react'
import type { CalEvent } from '@/types/data'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { TextareaField } from '@/components/ui/Field'
import { TextField } from '@/components/ui/TextField'
import { RecurrenceEditor, type RecurrenceValue } from '@/components/ui/RecurrenceEditor'
import { ReminderField } from '@/components/ui/ReminderField'
import { normalizeFixedReminders } from '@/lib/reminders'
import { PersonBadge, usePersons } from '@/features/persons'
import { endFor } from '@/lib/events'
import { buildRule, parseRule } from '@/lib/recurrence'
import { defaultFormValues, fromFormValues, moveStart, toFormValues, type EventFormValues, type EventInput } from '../utils'

interface Props {
  initial?: CalEvent
  /** Beim Bearbeiten eines Vorkommens: dessen Beginn (Formular zeigt diese Zeit) */
  instanceStart?: string
  defaults?: { date: string; time: string; personIds: string[] }
  /** Serienstart (JJJJ-MM-TT), wenn ein Vorkommen bearbeitet wird; die Regel bezieht sich darauf */
  seriesDate?: string
  submitLabel: string
  onSubmit: (input: EventInput) => void
}

export function EventForm({ initial, instanceStart, defaults, seriesDate, submitLabel, onSubmit }: Props) {
  const persons = usePersons()
  const [title, setTitle] = useState(initial?.title ?? '')
  const [location, setLocation] = useState(initial?.location ?? '')
  const [note, setNote] = useState(initial?.note ?? '')
  const [personIds, setPersonIds] = useState<string[]>(initial?.personIds ?? defaults?.personIds ?? [])
  const [times, setTimes] = useState<EventFormValues>(() => {
    if (initial) {
      const allDay = initial.allDay || initial.startAt.length < 16
      const startAt = instanceStart ?? (allDay ? initial.startAt.slice(0, 10) : initial.startAt)
      return toFormValues({ startAt, endAt: endFor(initial, startAt), allDay })
    }
    return defaultFormValues(defaults?.date ?? '', defaults?.time ?? '')
  })
  const [recurrence, setRecurrence] = useState<RecurrenceValue>(() => ({
    spec: initial?.recurrenceRule ? parseRule(initial.recurrenceRule, seriesDate ?? initial.startAt.slice(0, 10)) : null,
    mode: 'fixed',
    rotation: false,
  }))
  const [reminderTimes, setReminderTimes] = useState<string[]>(initial?.reminderTimes ?? [])
  const ruleDate = seriesDate ?? times.startDate
  const parsed = fromFormValues(times)
  const invalid = !parsed

  const family = persons.length >= 2 && persons.every((p) => personIds.includes(p.id))

  function togglePerson(id: string) {
    setPersonIds((ids) => (ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id]))
  }

  function setAllDay(allDay: boolean) {
    if (allDay) setTimes((t) => ({ ...t, allDay: true, startTime: '', endTime: '' }))
    else setTimes((t) => ({ ...defaultFormValues(t.startDate, '10:00'), startDate: t.startDate }))
  }

  function submit(e: FormEvent) {
    e.preventDefault()
    if (!title.trim() || !parsed) return
    onSubmit({
      title: title.trim(),
      location: location.trim(),
      note: note.trim(),
      ...parsed,
      personIds,
      recurrenceRule: recurrence.spec ? buildRule(recurrence.spec, ruleDate || times.startDate, 'fixed') : null,
      reminderTimes: normalizeFixedReminders(reminderTimes),
    })
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <Card>
        <div className="space-y-4">
          <TextField
            label="Titel"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            autoFocus={!initial}
            required
            placeholder="z. B. Zahnarzt"
            enterKeyHint="done"
          />
          <TextField label="Ort (optional)" value={location} onChange={(e) => setLocation(e.target.value)} enterKeyHint="done" />
        </div>
      </Card>

      <Card>
        <div className="space-y-4">
          <label className="flex min-h-10 items-center gap-3 text-sm">
            <input
              type="checkbox"
              className="h-5 w-5 accent-brand-700"
              checked={times.allDay}
              onChange={(e) => setAllDay(e.target.checked)}
            />
            Ganztägig
          </label>
          <div className={times.allDay ? '' : 'grid grid-cols-[minmax(0,3fr)_minmax(0,2fr)] gap-3'}>
            <TextField
              label="Beginn"
              type="date"
              required
              value={times.startDate}
              onChange={(e) => e.target.value && setTimes((t) => moveStart(t, e.target.value, t.startTime))}
            />
            {!times.allDay && (
              <TextField
                label="Uhrzeit"
                type="time"
                required
                value={times.startTime}
                onChange={(e) => e.target.value && setTimes((t) => moveStart(t, t.startDate, e.target.value))}
              />
            )}
          </div>
          <div className={times.allDay ? '' : 'grid grid-cols-[minmax(0,3fr)_minmax(0,2fr)] gap-3'}>
            <TextField
              label={times.allDay ? 'Bis (letzter Tag)' : 'Ende'}
              type="date"
              value={times.endDate}
              min={times.startDate}
              onChange={(e) => setTimes((t) => ({ ...t, endDate: e.target.value || t.startDate }))}
            />
            {!times.allDay && (
              <TextField
                label="Uhrzeit"
                type="time"
                value={times.endTime}
                onChange={(e) => setTimes((t) => ({ ...t, endTime: e.target.value }))}
              />
            )}
          </div>
          {invalid && times.startDate && (
            <p role="alert" className="-mt-2 text-xs text-red-600">
              Das Ende liegt vor dem Beginn.
            </p>
          )}
          <ReminderField value={reminderTimes} onChange={setReminderTimes} />

        </div>
      </Card>

      <Card>
        <fieldset>
          <legend className="mb-1 text-sm font-medium text-slate-700">Wer ist dabei?</legend>
          <div className="flex flex-wrap gap-2">
            {persons.length >= 2 && (
              <button
                type="button"
                onClick={() => setPersonIds(family ? [] : persons.map((p) => p.id))}
                aria-pressed={family}
                className={`flex min-h-10 items-center gap-2 rounded-full border-2 px-3 text-sm ${
                  family ? 'border-brand-700 bg-brand-50 font-semibold' : 'border-slate-200'
                }`}
              >
                <span aria-hidden="true">👪</span> Ganze Familie
              </button>
            )}
            {persons.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => togglePerson(p.id)}
                aria-pressed={personIds.includes(p.id)}
                className={`flex min-h-10 items-center gap-2 rounded-full border-2 pr-3 pl-1 text-sm ${
                  personIds.includes(p.id) ? 'border-brand-700 bg-brand-50' : 'border-slate-200'
                }`}
              >
                <PersonBadge person={p} />
                {p.name}
              </button>
            ))}
          </div>
          {persons.length === 0 && (
            <p className="text-xs text-slate-500">Personen legst du unter Einstellungen → Personen an.</p>
          )}
        </fieldset>
      </Card>

      <Card>
        <RecurrenceEditor
          value={recurrence}
          onChange={setRecurrence}
          date={ruleDate || times.startDate}
          allowAfterCompletion={false}
        />
      </Card>

      <Card>
        <TextareaField label="Notiz" value={note} onChange={(e) => setNote(e.target.value)} />
      </Card>

      <Button type="submit" block disabled={!title.trim() || invalid}>
        {submitLabel}
      </Button>
    </form>
  )
}
