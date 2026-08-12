import type { GameType } from '@brainrot/shared'

const STORAGE_KEY = 'brainrot.tutorials'

type SeenMap = Record<string, Record<GameType, boolean>>

function readSeen(): SeenMap {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      return {}
    }
    const parsed = JSON.parse(raw) as SeenMap
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch {
    return {}
  }
}

export function hasSeenTutorial(playerId: string, gameType: GameType): boolean {
  return Boolean(readSeen()[playerId]?.[gameType])
}

export function markTutorialSeen(playerId: string, gameType: GameType): void {
  const all = readSeen()
  all[playerId] = { ...all[playerId], [gameType]: true }
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(all))
}
