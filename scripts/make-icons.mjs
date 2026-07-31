// Generuje ikony PNG bez zewnętrznych zależności (własny enkoder PNG na zlib).
import { deflateSync } from 'node:zlib'
import { writeFileSync, mkdirSync, existsSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')

const CRC_TABLE = (() => {
  const t = new Uint32Array(256)
  for (let n = 0; n < 256; n++) {
    let c = n
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    t[n] = c >>> 0
  }
  return t
})()

function crc32(buf) {
  let c = 0xffffffff
  for (const b of buf) c = CRC_TABLE[(c ^ b) & 0xff] ^ (c >>> 8)
  return (c ^ 0xffffffff) >>> 0
}

function chunk(type, data) {
  const len = Buffer.alloc(4)
  len.writeUInt32BE(data.length)
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data])
  const crc = Buffer.alloc(4)
  crc.writeUInt32BE(crc32(body))
  return Buffer.concat([len, body, crc])
}

function encodePNG(width, height, rgba) {
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(width, 0)
  ihdr.writeUInt32BE(height, 4)
  ihdr[8] = 8
  ihdr[9] = 6
  const raw = Buffer.alloc((width * 4 + 1) * height)
  for (let y = 0; y < height; y++) {
    raw[y * (width * 4 + 1)] = 0
    rgba.copy(raw, y * (width * 4 + 1) + 1, y * width * 4, (y + 1) * width * 4)
  }
  return Buffer.concat([
    sig,
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ])
}

const mix = (a, b, t) => a.map((v, i) => Math.round(v + (b[i] - v) * t))
const C1 = [124, 58, 237]
const C2 = [217, 70, 239]
const C3 = [34, 211, 238]

/** Kropla cudzysłowu: koło z ogonkiem opadającym w lewo. */
function inQuoteMark(px, py, cx, cy, r) {
  const dx = px - cx
  const dy = py - cy
  if (dx * dx + dy * dy <= r * r) return true
  if (dy > 0 && dy < r * 2.1) {
    const t = dy / (r * 2.1)
    const left = -r + t * r * 0.75
    const right = left + r * (1 - t) * 1.05
    return dx > left && dx < right
  }
  return false
}

/**
 * shape:
 *  - 'rounded' — pełne tło z gradientem, zaokrąglony kwadrat
 *  - 'circle'  — pełne tło z gradientem, koło
 *  - 'foreground' — sam biały znak, przezroczyste tło, w bezpiecznej strefie 66%
 *  - 'mono'    — biały znak na przezroczystym tle (ikona powiadomienia)
 */
function makeIcon(size, shape = 'rounded') {
  const rgba = Buffer.alloc(size * size * 4)
  const radius = shape === 'rounded' ? size * 0.22 : 0
  const glyphScale = shape === 'foreground' ? 0.62 : 1
  const r0 = size * 0.1 * glyphScale
  const cy = size * (shape === 'foreground' ? 0.46 : 0.42)
  const spread = size * 0.13 * glyphScale

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const i = (y * size + x) * 4
      let alpha = 0
      let r = 255
      let g = 255
      let b = 255

      if (shape === 'rounded' || shape === 'circle') {
        const t = (x / size) * 0.5 + (y / size) * 0.5
        const base = t < 0.5 ? mix(C1, C2, t * 2) : mix(C2, C3, (t - 0.5) * 2)
        r = base[0]
        g = base[1]
        b = base[2]
        alpha = 255
        if (shape === 'circle') {
          const d = Math.hypot(x - size / 2 + 0.5, y - size / 2 + 0.5)
          const rad = size / 2
          if (d > rad) alpha = 0
          else if (d > rad - 1.5) alpha = Math.round((255 * (rad - d)) / 1.5)
        } else {
          const rx = Math.max(radius - x, x - (size - radius), 0)
          const ry = Math.max(radius - y, y - (size - radius), 0)
          const d = Math.hypot(rx, ry)
          if (d > radius) alpha = 0
          else if (d > radius - 1.5) alpha = Math.round((255 * (radius - d)) / 1.5)
        }
      }

      const inGlyph =
        inQuoteMark(x, y, size / 2 - spread, cy, r0) || inQuoteMark(x, y, size / 2 + spread, cy, r0)

      if (inGlyph) {
        r = 255
        g = 255
        b = 255
        alpha = 255
      } else if (shape === 'foreground' || shape === 'mono') {
        alpha = 0
      }

      rgba[i] = r
      rgba[i + 1] = g
      rgba[i + 2] = b
      rgba[i + 3] = alpha
    }
  }
  return encodePNG(size, size, rgba)
}

const DENSITIES = [
  ['mdpi', 48, 108, 24],
  ['hdpi', 72, 162, 36],
  ['xhdpi', 96, 216, 48],
  ['xxhdpi', 144, 324, 72],
  ['xxxhdpi', 192, 432, 96],
]

const targets = [
  ['public/icon-192.png', 192, 'rounded'],
  ['public/icon-512.png', 512, 'rounded'],
  ['public/apple-touch-icon.png', 180, 'rounded'],
]

const androidRes = resolve(ROOT, 'android/app/src/main/res')
if (existsSync(androidRes)) {
  for (const [density, launcher, foreground, notif] of DENSITIES) {
    targets.push([`android/app/src/main/res/mipmap-${density}/ic_launcher.png`, launcher, 'rounded'])
    targets.push([`android/app/src/main/res/mipmap-${density}/ic_launcher_round.png`, launcher, 'circle'])
    targets.push([
      `android/app/src/main/res/mipmap-${density}/ic_launcher_foreground.png`,
      foreground,
      'foreground',
    ])
    targets.push([`android/app/src/main/res/drawable-${density}/ic_stat_icon.png`, notif, 'mono'])
  }
}

for (const [path, size, shape] of targets) {
  const full = resolve(ROOT, path)
  try {
    mkdirSync(dirname(full), { recursive: true })
    writeFileSync(full, makeIcon(size, shape))
    console.log('zapisano', path)
  } catch (e) {
    console.warn('pominięto', path, e.message)
  }
}
