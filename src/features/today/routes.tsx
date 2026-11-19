import { formatLongDate } from '@/lib/dates'
import { alive } from '@/lib/records'
import { Card } from '@/components/ui/Card'
import { useAppStore, useMe } from '@/store'

export function TodayPage() {
  const me = useMe()
  const allRooms = useAppStore((s) => s.data?.rooms)
  const sorted = alive(allRooms ?? []).sort((a, b) => a.sortOrder - b.sortOrder)

  return (
    <div className="space-y-4 p-4">
      <div>
        <p className="text-sm text-slate-500">{formatLongDate(new Date())}</p>
        <h2 className="text-2xl font-semibold">Hallo{me ? ` ${me.name}` : ''}!</h2>
      </div>
      <Card title="Heute">
        <p className="text-sm text-slate-500">
          Hier erscheinen ab Phase 2 deine Aufgaben für heute und überfällige Aufgaben.
        </p>
      </Card>
      <Card title="Räume">
        <ul className="flex flex-wrap gap-2">
          {sorted.map((r) => (
            <li
              key={r.id}
              className="flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm"
              style={{ borderColor: r.color }}
            >
              <span aria-hidden="true">{r.icon}</span>
              {r.name}
            </li>
          ))}
        </ul>
      </Card>
    </div>
  )
}
