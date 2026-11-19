import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { useAppStore } from '@/store'
import { personActions, usePersons } from './store'
import { PersonBadge } from './components/PersonBadge'
import { PersonEditor } from './components/PersonEditor'

export function PersonsPage() {
  const persons = usePersons()
  const myId = useAppStore((s) => s.device?.personId)
  const [editing, setEditing] = useState<string | null>(null)

  function onRemove(id: string, name: string) {
    if (window.confirm(`${name} entfernen? Zugeordnete Aufgaben bleiben erhalten.`)) {
      personActions.remove(id)
      setEditing(null)
    }
  }

  return (
    <div className="space-y-3 p-4">
      <ul className="space-y-2">
        {persons.map((p) =>
          editing === p.id ? (
            <li key={p.id}>
              <Card>
                <PersonEditor
                  initial={p}
                  submitLabel="Speichern"
                  onSubmit={(input) => {
                    personActions.save(p.id, input)
                    setEditing(null)
                  }}
                  onCancel={() => setEditing(null)}
                />
                {p.id !== myId && (
                  <Button variant="danger" block className="mt-3" onClick={() => onRemove(p.id, p.name)}>
                    Person entfernen
                  </Button>
                )}
              </Card>
            </li>
          ) : (
            <li key={p.id}>
              <button
                type="button"
                onClick={() => setEditing(p.id)}
                className="flex min-h-14 w-full items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 text-left"
              >
                <PersonBadge person={p} size="md" />
                <span className="flex-1 font-medium">{p.name}</span>
                {p.id === myId && <span className="text-xs text-slate-500">Das bin ich</span>}
              </button>
            </li>
          ),
        )}
      </ul>

      {editing === 'new' ? (
        <Card title="Neue Person">
          <PersonEditor
            submitLabel="Hinzufügen"
            onSubmit={(input) => {
              personActions.add(input)
              setEditing(null)
            }}
            onCancel={() => setEditing(null)}
          />
        </Card>
      ) : (
        <Button variant="secondary" block onClick={() => setEditing('new')}>
          + Person hinzufügen
        </Button>
      )}
    </div>
  )
}
