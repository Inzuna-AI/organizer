import type { ReactNode } from 'react'

interface Props {
  title: ReactNode
  open: boolean
  onToggle: () => void
  /** Farbe der Überschrift, z. B. 'text-red-600' */
  tone?: string
  /** Rechts neben der Überschrift, z. B. ein Link */
  extra?: ReactNode
  children: ReactNode
}

/** Abschnitt mit Überschrift zum Ein- und Ausklappen */
export function CollapsibleSection({ title, open, onToggle, tone = 'text-slate-500', extra, children }: Props) {
  return (
    <section>
      <div className="mb-2 flex items-center justify-between gap-2">
        <h3 className={`text-sm font-semibold ${tone}`}>
          <button
            type="button"
            onClick={onToggle}
            aria-expanded={open}
            className="-ml-1 flex min-h-9 items-center gap-1.5 rounded-lg px-1"
          >
            <span aria-hidden className={`inline-block text-xs transition-transform ${open ? 'rotate-90' : ''}`}>
              ▶
            </span>
            {title}
          </button>
        </h3>
        {extra}
      </div>
      {open && children}
    </section>
  )
}
