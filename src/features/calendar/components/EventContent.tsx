import type { EventContentArg } from '@fullcalendar/core'
import type { CalEventEntry, CalendarEntry, TaskEvent } from '../utils'

/**
 * Inhalt eines Kalendereintrags.
 * Aufgaben: hell mit farbigem Rand, ☐/☑ vor dem Titel, Raum-Icon, Kürzel-Badges.
 * Termine: vollflächig in Personenfarbe (mehrere Personen gestreift, alle = 👪 Familie).
 * Tag: eine Zeile mit Uhrzeit. Woche (schmale Spalten): Titel umbrechen, Kürzel darunter. Monat: nur Titel.
 */
export function EventContent(arg: EventContentArg) {
  const props = arg.event.extendedProps as CalendarEntry['extendedProps']
  if (props.kind === 'event') return <CalEventContent arg={arg} props={props} />
  return <TaskContent arg={arg} props={props} />
}

type Badge = { kuerzel: string; color: string }

function badgeEls(badges: Badge[]) {
  return badges.map((b) => (
    <span
      key={b.kuerzel}
      className="flex h-4 min-w-4 items-center justify-center rounded-full px-0.5 text-[9px] font-bold text-white ring-1 ring-white/80"
      style={{ backgroundColor: b.color }}
    >
      {b.kuerzel}
    </span>
  ))
}

function TaskContent({ arg, props }: { arg: EventContentArg; props: TaskEvent['extendedProps'] }) {
  const { badges, done, icon, recurring } = props
  const type = arg.view.type
  const box = <span aria-label={done ? 'Aufgabe, erledigt' : 'Aufgabe'}>{done ? '☑' : '☐'} </span>
  const titleCls = done ? 'line-through' : ''

  if (type === 'dayGridMonth') {
    return (
      <div className="truncate px-1 text-[11px] leading-4 font-medium">
        {box}
        <span className={titleCls}>{arg.event.title}</span>
      </div>
    )
  }

  const els = badgeEls(badges)

  if (type === 'timeGridDay') {
    return (
      <div className="flex h-full min-w-0 items-start gap-2 overflow-hidden px-1.5 py-0.5 text-xs leading-tight">
        <div className="min-w-0 flex-1">
          <div className="truncate font-medium">
            {box}
            {icon && <span aria-hidden="true">{icon} </span>}
            <span className={titleCls}>{arg.event.title}</span>
            {recurring && <span aria-label="wiederkehrend"> ↻</span>}
          </div>
          {!arg.event.allDay && arg.timeText && <div className="text-[10px] opacity-70">{arg.timeText}</div>}
        </div>
        {els.length > 0 && <span className="flex shrink-0 gap-0.5">{els}</span>}
      </div>
    )
  }

  return (
    <div className="h-full overflow-hidden px-0.5 py-0.5 text-[11px] leading-tight" lang="de">
      <div className="font-medium hyphens-auto [overflow-wrap:anywhere]">
        {box}
        <span className={titleCls}>{arg.event.title}</span>
      </div>
      {els.length > 0 && <div className="mt-0.5 flex flex-wrap gap-0.5">{els}</div>}
    </div>
  )
}

function CalEventContent({ arg, props }: { arg: EventContentArg; props: CalEventEntry['extendedProps'] }) {
  const { background, striped, family, location, badges, recurring } = props
  const type = arg.view.type
  // Streifen liegen hinter dem Text; Schatten hält ihn auf jeder Farbe lesbar
  const bg = striped ? (
    <span className="pointer-events-none absolute inset-0 rounded-[5px]" style={{ background }} aria-hidden="true" />
  ) : null
  const textStyle = striped ? { textShadow: '0 1px 2px rgb(0 0 0 / 0.6)' } : undefined
  const fam = family ? <span aria-label="Familie">👪 </span> : null

  if (type === 'dayGridMonth') {
    return (
      <div className="relative truncate px-1 text-[11px] leading-4 font-semibold">
        {bg}
        <span className="relative" style={textStyle}>
          {fam}
          {arg.event.title}
        </span>
      </div>
    )
  }

  const els = family ? [] : badgeEls(badges)

  if (type === 'timeGridDay') {
    return (
      <div className="relative flex h-full min-w-0 items-start gap-2 overflow-hidden px-1.5 py-0.5 text-xs leading-tight">
        {bg}
        <div className="relative min-w-0 flex-1" style={textStyle}>
          <div className="truncate font-semibold">
            {fam}
            {arg.event.title}
            {recurring && <span aria-label="wiederkehrend"> ↻</span>}
          </div>
          {!arg.event.allDay && arg.timeText && <div className="text-[10px] opacity-90">{arg.timeText}</div>}
          {location && <div className="truncate text-[10px] opacity-90">📍 {location}</div>}
        </div>
        {els.length > 0 && <span className="relative flex shrink-0 gap-0.5">{els}</span>}
      </div>
    )
  }

  return (
    <div className="relative h-full overflow-hidden px-0.5 py-0.5 text-[11px] leading-tight" lang="de">
      {bg}
      <div className="relative font-semibold hyphens-auto [overflow-wrap:anywhere]" style={textStyle}>
        {fam}
        {arg.event.title}
      </div>
      {els.length > 0 && <div className="relative mt-0.5 flex flex-wrap gap-0.5">{els}</div>}
    </div>
  )
}
