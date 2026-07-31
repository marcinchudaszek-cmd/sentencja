import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface Collection {
  id: string
  name: string
  emoji: string
  createdAt: number
  quoteIds: string[]
}

export type ThemeMode = 'dark' | 'light' | 'system'

export interface Settings {
  themeMode: ThemeMode
  showOriginal: boolean
  fontScale: number
  hideDisputed: boolean
  dailyEnabled: boolean
  dailyHour: number
  dailyMinute: number
}

interface State {
  favorites: string[]
  collections: Collection[]
  notes: Record<string, string>
  seen: string[]
  settings: Settings

  toggleFavorite: (id: string) => void
  isFavorite: (id: string) => boolean

  createCollection: (name: string, emoji?: string) => string
  renameCollection: (id: string, name: string, emoji?: string) => void
  deleteCollection: (id: string) => void
  toggleInCollection: (collectionId: string, quoteId: string) => void
  collectionsOf: (quoteId: string) => Collection[]

  setNote: (quoteId: string, note: string) => void
  markSeen: (quoteId: string) => void

  updateSettings: (patch: Partial<Settings>) => void
}

const EMOJI_POOL = ['📚', '🌙', '⚡', '🌊', '🔥', '🌿', '🎯', '💎', '🪐', '🕊️']

export const useStore = create<State>()(
  persist(
    (set, get) => ({
      favorites: [],
      collections: [],
      notes: {},
      seen: [],
      settings: {
        themeMode: 'dark',
        showOriginal: true,
        fontScale: 1,
        hideDisputed: false,
        dailyEnabled: false,
        dailyHour: 8,
        dailyMinute: 0,
      },

      toggleFavorite: (id) =>
        set((s) => ({
          favorites: s.favorites.includes(id)
            ? s.favorites.filter((f) => f !== id)
            : [id, ...s.favorites],
        })),
      isFavorite: (id) => get().favorites.includes(id),

      createCollection: (name, emoji) => {
        const id = `col_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`
        set((s) => ({
          collections: [
            ...s.collections,
            {
              id,
              name: name.trim() || 'Nowa kolekcja',
              emoji: emoji || EMOJI_POOL[s.collections.length % EMOJI_POOL.length],
              createdAt: Date.now(),
              quoteIds: [],
            },
          ],
        }))
        return id
      },
      renameCollection: (id, name, emoji) =>
        set((s) => ({
          collections: s.collections.map((c) =>
            c.id === id ? { ...c, name: name.trim() || c.name, emoji: emoji ?? c.emoji } : c,
          ),
        })),
      deleteCollection: (id) =>
        set((s) => ({ collections: s.collections.filter((c) => c.id !== id) })),
      toggleInCollection: (collectionId, quoteId) =>
        set((s) => ({
          collections: s.collections.map((c) =>
            c.id !== collectionId
              ? c
              : {
                  ...c,
                  quoteIds: c.quoteIds.includes(quoteId)
                    ? c.quoteIds.filter((q) => q !== quoteId)
                    : [quoteId, ...c.quoteIds],
                },
          ),
        })),
      collectionsOf: (quoteId) => get().collections.filter((c) => c.quoteIds.includes(quoteId)),

      setNote: (quoteId, note) =>
        set((s) => {
          const notes = { ...s.notes }
          if (note.trim()) notes[quoteId] = note
          else delete notes[quoteId]
          return { notes }
        }),

      markSeen: (quoteId) =>
        set((s) => ({ seen: [quoteId, ...s.seen.filter((x) => x !== quoteId)].slice(0, 200) })),

      updateSettings: (patch) => set((s) => ({ settings: { ...s.settings, ...patch } })),
    }),
    {
      name: 'sentencja-v1',
      version: 1,
      partialize: (s) => ({
        favorites: s.favorites,
        collections: s.collections,
        notes: s.notes,
        seen: s.seen,
        settings: s.settings,
      }),
    },
  ),
)
