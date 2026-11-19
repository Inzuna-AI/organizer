import { Link } from 'react-router'
import type { EventInstance } from '@/lib/events'
import { dayRange, isFamily } from '@/lib/events'
import { formatDay } from '@/lib/dates'
import { PersonBadge, usePersons } from '@/features/persons'
import { eventBackground, personColors, timeLabel } from '../utils'

interface Props {
  instance: EventInstance
  /** Tag der Liste (für mehrtägige Termine: „bis 12:00“) */
  day?: string
  /** Datum mit anzeigen (z. B. in der Suche) */
  showDate?: boolean
}

/** Termin in Listen: farbiger Block (Farbe der Personen), Zeit, Titel, Ort. */
export function EventItem({ instance, day, showDate }: Props) {
  const persons = usePersons()
  const e = instance.event
  const family = isFamily(e.personIds, persons)
  const colors = family ? [] : personColors(e.personIds, persons)
  const href = instance.date ? `/termine/${e.id}?datum=${instance.date}` : `/termine/${e.id}`
  const involved = persons.filter((p) => e.personIds.includes(p.id))

  return (
    <li>
      <Link
        to={href}
        className="flex items-stretch gap-3 overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200 active:bg-slate-50"
      >
        <span
          className="w-2 shrink-0"
          style={{ background: eventBackground(colors, family ? 'var(--color-brand-600)' : '#94a3b8') }}
          aria-hidden="true"
        />
        <span className="min-w-0 flex-1 py-3">
          <span className="block text-xs font-medium text-slate-500">
            📅 {showDate && !(instance.allDay && dayRange(instance)[0] !== dayRange(instance)[1]) ? `${formatDay(instance.startAt.slice(0, 10))}, ` : ''}
            {timeLabel(instance, day)}
            {instance.date && <span aria-label="Serie"> · ↻</span>}
            {instance.moved && ' · verschoben'}
          </span>
          <span className="block truncate font-semibold">{e.title}</span>
          {e.location && <span className="block truncate text-sm text-slate-500">📍 {e.location}</span>}
        </span>
        <span className="flex shrink-0 items-center gap-1 pr-3">
          {family ? (
            <span className="rounded-full bg-brand-50 px-2 py-0.5 text-xs font-semibold text-brand-700">👪 Familie</span>
          ) : (
            involved.map((p) => <PersonBadge key={p.id} person={p} />)
          )}
        </span>
      </Link>
    </li>
  )
}
