import { Link } from 'react-router'
import { berlinDateString, formatDay } from '@/lib/dates'
import { PersonBadge, usePersonMap } from '@/features/persons'
import { RoomBadge, useRoomMap } from '@/features/rooms'
import { taskActions } from '../store'
import { periodLabel, untilLabel } from '@/lib/periods'
import {
  checklistProgress,
  formatDuration,
  isOverdue,
  taskDate,
  taskLink,
  taskPeriod,
  taskTime,
  type TaskInstance,
} from '../utils'

interface Props {
  task: TaskInstance
  /** Datum anzeigen (z. B. in der Heute-Ansicht bei überfälligen) */
  showDate?: boolean
}

export function TaskItem({ task, showDate = false }: Props) {
  const rooms = useRoomMap()
  const persons = usePersonMap()
  const room = task.roomId ? rooms.get(task.roomId) : undefined
  const done = task.status === 'done'
  const today = berlinDateString()
  const overdue = isOverdue(task, today)
  const date = taskDate(task)
  const time = taskTime(task)
  const progress = checklistProgress(task.checklist)
  const period = taskPeriod(task)

  return (
    <li
      className={`flex items-stretch overflow-hidden rounded-2xl border bg-white ${
        overdue ? 'border-red-200' : 'border-slate-200'
      }`}
      style={room ? { borderLeft: `5px solid ${room.color}` } : undefined}
    >
      <button
        type="button"
        onClick={() => taskActions.toggle(task)}
        aria-label={done ? `„${task.title}“ wieder öffnen` : `„${task.title}“ erledigen`}
        aria-pressed={done}
        className="flex w-14 shrink-0 items-center justify-center active:bg-slate-50"
      >
        <span
          className={`flex h-7 w-7 items-center justify-center rounded-full border-2 ${
            done ? 'border-brand-700 bg-brand-700 text-white' : 'border-slate-400'
          }`}
        >
          {done && (
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth={3} aria-hidden="true">
              <path d="M5 12l5 5 9-10" />
            </svg>
          )}
        </span>
      </button>
      <Link to={taskLink(task)} className="min-w-0 flex-1 py-3 pr-3">
        <div className="flex items-start gap-2">
          <p className={`min-w-0 flex-1 font-medium ${done ? 'text-slate-400 line-through' : ''}`}>
            {task.priority === 'high' && !done && (
              <span className="mr-1 font-bold text-red-600" aria-label="Hohe Priorität">
                !
              </span>
            )}
            {task.title}
          </p>
          {task.assigneeIds.length > 0 && (
            <span className="flex -space-x-1">
              {task.assigneeIds.map((id) => {
                const p = persons.get(id)
                return p ? <PersonBadge key={id} person={p} /> : null
              })}
            </span>
          )}
        </div>
        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
          {period ? (
            <span className={overdue ? 'font-medium text-red-600' : ''}>
              {showDate ? `${periodLabel(period, task.period ?? 'week', today)} · ` : ''}
              {period.from > today ? `ab ${formatDay(period.from, today)}` : untilLabel(period.to, today)}
            </span>
          ) : (
            (showDate || overdue) &&
            date && <span className={overdue ? 'font-medium text-red-600' : ''}>{formatDay(date, today)}</span>
          )}
          {time && <span>{time} Uhr</span>}
          {task.recurrenceRule && (
            <span title="Wiederkehrend" aria-label="Wiederkehrend">
              ↻{task.moved ? ' verschoben' : ''}
            </span>
          )}
          {task.durationMin ? <span>{formatDuration(task.durationMin)}</span> : null}
          {room && <RoomBadge room={room} />}
          {progress.total > 0 && (
            <span>
              ☑ {progress.done}/{progress.total}
            </span>
          )}
        </div>
      </Link>
    </li>
  )
}
