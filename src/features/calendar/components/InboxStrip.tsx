import { useEffect, useRef, useState } from 'react'
import { Draggable } from '@fullcalendar/interaction'
import type { Task } from '@/types/data'
import { loadPref, savePref } from '@/lib/storage'
import { DEFAULT_TIMED_MIN } from '../utils'

interface Props {
  tasks: Task[]
  colorOf: (t: Task) => string
  /** PC-Ansicht: als Spalte neben dem Kalender, immer offen */
  vertical?: boolean
}

/**
 * Aufgaben ohne Datum zum Hineinziehen in den Kalender.
 * Auf dem Handy: lange drücken, dann ziehen.
 */
export function InboxStrip({ tasks, colorOf, vertical = false }: Props) {
  const ref = useRef<HTMLDivElement>(null)
  // Standardmäßig eingeklappt, damit der Kalender Platz hat; das Gerät merkt sich die Wahl
  const [openPref, setOpenState] = useState<boolean>(() => loadPref('calendarInboxOpen', false))
  const open = vertical || openPref
  const setOpen = (v: boolean) => {
    setOpenState(v)
    savePref('calendarInboxOpen', v)
  }

  useEffect(() => {
    if (!ref.current) return
    const d = new Draggable(ref.current, {
      itemSelector: '[data-task-id]',
      longPressDelay: 350,
      eventData: (el) => ({
        id: `inbox-${el.dataset.taskId}`,
        title: el.dataset.title ?? '',
        duration: { minutes: Number(el.dataset.duration) || DEFAULT_TIMED_MIN },
        extendedProps: {
          taskId: el.dataset.taskId,
          badges: [],
          done: false,
          icon: el.dataset.icon ?? '',
        },
        create: true,
      }),
    })
    return () => d.destroy()
  }, [open, tasks.length])

  if (vertical) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white">
        <p className="px-3 pt-3 text-sm font-medium">📥 Inbox ({tasks.length})</p>
        {tasks.length === 0 ? (
          <p className="px-3 pt-1 pb-3 text-xs text-slate-500">Keine Aufgaben ohne Datum.</p>
        ) : (
          <>
            <p className="px-3 pb-2 text-xs text-slate-500">Mit der Maus in den Kalender ziehen</p>
            <div ref={ref} className="flex max-h-[calc(100dvh-16rem)] flex-col gap-2 overflow-y-auto px-3 pb-3">
              {tasks.map((t) => (
                <div
                  key={t.id}
                  data-task-id={t.id}
                  data-title={t.title}
                  data-duration={t.durationMin ?? ''}
                  className="flex min-h-10 cursor-grab items-center rounded-xl border-l-4 bg-slate-50 px-3 py-1.5 text-sm select-none hover:bg-slate-100"
                  style={{ borderLeftColor: colorOf(t) }}
                >
                  {t.title}
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    )
  }

  if (tasks.length === 0) return null

  return (
    <div className="rounded-2xl border border-slate-200 bg-white">
      <button
        type="button"
        onClick={() => setOpen(!openPref)}
        aria-expanded={open}
        className="flex min-h-11 w-full items-center justify-between px-3 text-sm"
      >
        <span className="flex items-center gap-1.5 font-medium">
          <span aria-hidden className={`inline-block text-xs text-slate-500 transition-transform ${open ? 'rotate-90' : ''}`}>
            ▶
          </span>
          📥 Inbox ({tasks.length})
        </span>
        <span className="text-xs text-slate-500">{open ? 'lange drücken und in den Kalender ziehen' : 'aufklappen'}</span>
      </button>
      {open && (
        <div ref={ref} className="flex gap-2 overflow-x-auto px-3 pb-3">
          {tasks.map((t) => (
            <div
              key={t.id}
              data-task-id={t.id}
              data-title={t.title}
              data-duration={t.durationMin ?? ''}
              className="flex min-h-10 shrink-0 cursor-grab items-center gap-1.5 rounded-xl border-l-4 bg-slate-50 px-3 text-sm select-none"
              style={{
                borderLeftColor: colorOf(t),
                WebkitTouchCallout: 'none',
              }}
            >
              {t.title}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
