import { describe, expect, it } from 'vitest'
import type { DataFile, Device, NotifySettings, Occurrence, ShoppingItem, Task } from '@/types/data'
import { changeRun, composeMessage, detectChanges, eventsForDevice, testMessages } from './changes'
import { expireDevices } from './common'
import { emptyState, reminderRun } from './reminders'
import { berlinParts, berlinWallToDate, inQuietHours } from './time'

const T0 = '2026-11-01T00:00:00.000Z'
const T1 = '2026-11-19T09:00:00.000Z'
const ME = 'me'
const LENA = 'lena'

function task(o: Partial<Task>): Task {
  return {
    id: 't',
    updatedAt: T0,
    deleted: false,
    createdBy: LENA,
    updatedBy: LENA,
    title: 'Aufgabe',
    description: '',
    roomId: null,
    priority: 'medium',
    startAt: null,
    allDay: false,
    durationMin: null,
    status: 'open',
    completedAt: null,
    assigneeIds: [],
    recurrenceRule: null,
    recurrenceMode: 'fixed',
    rotation: false,
    checklist: [],
    ...o,
  }
}

const NOTIFY: NotifySettings = {
  newTask: true,
  assignedToMe: true,
  completedByOther: true,
  changedOrMoved: true,
  newShoppingItem: true,
  onlyMyTasks: false,
  dueReminder: true,
  dueReminderMinutesBefore: 60,
  dailySummary: true,
  dailySummaryTime: '07:30',
  quietHours: null,
  rooms: [],
}

function device(id: string, personId: string, notify: Partial<NotifySettings> = {}): Device {
  return {
    id,
    updatedAt: T0,
    deleted: false,
    createdBy: personId,
    updatedBy: personId,
    personId,
    name: `Handy ${id}`,
    pushSubscription: { endpoint: `https://push/${id}`, keys: { p256dh: 'x', auth: 'y' } },
    notify: { ...NOTIFY, ...notify },
  }
}

function data(o: Partial<DataFile> = {}): DataFile {
  return {
    schemaVersion: 1,
    persons: [
      { id: ME, name: 'Ich', kuerzel: 'IC', color: '#000', updatedAt: T0, deleted: false, createdBy: null, updatedBy: null },
      { id: LENA, name: 'Lena', kuerzel: 'LE', color: '#000', updatedAt: T0, deleted: false, createdBy: null, updatedBy: null },
    ],
    rooms: [],
    tasks: [],
    occurrences: [],
    shoppingLists: [],
    shoppingItems: [],
    devices: [device('d-me', ME), device('d-lena', LENA)],
    ...o,
  }
}

function item(id: string, name: string, o: Partial<ShoppingItem> = {}): ShoppingItem {
  return {
    id,
    updatedAt: T1,
    deleted: false,
    createdBy: LENA,
    updatedBy: LENA,
    listId: 'l',
    name,
    quantity: '',
    note: '',
    checked: false,
    checkedAt: null,
    sortOrder: 0,
    ...o,
  }
}

const TODAY = '2026-11-19'
const NOON = new Date('2026-11-19T11:00:00Z') // 12:00 Berlin

describe('time', () => {
  it('rechnet Berliner Wandzeit in echte Zeitpunkte um (Winter- und Sommerzeit)', () => {
    expect(berlinWallToDate('2026-11-20T10:00').toISOString()).toBe('2026-11-20T09:00:00.000Z')
    expect(berlinWallToDate('2026-07-01T10:00').toISOString()).toBe('2026-07-01T08:00:00.000Z')
    expect(berlinParts(new Date('2026-11-19T23:30:00Z'))).toEqual({ date: '2026-11-20', time: '00:30' })
  })

  it('Ruhezeiten auch über Mitternacht', () => {
    const q = { from: '22:00', to: '07:00' }
    expect(inQuietHours('23:00', q)).toBe(true)
    expect(inQuietHours('06:59', q)).toBe(true)
    expect(inQuietHours('07:00', q)).toBe(false)
    expect(inQuietHours('12:00', { from: '12:00', to: '14:00' })).toBe(true)
    expect(inQuietHours('12:00', null)).toBe(false)
  })
})

describe('Änderungen', () => {
  it('neue Aufgabe von Lena, mir zugewiesen → nur mein Gerät, als „Dir zugewiesen“', () => {
    const prev = data()
    const next = data({ tasks: [task({ title: 'Bad putzen', assigneeIds: [ME], startAt: '2026-11-20T10:00', updatedAt: T1 })] })
    const msgs = changeRun(prev, next, NOON)
    expect(msgs.map((m) => m.device.id)).toEqual(['d-me'])
    expect(msgs[0].payload).toMatchObject({ title: 'Dir zugewiesen', body: 'Bad putzen · Morgen 10:00', url: '#/aufgaben/t' })
  })

  it('mehrere neue Aufgaben werden zu einer Nachricht', () => {
    const next = data({
      tasks: [task({ id: 'a', title: 'A' }), task({ id: 'b', title: 'B' }), task({ id: 'c', title: 'C' })],
    })
    const msgs = changeRun(data(), next, NOON)
    expect(msgs).toHaveLength(1)
    expect(msgs[0].payload).toMatchObject({ title: 'Lena hat 3 neue Aufgaben angelegt', body: 'A, B, C', url: '#/' })
  })

  it('Einkaufsartikel gebündelt, auch wieder geöffnete', () => {
    const prev = data({ shoppingItems: [item('x', 'Brot', { checked: true, updatedAt: T0 })] })
    const next = data({
      shoppingItems: [item('x', 'Brot'), item('m', 'Milch'), item('e', 'Eier'), item('k', 'Käse'), item('a', 'Äpfel')],
    })
    const [msg] = changeRun(prev, next, NOON)
    expect(msg.device.id).toBe('d-me')
    expect(msg.payload).toMatchObject({ title: 'Lena hat 5 Artikel hinzugefügt', body: 'Brot, Milch, Eier und 2 weitere', url: '#/einkauf' })
  })

  it('Abhaken mit Rotation: Lena bekommt „erledigt“ und „dir zugewiesen“ in einer Nachricht', () => {
    const series = task({
      id: 's',
      title: 'Müll',
      startAt: '2026-11-16',
      allDay: true,
      recurrenceRule: 'FREQ=WEEKLY;BYDAY=MO,TH',
      rotation: true,
      assigneeIds: [ME, LENA],
      createdBy: ME,
      updatedBy: ME,
    })
    // Termine: Mo 16. (0 → ME), Do 19. (1 → LENA), Mo 23. (2 → ME) …
    // Ich erledige den Termin am 19. → nächster offener ist der 23. (ME). Also Rotation andersherum testen:
    const done19: Occurrence = {
      id: 's:2026-11-19',
      taskId: 's',
      originalDate: '2026-11-19',
      movedTo: null,
      status: 'done',
      completedAt: T1,
      completedBy: ME,
      assigneeId: ME,
      updatedAt: T1,
      deleted: false,
      createdBy: ME,
      updatedBy: ME,
    }
    const done16 = { ...done19, id: 's:2026-11-16', originalDate: '2026-11-16', assigneeId: null, updatedAt: T0 }
    // Vorher: 16. erledigt, 19. (Lena, von mir übernommen) offen
    const prev = data({ tasks: [series], occurrences: [done16, { ...done19, status: 'open', completedAt: null, completedBy: null, updatedAt: T0 }] })
    const next = data({ tasks: [series], occurrences: [done16, done19] })
    const msgs = changeRun(prev, next, NOON)
    // Nächster offener Termin: 23.11. → Index 2 → ME. Lena wird nicht neu zuständig.
    expect(msgs.map((m) => m.device.id)).toEqual(['d-lena'])
    expect(msgs[0].payload).toMatchObject({ title: 'Ich hat erledigt', body: 'Müll' })

    // Erledige ich am 23. (ME) → nächster ist Do 26. (Index 3 → LENA)
    const done23 = { ...done19, id: 's:2026-11-23', originalDate: '2026-11-23', assigneeId: null }
    const msgs2 = changeRun(next, data({ tasks: [series], occurrences: [done16, done19, done23] }), NOON)
    expect(msgs2).toHaveLength(1)
    expect(msgs2[0].device.id).toBe('d-lena')
    expect(msgs2[0].payload).toMatchObject({ title: 'Neues von Ich', body: '1 dir zugewiesen · 1 erledigt' })
  })

  it('„nach Erledigung“: Abhaken meldet nur „erledigt“, nicht zusätzlich „geändert“', () => {
    const before = task({ id: 'a', title: 'Gießen', startAt: '2026-11-19', allDay: true, recurrenceRule: 'FREQ=DAILY;INTERVAL=3', recurrenceMode: 'after_completion' })
    const after = { ...before, startAt: '2026-11-22', updatedAt: T1 }
    const occ: Occurrence = {
      id: 'a:2026-11-19', taskId: 'a', originalDate: '2026-11-19', movedTo: null, status: 'done',
      completedAt: T1, completedBy: LENA, assigneeId: null, updatedAt: T1, deleted: false, createdBy: LENA, updatedBy: LENA,
    }
    const events = detectChanges(data({ tasks: [before] }), data({ tasks: [after], occurrences: [occ] }), TODAY)
    expect(events.map((e) => e.kind)).toEqual(['completed'])
  })

  it('Einstellungen: eigene Änderungen, abgeschaltete Arten, Räume und „nur meine“', () => {
    const events = detectChanges(
      data(),
      data({
        tasks: [
          task({ id: 'a', title: 'Küche', roomId: 'kueche' }),
          task({ id: 'b', title: 'Bad', roomId: 'bad', assigneeIds: [LENA] }),
          task({ id: 'c', title: 'Meins', createdBy: ME, updatedBy: ME }),
        ],
      }),
      TODAY,
    )
    const titles = (d: Device) => eventsForDevice(d, events).map((e) => e.title)
    expect(titles(device('1', ME))).toEqual(['Küche', 'Bad'])
    expect(titles(device('2', ME, { newTask: false }))).toEqual([])
    expect(titles(device('3', ME, { rooms: ['bad'] }))).toEqual(['Bad'])
    expect(titles(device('4', ME, { onlyMyTasks: true }))).toEqual([])
  })

  it('Änderung an Titel oder Termin wird gemeldet, Checkliste nicht', () => {
    const a = task({ id: 'a', title: 'Alt', checklist: [{ id: 'c', title: 'x', done: false }] })
    const ticked = { ...a, checklist: [{ id: 'c', title: 'x', done: true }], updatedAt: T1 }
    expect(detectChanges(data({ tasks: [a] }), data({ tasks: [ticked] }), TODAY)).toEqual([])
    const renamed = { ...a, title: 'Neu', updatedAt: T1 }
    const [msg] = changeRun(data({ tasks: [a] }), data({ tasks: [renamed] }), NOON)
    expect(msg.payload.title).toBe('Lena hat eine Aufgabe geändert')
  })

  it('Ruhezeiten unterdrücken Änderungen, aber nicht den Test', () => {
    const quiet = data({ devices: [device('d-me', ME, { quietHours: { from: '11:00', to: '13:00' } })] })
    const next = { ...quiet, tasks: [task({})], devices: quiet.devices.map((d) => ({ ...d, testRequestedAt: T1 })) }
    const msgs = changeRun(quiet, next, NOON)
    expect(msgs.map((m) => m.payload.tag)).toEqual(['test'])
  })

  it('Testanfrage nur bei geändertem Zeitstempel', () => {
    const d = data({ devices: [{ ...device('d-me', ME), testRequestedAt: T0 }] })
    expect(testMessages(d, d)).toEqual([])
    const asked = { ...d, devices: [{ ...d.devices[0], testRequestedAt: T1 }] }
    expect(testMessages(d, asked)[0].payload.body).toBe('Push funktioniert auf „Handy d-me“.')
  })

  it('ohne vorherigen Stand keine Nachrichten', () => {
    expect(changeRun(null, data({ tasks: [task({})] }), NOON)).toEqual([])
  })

  it('composeMessage: mehrere Personen', () => {
    const msg = composeMessage(
      [
        { kind: 'completed', by: ME, title: 'A', taskId: 'a', date: null, roomId: null, assigneeIds: [] },
        { kind: 'newShoppingItem', by: LENA, title: 'Milch', taskId: null, date: null, roomId: null, assigneeIds: [] },
      ],
      data(),
    )
    expect(msg).toMatchObject({ title: 'Neues im Organizer', body: '1 erledigt · 1 Einkaufsartikel', url: '#/' })
  })
})

describe('Erinnerungen und Zusammenfassung', () => {
  const at = (iso: string) => new Date(iso)
  const timed = task({ id: 'a', title: 'Arzt', startAt: '2026-11-19T15:00', assigneeIds: [ME] })
  const onlyMe = (o: Partial<NotifySettings> = {}) => [device('d-me', ME, { dailySummary: false, ...o })]

  it('60 Minuten vorher (stündlicher Lauf: bis zu 30 Minuten früher)', () => {
    const d = data({ tasks: [timed], devices: onlyMe() })
    // 13:20 Berlin: zu früh
    expect(reminderRun(d, emptyState(), at('2026-11-19T12:20:00Z')).messages).toEqual([])
    // 13:35 Berlin: Erinnerung (Soll 14:00)
    const run = reminderRun(d, emptyState(), at('2026-11-19T12:35:00Z'))
    expect(run.messages[0].payload).toMatchObject({ title: 'Erinnerung', body: 'Arzt · Heute 15:00', url: '#/aufgaben/a' })
    // nächster Lauf: nicht noch einmal
    expect(reminderRun(d, run.state, at('2026-11-19T13:35:00Z')).messages).toEqual([])
  })

  it('Lenas Aufgaben erinnern mich nicht, Aufgaben ohne Zuständige schon', () => {
    const d = data({
      tasks: [{ ...timed, assigneeIds: [LENA] }, { ...timed, id: 'b', title: 'Offen', assigneeIds: [] }],
      devices: onlyMe(),
    })
    const run = reminderRun(d, emptyState(), at('2026-11-19T13:30:00Z'))
    expect(run.messages.map((m) => m.payload.body)).toEqual(['Offen · Heute 15:00'])
  })

  it('ganztägige Aufgaben und „am Morgen“ ab 07:00', () => {
    const allDay = task({ id: 'g', title: 'Müll', startAt: '2026-11-19', allDay: true, assigneeIds: [ME] })
    const d = data({ tasks: [allDay, timed], devices: onlyMe({ dueReminderMinutesBefore: -1 }) })
    expect(reminderRun(d, emptyState(), at('2026-11-19T05:30:00Z')).messages).toEqual([]) // 06:30
    const run = reminderRun(d, emptyState(), at('2026-11-19T06:05:00Z')) // 07:05
    expect(run.messages[0].payload).toMatchObject({ title: 'Erinnerung: 2 Aufgaben', body: 'Müll, Arzt' })
  })

  it('Serien: Termin von heute, erledigte nicht', () => {
    const series = task({ id: 's', title: 'Gießen', startAt: '2026-11-16T15:00', recurrenceRule: 'FREQ=DAILY', assigneeIds: [ME] })
    const done: Occurrence = {
      id: 's:2026-11-19', taskId: 's', originalDate: '2026-11-19', movedTo: null, status: 'done',
      completedAt: T1, completedBy: ME, assigneeId: null, updatedAt: T1, deleted: false, createdBy: ME, updatedBy: ME,
    }
    const d = data({ tasks: [series], devices: onlyMe() })
    expect(reminderRun(d, emptyState(), at('2026-11-19T13:30:00Z')).messages[0].payload.url).toBe('#/aufgaben/s?datum=2026-11-19')
    expect(reminderRun({ ...d, occurrences: [done] }, emptyState(), at('2026-11-19T13:30:00Z')).messages).toEqual([])
  })

  it('Ruhezeiten: nichts senden und nichts als erledigt merken', () => {
    const d = data({ tasks: [timed], devices: onlyMe({ quietHours: { from: '13:00', to: '14:00' } }) })
    const run = reminderRun(d, emptyState(), at('2026-11-19T12:35:00Z'))
    expect(run.messages).toEqual([])
    expect(run.state.sent).toEqual({})
  })

  it('tägliche Zusammenfassung einmal am Tag ab der Wunschzeit', () => {
    const overdue = task({ id: 'o', title: 'Alt', startAt: '2026-11-17', allDay: true, assigneeIds: [ME] })
    const d = data({ tasks: [timed, overdue], devices: [device('d-me', ME, { dueReminder: false })] })
    expect(reminderRun(d, emptyState(), at('2026-11-19T06:00:00Z')).messages).toEqual([]) // 07:00
    const run = reminderRun(d, emptyState(), at('2026-11-19T07:05:00Z')) // 08:05
    expect(run.messages[0].payload).toMatchObject({ title: 'Dein Tag', body: 'Heute: 1 Aufgabe, 1 überfällig\nAlt, Arzt' })
    expect(reminderRun(d, run.state, at('2026-11-19T08:05:00Z')).messages).toEqual([])
    // viel zu spät (nach 3 Stunden) nicht mehr nachholen
    expect(reminderRun(d, emptyState(), at('2026-11-19T10:35:00Z')).messages).toEqual([])
  })

  it('ohne Aufgaben keine Zusammenfassung, aber als erledigt gemerkt', () => {
    const run = reminderRun(data({ devices: [device('d-me', ME)] }), emptyState(), at('2026-11-19T07:05:00Z'))
    expect(run.messages).toEqual([])
    expect(run.state.summaries).toEqual({ 'd-me': TODAY })
  })

  it('alte Einträge werden aufgeräumt', () => {
    const state = { sent: { alt: '2026-11-10T00:00:00Z', neu: '2026-11-19T00:00:00Z' }, summaries: {} }
    expect(Object.keys(reminderRun(data({ devices: [] }), state, NOON).state.sent)).toEqual(['neu'])
  })
})

describe('abgelaufene Anmeldungen', () => {
  it('werden als gelöscht markiert', () => {
    const out = expireDevices(data(), ['d-lena'], T1)
    expect(out.devices.find((d) => d.id === 'd-lena')).toMatchObject({ deleted: true, pushSubscription: null, updatedAt: T1 })
    expect(out.devices.find((d) => d.id === 'd-me')?.deleted).toBe(false)
  })
})
