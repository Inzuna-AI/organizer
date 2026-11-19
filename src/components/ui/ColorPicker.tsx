// Farbauswahl mit Farben, die auf hellem und dunklem Hintergrund lesbar sind.

export const PALETTE = [
  '#e76f51',
  '#d97706',
  '#d4a017',
  '#5fa463',
  '#2a9d8f',
  '#0891b2',
  '#3b82f6',
  '#6c8ea4',
  '#8e7dbe',
  '#a855f7',
  '#d9467a',
  '#78716c',
]

interface Props {
  value: string
  onChange: (color: string) => void
  label?: string
}

export function ColorPicker({ value, onChange, label = 'Farbe' }: Props) {
  return (
    <fieldset>
      <legend className="mb-1 text-sm font-medium text-slate-700">{label}</legend>
      <div className="grid grid-cols-6 gap-2">
        {PALETTE.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => onChange(c)}
            aria-label={`Farbe ${c}`}
            aria-pressed={value.toLowerCase() === c}
            className={`h-10 rounded-full border-2 ${
              value.toLowerCase() === c ? 'border-slate-900 ring-2 ring-white ring-inset' : 'border-transparent'
            }`}
            style={{ backgroundColor: c }}
          />
        ))}
      </div>
    </fieldset>
  )
}
