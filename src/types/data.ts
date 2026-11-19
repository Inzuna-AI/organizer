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
}

export interface NotifySettings {
  newTask: boolean
  assignedToMe: boolean
  completedByOther: boolean
  changedOrMoved: boolean
  newShoppingItem: boolean
  onlyMyTasks: boolean
  dueReminder: boolean
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
}

export interface DataFile {
  schemaVersion: number
  persons: Person[]
  rooms: Room[]
  tasks: Task[]
  occurrences: Occurrence[]
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
  'shoppingLists',
  'shoppingItems',
  'devices',
] as const

export type CollectionName = (typeof COLLECTIONS)[number]
