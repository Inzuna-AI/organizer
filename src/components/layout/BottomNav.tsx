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
  { to: '/einkauf', label: 'Einkauf', icon: CartIcon },
  { to: '/essen', label: 'Essen', icon: MealsIcon },
  { to: '/notizen', label: 'Notizen', icon: NotesIcon },
]

export function BottomNav() {
  return (
    <nav
      className="pb-safe fixed inset-x-0 bottom-0 z-20 border-t border-slate-200 bg-white/95 backdrop-blur"
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
