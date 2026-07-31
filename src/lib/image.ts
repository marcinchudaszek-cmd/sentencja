import type { Quote } from '@/data/types'
import { AUTHOR_BY_ID } from '@/data'

export interface CardTheme {
  id: string
  name: string
  bg: [string, string, string]
  blobs: string[]
  fg: string
  muted: string
  accent: string
  dark: boolean
}

export const CARD_THEMES: CardTheme[] = [
  { id: 'aurora', name: 'Zorza', bg: ['#0b0b16', '#221049', '#0d1b3e'], blobs: ['#7c3aed88', '#22d3ee66'], fg: '#f5f3ff', muted: '#a5b4fc', accent: '#a78bfa', dark: true },
  { id: 'obsydian', name: 'Obsydian', bg: ['#08080b', '#141419', '#0b0b0f'], blobs: ['#ffffff12', '#94a3b81f'], fg: '#f4f4f5', muted: '#a1a1aa', accent: '#e4e4e7', dark: true },
  { id: 'zachod', name: 'Zachód', bg: ['#3b0a2a', '#7c2d12', '#c2410c'], blobs: ['#fb923c66', '#f43f5e55'], fg: '#fff7ed', muted: '#fed7aa', accent: '#fdba74', dark: true },
  { id: 'ocean', name: 'Ocean', bg: ['#022c3f', '#035b6b', '#0e7490'], blobs: ['#22d3ee55', '#67e8f955'], fg: '#ecfeff', muted: '#a5f3fc', accent: '#67e8f9', dark: true },
  { id: 'las', name: 'Las', bg: ['#052e1c', '#064e3b', '#065f46'], blobs: ['#34d39955', '#a3e63544'], fg: '#ecfdf5', muted: '#a7f3d0', accent: '#6ee7b7', dark: true },
  { id: 'papier', name: 'Papier', bg: ['#faf7f0', '#f2ece0', '#e8dfd0'], blobs: ['#00000008', '#8b5cf610'], fg: '#1c1917', muted: '#57534e', accent: '#78716c', dark: false },
]

export interface CardFormat {
  id: string
  name: string
  w: number
  h: number
  hint: string
}

export const CARD_FORMATS: CardFormat[] = [
  { id: 'kwadrat', name: 'Kwadrat', w: 1080, h: 1080, hint: 'Instagram, Facebook' },
  { id: 'story', name: 'Story', w: 1080, h: 1920, hint: 'Stories, Reels' },
  { id: 'tapeta', name: 'Tapeta', w: 1170, h: 2532, hint: 'Ekran telefonu' },
  { id: 'panorama', name: 'Panorama', w: 1920, h: 1080, hint: 'Prezentacja, pulpit' },
]

export interface CardOptions {
  theme: CardTheme
  format: CardFormat
  showOriginal: boolean
  showSource: boolean
  watermark: boolean
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.arcTo(x + w, y, x + w, y + h, r)
  ctx.arcTo(x + w, y + h, x, y + h, r)
  ctx.arcTo(x, y + h, x, y, r)
  ctx.arcTo(x, y, x + w, y, r)
  ctx.closePath()
}

function wrap(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const words = text.split(/\s+/)
  const lines: string[] = []
  let line = ''
  for (const w of words) {
    const test = line ? line + ' ' + w : w
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line)
      line = w
    } else {
      line = test
    }
  }
  if (line) lines.push(line)
  return lines
}

/** Rysuje kartę z cytatem na canvasie o docelowych wymiarach formatu. */
export function renderCard(canvas: HTMLCanvasElement, quote: Quote, opts: CardOptions) {
  const { theme, format } = opts
  const W = format.w
  const H = format.h
  canvas.width = W
  canvas.height = H
  const ctx = canvas.getContext('2d')!

  // tło
  const g = ctx.createLinearGradient(0, 0, W * 0.6, H)
  g.addColorStop(0, theme.bg[0])
  g.addColorStop(0.55, theme.bg[1])
  g.addColorStop(1, theme.bg[2])
  ctx.fillStyle = g
  ctx.fillRect(0, 0, W, H)

  // rozmyte plamy światła
  theme.blobs.forEach((color, i) => {
    const cx = i === 0 ? W * 0.18 : W * 0.88
    const cy = i === 0 ? H * 0.12 : H * 0.82
    const r = Math.max(W, H) * (i === 0 ? 0.55 : 0.45)
    const rg = ctx.createRadialGradient(cx, cy, 0, cx, cy, r)
    rg.addColorStop(0, color)
    rg.addColorStop(1, 'rgba(0,0,0,0)')
    ctx.fillStyle = rg
    ctx.fillRect(0, 0, W, H)
  })

  // subtelne ziarno
  const grain = ctx.createImageData(W, Math.min(H, 400))
  for (let i = 0; i < grain.data.length; i += 4) {
    const v = (Math.random() * 255) | 0
    grain.data[i] = grain.data[i + 1] = grain.data[i + 2] = v
    grain.data[i + 3] = theme.dark ? 6 : 4
  }
  for (let y = 0; y < H; y += 400) ctx.putImageData(grain, 0, y)

  const pad = W * 0.1
  const contentW = W - pad * 2
  const author = AUTHOR_BY_ID[quote.authorId]

  // znak cudzysłowu
  ctx.fillStyle = theme.accent + '33'
  ctx.font = `700 ${W * 0.28}px Georgia, "Times New Roman", serif`
  ctx.textBaseline = 'top'
  ctx.fillText('„', pad - W * 0.02, H * 0.06)

  // dobór wielkości pisma tak, by cała kompozycja zmieściła się w kadrze
  const availableH = H - pad * 2 - H * 0.06
  let size = W * 0.075
  let lines: string[] = []
  let lineH = 0
  let originalLines: string[] = []
  let totalH = 0

  for (let i = 0; i < 60; i++) {
    ctx.font = `500 ${size}px Georgia, "Times New Roman", serif`
    lines = wrap(ctx, quote.pl, contentW)
    lineH = size * 1.32

    originalLines = []
    if (opts.showOriginal && quote.original) {
      ctx.font = `italic 400 ${size * 0.44}px Georgia, serif`
      originalLines = wrap(ctx, quote.original, contentW).slice(0, 4)
    }

    totalH =
      lines.length * lineH +
      size * 0.5 +
      originalLines.length * size * 0.44 * 1.4 +
      (originalLines.length ? size * 0.26 : 0) +
      size * 0.75 + // kreska
      size * 0.52 * 1.25 + // autor
      size * 0.33 * 1.4 * (opts.showSource && quote.source ? 2 : 1) // metadane

    if (totalH <= availableH || size < W * 0.026) break
    size *= 0.95
  }

  let y = format.id === 'tapeta' ? Math.max(pad, H * 0.26) : Math.max(pad * 0.9, (H - totalH) / 2)

  ctx.fillStyle = theme.fg
  ctx.textBaseline = 'alphabetic'
  ctx.font = `500 ${size}px Georgia, "Times New Roman", serif`
  for (const line of lines) {
    ctx.fillText(line, pad, y + size)
    y += lineH
  }

  y += size * 0.5

  // oryginał
  if (originalLines.length) {
    const oSize = size * 0.44
    ctx.font = `italic 400 ${oSize}px Georgia, serif`
    ctx.fillStyle = theme.muted + 'dd'
    for (const line of originalLines) {
      ctx.fillText(line, pad, y + oSize)
      y += oSize * 1.4
    }
    y += oSize * 0.6
  }

  // kreska
  ctx.strokeStyle = theme.accent + '66'
  ctx.lineWidth = Math.max(2, W * 0.004)
  ctx.beginPath()
  ctx.moveTo(pad, y)
  ctx.lineTo(pad + W * 0.1, y)
  ctx.stroke()
  y += size * 0.75

  // autor
  const aSize = size * 0.52
  ctx.font = `600 ${aSize}px "Segoe UI", system-ui, sans-serif`
  ctx.fillStyle = theme.fg
  ctx.fillText(author?.name ?? '', pad, y)
  y += aSize * 1.25

  const mSize = aSize * 0.62
  ctx.font = `400 ${mSize}px "Segoe UI", system-ui, sans-serif`
  ctx.fillStyle = theme.muted
  const metaBits = [author?.role, author?.country].filter(Boolean).join(' · ')
  if (metaBits) {
    ctx.fillText(metaBits, pad, y)
    y += mSize * 1.4
  }
  if (opts.showSource && quote.source) {
    const src = wrap(ctx, quote.source, contentW)[0]
    ctx.fillStyle = theme.muted + 'aa'
    ctx.fillText(src, pad, y)
  }

  // znak wodny
  if (opts.watermark) {
    const wSize = W * 0.026
    ctx.font = `600 ${wSize}px "Segoe UI", system-ui, sans-serif`
    ctx.fillStyle = theme.muted + '99'
    const label = 'SENTENCJA'
    const tw = ctx.measureText(label).width
    roundRect(ctx, W - pad - tw - wSize * 1.2, H - pad - wSize * 2.2, tw + wSize * 1.2, wSize * 2.2, wSize)
    ctx.fillStyle = theme.dark ? '#ffffff10' : '#00000008'
    ctx.fill()
    ctx.fillStyle = theme.muted + 'cc'
    ctx.fillText(label, W - pad - tw - wSize * 0.6, H - pad - wSize * 0.7)
  }
}

export function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('Nie udało się utworzyć obrazu'))), 'image/png', 0.98)
  })
}

export function downloadCanvas(canvas: HTMLCanvasElement, filename: string) {
  const url = canvas.toDataURL('image/png')
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
}

export function fileName(quote: Quote): string {
  const author = AUTHOR_BY_ID[quote.authorId]?.name ?? 'cytat'
  return `sentencja-${author.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}-${quote.id}.png`
}
