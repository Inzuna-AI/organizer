// Grundstruktur für eine neue data.json: Personen, Beispielräume, Standard-Einkaufsliste.

import type { DataFile, Person, Room, ShoppingList } from '@/types/data'
import { CURRENT_SCHEMA_VERSION } from '@/lib/migrations'
import { newBase } from '@/lib/records'

const PERSON_COLORS = ['#d9467a', '#3b82f6', '#16a34a', '#f59e0b']

const EXAMPLE_ROOMS: Array<Pick<Room, 'name' | 'icon' | 'color'>> = [
  { name: 'Küche', icon: '🍳', color: '#e76f51' },
  { name: 'Bad', icon: '🛁', color: '#2a9d8f' },
  { name: 'Wohnzimmer', icon: '🛋️', color: '#d4a017' },
  { name: 'Schlafzimmer', icon: '🛏️', color: '#8e7dbe' },
  { name: 'Flur', icon: '🚪', color: '#6c8ea4' },
  { name: 'Balkon', icon: '🌿', color: '#5fa463' },
]

export function makeKuerzel(name: string): string {
  const clean = name.trim()
  const parts = clean.split(/\s+/)
  const k = parts.length > 1 ? parts[0][0] + parts[1][0] : clean.slice(0, 2)
  return k.toUpperCase()
}

export function createPersons(names: string[], existingCount = 0): Person[] {
  return names
    .map((n) => n.trim())
    .filter(Boolean)
    .map((name, i) => ({
      ...newBase(null),
      name,
      kuerzel: makeKuerzel(name),
      color: PERSON_COLORS[(existingCount + i) % PERSON_COLORS.length],
    }))
}

export function createInitialData(names: string[]): DataFile {
  const rooms: Room[] = EXAMPLE_ROOMS.map((r, i) => ({ ...newBase(null), ...r, sortOrder: i + 1 }))
  const shoppingLists: ShoppingList[] = [{ ...newBase(null), name: 'Einkauf', sortOrder: 1 }]
  return {
    schemaVersion: CURRENT_SCHEMA_VERSION,
    persons: createPersons(names),
    rooms,
    tasks: [],
    occurrences: [],
    events: [],
    shoppingLists,
    shoppingItems: [],
    devices: [],
  }
}
