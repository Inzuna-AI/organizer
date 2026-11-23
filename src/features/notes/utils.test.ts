import { describe, expect, it } from 'vitest'
import type { Note } from '@/types/data'
import { checklistProgress, isEmptyNote, noteHeading, notePreview, sortNotes } from './utils'

function note(id: string, o: Partial<Note> = {}): Note {
  return {
    id,
    updatedAt: '2026-11-20T10:00:00.000Z',
    deleted: false,
    createdBy: null,
    updatedBy: null,
    title: '',
    text: '',
    checklist: [],
    color: null,
    pinned: false,
    ...o,
  }
}

describe('sortNotes', () => {
  it('angeheftete zuerst, dann zuletzt geänderte, ohne gelöschte', () => {
    const out = sortNotes([
      note('alt', { updatedAt: '2026-11-01T00:00:00.000Z' }),
      note('neu', { updatedAt: '2026-11-22T00:00:00.000Z' }),
      note('pin', { pinned: true, updatedAt: '2026-10-01T00:00:00.000Z' }),
      note('weg', { deleted: true, updatedAt: '2026-11-23T00:00:00.000Z' }),
    ])
    expect(out.map((n) => n.id)).toEqual(['pin', 'neu', 'alt'])
  })
})

describe('isEmptyNote', () => {
  it('erkennt leere Zettel, auch mit leeren Punkten', () => {
    expect(isEmptyNote({ title: ' ', text: '\n', checklist: [{ id: 'a', title: ' ', done: false }] })).toBe(true)
    expect(isEmptyNote({ title: '', text: '', checklist: [{ id: 'a', title: 'Milch', done: false }] })).toBe(false)
    expect(isEmptyNote({ title: 'WLAN', text: '', checklist: [] })).toBe(false)
  })
})

describe('noteHeading / notePreview', () => {
  it('Titel als Überschrift, Text als Vorschau', () => {
    const n = { title: 'Geschenke', text: 'Buch\nSchal', checklist: [] }
    expect(noteHeading(n)).toBe('Geschenke')
    expect(notePreview(n)).toBe('Buch\nSchal')
  })

  it('ohne Titel: erste Zeile als Überschrift, Rest als Vorschau', () => {
    const n = { title: '', text: '\nWLAN Gäste\nPasswort: xyz', checklist: [] }
    expect(noteHeading(n)).toBe('WLAN Gäste')
    expect(notePreview(n)).toBe('Passwort: xyz')
  })

  it('kürzt lange Vorschauen', () => {
    expect(notePreview({ title: 'x', text: 'a'.repeat(50) }, 10)).toBe(`${'a'.repeat(10)} …`)
  })
})

describe('checklistProgress', () => {
  it('zählt nur Punkte mit Text', () => {
    expect(checklistProgress([])).toBeNull()
    expect(
      checklistProgress([
        { id: '1', title: 'a', done: true },
        { id: '2', title: 'b', done: false },
        { id: '3', title: ' ', done: true },
      ]),
    ).toBe('1/2')
  })
})
