import { useEffect } from 'react'
import { Button } from './Button'

export interface Choice<T extends string> {
  value: T
  label: string
  variant?: 'primary' | 'secondary' | 'danger'
}

interface Props<T extends string> {
  open: boolean
  title: string
  message?: string
  choices: Array<Choice<T>>
  /** null = abgebrochen */
  onChoose: (value: T | null) => void
}

/** Kleine Auswahl als Bottom-Sheet, z. B. „Nur diesen Termin“ / „Ganze Serie“. */
export function ChoiceDialog<T extends string>({ open, title, message, choices, onChoose }: Props<T>) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onChoose(null)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onChoose])

  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center" onClick={() => onChoose(null)}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="choice-title"
        className="w-full max-w-md space-y-3 rounded-t-3xl bg-white p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] shadow-xl sm:rounded-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="choice-title" className="text-lg font-semibold">
          {title}
        </h2>
        {message && <p className="text-sm text-slate-600">{message}</p>}
        <div className="space-y-2 pt-1">
          {choices.map((c, i) => (
            <Button key={c.value} variant={c.variant ?? (i === 0 ? 'primary' : 'secondary')} block autoFocus={i === 0} onClick={() => onChoose(c.value)}>
              {c.label}
            </Button>
          ))}
          <Button variant="ghost" block onClick={() => onChoose(null)}>
            Abbrechen
          </Button>
        </div>
      </div>
    </div>
  )
}
