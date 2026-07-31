import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { QUOTE_BY_ID } from '@/data'
import { useStore } from '@/lib/store'
import { Button, EmptyState, PageHeader, Toast } from '@/components/ui'
import { QuoteList } from '@/components/QuoteCard'
import { Icon } from '@/components/Icon'
import { useToast } from '@/hooks/useToast'
import { quoteCount } from '@/lib/text'

const EMOJI = ['📚', '🌙', '⚡', '🌊', '🔥', '🌿', '🎯', '💎', '🪐', '🕊️', '☕', '🧭']

export default function CollectionScreen() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const { message, show } = useToast()
  const collection = useStore((s) => s.collections.find((c) => c.id === id))
  const renameCollection = useStore((s) => s.renameCollection)
  const deleteCollection = useStore((s) => s.deleteCollection)
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState(collection?.name ?? '')
  const [emoji, setEmoji] = useState(collection?.emoji ?? '📚')

  if (!collection) {
    return (
      <div>
        <PageHeader title="Nie ma takiej kolekcji" back />
        <EmptyState icon="folder" title="Kolekcja została usunięta" />
      </div>
    )
  }

  const quotes = collection.quoteIds.map((q) => QUOTE_BY_ID[q]).filter(Boolean)

  return (
    <div className="pb-8">
      <PageHeader
        back
        eyebrow="kolekcja"
        title={
          <span className="flex items-center gap-2.5">
            <span>{collection.emoji}</span>
            {collection.name}
          </span>
        }
        subtitle={quoteCount(quotes.length)}
        right={
          <button
            onClick={() => setEditing((v) => !v)}
            aria-label="Edytuj kolekcję"
            className="press focus-ring glass grid h-10 w-10 place-items-center rounded-full text-muted"
          >
            <Icon name="pencil" size={17} />
          </button>
        }
      />

      {editing && (
        <div className="glass mx-5 mb-5 rounded-2xl p-4 md:mx-8">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full border-b border-line pb-2 text-[15px] outline-none"
            placeholder="Nazwa kolekcji"
          />
          <div className="mt-3 flex flex-wrap gap-1.5">
            {EMOJI.map((e) => (
              <button
                key={e}
                onClick={() => setEmoji(e)}
                className={`press grid h-9 w-9 place-items-center rounded-xl border text-base ${
                  emoji === e ? 'border-accent bg-[color-mix(in_oklab,var(--accent)_20%,transparent)]' : 'border-line'
                }`}
              >
                {e}
              </button>
            ))}
          </div>
          <div className="mt-4 flex gap-2">
            <Button
              icon="check"
              onClick={() => {
                renameCollection(collection.id, name, emoji)
                setEditing(false)
                show('Zapisano')
              }}
            >
              Zapisz
            </Button>
            <Button
              variant="danger"
              icon="trash"
              onClick={() => {
                deleteCollection(collection.id)
                navigate('/zbiory')
              }}
            >
              Usuń kolekcję
            </Button>
          </div>
        </div>
      )}

      {quotes.length ? (
        <QuoteList quotes={quotes} onShared={show} />
      ) : (
        <EmptyState
          icon="folder"
          title="Kolekcja jest pusta"
          text="Otwórz dowolny cytat i użyj przycisku „Dodaj do kolekcji”."
        />
      )}

      <Toast message={message} />
    </div>
  )
}
