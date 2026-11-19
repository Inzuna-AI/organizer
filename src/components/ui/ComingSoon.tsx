interface Props {
  title: string
  phase: string
  text: string
}

/** Platzhalter für Bereiche, die in einer späteren Phase kommen. */
export function ComingSoon({ title, phase, text }: Props) {
  return (
    <div className="flex flex-col items-center px-6 py-16 text-center">
      <span className="mb-3 rounded-full bg-brand-50 px-3 py-1 text-xs font-medium text-brand-700">{phase}</span>
      <h2 className="mb-2 text-xl font-semibold">{title}</h2>
      <p className="max-w-sm text-sm text-slate-500">{text}</p>
    </div>
  )
}
