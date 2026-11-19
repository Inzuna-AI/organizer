import type { SyncState } from '@/lib/sync'
import { RefreshIcon } from './icons'
import { SyncIndicator } from './SyncIndicator'

interface Props {
  title: string
  sync: SyncState
  onRefresh: () => void
  /** Zeigt einen Zurück-Pfeil (Unterseiten) */
  onBack?: () => void
}

export function Header({ title, sync, onRefresh, onBack }: Props) {
  const busy = sync.status === 'syncing' || sync.status === 'saving'
  return (
    <header className="pt-safe sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-xl items-center gap-2 px-4">
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            aria-label="Zurück"
            className="-ml-2 flex h-11 w-11 items-center justify-center rounded-full text-slate-700 active:bg-slate-100"
          >
            <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>
        )}
        <h1 className="flex-1 truncate text-lg font-semibold">{title}</h1>
        <SyncIndicator state={sync} />
        <button
          type="button"
          onClick={onRefresh}
          className="-mr-2 flex h-11 w-11 items-center justify-center rounded-full text-slate-600 active:bg-slate-100"
          aria-label="Aktualisieren"
        >
          <RefreshIcon className={busy ? 'animate-spin' : ''} />
        </button>
      </div>
    </header>
  )
}
