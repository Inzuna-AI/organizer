// GitHub REST API (Contents API): lesen mit ETag, schreiben mit SHA.
// Der Token wird nie geloggt.

import { gitBlobSha } from './sha1'

export interface RepoConfig {
  owner: string
  repo: string
  token: string
}

export class GitHubError extends Error {
  readonly status: number
  constructor(status: number, message: string) {
    super(message)
    this.name = 'GitHubError'
    this.status = status
  }
}

export class NetworkError extends Error {
  constructor(message = 'Keine Verbindung') {
    super(message)
    this.name = 'NetworkError'
  }
}

export function isConflict(e: unknown): boolean {
  return e instanceof GitHubError && (e.status === 409 || e.status === 422)
}

const API = 'https://api.github.com'

function contentsUrl(cfg: RepoConfig, path: string): string {
  const p = path.split('/').map(encodeURIComponent).join('/')
  return `${API}/repos/${encodeURIComponent(cfg.owner)}/${encodeURIComponent(cfg.repo)}/contents/${p}`
}

function baseHeaders(cfg: RepoConfig): Record<string, string> {
  return {
    Authorization: `Bearer ${cfg.token}`,
    'X-GitHub-Api-Version': '2022-11-28',
  }
}

async function request(url: string, init: RequestInit): Promise<Response> {
  try {
    // no-store: Der Browser-Cache soll die bedingten Anfragen nicht beantworten.
    return await fetch(url, { ...init, cache: 'no-store' })
  } catch {
    throw new NetworkError()
  }
}

async function errorFrom(res: Response): Promise<GitHubError> {
  let msg = `GitHub antwortet mit ${res.status}`
  try {
    const body = (await res.json()) as { message?: string }
    if (body?.message) msg += `: ${body.message}`
  } catch {
    // Rumpf ohne JSON
  }
  return new GitHubError(res.status, msg)
}

// ---------- UTF-8 <-> Base64 ----------

export function encodeBase64Utf8(text: string): string {
  const bytes = new TextEncoder().encode(text)
  let bin = ''
  const chunk = 0x8000
  for (let i = 0; i < bytes.length; i += chunk) {
    bin += String.fromCharCode(...bytes.subarray(i, i + chunk))
  }
  return btoa(bin)
}

export function decodeBase64Utf8(b64: string): string {
  const bin = atob(b64.replace(/\s/g, ''))
  const bytes = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i)
  return new TextDecoder().decode(bytes)
}

// ---------- Lesen ----------

export type ReadResult =
  | { kind: 'not-modified' }
  | { kind: 'missing' }
  | { kind: 'ok'; text: string; sha: string; etag: string | null }

/**
 * Liest eine Datei als Rohinhalt (auch > 1 MB).
 * Mit `etag` wird bedingt gelesen; bei 304 hat sich nichts geändert.
 * Die SHA wird aus dem Inhalt berechnet (Git-Blob-SHA), so braucht es keinen zweiten Abruf.
 */
export async function readFile(
  cfg: RepoConfig,
  path: string,
  etag?: string | null,
): Promise<ReadResult> {
  const headers: Record<string, string> = {
    ...baseHeaders(cfg),
    Accept: 'application/vnd.github.raw+json',
  }
  if (etag) headers['If-None-Match'] = etag
  const res = await request(contentsUrl(cfg, path), { headers })
  if (res.status === 304) return { kind: 'not-modified' }
  if (res.status === 404) {
    // 404 kann auch "Repo nicht erreichbar" heißen; das prüft checkRepoAccess vorher.
    return { kind: 'missing' }
  }
  if (!res.ok) throw await errorFrom(res)
  const bytes = new Uint8Array(await res.arrayBuffer())
  return {
    kind: 'ok',
    text: new TextDecoder().decode(bytes),
    sha: gitBlobSha(bytes),
    etag: res.headers.get('ETag'),
  }
}

// ---------- Schreiben ----------

/** Schreibt eine Datei. Bei veralteter SHA wirft sie einen GitHubError mit 409/422. */
export async function writeFile(
  cfg: RepoConfig,
  path: string,
  text: string,
  sha: string | null,
  message: string,
): Promise<{ sha: string }> {
  const body: Record<string, string> = { message, content: encodeBase64Utf8(text) }
  if (sha) body.sha = sha
  const res = await request(contentsUrl(cfg, path), {
    method: 'PUT',
    headers: {
      ...baseHeaders(cfg),
      Accept: 'application/vnd.github+json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })
  if (!res.ok) throw await errorFrom(res)
  const json = (await res.json()) as { content?: { sha?: string } }
  const newSha = json.content?.sha
  if (!newSha) throw new GitHubError(res.status, 'Antwort ohne SHA')
  return { sha: newSha }
}

// ---------- Verbindung prüfen ----------

/** Prüft, ob das Repository mit dem Token erreichbar ist. */
export async function checkRepoAccess(cfg: RepoConfig): Promise<void> {
  const res = await request(
    `${API}/repos/${encodeURIComponent(cfg.owner)}/${encodeURIComponent(cfg.repo)}`,
    { headers: { ...baseHeaders(cfg), Accept: 'application/vnd.github+json' } },
  )
  if (!res.ok) throw await errorFrom(res)
}

/** Verständliche deutsche Fehlermeldung für die Oberfläche. */
export function describeError(e: unknown): string {
  if (e instanceof NetworkError) return 'Keine Verbindung zu GitHub. Bist du online?'
  if (e instanceof GitHubError) {
    switch (e.status) {
      case 401:
        return 'Der Token ist ungültig oder abgelaufen.'
      case 403:
        return 'Zugriff verweigert. Prüfe die Token-Berechtigung „Contents: Read and write“ (oder das Rate-Limit ist erreicht).'
      case 404:
        return 'Repository nicht gefunden. Prüfe Owner, Repo-Name und ob der Token Zugriff auf dieses Repo hat.'
      default:
        return e.message
    }
  }
  if (e instanceof Error) return e.message
  return 'Unbekannter Fehler'
}
