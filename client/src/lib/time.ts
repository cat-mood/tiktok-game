export function formatMmSs(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000))
  const minutes = Math.floor(total / 60)
  const seconds = total % 60
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}

export function remainingMs(
  phaseEndsAt: string | null,
  clockOffsetMs: number = 0,
  now: number = Date.now(),
): number {
  if (!phaseEndsAt) {
    return 0
  }
  return Math.max(0, Date.parse(phaseEndsAt) - now + clockOffsetMs)
}
