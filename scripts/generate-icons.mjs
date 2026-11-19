// Erzeugt die PWA-Icons (PNG) ohne zusätzliche Abhängigkeiten.
// Aufruf: npm run icons
import { mkdirSync, writeFileSync } from 'node:fs'
import { deflateSync } from 'node:zlib'

const BG = [0x0f, 0x76, 0x6e]
const FG = [0xff, 0xff, 0xff]

const CRC_TABLE = Array.from({ length: 256 }, (_, n) => {
  let c = n
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
  return c >>> 0
})

function crc32(buf) {
  let c = 0xffffffff
  for (const b of buf) c = CRC_TABLE[(c ^ b) & 0xff] ^ (c >>> 8)
  return (c ^ 0xffffffff) >>> 0
}

function chunk(type, data) {
  const len = Buffer.alloc(4)
  len.writeUInt32BE(data.length)
  const td = Buffer.concat([Buffer.from(type, 'ascii'), data])
  const crc = Buffer.alloc(4)
  crc.writeUInt32BE(crc32(td))
  return Buffer.concat([len, td, crc])
}

function png(size, rgbAt) {
  const raw = Buffer.alloc((size * 3 + 1) * size)
  let o = 0
  for (let y = 0; y < size; y++) {
    raw[o++] = 0
    for (let x = 0; x < size; x++) {
      const [r, g, b] = rgbAt(x, y)
      raw[o++] = r
      raw[o++] = g
      raw[o++] = b
    }
  }
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(size, 0)
  ihdr.writeUInt32BE(size, 4)
  ihdr[8] = 8 // Bittiefe
  ihdr[9] = 2 // RGB
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ])
}

/** Haus-Symbol in Koordinaten 0..1; scale < 1 verkleinert es (sichere Zone für maskable). */
function inHouse(u, v, scale) {
  const x = (u - 0.5) / scale + 0.5
  const y = (v - 0.5) / scale + 0.5
  // Dach: Dreieck mit Spitze (0.5, 0.2), Basis y = 0.48 von 0.17 bis 0.83
  const roof = y >= 0.2 && y <= 0.48 && Math.abs(x - 0.5) <= ((y - 0.2) / 0.28) * 0.33
  const body = x >= 0.27 && x <= 0.73 && y >= 0.46 && y <= 0.8
  const door = x >= 0.44 && x <= 0.56 && y >= 0.6 && y <= 0.8
  return (roof || body) && !door
}

function icon(size, scale) {
  const ss = 4 // Supersampling für glatte Kanten
  return png(size, (px, py) => {
    let hits = 0
    for (let i = 0; i < ss; i++) {
      for (let j = 0; j < ss; j++) {
        if (inHouse((px + (i + 0.5) / ss) / size, (py + (j + 0.5) / ss) / size, scale)) hits++
      }
    }
    const a = hits / (ss * ss)
    return BG.map((c, k) => Math.round(c * (1 - a) + FG[k] * a))
  })
}

mkdirSync('public/icons', { recursive: true })
writeFileSync('public/icons/icon-192.png', icon(192, 0.85))
writeFileSync('public/icons/icon-512.png', icon(512, 0.85))
writeFileSync('public/icons/icon-maskable-512.png', icon(512, 0.62))
writeFileSync('public/icons/apple-touch-icon.png', icon(180, 0.8))
console.log('Icons erzeugt in public/icons/')
