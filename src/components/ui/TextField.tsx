import type { InputHTMLAttributes } from 'react'

interface Props extends InputHTMLAttributes<HTMLInputElement> {
  label: string
  hint?: string
}

export function TextField({ label, hint, id, className = '', ...rest }: Props) {
  const inputId = id ?? `f-${label.replace(/\W+/g, '-').toLowerCase()}`
  return (
    <div className={`min-w-0 ${className}`}>
      <label htmlFor={inputId} className="mb-1 block text-sm font-medium text-slate-700">
        {label}
      </label>
      {/* min-w-0 + appearance-none: Datums-/Zeitfelder haben auf iOS/Android sonst eine
          feste Mindestbreite und ragen in Nachbarfelder hinein. */}
      <input
        id={inputId}
        className="block min-h-11 w-full min-w-0 appearance-none rounded-xl border border-slate-300 bg-white px-3 text-left text-base outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-100"
        {...rest}
      />
      {hint && <p className="mt-1 text-xs text-slate-500">{hint}</p>}
    </div>
  )
}
