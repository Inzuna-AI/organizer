import { useState, type KeyboardEvent } from 'react'
import type { ChecklistItem } from '@/types/data'
import { uuid } from '@/lib/records'

interface Props {
  items: ChecklistItem[]
  onChange: (items: ChecklistItem[]) => void
}

export function ChecklistEditor({ items, onChange }: Props) {
  const [draft, setDraft] = useState('')

  function add() {
    const title = draft.trim()
    if (!title) return
    onChange([...items, { id: uuid(), title, done: false }])
    setDraft('')
  }

  function onKey(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      e.preventDefault()
      add()
    }
  }

  return (
    <fieldset>
      <legend className="mb-1 text-sm font-medium text-slate-700">Checkliste</legend>
      <ul className="space-y-1">
        {items.map((item) => (
          <li key={item.id} className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={item.done}
              onChange={() => onChange(items.map((i) => (i.id === item.id ? { ...i, done: !i.done } : i)))}
              className="h-6 w-6 shrink-0 accent-brand-700"
              aria-label={`${item.title} erledigt`}
            />
            <input
              value={item.title}
              onChange={(e) => onChange(items.map((i) => (i.id === item.id ? { ...i, title: e.target.value } : i)))}
              className={`min-h-10 flex-1 rounded-lg border border-transparent px-2 outline-none focus:border-slate-300 ${
                item.done ? 'text-slate-400 line-through' : ''
              }`}
              aria-label="Punkt bearbeiten"
            />
            <button
              type="button"
              onClick={() => onChange(items.filter((i) => i.id !== item.id))}
              className="h-10 w-10 rounded-full text-slate-400 active:bg-slate-100"
              aria-label={`${item.title} entfernen`}
            >
              ✕
            </button>
          </li>
        ))}
      </ul>
      <div className="mt-2 flex gap-2">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={onKey}
          placeholder="Punkt hinzufügen …"
          className="min-h-11 flex-1 rounded-xl border border-slate-300 px-3 outline-none focus:border-brand-600"
          enterKeyHint="enter"
        />
        <button
          type="button"
          onClick={add}
          disabled={!draft.trim()}
          className="min-h-11 rounded-xl border border-slate-300 px-4 text-sm disabled:text-slate-300"
        >
          +
        </button>
      </div>
    </fieldset>
  )
}
