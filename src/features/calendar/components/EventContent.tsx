import type { EventContentArg } from '@fullcalendar/core'
import type { TaskEvent } from '../utils'

/**
 * Inhalt eines Kalendereintrags: Raum-Icon, Titel, Kürzel-Badges der Personen.
 * Tag: alles in einer Zeile mit Uhrzeit. Woche (schmale Spalten): Titel umbrechen, Kürzel darunter.
 * Monat: nur Titel (Person erkennt man über „Farbe nach Person“).
 */
export function EventContent(arg: EventContentArg) {
  const { badges, done, icon } = arg.event.extendedProps as TaskEvent['extendedProps']
  const type = arg.view.type
  const title = (
    <>
      {icon && <span aria-hidden="true">{icon} </span>}
      {arg.event.title}
    </>
  )

  if (type === 'dayGridMonth') {
    return (
      <div className={`truncate px-1 text-[11px] leading-4 font-medium ${done ? 'line-through' : ''}`}>
        {arg.event.title}
      </div>
    )
  }

  const badgeEls = badges.map((b) => (
    <span
      key={b.kuerzel}
      className="flex h-4 min-w-4 items-center justify-center rounded-full px-0.5 text-[9px] font-bold text-white ring-1 ring-white/80"
      style={{ backgroundColor: b.color }}
    >
      {b.kuerzel}
    </span>
  ))

  if (type === 'timeGridDay') {
    return (
      <div className="flex h-full min-w-0 items-start gap-2 overflow-hidden px-1.5 py-0.5 text-xs leading-tight">
        <div className="min-w-0 flex-1">
          <div className={`truncate font-medium ${done ? 'line-through' : ''}`}>{title}</div>
          {!arg.event.allDay && arg.timeText && <div className="text-[10px] opacity-80">{arg.timeText}</div>}
        </div>
        {badgeEls.length > 0 && <span className="flex shrink-0 gap-0.5">{badgeEls}</span>}
      </div>
    )
  }

  return (
    <div className="h-full overflow-hidden px-0.5 py-0.5 text-[11px] leading-tight" lang="de">
      <div className={`font-medium hyphens-auto [overflow-wrap:anywhere] ${done ? 'line-through' : ''}`}>
        {arg.event.title}
      </div>
      {badgeEls.length > 0 && <div className="mt-0.5 flex flex-wrap gap-0.5">{badgeEls}</div>}
    </div>
  )
}
