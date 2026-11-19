// Räume: Daten lesen (Hooks) und ändern (Aktionen).
import { useMemo } from 'react'
import type { Room } from '@/types/data'
import { alive, newBase, tombstone, updateById } from '@/lib/records'
import { currentPersonId, updateData, useAppStore } from '@/store'
import { moveRoom, nextSortOrder, sortRooms } from './utils'

/** Alle Räume (ohne gelöschte), sortiert. */
export function useRooms(): Room[] {
  const rooms = useAppStore((s) => s.data?.rooms)
  return useMemo(() => sortRooms(alive(rooms ?? [])), [rooms])
}

/** Räume nach id, inkl. gelöschter (damit alte Aufgaben ihren Raum noch anzeigen). */
export function useRoomMap(): Map<string, Room> {
  const rooms = useAppStore((s) => s.data?.rooms)
  return useMemo(() => new Map((rooms ?? []).map((r) => [r.id, r])), [rooms])
}

export type RoomInput = Pick<Room, 'name' | 'icon' | 'color'>

export const roomActions = {
  add(input: RoomInput) {
    const me = currentPersonId()
    updateData((d) => ({
      ...d,
      rooms: [...d.rooms, { ...newBase(me), ...input, sortOrder: nextSortOrder(alive(d.rooms)) }],
    }))
  },

  save(id: string, input: RoomInput) {
    const me = currentPersonId()
    updateData((d) => ({ ...d, rooms: updateById(d.rooms, id, me, input) }))
  },

  remove(id: string) {
    const me = currentPersonId()
    updateData((d) => ({ ...d, rooms: d.rooms.map((r) => (r.id === id ? tombstone(r, me) : r)) }))
  },

  move(id: string, dir: -1 | 1) {
    const me = currentPersonId()
    updateData((d) => {
      const changes = moveRoom(alive(d.rooms), id, dir)
      if (changes.size === 0) return d
      let rooms = d.rooms
      for (const [rid, sortOrder] of changes) rooms = updateById(rooms, rid, me, { sortOrder })
      return { ...d, rooms }
    })
  },
}
