import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { roomActions, useRooms } from './store'
import { RoomEditor } from './components/RoomEditor'

export function RoomsPage() {
  const rooms = useRooms()
  const [editing, setEditing] = useState<string | null>(null) // id oder 'new'

  function onRemove(id: string, name: string) {
    if (window.confirm(`Raum „${name}“ löschen? Aufgaben in diesem Raum bleiben erhalten.`)) {
      roomActions.remove(id)
      setEditing(null)
    }
  }

  return (
    <div className="space-y-3 p-4">
      <ul className="space-y-2">
        {rooms.map((r, i) =>
          editing === r.id ? (
            <li key={r.id}>
              <Card>
                <RoomEditor
                  initial={r}
                  submitLabel="Speichern"
                  onSubmit={(input) => {
                    roomActions.save(r.id, input)
                    setEditing(null)
                  }}
                  onCancel={() => setEditing(null)}
                />
                <Button variant="danger" block className="mt-3" onClick={() => onRemove(r.id, r.name)}>
                  Raum löschen
                </Button>
              </Card>
            </li>
          ) : (
            <li key={r.id} className="flex items-center gap-1 rounded-2xl border border-slate-200 bg-white pr-1">
              <button
                type="button"
                onClick={() => setEditing(r.id)}
                className="flex min-h-14 flex-1 items-center gap-3 px-4 text-left"
              >
                <span
                  className="flex h-9 w-9 items-center justify-center rounded-full text-lg"
                  style={{ backgroundColor: `${r.color}33`, border: `2px solid ${r.color}` }}
                  aria-hidden="true"
                >
                  {r.icon}
                </span>
                <span className="font-medium">{r.name}</span>
              </button>
              <button
                type="button"
                onClick={() => roomActions.move(r.id, -1)}
                disabled={i === 0}
                aria-label={`${r.name} nach oben`}
                className="h-11 w-11 rounded-full text-slate-500 active:bg-slate-100 disabled:opacity-30"
              >
                ▲
              </button>
              <button
                type="button"
                onClick={() => roomActions.move(r.id, 1)}
                disabled={i === rooms.length - 1}
                aria-label={`${r.name} nach unten`}
                className="h-11 w-11 rounded-full text-slate-500 active:bg-slate-100 disabled:opacity-30"
              >
                ▼
              </button>
            </li>
          ),
        )}
      </ul>

      {editing === 'new' ? (
        <Card title="Neuer Raum">
          <RoomEditor
            submitLabel="Anlegen"
            onSubmit={(input) => {
              roomActions.add(input)
              setEditing(null)
            }}
            onCancel={() => setEditing(null)}
          />
        </Card>
      ) : (
        <Button variant="secondary" block onClick={() => setEditing('new')}>
          + Raum hinzufügen
        </Button>
      )}
    </div>
  )
}
