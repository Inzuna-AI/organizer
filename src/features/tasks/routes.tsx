import { useMemo, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router'
import { berlinDateString, formatDateTime, formatDay } from '@/lib/dates'
import { describeRule, isFixedSeries, isSeries, occurrenceId } from '@/lib/recurrence'
import { loadPref, savePref } from '@/lib/storage'
import { describePeriodRepeat, isPeriodTask, periodInterval, periodLabel, periodRange, untilLabel } from '@/lib/periods'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { ChoiceDialog } from '@/components/ui/ChoiceDialog'
import { SelectField } from '@/components/ui/Field'
import { Fab } from '@/components/ui/Fab'
import { useGoBack } from '@/components/layout/useGoBack'
import { useAppStore } from '@/store'
import { usePersonMap, usePersons } from '@/features/persons'
import { taskActions, useOccurrences, useTask, useTaskInstance, useTaskInstances } from './store'
import { TaskFilters, type FilterValue } from './components/TaskFilters'
import { TaskForm } from './components/TaskForm'
import { TaskItem } from './components/TaskItem'
import {
  filterTasks,
  groupByDay,
  groupByPeriod,
  instanceKey,
  inView,
  matchesFilter,
  type TaskInput,
  type TaskView,
} from './utils'

const VIEWS: Array<{ key: TaskView; label: string; param: string }> = [
  { key: 'planned', label: 'Geplant', param: 'geplant' },
  { key: 'period', label: 'Zeitraum', param: 'zeitraum' },
  { key: 'inbox', label: 'Inbox', param: 'inbox' },
  { key: 'done', label: 'Erledigt', param: 'erledigt' },
]

const EMPTY_TEXT: Record<TaskView, string> = {
  planned: 'Keine geplanten Aufgaben.',
  period: 'Keine Aufgaben mit Zeitraum. Hier landen Aufgaben für „irgendwann diese Woche“ oder „diesen Monat“.',
  inbox: 'Die Inbox ist leer. Aufgaben ohne Datum landen hier.',
  done: 'Noch nichts erledigt.',
}

// ---------- Liste ----------

export function TasksPage() {
  const [params, setParams] = useSearchParams()
  const view = VIEWS.find((v) => v.param === params.get('ansicht'))?.key ?? 'planned'
  const tasks = useTaskInstances()
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
    const c: Record<TaskView, number> = { planned: 0, period: 0, inbox: 0, done: 0 }
    for (const t of tasks) {
      if (!matchesFilter(t, fullFilter)) continue
      for (const v of VIEWS) if (inView(t, v.key)) c[v.key]++
    }
    return c
  }, [tasks, fullFilter.roomId, fullFilter.personId, fullFilter.mineOnly, meId]) // eslint-disable-line react-hooks/exhaustive-deps

  const groups = view === 'planned' ? groupByDay(list, today) : view === 'period' ? groupByPeriod(list, today) : null
  const filterActive = !!(filter.roomId || filter.personId || filter.mineOnly)

  return (
    <div className="space-y-4 p-4">
      <div className="grid grid-cols-4 rounded-xl bg-slate-200 p-1" role="tablist" aria-label="Ansicht">
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
                <TaskItem key={instanceKey(t)} task={t} />
              ))}
            </ul>
          </section>
        ))
      ) : (
        <ul className="space-y-2">
          {list.map((t) => (
            <TaskItem key={instanceKey(t)} task={t} showDate />
          ))}
        </ul>
      )}

      <Fab
        to={view === 'inbox' ? '/aufgaben/neu?inbox=1' : view === 'period' ? '/aufgaben/neu?zeitraum=1' : '/aufgaben/neu'}
        label="Neue Aufgabe"
      />
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
        defaults={{
          date,
          time: params.get('uhrzeit') ?? '',
          assigneeIds: meId ? [meId] : [],
          period: params.has('zeitraum'),
        }}
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

type Scope = 'one' | 'series'

export function EditTaskPage() {
  const { id } = useParams()
  const [params] = useSearchParams()
  const task = useTask(id)
  const date = params.get('datum')
  const instance = useTaskInstance(task, date)
  const occurrences = useOccurrences()
  const goBack = useGoBack('/aufgaben')
  const persons = usePersonMap()
  const personList = usePersons()
  const [pending, setPending] = useState<TaskInput | null>(null)

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

  const series = isSeries(task)
  const periodTask = isPeriodTask(task)
  const fixed = isFixedSeries(task)
  const inst = instance && instance.occurrenceDate ? instance : null
  const instDate = inst?.occurrenceDate ?? null
  // Fester Rhythmus + Termin: Formular zeigt Datum/Uhrzeit des Termins, die Regel bleibt am Serienstart
  // (Zeitraum-Serien nicht: Zeitraum und Rhythmus gelten immer für die Serie)
  const instanceMode = fixed && !!inst && !periodTask
  const formInitial = instanceMode ? { ...task, startAt: inst.startAt, allDay: inst.allDay } : task
  const editor = task.updatedBy ? persons.get(task.updatedBy)?.name : null
  const done = task.status === 'done'
  const override = instDate
    ? occurrences.find((o) => o.id === occurrenceId(task.id, instDate) && !o.deleted)?.assigneeId ?? ''
    : ''

  function submit(input: TaskInput) {
    if (!task) return
    if (instanceMode && inst && input.recurrenceRule && input.startAt) {
      if (input.startAt !== inst.startAt) {
        setPending(input)
        return
      }
      // Datum unverändert: nur die übrigen Felder gelten für die Serie
      const { startAt: _s, allDay: _a, ...rest } = input // eslint-disable-line @typescript-eslint/no-unused-vars
      taskActions.save(task.id, rest)
    } else {
      taskActions.save(task.id, input)
    }
    goBack()
  }

  function onScope(scope: Scope | null) {
    const input = pending
    setPending(null)
    if (!scope || !input?.startAt || !task || !instDate) return
    const { startAt, allDay: _a, ...rest } = input // eslint-disable-line @typescript-eslint/no-unused-vars
    if (scope === 'one') {
      taskActions.save(task.id, rest)
      taskActions.saveInstance(task.id, instDate, { startAt })
    } else {
      taskActions.moveSeries(task.id, instDate, startAt, rest)
    }
    goBack()
  }

  function onDelete(scope: Scope) {
    if (!task) return
    if (scope === 'one' && instDate) {
      const q = periodTask
        ? 'Diesen Zeitraum auslassen? Die Serie bleibt bestehen, der nächste Zeitraum erscheint.'
        : 'Diesen Termin löschen? Die Serie bleibt bestehen.'
      if (window.confirm(q)) {
        taskActions.skipInstance(task.id, instDate)
        goBack()
      }
      return
    }
    const what = series ? `Die ganze Serie „${task.title}“` : `Aufgabe „${task.title}“`
    if (window.confirm(`${what} löschen?`)) {
      taskActions.remove(task.id)
      goBack()
    }
  }

  const instDone = inst?.status === 'done'
  const instTime = inst && !inst.allDay ? inst.startAt!.slice(11, 16) : null
  const completedBy = inst?.completedBy ? persons.get(inst.completedBy)?.name : null
  const today = berlinDateString()
  const instRange = periodTask && instDate ? periodRange(task, instDate) : null

  return (
    <div className="space-y-4 p-4">
      {series && inst && instDate ? (
        <Card>
          <div className="space-y-3">
            <div>
              <p className="text-xs text-slate-500">
                ↻{' '}
                {periodTask
                  ? describePeriodRepeat(task.period!, periodInterval(task))
                  : describeRule(task.recurrenceRule!, task.startAt!.slice(0, 10), task.recurrenceMode)}
              </p>
              {instRange ? (
                <p className="font-semibold">
                  Zeitraum: {periodLabel(instRange, task.period!, today)}
                  <span className="font-normal text-slate-500">
                    {' '}
                    ({instRange.from > today ? `ab ${formatDay(instRange.from, today)}` : untilLabel(instRange.to, today)})
                  </span>
                </p>
              ) : (
                <p className="font-semibold">
                  Termin: {formatDay(inst.startAt!.slice(0, 10))}
                  {instTime ? `, ${instTime} Uhr` : ''}
                  {inst.moved && <span className="font-normal text-slate-500"> (verschoben)</span>}
                </p>
              )}
            </div>
            <Button
              variant={instDone ? 'secondary' : 'primary'}
              block
              onClick={() => taskActions.setInstanceDone(task.id, instDate, !instDone)}
            >
              {instDone ? '↺ Wieder öffnen' : periodTask ? '✓ Erledigt' : '✓ Termin erledigt'}
            </Button>
            {instDone && inst.completedAt && (
              <p className="-mt-1 text-center text-xs text-slate-500">
                Erledigt am {formatDateTime(inst.completedAt)}
                {completedBy ? ` von ${completedBy}` : ''}
              </p>
            )}
            {!instDone && (
              <SelectField
                label="Diesmal zuständig"
                value={override}
                onChange={(e) => taskActions.saveInstance(task.id, instDate, { assigneeId: e.target.value || null })}
              >
                <option value="">
                  {task.rotation ? 'Reihum' : 'Wie bei der Serie'}
                  {!override && inst.assigneeIds.length
                    ? ` (${inst.assigneeIds.map((pid) => persons.get(pid)?.name ?? '?').join(', ')})`
                    : ''}
                </option>
                {personList.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </SelectField>
            )}
          </div>
        </Card>
      ) : !series ? (
        <>
          <Button variant={done ? 'secondary' : 'primary'} block onClick={() => taskActions.setDone(task.id, !done)}>
            {done ? '↺ Wieder öffnen' : '✓ Als erledigt markieren'}
          </Button>
          {done && task.completedAt && (
            <p className="-mt-2 text-center text-xs text-slate-500">Erledigt am {formatDateTime(task.completedAt)}</p>
          )}
        </>
      ) : null}

      {instanceMode && (
        <p className="text-xs text-slate-500">
          Titel, Raum, Checkliste und Wiederholung gelten immer für die ganze Serie. Bei geändertem Datum oder
          geänderter Uhrzeit wirst du gefragt, ob nur dieser Termin oder die ganze Serie gemeint ist.
        </p>
      )}

      {/* key: Formular neu aufbauen, wenn die Aufgabe oder der Termin von außen geändert wurde */}
      <TaskForm
        key={`${task.updatedAt}|${inst?.startAt ?? ''}`}
        initial={formInitial}
        seriesDate={instanceMode ? task.startAt!.slice(0, 10) : undefined}
        submitLabel="Speichern"
        onSubmit={submit}
      />

      {(instanceMode || (periodTask && inst)) && !instDone ? (
        <div className="grid grid-cols-2 gap-2">
          <Button variant="danger" onClick={() => onDelete('one')}>
            {periodTask ? 'Diesmal auslassen' : 'Diesen Termin löschen'}
          </Button>
          <Button variant="danger" onClick={() => onDelete('series')}>
            Ganze Serie löschen
          </Button>
        </div>
      ) : (
        <Button variant="danger" block onClick={() => onDelete('series')}>
          {series ? 'Ganze Serie löschen' : 'Aufgabe löschen'}
        </Button>
      )}
      <p className="text-center text-xs text-slate-400">
        Zuletzt geändert {formatDateTime(task.updatedAt)}
        {editor ? ` von ${editor}` : ''}
      </p>

      <ChoiceDialog<Scope>
        open={!!pending}
        title="Termin verschieben"
        message="Soll die neue Zeit nur für diesen Termin gelten oder für die ganze Serie?"
        choices={[
          { value: 'one', label: 'Nur diesen Termin' },
          { value: 'series', label: 'Ganze Serie' },
        ]}
        onChoose={onScope}
      />
    </div>
  )
}