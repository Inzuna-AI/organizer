interface Props<T extends string> {
  value: T
  options: ReadonlyArray<{ value: T; label: string }>
  onChange: (value: T) => void
  label?: string
}

/** Umschalter zwischen Ansichten einer Seite (z. B. Wochenplan / Gerichte, Kalender / Stundenplan) */
export function Tabs<T extends string>({ value, options, onChange, label = 'Ansicht' }: Props<T>) {
  return (
    <div
      className="grid rounded-xl bg-slate-200 p-1 text-sm"
      style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}
      role="tablist"
      aria-label={label}
    >
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="tab"
          aria-selected={value === o.value}
          onClick={() => onChange(o.value)}
          className={`min-h-10 rounded-lg font-medium ${value === o.value ? 'bg-white shadow-sm' : 'text-slate-600'}`}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}
