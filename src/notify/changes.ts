// Benachrichtigungen bei Änderungen: alten und neuen Stand von data.json vergleichen.
import type { CalEvent, DataFile, Device, Occurrence, Task } from '@/types/data'
import { addDays } from '@/lib/dates'
import { eventsBetween, involves, type EventInstance } from '@/lib/events'
import { instanceAt, isSeries } from '@/lib/recurrence'
import { isPeriodTask } from '@/lib/periods'
import {
  activeDevices,
  currentAssignees,
  eventUrl,
  isQuiet,
  listTitles,
  periodSlotLabel,
  personName,
  relevant,
  slotLabel,
  taskUrl,
  type PushPayload,
} from './common'
import { berlinParts } from './time'

export type ChangeKind =
  'newTask' | 'assigned' | 'completed' | 'changed' | 'newShoppingItem' | 'newEvent' | 'changedEvent'

export interface ChangeEvent {
  kind: ChangeKind
  /** Person, die die Änderung gemacht hat */
  by: string | null
  title: string
  taskId: string | null
  /** bei Terminen (newEvent, changedEvent) */
  eventId?: string
  /** Termin einer Serie (ursprüngliches Datum) */
  date: string | null
  roomId: string | null
  /** Zuständige des betroffenen Termins */
  assigneeIds: string[]
  /** nur bei „assigned“: wer jetzt zuständig ist */
  assignee?: string
  /** z. B. „Morgen 10:00“ */
  when?: string
}

/** Felder, deren Änderung als „geändert oder verschoben“ zählt (Checklisten-Haken nicht) */
const WATCHED = [
  'title',
  'description',
  'startAt',
  'allDay',
  'durationMin',
  'roomId',
  'priority',
  'recurrenceRule',
  'recurrenceMode',
  'period',
] as const

/** Termin-Felder, deren Änderung gemeldet wird */
const EVENT_WATCHED = [
  'title',
  'location',
  'startAt',
  'endAt',
  'allDay',
  'personIds',
  'recurrenceRule',
  'exceptions',
] as const

/** Nächstes Vorkommen ab heute (bei vergangenen einmaligen Terminen der Termin selbst) */
function nextEventInstance(e: CalEvent, today: string): EventInstance | null {
  return (
    eventsBetween([e], today, addDays(today, 400))[0] ??
    eventsBetween([e], e.startAt.slice(0, 10), e.startAt.slice(0, 10))[0] ??
    null
  )
}

function whenOf(t: Task, occurrences: Occurrence[], date: string | null, today: string): string | undefined {
  if (isPeriodTask(t)) return periodSlotLabel(t, date ?? t.startAt!.slice(0, 10), today)
  if (isSeries(t) && date) {
    const i = instanceAt(t, occurrences, date)
    return i ? slotLabel(i.startAt, i.allDay, today) : undefined
  }
  return t.startAt ? slotLabel(t.startAt, t.allDay || t.startAt.length < 16, today) : undefined
}

function instanceAssignees(t: Task, occurrences: Occurrence[], date: string): string[] {
  return instanceAt(t, occurrences, date)?.assigneeIds ?? t.assigneeIds
}

/** Alle meldenswerten Änderungen zwischen zwei Ständen */
export function detectChanges(prev: DataFile, next: DataFile, today: string): ChangeEvent[] {
  const events: ChangeEvent[] = []
  const prevTasks = new Map(prev.tasks.map((t) => [t.id, t]))
  const prevOccs = new Map(prev.occurrences.map((o) => [o.id, o]))
  const tasks = new Map(next.tasks.map((t) => [t.id, t]))

  /** Wer hat zuletzt eine Occurrence dieser Aufgabe geändert? (z. B. Abhaken → Rotation) */
  function occChangedBy(taskId: string): string | null {
    let latest: Occurrence | null = null
    for (const o of next.occurrences) {
      if (o.taskId !== taskId || prevOccs.get(o.id)?.updatedAt === o.updatedAt) continue
      if (!latest || o.updatedAt > latest.updatedAt) latest = o
    }
    return latest?.updatedBy ?? null
  }

  for (const t of next.tasks) {
    if (t.deleted) continue
    const p = prevTasks.get(t.id)
    const cur = currentAssignees(t, next.occurrences, today)
    const base = { title: t.title, taskId: t.id, roomId: t.roomId }
    const when = whenOf(t, next.occurrences, cur.date, today)

    if (!p || p.deleted) {
      const by = t.updatedBy ?? t.createdBy
      events.push({ kind: 'newTask', by, ...base, date: cur.date, assigneeIds: cur.ids, when })
      for (const a of cur.ids) {
        events.push({ kind: 'assigned', by, ...base, date: cur.date, assigneeIds: cur.ids, assignee: a, when })
      }
      continue
    }

    const taskChanged = p.updatedAt !== t.updatedAt
    // Neu zuständig: bei Serien auch durch Rotation, wenn der nächste Termin jemand anderem gehört
    const before = currentAssignees(p, prev.occurrences, today)
    const added = cur.ids.filter((id) => !before.ids.includes(id))
    if (added.length > 0) {
      const by = taskChanged ? t.updatedBy : occChangedBy(t.id)
      for (const a of added) {
        events.push({ kind: 'assigned', by, ...base, date: cur.date, assigneeIds: cur.ids, assignee: a, when })
      }
    }

    if (!taskChanged) continue
    if (!isSeries(t) && p.status === 'open' && t.status === 'done') {
      events.push({ kind: 'completed', by: t.updatedBy, ...base, date: null, assigneeIds: t.assigneeIds })
    } else if (WATCHED.some((k) => JSON.stringify(p[k]) !== JSON.stringify(t[k]))) {
      events.push({ kind: 'changed', by: t.updatedBy, ...base, date: cur.date, assigneeIds: cur.ids, when })
    }
  }

  for (const o of next.occurrences) {
    const t = tasks.get(o.taskId)
    if (o.deleted || !t || t.deleted) continue
    const po = prevOccs.get(o.id)
    const base = { title: t.title, taskId: t.id, roomId: t.roomId, date: o.originalDate }
    if (o.status === 'done' && po?.status !== 'done') {
      events.push({
        kind: 'completed',
        by: o.completedBy ?? o.updatedBy,
        ...base,
        assigneeIds: instanceAssignees(t, next.occurrences, o.originalDate),
      })
    }
    if (o.status === 'open' && o.movedTo && o.movedTo !== (po?.movedTo ?? null)) {
      events.push({
        kind: 'changed',
        by: o.updatedBy,
        ...base,
        assigneeIds: instanceAssignees(t, next.occurrences, o.originalDate),
        when: slotLabel(o.movedTo, o.movedTo.length < 16, today),
      })
    }
    if (o.assigneeId && o.assigneeId !== (po?.assigneeId ?? null) && o.status !== 'done') {
      events.push({
        kind: 'assigned',
        by: o.updatedBy,
        ...base,
        assigneeIds: [o.assigneeId],
        assignee: o.assigneeId,
        when: whenOf(t, next.occurrences, o.originalDate, today),
      })
    }
  }

  // Termine: neu angelegt oder geändert (Personen = Beteiligte)
  const prevEvents = new Map((prev.events ?? []).map((e) => [e.id, e]))
  for (const e of next.events ?? []) {
    if (e.deleted) continue
    const p = prevEvents.get(e.id)
    const base = { title: e.title, taskId: null, eventId: e.id, roomId: null, assigneeIds: e.personIds }
    const next1 = nextEventInstance(e, today)
    const when = next1 ? slotLabel(next1.startAt, next1.allDay, today) : undefined
    const date = next1?.date ?? null
    if (!p || p.deleted) {
      events.push({ kind: 'newEvent', by: e.updatedBy ?? e.createdBy, ...base, date, when })
    } else if (
      p.updatedAt !== e.updatedAt &&
      EVENT_WATCHED.some((k) => JSON.stringify(p[k]) !== JSON.stringify(e[k]))
    ) {
      // Neu dazugekommene Personen sollen es auch dann erfahren, wenn sie vorher nicht beteiligt waren
      events.push({ kind: 'changedEvent', by: e.updatedBy, ...base, date, when })
    }
  }

  const prevItems = new Map(prev.shoppingItems.map((i) => [i.id, i]))
  for (const i of next.shoppingItems) {
    // „Nächster Einkauf“ (later) zählt nicht: erst, wenn der Artikel auf die aktuelle Liste kommt
    if (i.deleted || i.checked || i.later) continue
    const pi = prevItems.get(i.id)
    // Neu, wieder auf die Liste gesetzt (z. B. über einen Vorschlag) oder aus „Nächster Einkauf“ geholt
    if (!pi || pi.deleted || pi.checked || pi.later) {
      events.push({
        kind: 'newShoppingItem',
        by: i.updatedBy,
        title: i.name,
        taskId: null,
        date: null,
        roomId: null,
        assigneeIds: [],
      })
    }
  }

  return dedupe(events)
}

function dedupe(events: ChangeEvent[]): ChangeEvent[] {
  const completed = new Set(events.filter((e) => e.kind === 'completed').map((e) => e.taskId))
  const seen = new Set<string>()
  return events.filter((e) => {
    // Abhaken bei „nach Erledigung“ verschiebt auch den Termin – das ist keine eigene Änderung
    if (e.kind === 'changed' && completed.has(e.taskId)) return false
    if (e.kind === 'newShoppingItem') return true
    const key = `${e.kind}|${e.taskId ?? e.eventId}|${e.kind === 'completed' ? e.date : ''}|${e.assignee ?? ''}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

/** Ereignisse, die dieses Gerät laut Einstellungen bekommen soll */
export function eventsForDevice(device: Device, events: ChangeEvent[]): ChangeEvent[] {
  const n = device.notify
  const me = device.personId
  const picked = events.filter((e) => {
    // Nie über eigene Änderungen benachrichtigen
    if (e.by && e.by === me) return false
    switch (e.kind) {
      case 'newShoppingItem':
        return n.newShoppingItem
      case 'assigned':
        return n.assignedToMe && e.assignee === me && relevant(device, e.roomId, [me])
      case 'newTask':
        return n.newTask && relevant(device, e.roomId, e.assigneeIds)
      case 'completed':
        return n.completedByOther && relevant(device, e.roomId, e.assigneeIds)
      case 'changed':
        return n.changedOrMoved && relevant(device, e.roomId, e.assigneeIds)
      case 'newEvent':
      case 'changedEvent':
        // Nur Termine, bei denen ich dabei bin (ohne Personen = alle); Raumfilter gilt hier nicht
        return (n.newEvent ?? true) && involves({ personIds: e.assigneeIds }, me)
    }
  })
  // „Dir zugewiesen“ sagt mehr als „Neue Aufgabe“ – nicht beides für dieselbe Aufgabe
  const assigned = new Set(picked.filter((e) => e.kind === 'assigned').map((e) => e.taskId))
  return picked.filter((e) => !(e.kind === 'newTask' && assigned.has(e.taskId)))
}

const PLURAL: Record<ChangeKind, (n: number) => string> = {
  newTask: (n) => (n === 1 ? '1 neue Aufgabe' : `${n} neue Aufgaben`),
  assigned: (n) => `${n} dir zugewiesen`,
  completed: (n) => `${n} erledigt`,
  changed: (n) => `${n} geändert`,
  newShoppingItem: (n) => (n === 1 ? '1 Einkaufsartikel' : `${n} Einkaufsartikel`),
  newEvent: (n) => (n === 1 ? '1 neuer Termin' : `${n} neue Termine`),
  changedEvent: (n) => (n === 1 ? '1 Termin geändert' : `${n} Termine geändert`),
}

/** Link zu einer Aufgabe oder einem Termin */
function targetUrl(e: ChangeEvent): string | null {
  if (e.taskId) return taskUrl(e.taskId, e.date)
  if (e.eventId) return eventUrl(e.eventId, e.date)
  return null
}

/** Alle Ereignisse eines Commits zu einer Nachricht zusammenfassen */
export function composeMessage(events: ChangeEvent[], data: DataFile): PushPayload | null {
  if (events.length === 0) return null
  const actors = [...new Set(events.map((e) => e.by))]
  const actor = actors.length === 1 ? personName(data, actors[0]) : null
  const who = actor ?? 'Mehrere'
  const kinds = [...new Set(events.map((e) => e.kind))]
  const onlyShopping = kinds.length === 1 && kinds[0] === 'newShoppingItem'
  const targets = [...new Set(events.map((e) => e.taskId ?? e.eventId).filter(Boolean))]
  const url = onlyShopping
    ? '#/einkauf'
    : targets.length === 1 && kinds.every((k) => k !== 'newShoppingItem')
      ? (targetUrl(events.find((e) => e.taskId ?? e.eventId)!) ?? '#/')
      : '#/'

  if (events.length === 1) {
    const e = events[0]
    const withWhen = e.when ? `${e.title} · ${e.when}` : e.title
    switch (e.kind) {
      case 'newTask':
        return { title: `Neue Aufgabe von ${who}`, body: withWhen, url }
      case 'assigned':
        return { title: 'Dir zugewiesen', body: withWhen, url }
      case 'completed':
        return { title: `${who} hat erledigt`, body: e.title, url }
      case 'changed':
        return { title: `${who} hat eine Aufgabe geändert`, body: withWhen, url }
      case 'newShoppingItem':
        return { title: 'Einkaufszettel', body: `${who} hat ${e.title} hinzugefügt`, url }
      case 'newEvent':
        return { title: `Neuer Termin von ${who}`, body: withWhen, url }
      case 'changedEvent':
        return { title: `${who} hat einen Termin geändert`, body: withWhen, url }
    }
  }

  const titles = listTitles(events.map((e) => e.title))
  if (kinds.length === 1) {
    const n = events.length
    switch (kinds[0]) {
      case 'newTask':
        return { title: `${who} hat ${n} neue Aufgaben angelegt`, body: titles, url }
      case 'assigned':
        return { title: `${n} Aufgaben sind dir zugewiesen`, body: titles, url }
      case 'completed':
        return { title: `${who} hat ${n} Aufgaben erledigt`, body: titles, url }
      case 'changed':
        return { title: `${who} hat ${n} Aufgaben geändert`, body: titles, url }
      case 'newShoppingItem':
        return { title: `${who} hat ${n} Artikel hinzugefügt`, body: titles, url }
      case 'newEvent':
        return { title: `${who} hat ${n} neue Termine angelegt`, body: titles, url }
      case 'changedEvent':
        return { title: `${who} hat ${n} Termine geändert`, body: titles, url }
    }
  }

  const counts = kinds.map((k) => PLURAL[k](events.filter((e) => e.kind === k).length))
  return { title: actor ? `Neues von ${actor}` : 'Neues im Organizer', body: counts.join(' · '), url }
}

/** Nachrichten für alle Geräte zu einem Commit */
export function changeMessages(
  prev: DataFile,
  next: DataFile,
  today: string,
): Array<{ device: Device; payload: PushPayload }> {
  const events = detectChanges(prev, next, today)
  const out: Array<{ device: Device; payload: PushPayload }> = []
  for (const device of activeDevices(next)) {
    const payload = composeMessage(eventsForDevice(device, events), next)
    if (payload) out.push({ device, payload })
  }
  return out
}

/**
 * Ein Lauf von „notify-on-change“: Änderungsnachrichten (ohne Ruhezeiten) plus Testnachrichten.
 * Ohne vorherigen Stand (erster Commit) wird nur getestet, nicht gemeldet.
 */
export function changeRun(
  prev: DataFile | null,
  next: DataFile,
  now: Date,
): Array<{ device: Device; payload: PushPayload }> {
  if (!prev) return []
  const today = berlinParts(now).date
  const changes = changeMessages(prev, next, today).filter((m) => !isQuiet(m.device, now))
  return [...changes, ...testMessages(prev, next)]
}

/** Geräte, die gerade „Testbenachrichtigung senden“ angetippt haben */
export function testMessages(prev: DataFile, next: DataFile): Array<{ device: Device; payload: PushPayload }> {
  const before = new Map(prev.devices.map((d) => [d.id, d.testRequestedAt ?? null]))
  return activeDevices(next)
    .filter((d) => d.testRequestedAt && d.testRequestedAt !== before.get(d.id))
    .map((device) => ({
      device,
      payload: {
        title: 'Testbenachrichtigung',
        body: `Push funktioniert auf „${device.name}“.`,
        url: '#/einstellungen/benachrichtigungen',
        tag: 'test',
      },
    }))
}
