export function formatMmSs(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000))
  const minutes = Math.floor(total / 60)
  const seconds = total % 60
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}

export function remainingMs(phaseEndsAt: string | null, serverNow?: string, now: number = Date.now()): number {
  if (!phaseEndsAt) {
    return 0
  }
  const offset = serverNow ? now - Date.parse(serverNow) : 0
  return Math.max(0, Date.parse(phaseEndsAt) - (now - offset))
}
