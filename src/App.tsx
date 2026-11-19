import { lazy, Suspense, useEffect } from 'react'
import { HashRouter, Navigate, Route, Routes, useLocation, useNavigate } from 'react-router'
import { BottomNav } from '@/components/layout/BottomNav'
import { Header } from '@/components/layout/Header'
import { useGoBack } from '@/components/layout/useGoBack'
import { useAppStore } from '@/store'
import { SetupPage } from '@/features/setup'
import { SettingsPage } from '@/features/settings'
import { TodayPage } from '@/features/today'
import { EditTaskPage, NewTaskPage, TasksPage } from '@/features/tasks'
import { EditEventPage, NewEventPage } from '@/features/events'
// Kalender (FullCalendar) erst beim Öffnen laden, damit der Start schnell bleibt
const CalendarPage = lazy(() => import('@/features/calendar').then((m) => ({ default: m.CalendarPage })))
import { ShoppingPage } from '@/features/shopping'
import { RoomsPage } from '@/features/rooms'
import { PersonsPage } from '@/features/persons'
import { SearchPage } from '@/features/search'
import { NotificationsPage, notificationActions } from '@/features/notifications'
import { listenForNavigation } from '@/lib/push'

// Tipp auf eine Benachrichtigung, während die App offen ist
listenForNavigation()

const TITLES: Record<string, string> = {
  '/': 'Heute',
  '/kalender': 'Kalender',
  '/aufgaben': 'Aufgaben',
  '/aufgaben/neu': 'Neue Aufgabe',
  '/termine/neu': 'Neuer Termin',
  '/einkauf': 'Einkauf',
  '/suche': 'Suche',
  '/einstellungen': 'Einstellungen',
  '/einstellungen/raeume': 'Räume',
  '/einstellungen/personen': 'Personen',
  '/einstellungen/benachrichtigungen': 'Benachrichtigungen',
}

/** Übergeordnete Seite einer Unterseite, z. B. /aufgaben/123 → /aufgaben */
function parentOf(pathname: string): string | null {
  if (pathname === '/suche') return '/'
  // Termine haben keine eigene Liste, sie stehen im Kalender
  if (pathname.startsWith('/termine/')) return '/kalender'
  const parts = pathname.split('/').filter(Boolean)
  return parts.length > 1 ? `/${parts.slice(0, -1).join('/')}` : null
}

function Shell() {
  const sync = useAppStore((s) => s.sync)
  const syncNow = useAppStore((s) => s.syncNow)
  const { pathname } = useLocation()
  const parent = parentOf(pathname)
  const goBack = useGoBack(parent ?? '/')
  const navigate = useNavigate()
  const device = useAppStore((s) => s.device)
  const hasData = useAppStore((s) => !!s.data)
  // Push-Eintrag dieses Geräts aktuell halten (Person, Name, erneuerte Anmeldung)
  useEffect(() => {
    if (hasData) void notificationActions.refresh()
  }, [device, hasData])
  const title = TITLES[pathname] ?? (pathname.startsWith('/aufgaben/') ? 'Aufgabe' : pathname.startsWith('/termine/') ? 'Termin' : 'Organizer')
  // Lupe auf den Hauptseiten, die Aufgaben zeigen
  const searchable = pathname === '/' || pathname === '/aufgaben' || pathname === '/kalender'

  return (
    <div className="flex min-h-full flex-col">
      <Header
        title={title}
        sync={sync}
        onRefresh={() => void syncNow()}
        onBack={parent ? goBack : undefined}
        onSearch={searchable ? () => navigate('/suche') : undefined}
      />
      {sync.status === 'readonly' && sync.error && (
        <div role="alert" className="bg-amber-100 px-4 py-2 text-sm text-amber-900 dark:bg-amber-950 dark:text-amber-200">
          {sync.error}
        </div>
      )}
      <main className="mx-auto w-full max-w-xl flex-1 pb-24">
        <Routes>
          <Route path="/" element={<TodayPage />} />
          <Route
            path="/kalender"
            element={
              <Suspense fallback={<p className="p-8 text-center text-sm text-slate-500">Kalender wird geladen …</p>}>
                <CalendarPage />
              </Suspense>
            }
          />
          <Route path="/aufgaben" element={<TasksPage />} />
          <Route path="/aufgaben/neu" element={<NewTaskPage />} />
          <Route path="/aufgaben/:id" element={<EditTaskPage />} />
          <Route path="/termine/neu" element={<NewEventPage />} />
          <Route path="/termine/:id" element={<EditEventPage />} />
          <Route path="/einkauf" element={<ShoppingPage />} />
          <Route path="/suche" element={<SearchPage />} />
          <Route path="/einstellungen" element={<SettingsPage />} />
          <Route path="/einstellungen/raeume" element={<RoomsPage />} />
          <Route path="/einstellungen/personen" element={<PersonsPage />} />
          <Route path="/einstellungen/benachrichtigungen" element={<NotificationsPage />} />
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
