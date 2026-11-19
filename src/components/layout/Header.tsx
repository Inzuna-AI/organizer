import type { SyncState } from '@/lib/sync'
import { RefreshIcon } from './icons'
import { SyncIndicator } from './SyncIndicator'

interface Props {
  title: string
  sync: SyncState
  onRefresh: () => void
}

export function Header({ title, sync, onRefresh }: Props) {
  const busy = sync.status === 'syncing' || sync.status === 'saving'
  return (
    <header className="pt-safe sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-xl items-center gap-3 px-4">
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
