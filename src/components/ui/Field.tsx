import type { ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react'

const INPUT =
  'block min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-base outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-100'

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string
  children: ReactNode
}

export function SelectField({ label, id, children, className = '', ...rest }: SelectProps) {
  const inputId = id ?? `s-${label.replace(/\W+/g, '-').toLowerCase()}`
  return (
    <div className={className}>
      <label htmlFor={inputId} className="mb-1 block text-sm font-medium text-slate-700">
        {label}
      </label>
      <select id={inputId} className={INPUT} {...rest}>
        {children}
      </select>
    </div>
  )
}

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string
}

export function TextareaField({ label, id, className = '', ...rest }: TextareaProps) {
  const inputId = id ?? `t-${label.replace(/\W+/g, '-').toLowerCase()}`
  return (
    <div className={className}>
      <label htmlFor={inputId} className="mb-1 block text-sm font-medium text-slate-700">
        {label}
      </label>
      <textarea id={inputId} rows={3} className={`${INPUT} py-2`} {...rest} />
    </div>
  )
}
