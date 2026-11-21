// Gesamttyp von data.json.
// Hinweis: Solange die Features noch klein sind, liegen die Datentypen hier zentral.
// src/lib darf nicht aus src/features importieren, deshalb bleiben gemeinsam genutzte
// Typen an dieser Stelle.

/** Felder, die jeder Datensatz hat (Grundlage für den Merge). */
export interface BaseRecord {
  id: string
  /** ISO-Zeitstempel der letzten Änderung */
  updatedAt: string
  /** Tombstone: gelöschte Datensätze bleiben erhalten */
  deleted: boolean
  createdBy: string | null
  updatedBy: string | null
}

export interface Person extends BaseRecord {
  name: string
  kuerzel: string
  color: string
}

export interface Room extends BaseRecord {
  name: string
  color: string
  icon: string
  sortOrder: number
}

export type Priority = 'low' | 'medium' | 'high'
export type RecurrenceMode = 'fixed' | 'after_completion'

export interface ChecklistItem {
  id: string
  title: string
  done: boolean
}

export interface Task extends BaseRecord {
  title: string
  description: string
  roomId: string | null
  priority: Priority
  /** z. B. "2026-11-20T10:00" oder "2026-11-20"; null = Inbox */
  startAt: string | null
  allDay: boolean
  durationMin: number | null
  status: 'open' | 'done'
  completedAt: string | null
  assigneeIds: string[]
  recurrenceRule: string | null
  recurrenceMode: RecurrenceMode
  rotation: boolean
  checklist: ChecklistItem[]
  /**
   * Erinnerungen zu festen Uhrzeiten (seit v1.2.0, optional), z. B. "-1@15:00" = Vortag 15 Uhr.
   * Fehlt oder leer = keine Erinnerung. (Ein altes Feld reminderMin aus v1.1.0 wird ignoriert.)
   */
  reminderTimes?: string[]
  /**
   * Zeitraum statt festem Tag (seit v1.4.0, optional): „irgendwann in dieser Woche/diesem Monat/Quartal/Halbjahr/Jahr“.
   * startAt ist dann der erste Tag des Zeitraums (Montag bzw. Monats-/Quartals-/Halbjahres-/Jahresanfang, ganztägig), siehe lib/periods.ts.
   */
  period?: 'week' | 'month' | 'quarter' | 'half' | 'year' | null
}

export interface Occurrence extends BaseRecord {
  taskId: string
  originalDate: string
  movedTo: string | null
  status: 'open' | 'done' | 'skipped'
  completedAt: string | null
  completedBy: string | null
  assigneeId: string | null
}

/** Abweichung eines einzelnen Termins einer Termin-Serie („Nur diesen Termin“) */
export interface EventException {
  /** ursprüngliches Datum laut Regel (JJJJ-MM-TT) */
  date: string
  /** neuer Beginn im startAt-Format; null = nicht verschoben */
  movedTo: string | null
  /** Termin fällt aus */
  skipped: boolean
}

/** Termin im Kalender (kein Abhaken, keine Räume) */
export interface CalEvent extends BaseRecord {
  title: string
  location: string
  note: string
  /** "2026-11-20T10:00" oder ganztägig "2026-11-20" (lokale Wandzeit) */
  startAt: string
  /**
   * Ende: mit Uhrzeit "2026-11-20T11:30" (auch an einem späteren Tag),
   * ganztägig der letzte Tag inklusive "2026-11-22"; null = Standarddauer bzw. ein Tag
   */
  endAt: string | null
  allDay: boolean
  /** Beteiligte Personen; alle = ganze Familie, leer = niemand Bestimmtes */
  personIds: string[]
  /** RRULE ohne DTSTART wie bei Aufgaben (Serienstart = startAt), null = einmalig */
  recurrenceRule: string | null
  exceptions: EventException[]
  /** Feste Erinnerungszeiten wie bei Aufgaben */
  reminderTimes?: string[]
}

export interface ShoppingList extends BaseRecord {
  name: string
  sortOrder: number
}

export interface ShoppingItem extends BaseRecord {
  listId: string
  name: string
  quantity: string
  note: string
  checked: boolean
  checkedAt: string | null
  sortOrder: number
  /** Zurückgestellt für den nächsten Einkauf (optional, seit v1.7.0); fehlt = aktuelle Liste */
  later?: boolean
}

export interface NotifySettings {
  newTask: boolean
  assignedToMe: boolean
  completedByOther: boolean
  changedOrMoved: boolean
  newShoppingItem: boolean
  /** Neuer oder geänderter Termin, an dem ich beteiligt bin (seit schemaVersion 2) */
  newEvent: boolean
  onlyMyTasks: boolean
  /** Erinnerungen (feste Uhrzeiten der Einträge) auf diesem Gerät an/aus */
  dueReminder: boolean
  /** Nicht mehr verwendet (seit v1.3.0 nur noch feste Uhrzeiten pro Eintrag); bleibt für ältere App-Versionen */
  dueReminderMinutesBefore: number
  dailySummary: boolean
  dailySummaryTime: string
  quietHours: { from: string; to: string } | null
  rooms: string[]
}

export interface Device extends BaseRecord {
  personId: string
  name: string
  pushSubscription: {
    endpoint: string
    keys: { p256dh: string; auth: string }
  } | null
  notify: NotifySettings
  /** „Testbenachrichtigung senden“: Der Workflow schickt einen Test, wenn sich der Wert ändert. */
  testRequestedAt?: string | null
}

export interface DataFile {
  schemaVersion: number
  persons: Person[]
  rooms: Room[]
  tasks: Task[]
  occurrences: Occurrence[]
  events: CalEvent[]
  shoppingLists: ShoppingList[]
  shoppingItems: ShoppingItem[]
  devices: Device[]
}

/** Alle Sammlungen in data.json, die aus Datensätzen mit BaseRecord bestehen. */
export const COLLECTIONS = [
  'persons',
  'rooms',
  'tasks',
  'occurrences',
  'events',
  'shoppingLists',
  'shoppingItems',
  'devices',
] as const

export type CollectionName = (typeof COLLECTIONS)[number]
