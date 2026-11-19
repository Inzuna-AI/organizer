import { useState, type FormEvent } from 'react'
import { Button } from '@/components/ui/Button'
import { ColorPicker, PALETTE } from '@/components/ui/ColorPicker'
import { TextField } from '@/components/ui/TextField'
import type { PersonInput } from '../store'
import { makeKuerzel } from '../utils'

interface Props {
  initial?: PersonInput
  submitLabel: string
  onSubmit: (input: PersonInput) => void
  onCancel: () => void
}

export function PersonEditor({ initial, submitLabel, onSubmit, onCancel }: Props) {
  const [name, setName] = useState(initial?.name ?? '')
  const [kuerzel, setKuerzel] = useState(initial?.kuerzel ?? '')
  // Solange das Kürzel nicht von Hand geändert wurde, folgt es dem Namen
  const [kuerzelTouched, setKuerzelTouched] = useState(!!initial)
  const [color, setColor] = useState(initial?.color ?? PALETTE[10])

  const shownKuerzel = kuerzelTouched ? kuerzel : makeKuerzel(name)

  function submit(e: FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    onSubmit({ name: name.trim(), kuerzel: (shownKuerzel || makeKuerzel(name)).toUpperCase(), color })
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <TextField label="Name" value={name} onChange={(e) => setName(e.target.value)} autoFocus required />
      <TextField
        label="Kürzel"
        value={shownKuerzel}
        maxLength={3}
        onChange={(e) => {
          setKuerzelTouched(true)
          setKuerzel(e.target.value.toUpperCase())
        }}
        hint="Erscheint als Badge an Aufgaben und im Kalender."
      />
      <ColorPicker value={color} onChange={setColor} />
      <div className="flex gap-2">
        <Button type="submit" className="flex-1" disabled={!name.trim()}>
          {submitLabel}
        </Button>
        <Button variant="secondary" onClick={onCancel}>
          Abbrechen
        </Button>
      </div>
    </form>
  )
}
