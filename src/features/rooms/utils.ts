import type { Room } from '@/types/data'

export function sortRooms(rooms: Room[]): Room[] {
  return [...rooms].sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name, 'de'))
}

/**
 * Verschiebt einen Raum um eine Position nach oben (-1) oder unten (+1).
 * Gibt die neuen sortOrder-Werte nur für geänderte Räume zurück (id → sortOrder).
 */
export function moveRoom(rooms: Room[], id: string, dir: -1 | 1): Map<string, number> {
  const sorted = sortRooms(rooms)
  const i = sorted.findIndex((r) => r.id === id)
  const j = i + dir
  const changes = new Map<string, number>()
  if (i < 0 || j < 0 || j >= sorted.length) return changes
  const order = [...sorted]
  ;[order[i], order[j]] = [order[j], order[i]]
  order.forEach((r, idx) => {
    if (r.sortOrder !== idx + 1) changes.set(r.id, idx + 1)
  })
  return changes
}

export function nextSortOrder(rooms: Room[]): number {
  return rooms.reduce((max, r) => Math.max(max, r.sortOrder), 0) + 1
}

/** Häufige Icons für Räume */
export const ROOM_ICONS = ['🍳', '🛁', '🚿', '🛋️', '🛏️', '🚪', '🌿', '🧺', '🧸', '💻', '🚗', '🗑️', '🏠', '🐾', '🪴', '🧹']
