import { useState } from 'react'
import { useParams, useSearchParams } from 'react-router'
import { berlinDateString, formatDateTime, formatDay } from '@/lib/dates'
import { describeRule } from '@/lib/recurrence'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { ChoiceDialog } from '@/components/ui/ChoiceDialog'
import { useGoBack } from '@/components/layout/useGoBack'
import { useAppStore } from '@/store'
import { usePersonMap } from '@/features/persons'
import { eventActions, useEvent, useEventInstance } from './store'
import { EventForm } from './components/EventForm'
import { fromFormValues, toFormValues, type EventInput } from './utils'

// ---------- Neu ----------

export function NewEventPage() {
  const [params] = useSearchParams()
  const goBack = useGoBack('/kalender')
  const meId = useAppStore((s) => s.device?.personId ?? null)

  return (
    <div className="p-4">
      <EventForm
        defaults={{
          date: params.get('datum') ?? berlinDateString(),
          time: params.get('uhrzeit') ?? '',
          personIds: meId ? [meId] : [],
        }}
        submitLabel="Termin anlegen"
        onSubmit={(input) => {
          eventActions.create(input)
          goBack()
        }}
      />
    </div>
  )
}

// ---------- Bearbeiten ----------

type Scope = 'one' | 'series'

export function EditEventPage() {
  const { id } = useParams()
  const [params] = useSearchParams()
  const event = useEvent(id)
  const inst = useEventInstance(event, params.get('datum'))
  const goBack = useGoBack('/kalender')
  const persons = usePersonMap()
  const [pending, setPending] = useState<EventInput | null>(null)

  if (!event) {
    return (
      <div className="p-8 text-center text-sm text-slate-500">
        <p className="mb-4">Diesen Termin gibt es nicht (mehr).</p>
        <Button variant="secondary" onClick={goBack}>
          Zurück
        </Button>
      </div>
    )
  }

  const series = !!event.recurrenceRule
  const instDate = inst?.date ?? null
  const editor = event.updatedBy ? persons.get(event.updatedBy)?.name : null

  /** Felder ohne Zeiten (gelten immer für die ganze Serie) */
  function rest(input: EventInput) {
    const { startAt: _s, endAt: _e, allDay: _a, ...r } = input // eslint-disable-line @typescript-eslint/no-unused-vars
    return r
  }

  function submit(input: EventInput) {
    if (!event) return
    if (inst && instDate && input.recurrenceRule) {
      // Zeiten des Vorkommens so normalisieren, wie das Formular sie liefert
      const before = fromFormValues(toFormValues(inst))
      const timesChanged =
        !before || input.startAt !== before.startAt || input.endAt !== before.endAt || input.allDay !== before.allDay
      if (timesChanged) {
        setPending(input)
        return
      }
      eventActions.save(event.id, rest(input))
    } else {
      eventActions.save(event.id, input)
    }
    goBack()
  }

  function onScope(scope: Scope | null) {
    const input = pending
    setPending(null)
    if (!scope || !input || !event || !instDate) return
    if (scope === 'one') {
      eventActions.save(event.id, rest(input))
      eventActions.moveInstance(event.id, instDate, input.startAt)
    } else {
      eventActions.moveSeries(event.id, instDate, input.startAt, input.endAt, rest(input))
    }
    goBack()
  }

  function onDelete(scope: Scope) {
    if (!event) return
    if (scope === 'one' && instDate) {
      if (window.confirm('Nur diesen Termin löschen? Die Serie bleibt bestehen.')) {
        eventActions.skipInstance(event.id, instDate)
        goBack()
      }
      return
    }
    const what = series ? `Die ganze Serie „${event.title}“` : `Termin „${event.title}“`
    if (window.confirm(`${what} löschen?`)) {
      eventActions.remove(event.id)
      goBack()
    }
  }

  const instTime = inst && !inst.allDay ? inst.startAt.slice(11, 16) : null

  return (
    <div className="space-y-4 p-4">
      {series && inst && (
        <Card>
          <p className="text-xs text-slate-500">↻ {describeRule(event.recurrenceRule!, event.startAt.slice(0, 10), 'fixed')}</p>
          <p className="font-semibold">
            Termin: {formatDay(inst.startAt.slice(0, 10))}
            {instTime ? `, ${instTime} Uhr` : ''}
            {inst.moved && <span className="font-normal text-slate-500"> (verschoben)</span>}
          </p>
          <p className="mt-2 text-xs text-slate-500">
            Titel, Ort, Personen und Notiz gelten für die ganze Serie. Bei geänderter Zeit wirst du gefragt, ob nur
            dieser Termin oder die ganze Serie gemeint ist.
          </p>
        </Card>
      )}

      {/* key: Formular neu aufbauen, wenn der Termin von außen geändert wurde */}
      <EventForm
        key={`${event.updatedAt}|${inst?.startAt ?? ''}`}
        initial={event}
        instanceStart={inst?.startAt}
        seriesDate={inst ? event.startAt.slice(0, 10) : undefined}
        submitLabel="Speichern"
        onSubmit={submit}
      />

      {inst ? (
        <div className="grid grid-cols-2 gap-2">
          <Button variant="danger" onClick={() => onDelete('one')}>
            Nur diesen löschen
          </Button>
          <Button variant="danger" onClick={() => onDelete('series')}>
            Ganze Serie löschen
          </Button>
        </div>
      ) : (
        <Button variant="danger" block onClick={() => onDelete('series')}>
          {series ? 'Ganze Serie löschen' : 'Termin löschen'}
        </Button>
      )}
      <p className="text-center text-xs text-slate-400">
        Zuletzt geändert {formatDateTime(event.updatedAt)}
        {editor ? ` von ${editor}` : ''}
      </p>

      <ChoiceDialog<Scope>
        open={!!pending}
        title="Termin ändern"
        message="Soll die neue Zeit nur für diesen Termin gelten oder für die ganze Serie? (Nur dieser Termin behält die Dauer der Serie.)"
        choices={[
          { value: 'one', label: 'Nur diesen Termin' },
          { value: 'series', label: 'Ganze Serie' },
        ]}
        onChoose={onScope}
      />
    </div>
  )
}
