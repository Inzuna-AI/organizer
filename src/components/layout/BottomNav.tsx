import { NavLink } from 'react-router'
import type { ComponentType, SVGProps } from 'react'
import { CalendarIcon, CartIcon, MealsIcon, NotesIcon, TasksIcon, TodayIcon } from './icons'

interface Item {
  to: string
  label: string
  icon: ComponentType<SVGProps<SVGSVGElement>>
}

const ITEMS: Item[] = [
  { to: '/', label: 'Heute', icon: TodayIcon },
  { to: '/kalender', label: 'Kalender', icon: CalendarIcon },
  { to: '/aufgaben', label: 'Aufgaben', icon: TasksIcon },
  { to: '/essen', label: 'Essen', icon: MealsIcon },
  { to: '/einkauf', label: 'Einkauf', icon: CartIcon },
  { to: '/notizen', label: 'Notizen', icon: NotesIcon },
]

/** Untere Leiste auf dem Handy (am PC ersetzt durch die Seitenleiste) */
export function BottomNav() {
  return (
    <nav
      className="pb-safe fixed inset-x-0 bottom-0 z-20 border-t border-slate-200 bg-white/95 backdrop-blur lg:hidden"
      aria-label="Hauptnavigation"
    >
      <ul className="mx-auto flex max-w-xl">
        {ITEMS.map(({ to, label, icon: IconCmp }) => (
          <li key={to} className="min-w-0 flex-1">
            <NavLink
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                `flex min-h-14 flex-col items-center justify-center gap-0.5 text-[11px] ${
                  isActive ? 'text-brand-700' : 'text-slate-500'
                }`
              }
            >
              <IconCmp />
              <span className="max-w-full truncate px-0.5">{label}</span>
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  )
}

/** Seitenleiste links am PC (ab 1024 px Breite) */
export function SideNav() {
  return (
    <nav
      className="fixed inset-y-0 left-0 z-20 hidden w-56 flex-col border-r border-slate-200 bg-white lg:flex"
      aria-label="Hauptnavigation"
    >
      <p className="flex h-14 items-center gap-2 px-5 text-lg font-semibold">
        <img src={`${import.meta.env.BASE_URL}icons/icon-192.png`} alt="" className="size-7 rounded-lg" />
        Organizer
      </p>
      <ul className="space-y-1 px-3 py-3">
        {ITEMS.map(({ to, label, icon: IconCmp }) => (
          <li key={to}>
            <NavLink
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                `flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-medium ${
                  isActive ? 'bg-brand-50 text-brand-700' : 'text-slate-600 hover:bg-slate-100'
                }`
              }
            >
              <IconCmp />
              {label}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  )
}
