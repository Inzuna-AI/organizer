/** Vorschlag für den Gerätenamen anhand des Browsers. */
export function guessDeviceName(userAgent: string = navigator.userAgent): string {
  if (/iPhone/i.test(userAgent)) return 'iPhone'
  if (/iPad/i.test(userAgent)) return 'iPad'
  if (/SamsungBrowser|SM-|Samsung/i.test(userAgent)) return 'Samsung'
  if (/Android/i.test(userAgent)) return 'Android'
  if (/Windows/i.test(userAgent)) return 'Windows-PC'
  if (/Macintosh/i.test(userAgent)) return 'Mac'
  return 'Browser'
}

/** Entfernt Leerzeichen und ein versehentlich mitkopiertes „https://github.com/“. */
export function cleanOwner(input: string): string {
  return input.trim().replace(/^https?:\/\/github\.com\//i, '').replace(/\/.*$/, '')
}
