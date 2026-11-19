// Personen: Daten lesen (Hooks) und ändern (Aktionen).
import { useMemo } from 'react'
import type { Person } from '@/types/data'
import { alive, newBase, tombstone, updateById } from '@/lib/records'
import { currentPersonId, updateData, useAppStore } from '@/store'

export function usePersons(): Person[] {
  const persons = useAppStore((s) => s.data?.persons)
  return useMemo(() => alive(persons ?? []), [persons])
}

/** Personen nach id, inkl. gelöschter (für alte Zuordnungen). */
export function usePersonMap(): Map<string, Person> {
  const persons = useAppStore((s) => s.data?.persons)
  return useMemo(() => new Map((persons ?? []).map((p) => [p.id, p])), [persons])
}

export type PersonInput = Pick<Person, 'name' | 'kuerzel' | 'color'>

export const personActions = {
  add(input: PersonInput) {
    const me = currentPersonId()
    updateData((d) => ({ ...d, persons: [...d.persons, { ...newBase(me), ...input }] }))
  },

  save(id: string, input: PersonInput) {
    const me = currentPersonId()
    updateData((d) => ({ ...d, persons: updateById(d.persons, id, me, input) }))
  },

  remove(id: string) {
    const me = currentPersonId()
    updateData((d) => ({
      ...d,
      persons: d.persons.map((p) => (p.id === id ? tombstone(p, me) : p)),
    }))
  },
}
