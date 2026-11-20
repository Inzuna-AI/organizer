import { useMemo, useState } from 'react'
import { Link } from 'react-router'
import { berlinDateString, formatLongDate } from '@/lib/dates'
import { loadPref, savePref } from '@/lib/storage'
import { FabChoice } from '@/components/ui/FabChoice'
import { CollapsibleSection } from '@/components/ui/CollapsibleSection'
import { involves } from '@/lib/events'
import { useAppStore, useMe } from '@/store'
import { instanceKey, TaskItem, todayBuckets, useTaskInstances } from '@/features/tasks'
import { EventItem, useEventsBetween } from '@/features/events'

export function TodayPage() {
  const me = useMe()
  const meId = useAppStore((s) => s.device?.personId ?? null)
  const tasks = useTaskInstances()
  const [mineOnly, setMineState] = useState<boolean>(() => loadPref('todayMineOnly', false))
  const setMineOnly = (v: boolean) => {
    setMineState(v)
    savePref('todayMineOnly', v)
  }

  // Eingeklappte Abschnitte merkt sich das Gerät
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>(() => loadPref('todayCollapsed', {}))
  const section = (key: string) => ({
    open: !collapsed[key],
    onToggle: () => {
      const next = { ...collapsed, [key]: !collapsed[key] }
      setCollapsed(next)
      savePref('todayCollapsed', next)
    },
  })

  const today = berlinDateString()
  const b = useMemo(
    () => todayBuckets(tasks, today, { mineOnly, meId }, (iso) => berlinDateString(new Date(iso))),
    [tasks, today, mineOnly, meId],
  )
  const nothing = b.overdue.length === 0 && b.today.length === 0
  const allEvents = useEventsBetween(today, today)
  const events = useMemo(
    () => (mineOnly ? allEvents.filter((i) => involves(i.event, meId)) : allEvents),
    [allEvents, mineOnly, meId],
  )

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

      {events.length > 0 && (
        <CollapsibleSection title={`Termine heute (${events.length})`} {...section('events')}>
          <ul className="space-y-2">
            {events.map((i) => (
              <EventItem key={i.date ? `${i.event.id}:${i.date}` : i.event.id} instance={i} day={today} />
            ))}
          </ul>
        </CollapsibleSection>
      )}

      {b.overdue.length > 0 && (
        <CollapsibleSection title={`Überfällig (${b.overdue.length})`} tone="text-red-600" {...section('overdue')}>
          <ul className="space-y-2">
            {b.overdue.map((t) => (
              <TaskItem key={instanceKey(t)} task={t} showDate />
            ))}
          </ul>
        </CollapsibleSection>
      )}

      <CollapsibleSection title={`Aufgaben heute (${b.today.length})`} {...section('today')}>
        {b.today.length > 0 ? (
          <ul className="space-y-2">
            {b.today.map((t) => (
              <TaskItem key={instanceKey(t)} task={t} />
            ))}
          </ul>
        ) : (
          <p className="rounded-2xl border border-dashed border-slate-300 p-4 text-center text-sm text-slate-500">
            {nothing && b.doneToday.length > 0 ? 'Alles erledigt für heute. 🎉' : events.length ? 'Keine Aufgaben für heute.' : 'Für heute steht nichts an.'}
          </p>
        )}
      </CollapsibleSection>

      {b.period.length > 0 && (
        <CollapsibleSection
          title={`Im Zeitraum (${b.period.length})`}
          extra={
            <Link to="/aufgaben?ansicht=zeitraum" className="text-xs text-brand-700">
              Alle anzeigen
            </Link>
          }
          {...section('period')}
        >
          <ul className="space-y-2">
            {b.period.map((t) => (
              <TaskItem key={instanceKey(t)} task={t} />
            ))}
          </ul>
        </CollapsibleSection>
      )}

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
        <CollapsibleSection title={`Erledigt heute (${b.doneToday.length})`} {...section('done')}>
          <ul className="space-y-2">
            {b.doneToday.map((t) => (
              <TaskItem key={instanceKey(t)} task={t} />
            ))}
          </ul>
        </CollapsibleSection>
      )}

      <FabChoice
        label="Neuer Termin oder neue Aufgabe für heute"
        options={[
          { label: '📅 Termin', to: `/termine/neu?datum=${today}` },
          { label: '☐ Aufgabe', to: `/aufgaben/neu?datum=${today}` },
        ]}
      />
    </div>
  )
}
