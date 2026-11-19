import { useState, type FormEvent } from 'react'
import { Button } from '@/components/ui/Button'
import { ColorPicker, PALETTE } from '@/components/ui/ColorPicker'
import { TextField } from '@/components/ui/TextField'
import type { RoomInput } from '../store'
import { ROOM_ICONS } from '../utils'

interface Props {
  initial?: RoomInput
  submitLabel: string
  onSubmit: (input: RoomInput) => void
  onCancel: () => void
}

export function RoomEditor({ initial, submitLabel, onSubmit, onCancel }: Props) {
  const [name, setName] = useState(initial?.name ?? '')
  const [icon, setIcon] = useState(initial?.icon ?? '🏠')
  const [color, setColor] = useState(initial?.color ?? PALETTE[0])

  function submit(e: FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    onSubmit({ name: name.trim(), icon: icon.trim(), color })
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <TextField label="Name" value={name} onChange={(e) => setName(e.target.value)} autoFocus required />
      <div>
        <TextField label="Icon" value={icon} onChange={(e) => setIcon(e.target.value)} maxLength={8} />
        <div className="mt-2 flex flex-wrap gap-1" role="group" aria-label="Icon-Vorschläge">
          {ROOM_ICONS.map((i) => (
            <button
              key={i}
              type="button"
              onClick={() => setIcon(i)}
              aria-pressed={icon === i}
              className={`h-10 w-10 rounded-lg text-xl ${icon === i ? 'bg-brand-100' : 'active:bg-slate-100'}`}
            >
              {i}
            </button>
          ))}
        </div>
      </div>
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
