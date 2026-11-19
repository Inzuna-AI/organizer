import { useState } from 'react'
import { useNavigate } from 'react-router'
import { ChoiceDialog } from './ChoiceDialog'

interface Props {
  label: string
  /** Auswahl, z. B. Termin oder Aufgabe, jeweils mit Ziel */
  options: Array<{ label: string; to: string }>
  title?: string
}

/** „+“-Button, der zuerst fragt, was angelegt werden soll. */
export function FabChoice({ label, options, title = 'Was möchtest du anlegen?' }: Props) {
  const [open, setOpen] = useState(false)
  const navigate = useNavigate()
  return (
    <>
      <button
        type="button"
        aria-label={label}
        onClick={() => setOpen(true)}
        className="fixed right-4 z-30 flex h-14 w-14 items-center justify-center rounded-full bg-brand-700 text-white shadow-lg active:bg-brand-800"
        style={{ bottom: 'calc(env(safe-area-inset-bottom) + 4.75rem)' }}
      >
        <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" aria-hidden="true">
          <path d="M12 5v14M5 12h14" />
        </svg>
      </button>
      <ChoiceDialog<string>
        open={open}
        title={title}
        choices={options.map((o, i) => ({ value: String(i), label: o.label }))}
        onChoose={(v) => {
          setOpen(false)
          if (v !== null) navigate(options[Number(v)].to)
        }}
      />
    </>
  )
}
