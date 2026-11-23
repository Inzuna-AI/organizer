import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router'
import { AnimatePresence, motion } from 'motion/react'
import type { Note } from '@/types/data'
import { formatDateTime } from '@/lib/dates'
import { Button } from '@/components/ui/Button'
import { ChecklistEditor } from '@/components/ui/ChecklistEditor'
import { PALETTE } from '@/components/ui/ColorPicker'
import { Fab } from '@/components/ui/Fab'
import { usePersonMap } from '@/features/persons'
import { noteActions, useNote, useNotes } from './store'
import { cleanChecklist, EMPTY_DRAFT, isEmptyNote, noteHeading, type NoteDraft } from './utils'
import { NoteCard, noteStyle } from './components/NoteCard'

const UNDO_MS = 5000
/** Tippen wird kurz gesammelt, bevor es im Store landet (der Sync bündelt zusätzlich 2 s) */
const SAVE_DELAY_MS = 400

// ---------- Übersicht ----------

export function NotesPage() {
  const notes = useNotes()
  const location = useLocation()
  const navigate = useNavigate()
  // Nach „Löschen“ im Editor: Hinweis mit „Rückgängig“
  const deleted = (location.state as { deleted?: { id: string; title: string } } | null)?.deleted ?? null
  const [undo, setUndo] = useState(deleted)

  useEffect(() => {
    if (!deleted) return
    setUndo(deleted)
    // Zustand aus dem Verlauf entfernen, damit der Hinweis nach „Zurück“ nicht wiederkommt
    navigate('.', { replace: true, state: null })
  }, [deleted, navigate])

  useEffect(() => {
    if (!undo) return
    const t = setTimeout(() => setUndo(null), UNDO_MS)
    return () => clearTimeout(t)
  }, [undo])

  const pinned = notes.filter((n) => n.pinned)
  const others = notes.filter((n) => !n.pinned)

  return (
    <div className="space-y-5 p-4">
      {notes.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500">
          Noch keine Notizen. Mit „+“ legst du einen Zettel an, z. B. für Geschenkideen oder das WLAN-Passwort für Gäste.
        </p>
      ) : (
        <>
          {pinned.length > 0 && <NoteGrid title="📌 Angeheftet" notes={pinned} />}
          <NoteGrid title={pinned.length > 0 ? 'Weitere' : undefined} notes={others} />
        </>
      )}

      <Fab to="/notizen/neu" label="Neue Notiz" />

      <AnimatePresence>
        {undo && (
          <motion.div
            role="status"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed right-20 left-4 z-30 mx-auto flex max-w-md items-center gap-3 rounded-xl bg-slate-800 py-2 pr-2 pl-4 text-sm text-white shadow-lg dark:bg-slate-200"
            style={{ bottom: 'calc(env(safe-area-inset-bottom) + 4.75rem)' }}
          >
            <span className="min-w-0 flex-1 truncate">„{undo.title}“ gelöscht</span>
            <button
              type="button"
              onClick={() => {
                noteActions.restore(undo.id)
                setUndo(null)
              }}
              className="min-h-10 rounded-lg px-3 font-semibold text-brand-100 active:bg-slate-700 dark:text-teal-300 dark:active:bg-slate-300"
            >
              Rückgängig
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function NoteGrid({ title, notes }: { title?: string; notes: Note[] }) {
  if (notes.length === 0) return null
  return (
    <section>
      {title && <h2 className="mb-2 text-sm font-semibold text-slate-500">{title}</h2>}
      <ul className="grid grid-cols-2 items-start gap-3">
        {notes.map((n) => (
          <li key={n.id}>
            <NoteCard note={n} />
          </li>
        ))}
      </ul>
    </section>
  )
}

// ---------- Bearbeiten ----------

function toDraft(n: Note | null): NoteDraft {
  return n ? { title: n.title, text: n.text, checklist: n.checklist, color: n.color, pinned: n.pinned } : EMPTY_DRAFT
}

/**
 * /notizen/neu und /notizen/:id. Gespeichert wird automatisch beim Tippen.
 * Eine neue Notiz entsteht erst mit dem ersten Inhalt; leer verlassen = verworfen.
 */
export function NoteEditPage() {
  const { id: param } = useParams()
  const navigate = useNavigate()
  const isNew = param === 'neu'
  const note = useNote(isNew ? null : (param ?? null))
  const persons = usePersonMap()

  const [draft, setDraft] = useState<NoteDraft>(() => toDraft(note))
  const [showChecklist, setShowChecklist] = useState(() => (note?.checklist.length ?? 0) > 0)
  const idRef = useRef<string | null>(note?.id ?? null)
  const draftRef = useRef(draft)
  const textRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    draftRef.current = draft
  }, [draft])

  /** Entwurf in den Store schreiben; legt die Notiz beim ersten Inhalt an. */
  function persist(d: NoteDraft, leaving: boolean) {
    const id = idRef.current
    if (id) {
      if (leaving && isEmptyNote(d)) noteActions.remove(id)
      else noteActions.save(id, leaving ? { ...d, checklist: cleanChecklist(d.checklist) } : d)
      return
    }
    if (isEmptyNote(d)) return
    idRef.current = noteActions.create(leaving ? { ...d, checklist: cleanChecklist(d.checklist) } : d)
    // Adresse anpassen (gleiche Route, die Seite bleibt erhalten)
    if (!leaving) navigate(`/notizen/${idRef.current}`, { replace: true })
  }
  const persistRef = useRef(persist)
  useEffect(() => {
    persistRef.current = persist
  })

  // Tippen kurz sammeln
  useEffect(() => {
    const t = setTimeout(() => persistRef.current(draft, false), SAVE_DELAY_MS)
    return () => clearTimeout(t)
  }, [draft])

  // Beim Verlassen: letzten Stand speichern, leere Notiz verwerfen
  useEffect(() => () => persistRef.current(draftRef.current, true), [])

  // Textfeld wächst mit dem Inhalt
  useLayoutEffect(() => {
    const el = textRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${Math.max(el.scrollHeight, 160)}px`
  }, [draft.text])

  const set = (changes: Partial<NoteDraft>) => setDraft((d) => ({ ...d, ...changes }))

  if (!isNew && !note && !idRef.current) {
    return <p className="p-8 text-center text-sm text-slate-500">Diese Notiz gibt es nicht mehr.</p>
  }

  function onDelete() {
    const id = idRef.current
    if (!id) return navigate('/notizen')
    if (!window.confirm('Notiz löschen?')) return
    const title = noteHeading(draftRef.current)
    // Beim Verlassen nichts mehr speichern
    idRef.current = null
    draftRef.current = EMPTY_DRAFT
    noteActions.remove(id)
    navigate('/notizen', { replace: true, state: { deleted: { id, title } } })
  }

  const editor = note?.updatedBy ? persons.get(note.updatedBy)?.name : null

  return (
    <div className="space-y-4 p-4">
      <div
        className="space-y-2 rounded-2xl border border-slate-200 bg-white p-3 transition-colors"
        style={noteStyle(draft.color)}
      >
        <input
          value={draft.title}
          onChange={(e) => set({ title: e.target.value })}
          placeholder="Titel"
          aria-label="Titel"
          autoFocus={isNew}
          enterKeyHint="next"
          className="block min-h-11 w-full bg-transparent px-1 text-lg font-semibold outline-none placeholder:text-slate-400"
        />
        <textarea
          ref={textRef}
          value={draft.text}
          onChange={(e) => set({ text: e.target.value })}
          placeholder="Notiz …"
          aria-label="Text"
          className="block w-full resize-none bg-transparent px-1 text-base leading-relaxed outline-none placeholder:text-slate-400"
        />
        {showChecklist && (
          <div className="border-t border-slate-200/70 pt-3">
            <ChecklistEditor items={draft.checklist} onChange={(checklist) => set({ checklist })} />
          </div>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        {!showChecklist && (
          <Button variant="secondary" onClick={() => setShowChecklist(true)}>
            ☑ Punkte zum Abhaken
          </Button>
        )}
        <Button variant="secondary" aria-pressed={draft.pinned} onClick={() => set({ pinned: !draft.pinned })}>
          📌 {draft.pinned ? 'Angeheftet' : 'Anheften'}
        </Button>
      </div>

      <fieldset>
        <legend className="mb-2 text-sm font-medium text-slate-700">Farbe</legend>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => set({ color: null })}
            aria-label="Keine Farbe"
            aria-pressed={draft.color === null}
            className={`h-9 w-9 rounded-full border-2 bg-white text-xs text-slate-400 ${
              draft.color === null ? 'border-slate-900' : 'border-slate-300'
            }`}
          >
            ⌀
          </button>
          {PALETTE.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => set({ color: c })}
              aria-label={`Farbe ${c}`}
              aria-pressed={draft.color === c}
              className={`h-9 w-9 rounded-full border-2 ${
                draft.color === c ? 'border-slate-900 ring-2 ring-white ring-inset' : 'border-transparent'
              }`}
              style={{ backgroundColor: c }}
            />
          ))}
        </div>
      </fieldset>

      {note && (
        <p className="text-xs text-slate-500">
          Zuletzt geändert {editor ? `von ${editor} ` : ''}am {formatDateTime(note.updatedAt)} · wird automatisch gespeichert
        </p>
      )}

      {note && (
        <Button variant="danger" block onClick={onDelete}>
          Notiz löschen
        </Button>
      )}
    </div>
  )
}
