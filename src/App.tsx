import { useEffect } from 'react'
import { HashRouter, Navigate, Route, Routes, useLocation } from 'react-router'
import { BottomNav } from '@/components/layout/BottomNav'
import { Header } from '@/components/layout/Header'
import { useGoBack } from '@/components/layout/useGoBack'
import { useAppStore } from '@/store'
import { SetupPage } from '@/features/setup'
import { SettingsPage } from '@/features/settings'
import { TodayPage } from '@/features/today'
import { EditTaskPage, NewTaskPage, TasksPage } from '@/features/tasks'
import { CalendarPage } from '@/features/calendar'
import { ShoppingPage } from '@/features/shopping'
import { RoomsPage } from '@/features/rooms'
import { PersonsPage } from '@/features/persons'

const TITLES: Record<string, string> = {
  '/': 'Heute',
  '/kalender': 'Kalender',
  '/aufgaben': 'Aufgaben',
  '/aufgaben/neu': 'Neue Aufgabe',
  '/einkauf': 'Einkauf',
  '/einstellungen': 'Einstellungen',
  '/einstellungen/raeume': 'Räume',
  '/einstellungen/personen': 'Personen',
}

/** Übergeordnete Seite einer Unterseite, z. B. /aufgaben/123 → /aufgaben */
function parentOf(pathname: string): string | null {
  const parts = pathname.split('/').filter(Boolean)
  return parts.length > 1 ? `/${parts.slice(0, -1).join('/')}` : null
}

function Shell() {
  const sync = useAppStore((s) => s.sync)
  const syncNow = useAppStore((s) => s.syncNow)
  const { pathname } = useLocation()
  const parent = parentOf(pathname)
  const goBack = useGoBack(parent ?? '/')
  const title = TITLES[pathname] ?? (pathname.startsWith('/aufgaben/') ? 'Aufgabe' : 'Organizer')

  return (
    <div className="flex min-h-full flex-col">
      <Header title={title} sync={sync} onRefresh={() => void syncNow()} onBack={parent ? goBack : undefined} />
      {sync.status === 'readonly' && sync.error && (
        <div role="alert" className="bg-amber-100 px-4 py-2 text-sm text-amber-900">
          {sync.error}
        </div>
      )}
      <main className="mx-auto w-full max-w-xl flex-1 pb-24">
        <Routes>
          <Route path="/" element={<TodayPage />} />
          <Route path="/kalender" element={<CalendarPage />} />
          <Route path="/aufgaben" element={<TasksPage />} />
          <Route path="/aufgaben/neu" element={<NewTaskPage />} />
          <Route path="/aufgaben/:id" element={<EditTaskPage />} />
          <Route path="/einkauf" element={<ShoppingPage />} />
          <Route path="/einstellungen" element={<SettingsPage />} />
          <Route path="/einstellungen/raeume" element={<RoomsPage />} />
          <Route path="/einstellungen/personen" element={<PersonsPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <BottomNav />
    </div>
  )
}

export default function App() {
  const phase = useAppStore((s) => s.phase)

  useEffect(() => {
    useAppStore.getState().init()
  }, [])

  if (phase === 'loading') return null
  if (phase === 'setup') return <SetupPage />
  return (
    <HashRouter>
      <Shell />
    </HashRouter>
  )
}
