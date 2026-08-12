import type { Identity } from '@brainrot/shared'

const KEY = 'brainrot.identity'

export function loadIdentity(): Identity | null {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) {
      return null
    }
    const parsed = JSON.parse(raw) as Identity
    if (!parsed.playerId || !parsed.sessionId) {
      return null
    }
    return parsed
  } catch {
    return null
  }
}

export function saveIdentity(identity: Identity): void {
  localStorage.setItem(KEY, JSON.stringify(identity))
}

export function clearIdentity(): void {
  localStorage.removeItem(KEY)
}
