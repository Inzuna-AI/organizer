import { describe, expect, it } from 'vitest'
import { makeKuerzel } from './utils'

describe('makeKuerzel', () => {
  it('bildet Kürzel', () => {
    expect(makeKuerzel('Lena')).toBe('LE')
    expect(makeKuerzel('max mustermann')).toBe('MM')
    expect(makeKuerzel('  ')).toBe('')
  })
})
