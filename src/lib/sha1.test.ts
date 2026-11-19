import { describe, expect, it } from 'vitest'
import { gitBlobSha, sha1Hex } from './sha1'

const enc = (s: string) => new TextEncoder().encode(s)

describe('sha1', () => {
  it('berechnet bekannte Prüfwerte', () => {
    expect(sha1Hex(enc('abc'))).toBe('a9993e364706816aba3e25717850c26c9cd0d89d')
    expect(sha1Hex(enc(''))).toBe('da39a3ee5e6b4b0d3255bfef95601890afd80709')
    // 56 Bytes: Grenzfall beim Padding
    expect(sha1Hex(enc('abcdbcdecdefdefgefghfghighijhijkijkljklmklmnlmnomnopnopq'))).toBe(
      '84983e441c3bd26ebaae4aa1f95129e5e54670f1',
    )
  })

  it('berechnet Git-Blob-SHAs wie git hash-object', () => {
    expect(gitBlobSha(enc(''))).toBe('e69de29bb2d1d6434b8b29ae775ad8c2e48c5391')
    expect(gitBlobSha(enc('hello\n'))).toBe('ce013625030ba8dba906f756967f9e9ca394464a')
  })

  it('kommt mit großen Eingaben zurecht', () => {
    const big = new Uint8Array(1_000_000).fill(97)
    expect(sha1Hex(big)).toBe('34aa973cd4c4daa4f61eeb2bdbad27316534016f')
  })
})
