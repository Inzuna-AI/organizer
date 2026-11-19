import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  decodeBase64Utf8,
  encodeBase64Utf8,
  GitHubError,
  isConflict,
  NetworkError,
  readFile,
  writeFile,
} from './github'
import { gitBlobSha } from './sha1'

const cfg = { owner: 'me', repo: 'organizer-data', token: 'secret-token' }

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('Base64 mit UTF-8', () => {
  it('kodiert Umlaute korrekt', () => {
    const text = 'Küche, Bäder, Grüße – ß 🍳'
    const b64 = encodeBase64Utf8(text)
    expect(b64).toBe(Buffer.from(text, 'utf-8').toString('base64'))
    expect(decodeBase64Utf8(b64)).toBe(text)
  })

  it('kodiert große Texte (über die Chunk-Grenze)', () => {
    const text = 'ä'.repeat(100_000)
    expect(decodeBase64Utf8(encodeBase64Utf8(text))).toBe(text)
  })
})

describe('readFile', () => {
  it('sendet If-None-Match und meldet 304 als unverändert', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 304 }))
    vi.stubGlobal('fetch', fetchMock)
    const res = await readFile(cfg, 'data.json', '"abc"')
    expect(res).toEqual({ kind: 'not-modified' })
    const [url, init] = fetchMock.mock.calls[0]
    expect(url).toBe('https://api.github.com/repos/me/organizer-data/contents/data.json')
    expect(init.headers['If-None-Match']).toBe('"abc"')
    expect(init.headers.Accept).toBe('application/vnd.github.raw+json')
    expect(init.headers.Authorization).toBe('Bearer secret-token')
  })

  it('liefert Text, ETag und berechnete SHA', async () => {
    const body = '{"schemaVersion":1,"name":"Küche"}'
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(new Response(body, { status: 200, headers: { ETag: '"e1"' } })),
    )
    const res = await readFile(cfg, 'data.json')
    expect(res).toEqual({
      kind: 'ok',
      text: body,
      etag: '"e1"',
      sha: gitBlobSha(new TextEncoder().encode(body)),
    })
  })

  it('meldet 404 als fehlende Datei', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('{}', { status: 404 })))
    expect(await readFile(cfg, 'data.json')).toEqual({ kind: 'missing' })
  })

  it('wirft NetworkError, wenn fetch scheitert', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')))
    await expect(readFile(cfg, 'data.json')).rejects.toBeInstanceOf(NetworkError)
  })
})

describe('writeFile', () => {
  it('schreibt Base64-Inhalt mit SHA und Message', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(new Response(JSON.stringify({ content: { sha: 'new' } }), { status: 200 }))
    vi.stubGlobal('fetch', fetchMock)
    const res = await writeFile(cfg, 'data.json', 'Grüße', 'old', 'update von Test')
    expect(res).toEqual({ sha: 'new' })
    const init = fetchMock.mock.calls[0][1]
    expect(init.method).toBe('PUT')
    expect(JSON.parse(init.body)).toEqual({
      message: 'update von Test',
      content: Buffer.from('Grüße', 'utf-8').toString('base64'),
      sha: 'old',
    })
  })

  it('meldet veraltete SHA als Konflikt', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(new Response('{"message":"does not match"}', { status: 409 })),
    )
    const err = await writeFile(cfg, 'data.json', 'x', 'old', 'm').catch((e) => e)
    expect(err).toBeInstanceOf(GitHubError)
    expect(isConflict(err)).toBe(true)
  })

  it('schreibt den Token nicht in Fehlermeldungen', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(new Response('{"message":"Bad credentials"}', { status: 401 })),
    )
    const err = await writeFile(cfg, 'data.json', 'x', null, 'm').catch((e) => e)
    expect(String(err.message)).not.toContain('secret-token')
  })
})
