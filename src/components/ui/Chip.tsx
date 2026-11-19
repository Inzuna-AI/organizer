import type { ReactNode } from 'react'

interface Props {
  active: boolean
  onClick: () => void
  children: ReactNode
  color?: string
}

/** Filter-Chip zum An- und Abwählen. */
export function Chip({ active, onClick, children, color }: Props) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`inline-flex min-h-9 shrink-0 items-center gap-1.5 rounded-full border px-3 text-sm whitespace-nowrap ${
        active ? 'border-brand-700 bg-brand-700 text-white' : 'border-slate-300 bg-white text-slate-700'
      }`}
    >
      {color && <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: color }} />}
      {children}
    </button>
  )
}
