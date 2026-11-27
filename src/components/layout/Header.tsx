import type { SyncState } from '@/lib/sync'
import { RefreshIcon, SearchIcon, SettingsIcon } from './icons'
import { SyncIndicator } from './SyncIndicator'

interface Props {
  title: string
  sync: SyncState
  onRefresh: () => void
  /** Zeigt einen Zurück-Pfeil (Unterseiten) */
  onBack?: () => void
  /** Zeigt eine Lupe, die zur Suche führt */
  onSearch?: () => void
  /** Zahnrad ganz rechts, öffnet die Einstellungen */
  onSettings: () => void
  /** Gerade in den Einstellungen (Zahnrad hervorgehoben) */
  settingsActive?: boolean
}

export function Header({ title, sync, onRefresh, onBack, onSearch, onSettings, settingsActive }: Props) {
  const busy = sync.status === 'syncing' || sync.status === 'saving'
  return (
    <header className="pt-safe sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-xl items-center gap-1 px-4 lg:max-w-none lg:px-8">
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
        <h1 className="min-w-0 flex-1 truncate text-lg font-semibold">{title}</h1>
        <SyncIndicator state={sync} />
        {onSearch && (
          <button
            type="button"
            onClick={onSearch}
            className="flex h-11 w-10 shrink-0 items-center justify-center rounded-full text-slate-600 active:bg-slate-100"
            aria-label="Suchen"
          >
            <SearchIcon />
          </button>
        )}
        <button
          type="button"
          onClick={onRefresh}
          className="flex h-11 w-10 shrink-0 items-center justify-center rounded-full text-slate-600 active:bg-slate-100"
          aria-label="Aktualisieren"
        >
          <RefreshIcon className={busy ? 'animate-spin' : ''} />
        </button>
        <button
          type="button"
          onClick={onSettings}
          className={`-mr-2 flex h-11 w-10 shrink-0 items-center justify-center rounded-full active:bg-slate-100 ${
            settingsActive ? 'text-brand-700' : 'text-slate-600'
          }`}
          aria-label="Einstellungen"
          aria-current={settingsActive ? 'page' : undefined}
        >
          <SettingsIcon />
        </button>
      </div>
    </header>
  )
}
