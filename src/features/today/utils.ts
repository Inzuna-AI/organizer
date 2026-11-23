// Reihenfolge der Abschnitte in „Heute“ (pro Gerät gespeichert, Pref `todayOrder`)

export type TodaySection = 'events' | 'meal' | 'overdue' | 'today' | 'period' | 'links' | 'done'

export const TODAY_SECTIONS: Array<{ key: TodaySection; label: string }> = [
  { key: 'events', label: '📅 Termine heute' },
  { key: 'meal', label: '🍽️ Mittagessen' },
  { key: 'overdue', label: '⚠️ Überfällig' },
  { key: 'today', label: '☐ Aufgaben heute' },
  { key: 'period', label: '🗓️ Im Zeitraum' },
  { key: 'links', label: '📥 Inbox & Morgen' },
  { key: 'done', label: '✓ Erledigt heute' },
]

export const DEFAULT_ORDER: TodaySection[] = TODAY_SECTIONS.map((s) => s.key)

/**
 * Gespeicherte Reihenfolge bereinigen: unbekannte/doppelte Einträge fallen weg,
 * fehlende (z. B. neue Abschnitte späterer Versionen) kommen an ihrer Standardposition dazu.
 */
export function normalizeOrder(saved: unknown): TodaySection[] {
  const known = new Set<string>(DEFAULT_ORDER)
  const out: TodaySection[] = []
  if (Array.isArray(saved)) {
    for (const k of saved) if (typeof k === 'string' && known.has(k) && !out.includes(k as TodaySection)) out.push(k as TodaySection)
  }
  DEFAULT_ORDER.forEach((k, i) => {
    if (out.includes(k)) return
    // hinter den Vorgänger aus der Standardreihenfolge einsortieren
    const prev = DEFAULT_ORDER.slice(0, i).reverse().find((p) => out.includes(p))
    out.splice(prev ? out.indexOf(prev) + 1 : 0, 0, k)
  })
  return out
}

/** Eintrag an Position i um delta (−1 = nach oben, +1 = nach unten) verschieben */
export function moveSection(order: TodaySection[], i: number, delta: number): TodaySection[] {
  const j = i + delta
  if (i < 0 || j < 0 || i >= order.length || j >= order.length) return order
  const next = [...order]
  ;[next[i], next[j]] = [next[j], next[i]]
  return next
}
