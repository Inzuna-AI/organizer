// Nur für Tests: kleine Datensätze bauen.
import type { DataFile, Room } from '@/types/data'
import { CURRENT_SCHEMA_VERSION } from './migrations'

export function emptyData(): DataFile {
  return {
    schemaVersion: CURRENT_SCHEMA_VERSION,
    persons: [],
    rooms: [],
    tasks: [],
    occurrences: [],
    events: [],
    shoppingLists: [],
    shoppingItems: [],
    notes: [],
    recipes: [],
    meals: [],
    devices: [],
  }
}

export function room(id: string, name: string, updatedAt: string, deleted = false): Room {
  return {
    id,
    name,
    updatedAt,
    deleted,
    createdBy: null,
    updatedBy: null,
    color: '#000000',
    icon: '',
    sortOrder: 0,
  }
}

export function withRooms(...rooms: Room[]): DataFile {
  return { ...emptyData(), rooms }
}
