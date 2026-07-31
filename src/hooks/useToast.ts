import { useCallback, useEffect, useRef, useState } from 'react'

/** Krótki komunikat u dołu ekranu. */
export function useToast(duration = 2200) {
  const [message, setMessage] = useState<string | null>(null)
  const timer = useRef<number | null>(null)

  const show = useCallback(
    (text: string) => {
      setMessage(text)
      if (timer.current) window.clearTimeout(timer.current)
      timer.current = window.setTimeout(() => setMessage(null), duration)
    },
    [duration],
  )

  useEffect(() => () => { if (timer.current) window.clearTimeout(timer.current) }, [])

  return { message, show }
}
