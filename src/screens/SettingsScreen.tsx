import { useState } from 'react'
import { STATS } from '@/data'
import { useStore, type ThemeMode } from '@/lib/store'
import { isNative, syncDailyNotification, tap } from '@/lib/native'
import { PageHeader, Toast } from '@/components/ui'
import { Icon } from '@/components/Icon'
import { useToast } from '@/hooks/useToast'
import { quoteCount } from '@/lib/text'

export default function SettingsScreen() {
  const settings = useStore((s) => s.settings)
  const update = useStore((s) => s.updateSettings)
  const favorites = useStore((s) => s.favorites)
  const collections = useStore((s) => s.collections)
  const notes = useStore((s) => s.notes)
  const { message, show } = useToast()
  const [savingDaily, setSavingDaily] = useState(false)

  const applyDaily = async (patch: Partial<typeof settings>) => {
    const next = { ...settings, ...patch }
    update(patch)
    if (!isNative) {
      if (patch.dailyEnabled) show('Powiadomienia działają w aplikacji na Androida')
      return
    }
    setSavingDaily(true)
    const res = await syncDailyNotification(next.dailyEnabled, next.dailyHour, next.dailyMinute)
    setSavingDaily(false)
    if (res.reason === 'denied') {
      update({ dailyEnabled: false })
      show('Brak zgody na powiadomienia')
    } else if (res.reason === 'scheduled') {
      show(`Codziennie o ${String(next.dailyHour).padStart(2, '0')}:${String(next.dailyMinute).padStart(2, '0')}`)
    }
  }

  const exportData = () => {
    const data = JSON.stringify({ favorites, collections, notes, settings }, null, 2)
    const blob = new Blob([data], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'sentencja-kopia.json'
    a.click()
    URL.revokeObjectURL(url)
    show('Kopia zapisana')
  }

  return (
    <div className="pb-10">
      <PageHeader title="Ustawienia" back />

      <Group title="Wygląd">
        <Row label="Motyw">
          <div className="flex gap-1">
            {(
              [
                ['dark', 'moon', 'Ciemny'],
                ['light', 'sun', 'Jasny'],
                ['system', 'settings', 'System'],
              ] as [ThemeMode, 'moon' | 'sun' | 'settings', string][]
            ).map(([mode, icon, label]) => (
              <button
                key={mode}
                onClick={() => {
                  tap()
                  update({ themeMode: mode })
                }}
                aria-label={label}
                title={label}
                className={`press focus-ring grid h-10 w-10 place-items-center rounded-xl border ${
                  settings.themeMode === mode
                    ? 'border-transparent bg-[color-mix(in_oklab,var(--accent)_26%,transparent)] text-ink'
                    : 'border-line text-muted'
                }`}
              >
                <Icon name={icon} size={17} />
              </button>
            ))}
          </div>
        </Row>

        <Row label="Wielkość tekstu" hint={`${Math.round(settings.fontScale * 100)}%`}>
          <input
            type="range"
            min={0.85}
            max={1.25}
            step={0.05}
            value={settings.fontScale}
            onChange={(e) => update({ fontScale: Number(e.target.value) })}
            className="w-36 accent-[var(--accent)]"
          />
        </Row>

        <Toggle
          label="Pokazuj oryginał"
          hint="Łacina, greka, angielski — pod polskim tłumaczeniem"
          checked={settings.showOriginal}
          onChange={(v) => update({ showOriginal: v })}
        />

        <Toggle
          label="Ukryj cytaty o spornej atrybucji"
          hint="Odfiltruje te, których nie potwierdzają źródła"
          checked={settings.hideDisputed}
          onChange={(v) => update({ hideDisputed: v })}
        />
      </Group>

      <Group title="Cytat dnia">
        <Toggle
          label="Codzienne powiadomienie"
          hint={isNative ? 'Jeden cytat każdego ranka' : 'Dostępne w aplikacji na Androida'}
          checked={settings.dailyEnabled}
          onChange={(v) => applyDaily({ dailyEnabled: v })}
          disabled={savingDaily}
        />
        {settings.dailyEnabled && (
          <Row label="Godzina">
            <input
              type="time"
              value={`${String(settings.dailyHour).padStart(2, '0')}:${String(settings.dailyMinute).padStart(2, '0')}`}
              onChange={(e) => {
                const [h, m] = e.target.value.split(':').map(Number)
                applyDaily({ dailyHour: h, dailyMinute: m })
              }}
              className="glass rounded-xl px-3 py-2 text-[13.5px] outline-none"
            />
          </Row>
        )}
      </Group>

      <Group title="Twoje dane">
        <Row label="Ulubione" hint={quoteCount(favorites.length)} />
        <Row label="Kolekcje" hint={`${collections.length}`} />
        <Row label="Notatki" hint={`${Object.keys(notes).length}`} />
        <button
          onClick={exportData}
          className="press focus-ring glass flex w-full items-center gap-3 rounded-2xl p-4 text-left"
        >
          <Icon name="download" size={17} className="text-accent" />
          <span className="flex-1 text-[13.5px]">Zapisz kopię danych (JSON)</span>
          <Icon name="chevron" size={15} className="text-faint" />
        </button>
      </Group>

      <Group title="O aplikacji">
        <div className="glass rounded-2xl p-4">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-violet-500 via-fuchsia-500 to-cyan-400 text-white">
              <Icon name="quote" size={18} />
            </span>
            <div>
              <div className="text-[14.5px] font-medium">Sentencja</div>
              <div className="text-[11.5px] text-faint">wersja 1.0 · {isNative ? 'Android' : 'web'}</div>
            </div>
          </div>
          <p className="mt-3 text-[13px] leading-relaxed text-muted">
            {STATS.quotes} cytatów od {STATS.authors} autorów z {STATS.countries} krajów, w podziale
            na {STATS.themes} tematów i {STATS.eras} epok. Każdy cytat ma źródło, a te o niepewnym
            pochodzeniu są wyraźnie oznaczone.
          </p>
          <p className="mt-2 text-[12px] leading-relaxed text-faint">
            Baza działa w całości offline — nic nie jest wysyłane na zewnątrz.
          </p>
        </div>
      </Group>

      <Toast message={message} />
    </div>
  )
}

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-6 px-5 md:px-8">
      <h2 className="mb-2.5 text-[12px] font-semibold uppercase tracking-[0.14em] text-muted">
        {title}
      </h2>
      <div className="space-y-2">{children}</div>
    </section>
  )
}

function Row({
  label,
  hint,
  children,
}: {
  label: string
  hint?: string
  children?: React.ReactNode
}) {
  return (
    <div className="glass flex items-center gap-3 rounded-2xl p-4">
      <span className="min-w-0 flex-1">
        <span className="block text-[13.5px]">{label}</span>
        {hint && <span className="block text-[11.5px] text-faint">{hint}</span>}
      </span>
      {children}
    </div>
  )
}

function Toggle({
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
      className="press focus-ring glass flex w-full items-center gap-3 rounded-2xl p-4 text-left disabled:opacity-50"
    >
      <span className="min-w-0 flex-1">
        <span className="block text-[13.5px]">{label}</span>
        {hint && <span className="block text-[11.5px] text-faint">{hint}</span>}
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
