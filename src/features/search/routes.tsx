import { useMemo } from 'react'
import { useSearchParams } from 'react-router'
import { useRoomMap } from '@/features/rooms'
import { instanceKey, TaskItem, useAllTasks, useTaskInstances } from '@/features/tasks'
import { EventItem, useAllEvents } from '@/features/events'
import { NoteCard, useAllNotes } from '@/features/notes'
import { berlinDateString } from '@/lib/dates'
import type { EventInstance } from '@/lib/events'
import { searchEvents, searchNotes, searchTasks } from './utils'

export function SearchPage() {
  const [params, setParams] = useSearchParams()
  // Suchbegriff in der URL, damit er nach „Zurück“ aus einer Aufgabe noch da ist
  const query = params.get('q') ?? ''
  const tasks = useAllTasks()
  const instances = useTaskInstances()
  const rooms = useRoomMap()

  const events = useAllEvents()
  const result = useMemo(
    () => searchTasks(tasks, instances, query, (id) => (id ? rooms.get(id)?.name : undefined)),
    [tasks, instances, query, rooms],
  )
  const today = berlinDateString()
  const evResult = useMemo(() => searchEvents(events, query, today), [events, query, today])
  const notes = useAllNotes()
  const noteResult = useMemo(() => searchNotes(notes, query), [notes, query])
  const total =
    result.open.length + result.done.length + evResult.upcoming.length + evResult.past.length + noteResult.length
  const evKey = (i: EventInstance) => (i.date ? `${i.event.id}:${i.date}` : i.event.id)

  return (
    <div className="space-y-4 p-4">
      <div className="relative">
        <svg
          viewBox="0 0 24 24"
          width="20"
          height="20"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-slate-400"
          aria-hidden="true"
        >
          <circle cx="11" cy="11" r="7" />
          <path d="M20 20l-3.5-3.5" />
        </svg>
        <input
          type="search"
          autoFocus
          value={query}
          onChange={(e) => setParams(e.target.value ? { q: e.target.value } : {}, { replace: true })}
          placeholder="Aufgaben, Termine, Notizen durchsuchen …"
          aria-label="Suchbegriff"
          enterKeyHint="search"
          className="block min-h-12 w-full rounded-2xl border border-slate-300 bg-white pr-3 pl-10 text-base outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-100"
        />
      </div>

      {!query.trim() ? (
        <p className="py-8 text-center text-sm text-slate-500">
          Sucht in Aufgaben (Titel, Beschreibung, Checkliste, Raum), Terminen (Titel, Ort, Notiz) und Notizen (Titel, Text, Punkte). Groß-/Kleinschreibung und Umlaute sind egal.
        </p>
      ) : total === 0 ? (
        <p className="py-8 text-center text-sm text-slate-500">Nichts gefunden.</p>
      ) : (
        <>
          {evResult.upcoming.length > 0 && (
            <section>
              <h2 className="mb-2 text-sm font-semibold text-slate-500">Termine ({evResult.upcoming.length})</h2>
              <ul className="space-y-2">
                {evResult.upcoming.map((i) => (
                  <EventItem key={evKey(i)} instance={i} showDate />
                ))}
              </ul>
            </section>
          )}
          {result.open.length > 0 && (
            <section>
              <h2 className="mb-2 text-sm font-semibold text-slate-500">Offen ({result.open.length})</h2>
              <ul className="space-y-2">
                {result.open.map((t) => (
                  <TaskItem key={instanceKey(t)} task={t} showDate />
                ))}
              </ul>
            </section>
          )}
          {result.done.length > 0 && (
            <section>
              <h2 className="mb-2 text-sm font-semibold text-slate-500">Erledigt ({result.done.length})</h2>
              <ul className="space-y-2">
                {result.done.map((t) => (
                  <TaskItem key={instanceKey(t)} task={t} showDate />
                ))}
              </ul>
            </section>
          )}
          {noteResult.length > 0 && (
            <section>
              <h2 className="mb-2 text-sm font-semibold text-slate-500">Notizen ({noteResult.length})</h2>
              <ul className="grid grid-cols-2 items-start gap-3">
                {noteResult.map((n) => (
                  <li key={n.id}>
                    <NoteCard note={n} />
                  </li>
                ))}
              </ul>
            </section>
          )}
          {evResult.past.length > 0 && (
            <section>
              <h2 className="mb-2 text-sm font-semibold text-slate-500">Vergangene Termine ({evResult.past.length})</h2>
              <ul className="space-y-2 opacity-70">
                {evResult.past.map((i) => (
                  <EventItem key={evKey(i)} instance={i} showDate />
                ))}
              </ul>
            </section>
          )}
        </>
      )}
    </div>
  )
}
