import type { Room } from '@/types/data'

/** Kleine Raum-Kennzeichnung: Farbpunkt, Icon und Name. */
export function RoomBadge({ room }: { room: Room }) {
  return (
    <span className="inline-flex items-center gap-1 text-xs text-slate-600">
      <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: room.color }} />
      <span aria-hidden="true">{room.icon}</span>
      {room.name}
    </span>
  )
}
