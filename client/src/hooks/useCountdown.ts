import { useEffect, useRef, useState } from 'react'
import { remainingMs } from '../lib/time'

function clockOffsetMs(serverNow: string): number {
  if (!serverNow) {
    return 0
  }
  const parsed = Date.parse(serverNow)
  if (Number.isNaN(parsed)) {
    return 0
  }
  return Date.now() - parsed
}

export function useCountdown(phaseEndsAt: string | null, serverNow: string): number {
  const offsetRef = useRef<number | null>(null)
  const lastServerNow = useRef<string | null>(null)

  if (offsetRef.current === null || lastServerNow.current !== serverNow) {
    lastServerNow.current = serverNow
    offsetRef.current = clockOffsetMs(serverNow)
  }

  const [ms, setMs] = useState(() => remainingMs(phaseEndsAt, offsetRef.current ?? 0))

  useEffect(() => {
    const tick = () => setMs(remainingMs(phaseEndsAt, offsetRef.current ?? 0))
    tick()
    const id = window.setInterval(tick, 250)
    return () => window.clearInterval(id)
  }, [phaseEndsAt, serverNow])

  return ms
}
