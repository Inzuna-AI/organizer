// Einstieg für die Workflows im Daten-Repo. Wird mit `npm run build:notify` zu
// data-repo-template/scripts/notify.mjs gebündelt (rrule und App-Logik inklusive, nur web-push extern).
//
//   node scripts/notify.mjs change     → nach einem Push auf data.json (notify-on-change.yml)
//   node scripts/notify.mjs reminders  → stündlich (reminders.yml)
//
// Wichtig: Keine Aufgabeninhalte ins Log schreiben, nur Zahlen.

import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import webpush from 'web-push'
import type { DataFile, Device } from '@/types/data'
import { normalizeData, serializeData } from '@/lib/merge'
import { changeRun } from '@/notify/changes'
import { expireDevices, type PushPayload } from '@/notify/common'
import { emptyState, reminderRun, type NotifyState } from '@/notify/reminders'

const DATA = 'data.json'
const STATE = 'notify-state.json'

function parseData(text: string): DataFile {
  return normalizeData(JSON.parse(text) as DataFile)
}

/** Stand von data.json vor dem letzten Commit; null beim allerersten Commit */
function previousData(): DataFile | null {
  try {
    const text = execFileSync('git', ['show', `HEAD~1:${DATA}`], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] })
    return text.trim() ? parseData(text) : null
  } catch {
    return null
  }
}

function readState(): NotifyState {
  if (!existsSync(STATE)) return emptyState()
  try {
    return { ...emptyState(), ...(JSON.parse(readFileSync(STATE, 'utf8')) as NotifyState) }
  } catch {
    return emptyState()
  }
}

async function send(messages: Array<{ device: Device; payload: PushPayload }>): Promise<string[]> {
  const expired: string[] = []
  let ok = 0
  let failed = 0
  for (const { device, payload } of messages) {
    try {
      await webpush.sendNotification(device.pushSubscription!, JSON.stringify(payload), { TTL: 12 * 3600 })
      ok++
    } catch (e) {
      const status = (e as { statusCode?: number }).statusCode
      if (status === 404 || status === 410) expired.push(device.id)
      else failed++
      console.log(`Versand an ein Gerät fehlgeschlagen (HTTP ${status ?? '?'})`)
    }
  }
  console.log(`Gesendet: ${ok}, fehlgeschlagen: ${failed}, abgelaufen: ${expired.length}`)
  return expired
}

async function main() {
  const mode = process.argv[2]
  if (mode !== 'change' && mode !== 'reminders') {
    console.error('Aufruf: node scripts/notify.mjs change|reminders')
    process.exit(2)
  }
  const { VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_SUBJECT } = process.env
  if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY || !VAPID_SUBJECT) {
    console.error('VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY und VAPID_SUBJECT müssen als Secrets gesetzt sein.')
    process.exit(1)
  }
  webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY)

  if (!existsSync(DATA)) {
    console.log('Keine data.json – nichts zu tun.')
    return
  }
  const data = parseData(readFileSync(DATA, 'utf8'))
  const now = new Date()

  let messages: Array<{ device: Device; payload: PushPayload }>
  if (mode === 'change') {
    messages = changeRun(previousData(), data, now)
  } else {
    const run = reminderRun(data, readState(), now)
    messages = run.messages
    writeFileSync(STATE, JSON.stringify(run.state, null, 2) + '\n')
  }
  console.log(`Nachrichten: ${messages.length}`)

  const expired = await send(messages)
  if (expired.length > 0) {
    // Als Tombstone markieren, damit die Geräte den Eintrag beim Sync nicht zurückbringen
    writeFileSync(DATA, serializeData(expireDevices(data, expired, now.toISOString())))
  }
}

main().catch((e) => {
  console.error('Fehler:', e instanceof Error ? e.message : 'unbekannt')
  process.exit(1)
})
