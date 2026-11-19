import type { NotifySettings } from '@/types/data'

/** Standard für ein neu angemeldetes Gerät */
export const NOTIFY_DEFAULTS: NotifySettings = {
  newTask: true,
  assignedToMe: true,
  completedByOther: false,
  changedOrMoved: false,
  newShoppingItem: false,
  newEvent: true,
  onlyMyTasks: false,
  dueReminder: true,
  dueReminderMinutesBefore: 60,
  dailySummary: true,
  dailySummaryTime: '07:30',
  quietHours: { from: '22:00', to: '07:00' },
  rooms: [],
}

export const REMINDER_OPTIONS: Array<{ value: string; label: string }> = [
  { value: 'off', label: 'Aus' },
  { value: '0', label: 'Zum Zeitpunkt' },
  { value: '5', label: '5 Minuten vorher' },
  { value: '15', label: '15 Minuten vorher' },
  { value: '30', label: '30 Minuten vorher' },
  { value: '60', label: '1 Stunde vorher' },
  { value: '1440', label: '1 Tag vorher' },
  { value: '-1', label: 'Am Morgen (7 Uhr)' },
]

export function reminderValue(n: NotifySettings): string {
  return n.dueReminder ? String(n.dueReminderMinutesBefore) : 'off'
}

export function reminderPatch(value: string): Partial<NotifySettings> {
  return value === 'off' ? { dueReminder: false } : { dueReminder: true, dueReminderMinutesBefore: Number(value) }
}

/** Räume-Filter umschalten; leer = alle */
export function toggleRoom(rooms: string[], id: string): string[] {
  return rooms.includes(id) ? rooms.filter((r) => r !== id) : [...rooms, id]
}
