import { randomInt } from 'node:crypto'
import { GAME_TYPES, type GameType } from '@brainrot/shared'
import type { TaskDifficulty } from '@brainrot/shared'
import { getPuzzle, puzzlesFor, type Puzzle } from './catalog.js'

export function pickGameType(random: (maxExclusive: number) => number = randomInt): GameType {
  return GAME_TYPES[random(GAME_TYPES.length)]
}

export function pickPuzzle(
  gameType: GameType,
  difficulty: TaskDifficulty,
  excludeIds: string[] = [],
  random: (maxExclusive: number) => number = randomInt,
): Puzzle {
  const pool = puzzlesFor(gameType, difficulty)
  if (pool.length === 0) {
    throw new Error(`Нет заданий для ${gameType} ${difficulty}`)
  }
  const exclude = new Set(excludeIds)
  const available = pool.filter((puzzle) => !exclude.has(puzzle.id))
  const choices = available.length > 0 ? available : pool
  return choices[random(choices.length)]
}

export function requirePuzzle(puzzleId: string): Puzzle {
  const puzzle = getPuzzle(puzzleId)
  if (!puzzle) {
    throw new Error('Задание не найдено')
  }
  return puzzle
}
