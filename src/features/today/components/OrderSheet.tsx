import { useEffect } from 'react'
import { Button } from '@/components/ui/Button'
import { DEFAULT_ORDER, moveSection, TODAY_SECTIONS, type TodaySection } from '../utils'

interface Props {
  open: boolean
  order: TodaySection[]
  onChange: (order: TodaySection[]) => void
  onClose: () => void
}

const LABEL = new Map(TODAY_SECTIONS.map((s) => [s.key, s.label]))

/** Bottom-Sheet: Reihenfolge der Abschnitte mit ↑/↓ ändern; jede Änderung gilt sofort. */
export function OrderSheet({ open, order, onChange, onClose }: Props) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null
  const isDefault = order.join() === DEFAULT_ORDER.join()

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="order-title"
        className="w-full max-w-md space-y-3 rounded-t-3xl bg-white p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] shadow-xl sm:rounded-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="order-title" className="text-lg font-semibold">
          Reihenfolge anpassen
        </h2>
        <p className="text-sm text-slate-600">Gilt nur auf diesem Gerät. Leere Abschnitte werden in „Heute“ ausgeblendet.</p>
        <ol className="space-y-2">
          {order.map((key, i) => (
            <li key={key} className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 py-1 pr-1 pl-3">
              <span className="flex-1 text-sm font-medium">{LABEL.get(key)}</span>
              <button
                type="button"
                disabled={i === 0}
                onClick={() => onChange(moveSection(order, i, -1))}
                aria-label={`${LABEL.get(key)} nach oben`}
                className="flex size-11 items-center justify-center rounded-lg text-lg text-brand-700 active:bg-brand-50 disabled:text-slate-300"
              >
                ↑
              </button>
              <button
                type="button"
                disabled={i === order.length - 1}
                onClick={() => onChange(moveSection(order, i, 1))}
                aria-label={`${LABEL.get(key)} nach unten`}
                className="flex size-11 items-center justify-center rounded-lg text-lg text-brand-700 active:bg-brand-50 disabled:text-slate-300"
              >
                ↓
              </button>
            </li>
          ))}
        </ol>
        <div className="grid grid-cols-2 gap-2 pt-1">
          <Button variant="secondary" disabled={isDefault} onClick={() => onChange(DEFAULT_ORDER)}>
            Standard
          </Button>
          <Button onClick={onClose}>Fertig</Button>
        </div>
      </div>
    </div>
  )
}
