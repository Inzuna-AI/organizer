import { Chip } from '@/components/ui/Chip'
import { usePersons } from '@/features/persons'
import { useRooms } from '@/features/rooms'

export interface FilterValue {
  roomId: string | null
  personId: string | null
  mineOnly: boolean
}

interface Props {
  value: FilterValue
  onChange: (v: FilterValue) => void
}

export function TaskFilters({ value, onChange }: Props) {
  const rooms = useRooms()
  const persons = usePersons()
  const set = (patch: Partial<FilterValue>) => onChange({ ...value, ...patch })

  return (
    <div className="space-y-2">
      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1" role="group" aria-label="Filter Person">
        <Chip active={value.mineOnly} onClick={() => set({ mineOnly: !value.mineOnly, personId: null })}>
          Meine Aufgaben
        </Chip>
        {persons.map((p) => (
          <Chip
            key={p.id}
            color={p.color}
            active={value.personId === p.id}
            onClick={() => set({ personId: value.personId === p.id ? null : p.id, mineOnly: false })}
          >
            {p.name}
          </Chip>
        ))}
      </div>
      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1" role="group" aria-label="Filter Raum">
        {rooms.map((r) => (
          <Chip
            key={r.id}
            color={r.color}
            active={value.roomId === r.id}
            onClick={() => set({ roomId: value.roomId === r.id ? null : r.id })}
          >
            {r.icon} {r.name}
          </Chip>
        ))}
      </div>
    </div>
  )
}
