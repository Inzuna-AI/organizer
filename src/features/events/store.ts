// Termine: Daten lesen (Hooks) und ändern (Aktionen).
import { useMemo } from 'react'
import type { CalEvent } from '@/types/data'
import { eventInstanceAt, eventsBetween, movedTimes, seriesReshaped,shiftSeries, withException, type EventInstance } from '@/lib/events'
import { newBase, tombstone, updateById } from '@/lib/records'
import { currentPersonId, updateData, useAppStore } from '@/store'
import type { EventInput } from './utils'

/** Alle Termine inkl. gelöschter */
export function useAllEvents(): CalEvent[] {
  const events = useAppStore((s) => s.data?.events)
  return useMemo(() => events ?? [], [events])
}

export function useEvent(id: string | undefined): CalEvent | null {
  return useAppStore((s) => s.data?.events?.find((e) => e.id === id && !e.deleted) ?? null)
}

/** Vorkommen im Zeitraum [from, to] (JJJJ-MM-TT) */
export function useEventsBetween(from: string, to: string): EventInstance[] {
  const events = useAllEvents()
  return useMemo(() => (from && to ? eventsBetween(events, from, to) : []), [events, from, to])
}

/** Ein Vorkommen einer Serie; null, wenn kein Serien-Termin */
export function useEventInstance(event: CalEvent | null, date: string | null): EventInstance | null {
  return useMemo(() => (event && date ? eventInstanceAt(event, date) : null), [event, date])
}

function find(events: CalEvent[], id: string): CalEvent | undefined {
  return events.find((e) => e.id === id && !e.deleted)
}

export const eventActions = {
  create(input: EventInput): string {
    const ev: CalEvent = { ...newBase(currentPersonId()), ...input, exceptions: [] }
    updateData((d) => ({ ...d, events: [...d.events, ev] }))
    return ev.id
  },

  /** Ganze Serie bzw. einmaligen Termin ändern. Geänderter Serien-Rhythmus verwirft Ausnahmen. */
  save(id: string, input: Partial<EventInput>) {
    const me = currentPersonId()
    updateData((d) => {
      const old = find(d.events, id)
      if (!old) return d
      const next = { ...old, ...input }
      const reshaped = !!old.recurrenceRule && seriesReshaped(old, next)
      return { ...d, events: updateById<CalEvent>(d.events, id, me, reshaped ? { ...input, exceptions: [] } : input) }
    })
  },

  /** Einmaligen Termin verschieben (Kalender); endAt undefined = Länge bleibt */
  move(id: string, startAt: string, endAt?: string | null) {
    const me = currentPersonId()
    updateData((d) => ({
      ...d,
      events: updateById<CalEvent>(d.events, id, me, (e) => movedTimes(e, startAt, endAt)),
    }))
  },

  /** Nur dieses Vorkommen auf einen neuen Beginn legen (Dauer bleibt) */
  moveInstance(id: string, date: string, startAt: string) {
    const me = currentPersonId()
    updateData((d) => ({
      ...d,
      events: updateById<CalEvent>(d.events, id, me, (e) => ({ exceptions: withException(e, date, { movedTo: startAt }) })),
    }))
  },

  /** Ganze Serie so verschieben wie das gezogene Vorkommen */
  moveSeries(id: string, date: string, startAt: string, endAt?: string | null, extra: Partial<EventInput> = {}) {
    const me = currentPersonId()
    updateData((d) => ({
      ...d,
      events: updateById<CalEvent>(d.events, id, me, (e) => ({ ...extra, ...shiftSeries({ ...e, ...extra }, date, startAt, endAt) })),
    }))
  },

  /** Ein Vorkommen der Serie fällt aus */
  skipInstance(id: string, date: string) {
    const me = currentPersonId()
    updateData((d) => ({
      ...d,
      events: updateById<CalEvent>(d.events, id, me, (e) => ({ exceptions: withException(e, date, { skipped: true }) })),
    }))
  },

  remove(id: string) {
    const me = currentPersonId()
    updateData((d) => ({ ...d, events: d.events.map((e) => (e.id === id ? tombstone(e, me) : e)) }))
  },
}
