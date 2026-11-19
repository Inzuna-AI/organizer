import { useMemo, useState } from 'react'
import { Link } from 'react-router'
import { berlinDateString, formatLongDate } from '@/lib/dates'
import { loadPref, savePref } from '@/lib/storage'
import { Fab } from '@/components/ui/Fab'
import { useAppStore, useMe } from '@/store'
import { TaskItem, todayBuckets, useAllTasks } from '@/features/tasks'

export function TodayPage() {
  const me = useMe()
  const meId = useAppStore((s) => s.device?.personId ?? null)
  const tasks = useAllTasks()
  const [mineOnly, setMineState] = useState<boolean>(() => loadPref('todayMineOnly', false))
  const setMineOnly = (v: boolean) => {
    setMineState(v)
    savePref('todayMineOnly', v)
  }

  const today = berlinDateString()
  const b = useMemo(
    () => todayBuckets(tasks, today, { mineOnly, meId }, (iso) => berlinDateString(new Date(iso))),
    [tasks, today, mineOnly, meId],
  )
  const nothing = b.overdue.length === 0 && b.today.length === 0

  return (
    <div className="space-y-5 p-4">
      <div className="flex items-end justify-between gap-3">
        <div>
          <p className="text-sm text-slate-500">{formatLongDate(new Date())}</p>
          <h2 className="text-2xl font-semibold">Hallo{me ? ` ${me.name}` : ''}!</h2>
        </div>
        <div className="flex rounded-xl bg-slate-200 p-1 text-sm" role="group" aria-label="Aufgaben anzeigen">
          {[
            { v: true, label: 'Meine' },
            { v: false, label: 'Alle' },
          ].map((o) => (
            <button
              key={o.label}
              type="button"
              aria-pressed={mineOnly === o.v}
              onClick={() => setMineOnly(o.v)}
              className={`min-h-9 rounded-lg px-3 font-medium ${mineOnly === o.v ? 'bg-white shadow-sm' : 'text-slate-600'}`}
            >
              {o.label}
            </button>
          ))}
        </div>
      </div>

      {b.overdue.length > 0 && (
        <section>
          <h3 className="mb-2 text-sm font-semibold text-red-600">Überfällig ({b.overdue.length})</h3>
          <ul className="space-y-2">
            {b.overdue.map((t) => (
              <TaskItem key={t.id} task={t} showDate />
            ))}
          </ul>
        </section>
      )}

      <section>
        <h3 className="mb-2 text-sm font-semibold text-slate-500">Heute ({b.today.length})</h3>
        {b.today.length > 0 ? (
          <ul className="space-y-2">
            {b.today.map((t) => (
              <TaskItem key={t.id} task={t} />
            ))}
          </ul>
        ) : (
          <p className="rounded-2xl border border-dashed border-slate-300 p-4 text-center text-sm text-slate-500">
            {nothing && b.doneToday.length > 0 ? 'Alles erledigt für heute. 🎉' : 'Für heute steht nichts an.'}
          </p>
        )}
      </section>

      <div className="grid grid-cols-2 gap-2 text-sm">
        <Link
          to="/aufgaben?ansicht=inbox"
          className="flex min-h-12 items-center justify-between rounded-2xl border border-slate-200 bg-white px-4"
        >
          <span>📥 Inbox</span>
          <span className="font-semibold">{b.inboxCount}</span>
        </Link>
        <Link
          to="/aufgaben"
          className="flex min-h-12 items-center justify-between rounded-2xl border border-slate-200 bg-white px-4"
        >
          <span>Morgen</span>
          <span className="font-semibold">{b.tomorrowCount}</span>
        </Link>
      </div>

      {b.doneToday.length > 0 && (
        <section>
          <h3 className="mb-2 text-sm font-semibold text-slate-500">Erledigt heute ({b.doneToday.length})</h3>
          <ul className="space-y-2">
            {b.doneToday.map((t) => (
              <TaskItem key={t.id} task={t} />
            ))}
          </ul>
        </section>
      )}

      <Fab to={`/aufgaben/neu?datum=${today}`} label="Neue Aufgabe für heute" />
    </div>
  )
}
