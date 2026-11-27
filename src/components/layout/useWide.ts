import { useSyncExternalStore } from 'react'

/** Gleiche Grenze wie Tailwind `lg:` – ab hier gilt die PC-Ansicht mit Seitenleiste */
const QUERY = '(min-width: 1024px)'

function subscribe(cb: () => void) {
  const mq = window.matchMedia(QUERY)
  mq.addEventListener('change', cb)
  return () => mq.removeEventListener('change', cb)
}

/** true, wenn das Fenster breit genug für die PC-Ansicht ist (reagiert auf Größenänderungen) */
export function useWide(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(QUERY).matches,
    () => false,
  )
}

/** true, wenn hauptsächlich mit der Maus bedient wird (für Hinweistexte) */
export function useMouse(): boolean {
  return useSyncExternalStore(
    (cb) => {
      const mq = window.matchMedia('(pointer: fine)')
      mq.addEventListener('change', cb)
      return () => mq.removeEventListener('change', cb)
    },
    () => window.matchMedia('(pointer: fine)').matches,
    () => false,
  )
}
