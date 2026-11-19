import { describe, expect, it } from 'vitest'
import { cleanOwner, guessDeviceName } from './utils'

describe('setup utils', () => {
  it('räumt den Owner auf', () => {
    expect(cleanOwner('  lena ')).toBe('lena')
    expect(cleanOwner('https://github.com/lena/organizer-data')).toBe('lena')
  })

  it('schlägt einen Gerätenamen vor', () => {
    expect(guessDeviceName('Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X)')).toBe('iPhone')
    expect(guessDeviceName('Mozilla/5.0 (Linux; Android 14; SM-S921B) SamsungBrowser/25.0')).toBe('Samsung')
    expect(guessDeviceName('Mozilla/5.0 (Windows NT 10.0; Win64; x64)')).toBe('Windows-PC')
  })
})
