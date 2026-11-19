// Reines JS-SHA-1. Bewusst ohne crypto.subtle, weil das nur in sicheren Kontexten
// (HTTPS/localhost) verfügbar ist und die App beim lokalen Test auch per WLAN-IP läuft.

export function sha1Hex(bytes: Uint8Array): string {
  const len = bytes.length
  const padded = (((len + 9 + 63) >> 6) << 6) >>> 0
  const buf = new Uint8Array(padded)
  buf.set(bytes)
  buf[len] = 0x80
  const view = new DataView(buf.buffer)
  const bitLen = len * 8
  view.setUint32(padded - 8, Math.floor(bitLen / 0x100000000))
  view.setUint32(padded - 4, bitLen >>> 0)

  let h0 = 0x67452301
  let h1 = 0xefcdab89
  let h2 = 0x98badcfe
  let h3 = 0x10325476
  let h4 = 0xc3d2e1f0
  const w = new Uint32Array(80)

  for (let off = 0; off < padded; off += 64) {
    for (let i = 0; i < 16; i++) w[i] = view.getUint32(off + i * 4)
    for (let i = 16; i < 80; i++) {
      const x = w[i - 3] ^ w[i - 8] ^ w[i - 14] ^ w[i - 16]
      w[i] = (x << 1) | (x >>> 31)
    }
    let a = h0
    let b = h1
    let c = h2
    let d = h3
    let e = h4
    for (let i = 0; i < 80; i++) {
      let f: number
      let k: number
      if (i < 20) {
        f = (b & c) | (~b & d)
        k = 0x5a827999
      } else if (i < 40) {
        f = b ^ c ^ d
        k = 0x6ed9eba1
      } else if (i < 60) {
        f = (b & c) | (b & d) | (c & d)
        k = 0x8f1bbcdc
      } else {
        f = b ^ c ^ d
        k = 0xca62c1d6
      }
      const t = (((a << 5) | (a >>> 27)) + f + e + k + w[i]) >>> 0
      e = d
      d = c
      c = ((b << 30) | (b >>> 2)) >>> 0
      b = a
      a = t
    }
    h0 = (h0 + a) >>> 0
    h1 = (h1 + b) >>> 0
    h2 = (h2 + c) >>> 0
    h3 = (h3 + d) >>> 0
    h4 = (h4 + e) >>> 0
  }
  return [h0, h1, h2, h3, h4].map((h) => h.toString(16).padStart(8, '0')).join('')
}

/** Git-Blob-SHA einer Datei, so wie GitHub sie als `sha` führt. */
export function gitBlobSha(content: Uint8Array): string {
  const header = new TextEncoder().encode(`blob ${content.length}\0`)
  const all = new Uint8Array(header.length + content.length)
  all.set(header)
  all.set(content, header.length)
  return sha1Hex(all)
}
