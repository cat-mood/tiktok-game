import { useEffect, useRef, useState } from 'react'
import { remainingMs } from '../lib/time'

export function useCountdown(phaseEndsAt: string | null, serverNow: string): number {
  const offsetAt = useRef(serverNow)

  useEffect(() => {
    offsetAt.current = serverNow
  }, [serverNow])

  const [ms, setMs] = useState(() => remainingMs(phaseEndsAt, serverNow))

  useEffect(() => {
    const tick = () => setMs(remainingMs(phaseEndsAt, offsetAt.current))
    tick()
    const id = window.setInterval(tick, 250)
    return () => window.clearInterval(id)
  }, [phaseEndsAt, serverNow])

  return ms
}
