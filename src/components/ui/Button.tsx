import type { ButtonHTMLAttributes } from 'react'

type Variant = 'primary' | 'secondary' | 'danger' | 'ghost'

const STYLES: Record<Variant, string> = {
  primary: 'bg-brand-700 text-white active:bg-brand-800 disabled:bg-slate-300',
  secondary: 'bg-white text-slate-800 border border-slate-300 active:bg-slate-100 disabled:text-slate-400',
  danger: 'bg-white text-red-700 border border-red-300 active:bg-red-50',
  ghost: 'text-brand-700 active:bg-brand-50',
}

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  block?: boolean
}

export function Button({ variant = 'primary', block, className = '', ...rest }: Props) {
  return (
    <button
      type="button"
      className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-4 text-sm font-medium transition-colors disabled:cursor-not-allowed ${STYLES[variant]} ${block ? 'w-full' : ''} ${className}`}
      {...rest}
    />
  )
}
