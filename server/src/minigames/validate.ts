import type { PuzzleAnswer } from './catalog.js'

export function normalizeText(value: string): string {
  return value.trim().toUpperCase()
}

export function answersMatch(expected: PuzzleAnswer, given: unknown): boolean {
  if (Array.isArray(expected)) {
    if (!Array.isArray(given) || given.length !== expected.length) {
      return false
    }
    return expected.every((id, index) => String(given[index]) === id)
  }

  if (typeof given === 'number') {
    return normalizeText(String(given)) === normalizeText(expected)
  }
  if (typeof given !== 'string') {
    return false
  }
  return normalizeText(given) === normalizeText(expected)
}
