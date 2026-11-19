import { describe, expect, it } from 'vitest'
import type { Person, Room, Task } from '@/types/data'
import { addMinutes, moveChange, taskToEvent, tasksToEvents, textColorFor, toLocalString, type EventContext } from './utils'

const base = { updatedAt: '2026-11-19T10:00:00Z', deleted: false, createdBy: null, updatedBy: null }
const room: Room = { ...base, id: 'r', name: 'Bad', color: '#0891b2', icon: '🛁', sortOrder: 1 }
const lena: Person = { ...base, id: 'l', name: 'Lena', kuerzel: 'LE', color: '#db2777' }
const max: Person = { ...base, id: 'm', name: 'Max', kuerzel: 'MA', color: '#2563eb' }

function task(p: Partial<Task>): Task {
  return {
    ...base,
    id: 't',
    title: 'Bad putzen',
    description: '',
    roomId: 'r',
    priority: 'medium',
    startAt: '2026-11-20T10:00',
    allDay: false,
    durationMin: 45,
    status: 'open',
    completedAt: null,
    assigneeIds: ['l', 'm'],
    recurrenceRule: null,
    recurrenceMode: 'fixed',
    rotation: false,
    checklist: [],
    ...p,
  }
}

const ctx = (mode: EventContext['mode']): EventContext => ({
  mode,
  rooms: new Map([[room.id, room]]),
  persons: new Map([
    [lena.id, lena],
    [max.id, max],
  ]),
})

describe('toLocalString / addMinutes', () => {
  it('formatiert lokal', () => {
    expect(toLocalString(new Date(2026, 0, 5, 7, 3), false)).toBe('2026-01-05T07:03')
    expect(toLocalString(new Date(2026, 0, 5, 7, 3), true)).toBe('2026-01-05')
  })
  it('rechnet über Mitternacht', () => {
    expect(addMinutes('2026-11-20T23:30', 45)).toBe('2026-11-21T00:15')
  })
})

describe('textColorFor', () => {
  it('helle Farben → dunkle Schrift, dunkle → weiß', () => {
    expect(textColorFor('#fde047')).toBe('#0f172a')
    expect(textColorFor('#1e3a8a')).toBe('#ffffff')
    expect(textColorFor('kaputt')).toBe('#ffffff')
  })
})

describe('taskToEvent', () => {
  it('Termin mit Uhrzeit: Ende aus Dauer, Farbe des Raums, Kürzel', () => {
    const e = taskToEvent(task({}), ctx('room'))!
    expect(e).toMatchObject({ start: '2026-11-20T10:00', end: '2026-11-20T10:45', allDay: false, backgroundColor: '#0891b2' })
    expect(e.extendedProps.badges.map((b) => b.kuerzel)).toEqual(['LE', 'MA'])
    expect(e.extendedProps.icon).toBe('🛁')
  })
  it('Farbe nach Person = erste zuständige Person', () => {
    expect(taskToEvent(task({}), ctx('person'))!.backgroundColor).toBe('#db2777')
    expect(taskToEvent(task({ assigneeIds: [] }), ctx('person'))!.backgroundColor).toBe('#64748b')
  })
  it('ganztägig ohne Ende, ohne Dauer 30 Min., erledigt markiert', () => {
    expect(taskToEvent(task({ startAt: '2026-11-20', allDay: true }), ctx('room'))).toMatchObject({
      start: '2026-11-20',
      allDay: true,
      end: undefined,
    })
    expect(taskToEvent(task({ durationMin: null }), ctx('room'))!.end).toBe('2026-11-20T10:30')
    expect(taskToEvent(task({ status: 'done' }), ctx('room'))!.classNames).toEqual(['task-done'])
  })
  it('Inbox und gelöschte erscheinen nicht', () => {
    expect(tasksToEvents([task({ startAt: null }), task({ deleted: true }), task({ id: 'x' })], ctx('room'))).toHaveLength(1)
  })
})

describe('moveChange', () => {
  it('Verschieben behält die Dauer, Resize berechnet sie neu', () => {
    const s = new Date(2026, 10, 21, 9, 0)
    expect(moveChange(s, false, new Date(2026, 10, 21, 9, 45))).toEqual({ startAt: '2026-11-21T09:00', allDay: false })
    expect(moveChange(s, false, new Date(2026, 10, 21, 10, 30), true)).toEqual({
      startAt: '2026-11-21T09:00',
      allDay: false,
      durationMin: 90,
    })
    expect(moveChange(s, true, null)).toEqual({ startAt: '2026-11-21', allDay: true })
  })
})
