import { useEffect } from 'react'
import { HashRouter, Navigate, Route, Routes, useLocation } from 'react-router'
import { BottomNav } from '@/components/layout/BottomNav'
import { Header } from '@/components/layout/Header'
import { useAppStore } from '@/store'
import { SetupPage } from '@/features/setup'
import { SettingsPage } from '@/features/settings'
import { TodayPage } from '@/features/today'
import { TasksPage } from '@/features/tasks'
import { CalendarPage } from '@/features/calendar'
import { ShoppingPage } from '@/features/shopping'

const TITLES: Record<string, string> = {
  '/': 'Heute',
  '/kalender': 'Kalender',
  '/aufgaben': 'Aufgaben',
  '/einkauf': 'Einkauf',
  '/einstellungen': 'Einstellungen',
}

function Shell() {
  const sync = useAppStore((s) => s.sync)
  const syncNow = useAppStore((s) => s.syncNow)
  const { pathname } = useLocation()

  return (
    <div className="flex min-h-full flex-col">
      <Header title={TITLES[pathname] ?? 'Organizer'} sync={sync} onRefresh={() => void syncNow()} />
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
          <Route path="/einkauf" element={<ShoppingPage />} />
          <Route path="/einstellungen" element={<SettingsPage />} />
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
