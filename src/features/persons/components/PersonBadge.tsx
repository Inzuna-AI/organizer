import type { Person } from '@/types/data'

interface Props {
  person: Person
  size?: 'sm' | 'md'
}

/** Kürzel im Farbkreis, z. B. am Aufgabeneintrag. */
export function PersonBadge({ person, size = 'sm' }: Props) {
  const dim = size === 'sm' ? 'h-6 w-6 text-[10px]' : 'h-9 w-9 text-sm'
  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center rounded-full font-semibold text-white ${dim}`}
      style={{ backgroundColor: person.color }}
      title={person.name}
      aria-label={person.name}
    >
      {person.kuerzel}
    </span>
  )
}
