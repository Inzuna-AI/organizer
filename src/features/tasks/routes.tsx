import { useMemo, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router'
import { berlinDateString, formatDateTime } from '@/lib/dates'
import { loadPref, savePref } from '@/lib/storage'
import { Button } from '@/components/ui/Button'
import { Fab } from '@/components/ui/Fab'
import { useGoBack } from '@/components/layout/useGoBack'
import { useAppStore } from '@/store'
import { usePersonMap } from '@/features/persons'
import { taskActions, useAllTasks, useTask } from './store'
import { TaskFilters, type FilterValue } from './components/TaskFilters'
import { TaskForm } from './components/TaskForm'
import { TaskItem } from './components/TaskItem'
import { filterTasks, groupByDay, inView, matchesFilter, type TaskView } from './utils'

const VIEWS: Array<{ key: TaskView; label: string; param: string }> = [
  { key: 'planned', label: 'Geplant', param: 'geplant' },
  { key: 'inbox', label: 'Inbox', param: 'inbox' },
  { key: 'done', label: 'Erledigt', param: 'erledigt' },
]

const EMPTY_TEXT: Record<TaskView, string> = {
  planned: 'Keine geplanten Aufgaben.',
  inbox: 'Die Inbox ist leer. Aufgaben ohne Datum landen hier.',
  done: 'Noch nichts erledigt.',
}

// ---------- Liste ----------

export function TasksPage() {
  const [params, setParams] = useSearchParams()
  const view = VIEWS.find((v) => v.param === params.get('ansicht'))?.key ?? 'planned'
  const tasks = useAllTasks()
  const meId = useAppStore((s) => s.device?.personId ?? null)
  const [filter, setFilterState] = useState<FilterValue>(() =>
    loadPref('taskFilter', { roomId: null, personId: null, mineOnly: false }),
  )
  const setFilter = (f: FilterValue) => {
    setFilterState(f)
    savePref('taskFilter', f)
  }

  const today = berlinDateString()
  const fullFilter = { ...filter, meId }
  const list = useMemo(() => filterTasks(tasks, { ...fullFilter, view }), [tasks, view, fullFilter.roomId, fullFilter.personId, fullFilter.mineOnly, meId]) // eslint-disable-line react-hooks/exhaustive-deps
  const counts = useMemo(() => {
    const c: Record<TaskView, number> = { planned: 0, inbox: 0, done: 0 }
    for (const t of tasks) {
      if (!matchesFilter(t, fullFilter)) continue
      for (const v of VIEWS) if (inView(t, v.key)) c[v.key]++
    }
    return c
  }, [tasks, fullFilter.roomId, fullFilter.personId, fullFilter.mineOnly, meId]) // eslint-disable-line react-hooks/exhaustive-deps

  const groups = view === 'planned' ? groupByDay(list, today) : null
  const filterActive = !!(filter.roomId || filter.personId || filter.mineOnly)

  return (
    <div className="space-y-4 p-4">
      <div className="grid grid-cols-3 rounded-xl bg-slate-200 p-1" role="tablist" aria-label="Ansicht">
        {VIEWS.map((v) => (
          <button
            key={v.key}
            type="button"
            role="tab"
            aria-selected={view === v.key}
            onClick={() => setParams(v.key === 'planned' ? {} : { ansicht: v.param }, { replace: true })}
            className={`min-h-10 rounded-lg text-sm font-medium ${
              view === v.key ? 'bg-white shadow-sm' : 'text-slate-600'
            }`}
          >
            {v.label}
            <span className="ml-1 text-xs text-slate-500">{counts[v.key]}</span>
          </button>
        ))}
      </div>

      <TaskFilters value={filter} onChange={setFilter} />

      {list.length === 0 ? (
        <div className="py-10 text-center text-sm text-slate-500">
          <p>{EMPTY_TEXT[view]}</p>
          {filterActive && (
            <Button variant="ghost" onClick={() => setFilter({ roomId: null, personId: null, mineOnly: false })}>
              Filter zurücksetzen
            </Button>
          )}
        </div>
      ) : groups ? (
        groups.map((g) => (
          <section key={g.key}>
            <h2 className={`mb-2 text-sm font-semibold ${g.overdue ? 'text-red-600' : 'text-slate-500'}`}>
              {g.label}
            </h2>
            <ul className="space-y-2">
              {g.tasks.map((t) => (
                <TaskItem key={t.id} task={t} />
              ))}
            </ul>
          </section>
        ))
      ) : (
        <ul className="space-y-2">
          {list.map((t) => (
            <TaskItem key={t.id} task={t} showDate />
          ))}
        </ul>
      )}

      <Fab to={view === 'inbox' ? '/aufgaben/neu?inbox=1' : '/aufgaben/neu'} label="Neue Aufgabe" />
    </div>
  )
}

// ---------- Neu ----------

export function NewTaskPage() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const goBack = useGoBack('/aufgaben')
  const meId = useAppStore((s) => s.device?.personId ?? null)
  const date = params.get('datum') ?? (params.get('inbox') ? '' : berlinDateString())

  return (
    <div className="p-4">
      <TaskForm
        defaults={{ date, time: params.get('uhrzeit') ?? '', assigneeIds: meId ? [meId] : [] }}
        submitLabel="Aufgabe anlegen"
        onSubmit={(input) => {
          taskActions.create(input)
          if (input.startAt) goBack()
          else navigate('/aufgaben?ansicht=inbox', { replace: true })
        }}
      />
    </div>
  )
}

// ---------- Bearbeiten ----------

export function EditTaskPage() {
  const { id } = useParams()
  const task = useTask(id)
  const goBack = useGoBack('/aufgaben')
  const persons = usePersonMap()

  if (!task) {
    return (
      <div className="p-8 text-center text-sm text-slate-500">
        <p className="mb-4">Diese Aufgabe gibt es nicht (mehr).</p>
        <Button variant="secondary" onClick={goBack}>
          Zurück
        </Button>
      </div>
    )
  }

  const done = task.status === 'done'
  const editor = task.updatedBy ? persons.get(task.updatedBy)?.name : null

  function onDelete() {
    if (task && window.confirm(`Aufgabe „${task.title}“ löschen?`)) {
      taskActions.remove(task.id)
      goBack()
    }
  }

  return (
    <div className="space-y-4 p-4">
      <Button
        variant={done ? 'secondary' : 'primary'}
        block
        onClick={() => taskActions.setDone(task.id, !done)}
      >
        {done ? '↺ Wieder öffnen' : '✓ Als erledigt markieren'}
      </Button>
      {done && task.completedAt && (
        <p className="-mt-2 text-center text-xs text-slate-500">Erledigt am {formatDateTime(task.completedAt)}</p>
      )}

      {/* key: Formular neu aufbauen, wenn die Aufgabe von außen geändert wurde */}
      <TaskForm
        key={task.updatedAt}
        initial={task}
        submitLabel="Speichern"
        onSubmit={(input) => {
          taskActions.save(task.id, input)
          goBack()
        }}
      />

      <Button variant="danger" block onClick={onDelete}>
        Aufgabe löschen
      </Button>
      <p className="text-center text-xs text-slate-400">
        Zuletzt geändert {formatDateTime(task.updatedAt)}
        {editor ? ` von ${editor}` : ''}
      </p>
    </div>
  )
}
