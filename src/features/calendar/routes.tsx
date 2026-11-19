import { useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin, { type DateClickArg, type EventReceiveArg } from '@fullcalendar/interaction'
import deLocale from '@fullcalendar/core/locales/de'
import type { DatesSetArg, DayHeaderContentArg, EventClickArg, EventDropArg } from '@fullcalendar/core'
import type { EventResizeDoneArg } from '@fullcalendar/interaction'
import type { Task } from '@/types/data'
import { loadPref, savePref } from '@/lib/storage'
import { usePersonMap } from '@/features/persons'
import { useRoomMap } from '@/features/rooms'
import { isInbox, taskActions, useAllTasks } from '@/features/tasks'
import { EventContent } from './components/EventContent'
import { InboxStrip } from './components/InboxStrip'
import { eventColor, moveChange, tasksToEvents, toLocalString, type CalendarView, type ColorMode } from './utils'
import './calendar.css'

const VIEWS: Array<{ key: CalendarView; label: string }> = [
  { key: 'dayGridMonth', label: 'Monat' },
  { key: 'timeGridWeek', label: 'Woche' },
  { key: 'timeGridDay', label: 'Tag' },
]

const COLOR_MODES: Array<{ key: ColorMode; label: string }> = [
  { key: 'room', label: 'Raum' },
  { key: 'person', label: 'Person' },
]

const LONG_PRESS_MS = 350
const SCROLL_TIME = '07:00:00'

export function CalendarPage() {
  const navigate = useNavigate()
  const calRef = useRef<FullCalendar>(null)
  const tasks = useAllTasks()
  const rooms = useRoomMap()
  const persons = usePersonMap()

  const [view, setViewState] = useState<CalendarView>(() => loadPref('calendarView', 'timeGridWeek'))
  const [mode, setModeState] = useState<ColorMode>(() => loadPref('calendarColor', 'room'))
  const [title, setTitle] = useState('')

  const ctx = useMemo(() => ({ mode, rooms, persons }), [mode, rooms, persons])
  const events = useMemo(() => tasksToEvents(tasks, ctx), [tasks, ctx])
  const inbox = useMemo(() => tasks.filter((t) => !t.deleted && t.status === 'open' && isInbox(t)), [tasks])

  const api = () => calRef.current?.getApi()

  function setView(v: CalendarView) {
    setViewState(v)
    savePref('calendarView', v)
    api()?.changeView(v)
    // Nach dem Wechsel aus der Monatsansicht (Höhe „auto“) sonst bei 0 Uhr
    requestAnimationFrame(() => api()?.scrollToTime(SCROLL_TIME))
  }

  function setMode(m: ColorMode) {
    setModeState(m)
    savePref('calendarColor', m)
  }

  function onDatesSet(arg: DatesSetArg) {
    setTitle(arg.view.title)
  }

  function onDateClick(arg: DateClickArg) {
    const date = toLocalString(arg.date, true)
    const q = new URLSearchParams({ datum: date })
    if (!arg.allDay) q.set('uhrzeit', toLocalString(arg.date, false).slice(11))
    navigate(`/aufgaben/neu?${q}`)
  }

  function onEventClick(arg: EventClickArg) {
    arg.jsEvent.preventDefault()
    navigate(`/aufgaben/${arg.event.id}`)
  }

  function onEventDrop(arg: EventDropArg) {
    if (!arg.event.start) return arg.revert()
    taskActions.save(arg.event.id, moveChange(arg.event.start, arg.event.allDay, arg.event.end))
  }

  function onEventResize(arg: EventResizeDoneArg) {
    if (!arg.event.start) return arg.revert()
    taskActions.save(arg.event.id, moveChange(arg.event.start, arg.event.allDay, arg.event.end, true))
  }

  /** Aus der Inbox in den Kalender gezogen */
  function onEventReceive(arg: EventReceiveArg) {
    const taskId = arg.event.extendedProps.taskId as string | undefined
    const start = arg.event.start
    // Der Platzhalter wird entfernt; der echte Eintrag kommt aus dem Store
    arg.event.remove()
    if (taskId && start) taskActions.save(taskId, moveChange(start, arg.event.allDay, null))
  }

  const colorOf = (t: Task) => eventColor(t, ctx)

  return (
    <div className="organizer-calendar space-y-3 p-4">
      <div className="flex items-center gap-2">
        <div className="flex">
          <NavButton label="Zurück" onClick={() => api()?.prev()}>
            ‹
          </NavButton>
          <NavButton label="Weiter" onClick={() => api()?.next()}>
            ›
          </NavButton>
        </div>
        <h2 className="min-w-0 flex-1 truncate text-base font-semibold">{title}</h2>
        <button
          type="button"
          onClick={() => api()?.today()}
          className="min-h-10 rounded-xl border border-slate-300 bg-white px-3 text-sm font-medium active:bg-slate-100"
        >
          Heute
        </button>
      </div>

      <div className="flex gap-2">
        <Segmented options={VIEWS} value={view} onChange={setView} label="Ansicht" className="flex-1" />
        <Segmented options={COLOR_MODES} value={mode} onChange={setMode} label="Farbe nach" />
      </div>

      <InboxStrip tasks={inbox} colorOf={colorOf} />

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <FullCalendar
          ref={calRef}
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
          initialView={view}
          locale={deLocale}
          timeZone="local"
          firstDay={1}
          headerToolbar={false}
          height={view === 'dayGridMonth' ? 'auto' : 'calc(100dvh - 19rem)'}
          events={events}
          eventContent={EventContent}
          eventDisplay="block"
          editable
          droppable
          longPressDelay={LONG_PRESS_MS}
          eventLongPressDelay={LONG_PRESS_MS}
          selectLongPressDelay={LONG_PRESS_MS}
          dayMaxEvents={3}
          nowIndicator
          scrollTime={SCROLL_TIME}
          slotDuration="00:30:00"
          snapDuration="00:15:00"
          defaultTimedEventDuration="00:30:00"
          allDayText="ganzt."
          dayHeaderContent={DayHeader}
          slotLabelFormat={{ hour: '2-digit', minute: '2-digit', hour12: false }}
          eventTimeFormat={{ hour: '2-digit', minute: '2-digit', hour12: false }}
          datesSet={onDatesSet}
          dateClick={onDateClick}
          eventClick={onEventClick}
          eventDrop={onEventDrop}
          eventResize={onEventResize}
          eventReceive={onEventReceive}
        />
      </div>
      <p className="text-center text-xs text-slate-400">
        Tippen auf einen freien Platz legt eine Aufgabe an. Zum Verschieben einen Eintrag lange drücken und ziehen.
      </p>
    </div>
  )
}

const WEEKDAYS = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa']

/** Spaltenkopf: Monat nur Wochentag, Woche/Tag zweizeilig „Mo / 16“. */
function DayHeader(arg: DayHeaderContentArg) {
  const wd = WEEKDAYS[arg.date.getDay()]
  if (arg.view.type === 'dayGridMonth') return <span className="text-xs">{wd}</span>
  return (
    <span className="flex flex-col items-center leading-tight">
      <span className="text-[11px] font-normal text-slate-500">{wd}</span>
      <span className={arg.isToday ? 'font-bold text-brand-700' : ''}>{arg.date.getDate()}</span>
    </span>
  )
}

function NavButton({ label, onClick, children }: { label: string; onClick: () => void; children: string }) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className="flex h-10 w-10 items-center justify-center rounded-full text-2xl text-slate-700 active:bg-slate-200"
    >
      {children}
    </button>
  )
}

function Segmented<T extends string>({
  options,
  value,
  onChange,
  label,
  className = '',
}: {
  options: Array<{ key: T; label: string }>
  value: T
  onChange: (v: T) => void
  label: string
  className?: string
}) {
  return (
    <div className={`flex rounded-xl bg-slate-200 p-1 text-sm ${className}`} role="group" aria-label={label}>
      {options.map((o) => (
        <button
          key={o.key}
          type="button"
          aria-pressed={value === o.key}
          onClick={() => onChange(o.key)}
          className={`min-h-9 flex-1 rounded-lg px-2 font-medium ${value === o.key ? 'bg-white shadow-sm' : 'text-slate-600'}`}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}
