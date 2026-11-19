import { useEffect, useRef, useState } from 'react'
import { Draggable } from '@fullcalendar/interaction'
import type { Task } from '@/types/data'
import { DEFAULT_TIMED_MIN } from '../utils'

interface Props {
  tasks: Task[]
  colorOf: (t: Task) => string
}

/**
 * Aufgaben ohne Datum zum Hineinziehen in den Kalender.
 * Auf dem Handy: lange drücken, dann ziehen.
 */
export function InboxStrip({ tasks, colorOf }: Props) {
  const ref = useRef<HTMLDivElement>(null)
  const [open, setOpen] = useState(true)

  useEffect(() => {
    if (!ref.current) return
    const d = new Draggable(ref.current, {
      itemSelector: '[data-task-id]',
      longPressDelay: 350,
      eventData: (el) => ({
        id: `inbox-${el.dataset.taskId}`,
        title: el.dataset.title ?? '',
        duration: { minutes: Number(el.dataset.duration) || DEFAULT_TIMED_MIN },
        extendedProps: { taskId: el.dataset.taskId, badges: [], done: false, icon: el.dataset.icon ?? '' },
        create: true,
      }),
    })
    return () => d.destroy()
  }, [open])

  if (tasks.length === 0) return null

  return (
    <div className="rounded-2xl border border-slate-200 bg-white">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        className="flex min-h-11 w-full items-center justify-between px-3 text-sm"
      >
        <span className="font-medium">📥 Inbox ({tasks.length})</span>
        <span className="text-xs text-slate-500">{open ? 'lange drücken und in den Kalender ziehen' : 'anzeigen'}</span>
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
              style={{ borderLeftColor: colorOf(t), WebkitTouchCallout: 'none' }}
            >
              {t.title}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
