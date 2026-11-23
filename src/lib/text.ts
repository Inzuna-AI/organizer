// Textvergleich für Suche und Filter.

/** Kleinbuchstaben, ohne Akzente/Umlaut-Punkte, ß → ss: „Küche“ findet man auch mit „kuche“. */
export function normalize(s: string): string {
  return s
    .toLocaleLowerCase('de')
    .replace(/ß/g, 'ss')
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
}

/** Alle Wörter der Suche müssen im (normalisierten) Text vorkommen, in beliebiger Reihenfolge. */
export function matches(text: string, query: string): boolean {
  const words = normalize(query).split(/\s+/).filter(Boolean)
  return words.length > 0 && words.every((w) => text.includes(w))
}
