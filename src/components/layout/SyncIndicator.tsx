// Dezenter Sync-Status: „Synchronisiert“, „Wird gespeichert…“, „Offline“ …
import type { SyncState } from '@/lib/sync'

interface Props {
  state: SyncState
}

function label(state: SyncState): { text: string; dot: string } {
  switch (state.status) {
    case 'offline':
      return { text: 'Offline', dot: 'bg-slate-400' }
    case 'error':
      return { text: 'Fehler beim Sync', dot: 'bg-red-500' }
    case 'readonly':
      return { text: 'Nur lesen', dot: 'bg-amber-500' }
    case 'saving':
      return { text: 'Wird gespeichert…', dot: 'bg-amber-400 animate-pulse' }
    case 'syncing':
      return { text: 'Aktualisiere…', dot: 'bg-brand-500 animate-pulse' }
    default:
      return state.dirty
        ? { text: 'Wird gespeichert…', dot: 'bg-amber-400 animate-pulse' }
        : { text: 'Synchronisiert', dot: 'bg-emerald-500' }
  }
}

export function SyncIndicator({ state }: Props) {
  const { text, dot } = label(state)
  return (
    <span
      className="inline-flex items-center gap-1.5 text-xs text-slate-500"
      role="status"
      aria-live="polite"
      title={state.error ?? text}
    >
      <span className={`h-2 w-2 rounded-full ${dot}`} />
      {text}
    </span>
  )
}
