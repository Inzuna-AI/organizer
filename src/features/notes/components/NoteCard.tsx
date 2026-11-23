import { Link } from 'react-router'
import type { Note } from '@/types/data'
import { checklistProgress, noteHeading, notePreview } from '../utils'

/** Hintergrund und Rand eines Zettels in seiner Farbe (hell genug für dunkle und helle Schrift) */
export function noteStyle(color: string | null) {
  return color ? { backgroundColor: `${color}24`, borderColor: color } : undefined
}

/** Kachel in der Übersicht und in der Suche */
export function NoteCard({ note }: { note: Note }) {
  const preview = notePreview(note)
  const progress = checklistProgress(note.checklist)
  const open = note.checklist.filter((i) => !i.done && i.title.trim()).slice(0, 4)
  return (
    <Link
      to={`/notizen/${note.id}`}
      className="flex min-h-24 flex-col gap-1 overflow-hidden rounded-2xl border border-slate-200 bg-white p-3 active:opacity-80"
      style={noteStyle(note.color)}
    >
      <div className="flex items-start gap-1">
        <h3 className="min-w-0 flex-1 text-sm font-semibold break-words">{noteHeading(note)}</h3>
        {note.pinned && (
          <span className="shrink-0 text-xs" aria-label="angeheftet">
            📌
          </span>
        )}
      </div>
      {preview && <p className="line-clamp-6 text-xs whitespace-pre-line text-slate-600">{preview}</p>}
      {open.length > 0 && (
        <ul className="space-y-0.5 text-xs text-slate-600">
          {open.map((i) => (
            <li key={i.id} className="truncate">
              ☐ {i.title}
            </li>
          ))}
        </ul>
      )}
      {progress && <p className="mt-auto pt-1 text-[11px] text-slate-500">☑ {progress}</p>}
    </Link>
  )
}
