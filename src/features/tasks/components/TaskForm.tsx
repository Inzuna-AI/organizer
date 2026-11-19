import { useState, type FormEvent } from 'react'
import type { ChecklistItem, Priority, Task } from '@/types/data'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { SelectField, TextareaField } from '@/components/ui/Field'
import { TextField } from '@/components/ui/TextField'
import { PersonBadge, usePersons } from '@/features/persons'
import { useRooms } from '@/features/rooms'
import { ChecklistEditor } from './ChecklistEditor'
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
  defaults?: { date?: string; assigneeIds?: string[] }
  submitLabel: string
  onSubmit: (input: TaskInput) => void
}

const PRIORITIES: Priority[] = ['low', 'medium', 'high']

export function TaskForm({ initial, defaults, submitLabel, onSubmit }: Props) {
  const rooms = useRooms()
  const persons = usePersons()

  const [title, setTitle] = useState(initial?.title ?? '')
  const [description, setDescription] = useState(initial?.description ?? '')
  const [roomId, setRoomId] = useState(initial?.roomId ?? '')
  const [priority, setPriority] = useState<Priority>(initial?.priority ?? 'medium')
  const [date, setDate] = useState(initial ? (taskDate(initial) ?? '') : (defaults?.date ?? ''))
  const [time, setTime] = useState(initial ? (taskTime(initial) ?? '') : '')
  const [duration, setDuration] = useState(initial?.durationMin ? String(initial.durationMin) : '')
  const [assigneeIds, setAssigneeIds] = useState<string[]>(initial?.assigneeIds ?? defaults?.assigneeIds ?? [])
  const [checklist, setChecklist] = useState<ChecklistItem[]>(initial?.checklist ?? [])

  // Dauer-Optionen um einen eventuell abweichenden gespeicherten Wert ergänzen
  const durationOptions = DURATION_OPTIONS.includes(Number(duration)) || !duration
    ? DURATION_OPTIONS
    : [...DURATION_OPTIONS, Number(duration)].sort((a, b) => a - b)

  function toggleAssignee(id: string) {
    setAssigneeIds((ids) => (ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id]))
  }

  function submit(e: FormEvent) {
    e.preventDefault()
    if (!title.trim()) return
    const { startAt, allDay } = buildStartAt(date, time)
    onSubmit({
      title: title.trim(),
      description: description.trim(),
      roomId: roomId || null,
      priority,
      startAt,
      allDay,
      durationMin: duration ? Number(duration) : null,
      assigneeIds,
      checklist: checklist.filter((i) => i.title.trim()).map((i) => ({ ...i, title: i.title.trim() })),
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
          <div className="grid grid-cols-2 gap-3">
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
          {date && (
            <Button variant="ghost" className="-mt-2" onClick={() => { setDate(''); setTime('') }}>
              Datum entfernen (in die Inbox)
            </Button>
          )}
          <SelectField label="Dauer" value={duration} onChange={(e) => setDuration(e.target.value)}>
            <option value="">–</option>
            {durationOptions.map((m) => (
              <option key={m} value={m}>
                {formatDuration(m)}
              </option>
            ))}
          </SelectField>
        </div>
      </Card>

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
