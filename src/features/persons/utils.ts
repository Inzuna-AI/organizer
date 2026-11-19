/** Kürzel aus dem Namen: „Lena“ → „LE“, „Max Mustermann“ → „MM“ */
export function makeKuerzel(name: string): string {
  const clean = name.trim()
  if (!clean) return ''
  const parts = clean.split(/\s+/)
  const k = parts.length > 1 ? parts[0][0] + parts[1][0] : clean.slice(0, 2)
  return k.toUpperCase()
}
