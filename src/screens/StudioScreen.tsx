import { useEffect, useRef, useState } from 'react'
import { useParams } from 'react-router-dom'
import { AUTHOR_BY_ID, QUOTE_BY_ID } from '@/data'
import {
  CARD_FORMATS,
  CARD_THEMES,
  canvasToBlob,
  downloadCanvas,
  fileName,
  renderCard,
} from '@/lib/image'
import { isNative, tap } from '@/lib/native'
import { EmptyState, PageHeader, Toast } from '@/components/ui'
import { Icon } from '@/components/Icon'
import { useToast } from '@/hooks/useToast'

export default function StudioScreen() {
  const { id = '' } = useParams()
  const quote = QUOTE_BY_ID[id]
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const { message, show } = useToast()

  const [themeIdx, setThemeIdx] = useState(0)
  const [formatIdx, setFormatIdx] = useState(0)
  const [showOriginal, setShowOriginal] = useState(true)
  const [showSource, setShowSource] = useState(true)
  const [watermark, setWatermark] = useState(true)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!quote || !canvasRef.current) return
    renderCard(canvasRef.current, quote, {
      theme: CARD_THEMES[themeIdx],
      format: CARD_FORMATS[formatIdx],
      showOriginal,
      showSource,
      watermark,
    })
  }, [quote, themeIdx, formatIdx, showOriginal, showSource, watermark])

  if (!quote) {
    return (
      <div>
        <PageHeader title="Studio" back />
        <EmptyState icon="image" title="Nie ma takiego cytatu" />
      </div>
    )
  }

  const format = CARD_FORMATS[formatIdx]

  const save = async () => {
    if (!canvasRef.current) return
    tap('medium')
    setBusy(true)
    try {
      if (isNative) {
        const blob = await canvasToBlob(canvasRef.current)
        const base64 = await blobToBase64(blob)
        const { Filesystem, Directory } = await import('@capacitor/filesystem')
        const name = fileName(quote)
        const written = await Filesystem.writeFile({
          path: name,
          data: base64,
          directory: Directory.Cache,
        })
        const { Share } = await import('@capacitor/share')
        await Share.share({
          title: 'Cytat',
          text: `„${quote.pl}" — ${AUTHOR_BY_ID[quote.authorId]?.name ?? ''}`,
          files: [written.uri],
        })
      } else {
        downloadCanvas(canvasRef.current, fileName(quote))
        show('Pobrano grafikę')
      }
    } catch {
      show('Nie udało się zapisać grafiki')
    } finally {
      setBusy(false)
    }
  }

  const copyImage = async () => {
    if (!canvasRef.current) return
    try {
      const blob = await canvasToBlob(canvasRef.current)
      await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })])
      show('Skopiowano obraz')
    } catch {
      show('Kopiowanie obrazu nie jest tu dostępne')
    }
  }

  return (
    <div className="pb-10">
      <PageHeader
        back
        eyebrow="studio"
        title="Grafika z cytatem"
        subtitle="Wybierz motyw i format — plik zapisuje się w pełnej rozdzielczości."
      />

      {/* podgląd */}
      <div className="px-5 md:px-8">
        <div className="glass flex justify-center rounded-3xl p-4">
          <canvas
            ref={canvasRef}
            className="max-h-[52dvh] w-auto rounded-2xl shadow-[var(--shadow)]"
            style={{ aspectRatio: `${format.w} / ${format.h}`, maxWidth: '100%' }}
          />
        </div>
      </div>

      {/* motywy */}
      <section className="mt-5">
        <h2 className="mb-2.5 px-5 text-[12px] font-semibold uppercase tracking-[0.14em] text-muted md:px-8">
          Motyw
        </h2>
        <div className="no-scrollbar mask-fade-r flex gap-2.5 overflow-x-auto px-5 pb-1 md:px-8">
          {CARD_THEMES.map((t, i) => (
            <button
              key={t.id}
              onClick={() => {
                tap()
                setThemeIdx(i)
              }}
              className={`press focus-ring shrink-0 rounded-2xl border p-1 ${
                themeIdx === i ? 'border-accent' : 'border-line'
              }`}
            >
              <span
                className="block h-12 w-16 rounded-xl"
                style={{
                  background: `linear-gradient(135deg, ${t.bg[0]}, ${t.bg[1]} 55%, ${t.bg[2]})`,
                }}
              />
              <span className="mt-1 block text-center text-[11px] text-muted">{t.name}</span>
            </button>
          ))}
        </div>
      </section>

      {/* formaty */}
      <section className="mt-5">
        <h2 className="mb-2.5 px-5 text-[12px] font-semibold uppercase tracking-[0.14em] text-muted md:px-8">
          Format
        </h2>
        <div className="no-scrollbar flex gap-2 overflow-x-auto px-5 pb-1 md:px-8">
          {CARD_FORMATS.map((f, i) => (
            <button
              key={f.id}
              onClick={() => {
                tap()
                setFormatIdx(i)
              }}
              className={`press focus-ring shrink-0 rounded-2xl border px-3.5 py-2 text-left ${
                formatIdx === i
                  ? 'border-transparent bg-[color-mix(in_oklab,var(--accent)_26%,transparent)] text-ink'
                  : 'border-line text-muted'
              }`}
            >
              <span className="block text-[13px] font-medium">{f.name}</span>
              <span className="block text-[10.5px] text-faint">
                {f.w}×{f.h} · {f.hint}
              </span>
            </button>
          ))}
        </div>
      </section>

      {/* przełączniki */}
      <section className="mt-5 space-y-2 px-5 md:px-8">
        <Switch
          label="Pokaż oryginał"
          hint={quote.original ? quote.original.slice(0, 48) + (quote.original.length > 48 ? '…' : '') : 'Ten cytat nie ma zapisanego oryginału'}
          checked={showOriginal && !!quote.original}
          disabled={!quote.original}
          onChange={setShowOriginal}
        />
        <Switch
          label="Pokaż źródło"
          hint={quote.source ?? 'Brak informacji o źródle'}
          checked={showSource && !!quote.source}
          disabled={!quote.source}
          onChange={setShowSource}
        />
        <Switch label="Znak „Sentencja”" checked={watermark} onChange={setWatermark} />
      </section>

      {/* akcje */}
      <div className="mt-6 flex gap-2 px-5 md:px-8">
        <button
          onClick={save}
          disabled={busy}
          className="press focus-ring flex flex-1 items-center justify-center gap-2 rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-500 px-4 py-3.5 text-[14px] font-medium text-white shadow-lg shadow-violet-900/25 disabled:opacity-60"
        >
          <Icon name={isNative ? 'share' : 'download'} size={17} />
          {busy ? 'Chwileczkę…' : isNative ? 'Udostępnij grafikę' : 'Pobierz PNG'}
        </button>
        <button
          onClick={copyImage}
          aria-label="Kopiuj obraz"
          className="press focus-ring glass grid w-14 place-items-center rounded-2xl text-muted"
        >
          <Icon name="copy" size={18} />
        </button>
      </div>

      <Toast message={message} />
    </div>
  )
}

function Switch({
  label,
  hint,
  checked,
  onChange,
  disabled,
}: {
  label: string
  hint?: string
  checked: boolean
  onChange: (v: boolean) => void
  disabled?: boolean
}) {
  return (
    <button
      onClick={() => {
        if (disabled) return
        tap()
        onChange(!checked)
      }}
      disabled={disabled}
      className="press focus-ring glass flex w-full items-center gap-3 rounded-2xl p-3.5 text-left disabled:opacity-45"
    >
      <span className="min-w-0 flex-1">
        <span className="block text-[13.5px]">{label}</span>
        {hint && <span className="block truncate text-[11.5px] text-faint">{hint}</span>}
      </span>
      <span
        className={`relative h-6 w-10 shrink-0 rounded-full transition-colors ${
          checked ? 'bg-[color-mix(in_oklab,var(--accent)_75%,transparent)]' : 'bg-[var(--border-strong)]'
        }`}
      >
        <span
          className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all ${
            checked ? 'left-[1.15rem]' : 'left-0.5'
          }`}
        />
      </span>
    </button>
  )
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = reject
    reader.onload = () => {
      const result = String(reader.result)
      resolve(result.slice(result.indexOf(',') + 1))
    }
    reader.readAsDataURL(blob)
  })
}
