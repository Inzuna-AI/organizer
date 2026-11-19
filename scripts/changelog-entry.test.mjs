import { describe, expect, it } from 'vitest'
import { extractEntry } from './changelog-entry.mjs'

const CL = `# Changelog

## [0.2.0] – 2026-12-01
### Neu
- Aufgaben

## [0.1.0] – 2026-11-20
### Neu
- Grundgerüst
`

describe('extractEntry', () => {
  it('liefert genau den Abschnitt einer Version', () => {
    expect(extractEntry(CL, '0.2.0')).toBe('### Neu\n- Aufgaben')
    expect(extractEntry(CL, '0.1.0')).toBe('### Neu\n- Grundgerüst')
  })

  it('liefert null für unbekannte Versionen', () => {
    expect(extractEntry(CL, '9.9.9')).toBeNull()
  })
})
