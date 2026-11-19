// Gibt den CHANGELOG-Abschnitt einer Version aus (für die Release-Beschreibung).
// Aufruf: node scripts/changelog-entry.mjs 0.1.0
import { readFileSync } from 'node:fs'
import { pathToFileURL } from 'node:url'

export function extractEntry(changelog, version) {
  const lines = changelog.split(/\r?\n/)
  const start = lines.findIndex((l) => l.startsWith(`## [${version}]`))
  if (start === -1) return null
  let end = lines.findIndex((l, i) => i > start && l.startsWith('## ['))
  if (end === -1) end = lines.length
  return lines
    .slice(start + 1, end)
    .join('\n')
    .trim()
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const version = process.argv[2]
  if (!version) {
    console.error('Version fehlt, z. B. 0.1.0')
    process.exit(1)
  }
  const entry = extractEntry(readFileSync('CHANGELOG.md', 'utf-8'), version)
  if (!entry) {
    console.error(`Kein CHANGELOG-Eintrag für ${version} gefunden`)
    process.exit(1)
  }
  console.log(entry)
}
