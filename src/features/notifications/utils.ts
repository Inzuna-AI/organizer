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

/** Räume-Filter umschalten; leer = alle */
export function toggleRoom(rooms: string[], id: string): string[] {
  return rooms.includes(id) ? rooms.filter((r) => r !== id) : [...rooms, id]
}
