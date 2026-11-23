import { useState, type FormEvent } from 'react'
import type { ChecklistItem, Priority, Task } from '@/types/data'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { SelectField, TextareaField } from '@/components/ui/Field'
import { TextField } from '@/components/ui/TextField'
import { PersonBadge, usePersons } from '@/features/persons'
import { useRooms } from '@/features/rooms'
import { berlinDateString } from '@/lib/dates'
import { buildRule, parseRule } from '@/lib/recurrence'
import { ChecklistEditor } from '@/components/ui/ChecklistEditor'
import { RecurrenceEditor, type RecurrenceValue } from '@/components/ui/RecurrenceEditor'
import { ReminderField } from '@/components/ui/ReminderField'
import { normalizeFixedReminders } from '@/lib/reminders'
import {
  DEFAULT_PERIOD_REMINDERS,
  isPeriodTask,
  normalizePeriodReminders,
  periodInterval,
  periodRule,
  periodStartOf,
} from '@/lib/periods'
import { PeriodField, type PeriodValue } from './PeriodField'
import { PeriodReminderField } from './PeriodReminderField'
import {
  buildStartAt,
  DURATION_OPTIONS,
  formatDuration,
  PRIORITY_LABEL,
  taskDate,
  taskTime,
  type TaskInput,
} from '../utils'

interface Props {
  initial?: Task
  /** Vorbelegung für neue Aufgaben */
  defaults?: { date?: string; time?: string; assigneeIds?: string[]; period?: boolean }
  /**
   * Beim Bearbeiten eines einzelnen Termins: Datum/Uhrzeit im Formular sind die des Termins,
   * die Regel wird aber vom Serienstart aus gebaut.
   */
  seriesDate?: string
  submitLabel: string
  onSubmit: (input: TaskInput) => void
}

const PRIORITIES: Priority[] = ['low', 'medium', 'high']

export function TaskForm({ initial, defaults, seriesDate, submitLabel, onSubmit }: Props) {
  const rooms = useRooms()
  const persons = usePersons()

  const [title, setTitle] = useState(initial?.title ?? '')
  const [description, setDescription] = useState(initial?.description ?? '')
  const [roomId, setRoomId] = useState(initial?.roomId ?? '')
  const [priority, setPriority] = useState<Priority>(initial?.priority ?? 'medium')
  const [date, setDate] = useState(initial ? (taskDate(initial) ?? '') : (defaults?.date ?? ''))
  const [time, setTime] = useState(initial ? (taskTime(initial) ?? '') : (defaults?.time ?? ''))
  const [duration, setDuration] = useState(initial?.durationMin ? String(initial.durationMin) : '')
  const [assigneeIds, setAssigneeIds] = useState<string[]>(initial?.assigneeIds ?? defaults?.assigneeIds ?? [])
  const [checklist, setChecklist] = useState<ChecklistItem[]>(initial?.checklist ?? [])
  const [recurrence, setRecurrence] = useState<RecurrenceValue>(() => ({
    spec:
      initial?.recurrenceRule && initial.startAt
        ? parseRule(initial.recurrenceRule, seriesDate ?? initial.startAt.slice(0, 10))
        : null,
    mode: initial?.recurrenceMode ?? 'fixed',
    rotation: initial?.rotation ?? false,
  }))
  const [reminderTimes, setReminderTimes] = useState<string[]>(initial?.reminderTimes ?? [])
  // Zeitraum-Aufgaben: „zum Start“ / „kurz vor Ablauf“, bei neuen standardmäßig beide
  const [periodReminders, setPeriodReminders] = useState<string[]>(() =>
    initial && isPeriodTask(initial)
      ? (normalizePeriodReminders(initial.reminderTimes) ?? [])
      : DEFAULT_PERIOD_REMINDERS,
  )
  const ruleDate = seriesDate ?? date
  const today = berlinDateString()
  // Fester Tag oder Zeitraum („irgendwann diese Woche“)
  const [kind, setKind] = useState<'day' | 'period'>(() =>
    (initial ? isPeriodTask(initial) : !!defaults?.period) ? 'period' : 'day',
  )
  const [period, setPeriod] = useState<PeriodValue>(() =>
    initial && isPeriodTask(initial)
      ? {
          unit: initial.period!,
          from: initial.startAt!.slice(0, 10),
          repeat: initial.recurrenceRule ? periodInterval(initial) : null,
          rotation: initial.rotation,
        }
      : { unit: 'week', from: periodStartOf(today, 'week'), repeat: null, rotation: false },
  )

  function changeRecurrence(v: RecurrenceValue) {
    // Eine Serie braucht einen Starttermin
    if (v.spec && !date) setDate(berlinDateString())
    setRecurrence(v)
  }

  // Dauer-Optionen um einen eventuell abweichenden gespeicherten Wert ergänzen
  const durationOptions =
    DURATION_OPTIONS.includes(Number(duration)) || !duration
      ? DURATION_OPTIONS
      : [...DURATION_OPTIONS, Number(duration)].sort((a, b) => a - b)

  function toggleAssignee(id: string) {
    setAssigneeIds((ids) => (ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id]))
  }

  function submit(e: FormEvent) {
    e.preventDefault()
    if (!title.trim()) return
    const common = {
      title: title.trim(),
      description: description.trim(),
      roomId: roomId || null,
      priority,
      durationMin: duration ? Number(duration) : null,
      assigneeIds,
      checklist: checklist.filter((i) => i.title.trim()).map((i) => ({ ...i, title: i.title.trim() })),
    }
    if (kind === 'period') {
      onSubmit({
        ...common,
        startAt: period.from,
        allDay: true,
        period: period.unit,
        recurrenceRule: period.repeat ? periodRule(period.unit, period.repeat) : null,
        recurrenceMode: 'fixed',
        rotation: !!period.repeat && period.rotation && assigneeIds.length >= 2,
        reminderTimes: normalizePeriodReminders(periodReminders),
      })
      return
    }
    const { startAt, allDay } = buildStartAt(date, time)
    onSubmit({
      period: null,
      title: title.trim(),
      description: description.trim(),
      roomId: roomId || null,
      priority,
      startAt,
      allDay,
      durationMin: duration ? Number(duration) : null,
      assigneeIds,
      checklist: checklist.filter((i) => i.title.trim()).map((i) => ({ ...i, title: i.title.trim() })),
      recurrenceRule: recurrence.spec && startAt ? buildRule(recurrence.spec, ruleDate || date, recurrence.mode) : null,
      recurrenceMode: recurrence.mode,
      rotation: recurrence.rotation && assigneeIds.length >= 2,
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
            placeholder="z. B. Bad putzen"
            enterKeyHint="done"
          />
          <TextareaField label="Beschreibung" value={description} onChange={(e) => setDescription(e.target.value)} />
        </div>
      </Card>

      <Card>
        <div className="space-y-4">
          <div className="grid grid-cols-2 rounded-xl bg-slate-200 p-1" role="group" aria-label="Wann">
            {(
              [
                { k: 'day', label: 'Fester Tag' },
                { k: 'period', label: 'Zeitraum' },
              ] as const
            ).map((o) => (
              <button
                key={o.k}
                type="button"
                aria-pressed={kind === o.k}
                onClick={() => setKind(o.k)}
                className={`min-h-10 rounded-lg text-sm font-medium ${kind === o.k ? 'bg-white shadow-sm' : 'text-slate-600'}`}
              >
                {o.label}
              </button>
            ))}
          </div>
          {kind === 'period' ? (
            <PeriodField value={period} onChange={setPeriod} today={today} canRotate={assigneeIds.length >= 2} />
          ) : (
            <>
              <div className="grid grid-cols-[minmax(0,3fr)_minmax(0,2fr)] gap-3">
                <TextField label="Datum" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
                <TextField
                  label="Uhrzeit"
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  disabled={!date}
                />
              </div>
              <p className="-mt-2 text-xs text-slate-500">
                {date ? (time ? '' : 'Ohne Uhrzeit = ganztägig.') : 'Ohne Datum landet die Aufgabe in der Inbox.'}
              </p>
              {date && !recurrence.spec && (
                <Button
                  variant="ghost"
                  className="-mt-2"
                  onClick={() => {
                    setDate('')
                    setTime('')
                    setRecurrence((r) => ({ ...r, spec: null }))
                  }}
                >
                  Datum entfernen (in die Inbox)
                </Button>
              )}
            </>
          )}
          <SelectField label="Dauer" value={duration} onChange={(e) => setDuration(e.target.value)}>
            <option value="">–</option>
            {durationOptions.map((m) => (
              <option key={m} value={m}>
                {formatDuration(m)}
              </option>
            ))}
          </SelectField>
          {kind === 'day' ? (
            <ReminderField value={reminderTimes} onChange={setReminderTimes} disabled={!date} />
          ) : (
            <PeriodReminderField value={periodReminders} onChange={setPeriodReminders} />
          )}
        </div>
      </Card>

      {kind === 'day' && (
        <Card>
          <RecurrenceEditor
            value={recurrence}
            onChange={changeRecurrence}
            date={ruleDate || today}
            canRotate={assigneeIds.length >= 2}
          />
        </Card>
      )}

      <Card>
        <div className="space-y-4">
          <fieldset>
            <legend className="mb-1 text-sm font-medium text-slate-700">Raum</legend>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setRoomId('')}
                aria-pressed={!roomId}
                className={`min-h-10 rounded-full border px-3 text-sm ${!roomId ? 'border-brand-700 bg-brand-50' : 'border-slate-300'}`}
              >
                Kein Raum
              </button>
              {rooms.map((r) => (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => setRoomId(r.id)}
                  aria-pressed={roomId === r.id}
                  className="min-h-10 rounded-full border-2 px-3 text-sm"
                  style={{
                    borderColor: r.color,
                    backgroundColor: roomId === r.id ? `${r.color}33` : undefined,
                    fontWeight: roomId === r.id ? 600 : undefined,
                  }}
                >
                  {r.icon} {r.name}
                </button>
              ))}
            </div>
          </fieldset>

          <fieldset>
            <legend className="mb-1 text-sm font-medium text-slate-700">Zuständig</legend>
            <div className="flex flex-wrap gap-2">
              {persons.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => toggleAssignee(p.id)}
                  aria-pressed={assigneeIds.includes(p.id)}
                  className={`flex min-h-10 items-center gap-2 rounded-full border-2 pr-3 pl-1 text-sm ${
                    assigneeIds.includes(p.id) ? 'border-brand-700 bg-brand-50' : 'border-slate-200'
                  }`}
                >
                  <PersonBadge person={p} />
                  {p.name}
                </button>
              ))}
            </div>
          </fieldset>

          <fieldset>
            <legend className="mb-1 text-sm font-medium text-slate-700">Priorität</legend>
            <div className="grid grid-cols-3 gap-2">
              {PRIORITIES.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPriority(p)}
                  aria-pressed={priority === p}
                  className={`min-h-10 rounded-xl border text-sm ${
                    priority === p
                      ? p === 'high'
                        ? 'border-red-600 bg-red-50 font-semibold text-red-700'
                        : 'border-brand-700 bg-brand-50 font-semibold'
                      : 'border-slate-300'
                  }`}
                >
                  {PRIORITY_LABEL[p]}
                </button>
              ))}
            </div>
          </fieldset>
        </div>
      </Card>

      <Card>
        <ChecklistEditor items={checklist} onChange={setChecklist} />
      </Card>

      <Button type="submit" block disabled={!title.trim()}>
        {submitLabel}
      </Button>
    </form>
  )
}
