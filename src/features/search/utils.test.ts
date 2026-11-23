import { describe, expect, it } from 'vitest'
import type { CalEvent, Note, Task } from '@/types/data'
import { haystack, matches, normalize, searchEvents, searchNotes, searchTasks } from './utils'

function task(o: Partial<Task>): Task {
  return {
    id: 't',
    updatedAt: '2026-11-01T00:00:00.000Z',
    deleted: false,
    createdBy: null,
    updatedBy: null,
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

const noRoom = () => undefined

describe('normalize/matches', () => {
  it('ignoriert Groß-/Kleinschreibung, Umlaute und ß', () => {
    expect(normalize('Küche Straße')).toBe('kuche strasse')
    expect(matches(normalize('Küche putzen'), 'KUCHE')).toBe(true)
    expect(matches(normalize('Küche putzen'), 'küche')).toBe(true)
  })

  it('alle Wörter müssen vorkommen', () => {
    expect(matches('bad putzen', 'putzen bad')).toBe(true)
    expect(matches('bad putzen', 'bad saugen')).toBe(false)
    expect(matches('bad putzen', '   ')).toBe(false)
  })

  it('durchsucht Beschreibung, Checkliste und Raum', () => {
    const t = task({ description: 'mit Essig', checklist: [{ id: 'c', title: 'Spiegel', done: false }] })
    const text = haystack(t, 'Badezimmer')
    expect(matches(text, 'essig')).toBe(true)
    expect(matches(text, 'spiegel')).toBe(true)
    expect(matches(text, 'badezimmer')).toBe(true)
  })
})

describe('searchTasks', () => {
  it('trennt offen und erledigt, ohne gelöschte', () => {
    const tasks = [
      task({ id: 'a', title: 'Bad putzen', startAt: '2026-11-20' }),
      task({ id: 'b', title: 'Bad streichen', status: 'done', completedAt: '2026-11-01T10:00:00Z' }),
      task({ id: 'c', title: 'Bad alt', deleted: true }),
      task({ id: 'd', title: 'Küche' }),
    ]
    const r = searchTasks(tasks, tasks.filter((t) => !t.deleted), 'bad', noRoom)
    expect(r.open.map((t) => t.id)).toEqual(['a'])
    expect(r.done.map((t) => t.id)).toEqual(['b'])
  })

  it('Serie erscheint einmal mit dem nächsten offenen Termin', () => {
    const s = task({ id: 's', title: 'Blumen', startAt: '2026-11-10', recurrenceRule: 'FREQ=DAILY' })
    const instances = [
      { ...s, startAt: '2026-11-19', occurrenceDate: '2026-11-19' },
      { ...s, startAt: '2026-11-18', occurrenceDate: '2026-11-18' },
      { ...s, startAt: '2026-11-17', status: 'done' as const, completedAt: 'x', occurrenceDate: '2026-11-17' },
    ]
    const r = searchTasks([s], instances, 'blumen', noRoom)
    expect(r.open.map((t) => t.occurrenceDate)).toEqual(['2026-11-18'])
    expect(r.done).toEqual([])
  })
})


describe('searchEvents', () => {
  const base = { updatedAt: 'x', deleted: false, createdBy: null, updatedBy: null }
  const ev = (id: string, title: string, startAt: string, o: Partial<CalEvent> = {}): CalEvent => ({
    ...base, id, title, location: '', note: '', startAt, endAt: null, allDay: false, personIds: [], recurrenceRule: null, exceptions: [], ...o,
  })
  it('findet Titel, Ort und Notiz; kommende vor vergangenen', () => {
    const list = [
      ev('a', 'Zahnarzt', '2026-11-25T10:00', { location: 'Praxis Müller' }),
      ev('b', 'Elternabend', '2026-11-01T19:00', { note: 'Müller fragen' }),
      ev('c', 'Training', '2026-11-02T18:00', { recurrenceRule: 'FREQ=WEEKLY;BYDAY=MO' }),
    ]
    const r = searchEvents(list, 'muller', '2026-11-19')
    expect(r.upcoming.map((i) => i.event.id)).toEqual(['a'])
    expect(r.past.map((i) => i.event.id)).toEqual(['b'])
    expect(searchEvents(list, 'training', '2026-11-19').upcoming[0].startAt).toBe('2026-11-23T18:00')
  })
})

describe('searchNotes', () => {
  const n = (id: string, o: Partial<Note>): Note => ({
    id,
    updatedAt: '2026-11-01T00:00:00.000Z',
    deleted: false,
    createdBy: null,
    updatedBy: null,
    title: '',
    text: '',
    checklist: [],
    color: null,
    pinned: false,
    ...o,
  })

  it('findet Titel, Text und Punkte, ohne gelöschte; angeheftete zuerst', () => {
    const list = [
      n('a', { title: 'Geschenke', text: 'Buch für Lena' }),
      n('b', { checklist: [{ id: 'x', title: 'Geschenkpapier', done: false }], pinned: true }),
      n('c', { title: 'Geschenke alt', deleted: true }),
      n('d', { title: 'WLAN', text: 'Passwort' }),
    ]
    expect(searchNotes(list, 'geschenk').map((x) => x.id)).toEqual(['b', 'a'])
    expect(searchNotes(list, 'fur lena').map((x) => x.id)).toEqual(['a'])
  })
})
