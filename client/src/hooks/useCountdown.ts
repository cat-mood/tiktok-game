import { useEffect, useRef, useState } from 'react'
import { remainingMs } from '../lib/time'

export function useCountdown(phaseEndsAt: string | null, serverNow: string): number {
  const offsetRef = useRef(0)

  useEffect(() => {
    if (serverNow) {
      offsetRef.current = Date.now() - Date.parse(serverNow)
    }
  }, [serverNow])

  const [ms, setMs] = useState(() => remainingMs(phaseEndsAt))

  useEffect(() => {
    const tick = () => setMs(remainingMs(phaseEndsAt, offsetRef.current))
    tick()
    const id = window.setInterval(tick, 250)
    return () => window.clearInterval(id)
  }, [phaseEndsAt])

  return ms
}
