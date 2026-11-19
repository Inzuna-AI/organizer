import { Link } from 'react-router'

interface Props {
  to: string
  label: string
}

/** Schwebender „+“-Button über der unteren Navigation. */
export function Fab({ to, label }: Props) {
  return (
    <Link
      to={to}
      aria-label={label}
      className="fixed right-4 z-30 flex h-14 w-14 items-center justify-center rounded-full bg-brand-700 text-white shadow-lg active:bg-brand-800"
      style={{ bottom: 'calc(env(safe-area-inset-bottom) + 4.75rem)' }}
    >
      <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" aria-hidden="true">
        <path d="M12 5v14M5 12h14" />
      </svg>
    </Link>
  )
}
