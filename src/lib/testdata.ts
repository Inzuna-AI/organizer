// Nur für Tests: kleine Datensätze bauen.
import type { DataFile, Room } from '@/types/data'

export function emptyData(): DataFile {
  return {
    schemaVersion: 1,
    persons: [],
    rooms: [],
    tasks: [],
    occurrences: [],
    shoppingLists: [],
    shoppingItems: [],
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
