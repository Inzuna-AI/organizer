// Darstellung hell/dunkel: Klasse .dark am <html>, Einstellung pro Gerät.
import { loadPref, savePref } from './storage'

export type Theme = 'system' | 'light' | 'dark'

const BAR_LIGHT = '#0f766e'
const BAR_DARK = '#020617'

const media = () => window.matchMedia?.('(prefers-color-scheme: dark)')

export function getTheme(): Theme {
  const t = loadPref<Theme>('theme', 'system')
  return t === 'light' || t === 'dark' ? t : 'system'
}

export function isDark(theme: Theme = getTheme()): boolean {
  return theme === 'dark' || (theme === 'system' && !!media()?.matches)
}

function apply(theme: Theme) {
  const dark = isDark(theme)
  const root = document.documentElement
  root.classList.toggle('dark', dark)
  root.style.colorScheme = dark ? 'dark' : 'light'
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', dark ? BAR_DARK : BAR_LIGHT)
}

export function setTheme(theme: Theme) {
  savePref('theme', theme)
  apply(theme)
}

/** Einmal beim Start: anwenden und bei „System“ auf Änderungen des Geräts reagieren */
export function initTheme() {
  apply(getTheme())
  media()?.addEventListener('change', () => {
    if (getTheme() === 'system') apply('system')
  })
}
