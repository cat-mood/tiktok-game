import type { TaskDifficulty } from './types.js'

export const GAME_TYPES = [
  'DECRYPT_MESSAGE',
  'BUILD_ALGORITHM',
  'SEQUENCE',
  'SPEED_TYPING',
] as const

export type GameType = (typeof GAME_TYPES)[number]

export const TIME_LIMIT_MS_BY_DIFFICULTY: Record<TaskDifficulty, number> = {
  EASY: 60_000,
  MEDIUM: 50_000,
  HARD: 40_000,
}

export const GAME_TYPE_META: Record<
  GameType,
  { title: string; emoji: string; short: string }
> = {
  DECRYPT_MESSAGE: {
    title: 'Расшифруй сообщение',
    emoji: '🔐',
    short: 'Шифр',
  },
  BUILD_ALGORITHM: {
    title: 'Собери алгоритм',
    emoji: '🧩',
    short: 'Алгоритм',
  },
  SEQUENCE: {
    title: 'Продолжи последовательность',
    emoji: '🔢',
    short: 'Ряд',
  },
  SPEED_TYPING: {
    title: 'Скоропечать',
    emoji: '⌨️',
    short: 'Печать',
  },
}

export function isGameType(value: unknown): value is GameType {
  return typeof value === 'string' && GAME_TYPES.includes(value as GameType)
}

export type CipherKeyEntry = {
  from: string
  to: string
}

export type DecryptPrompt = {
  kind: 'DECRYPT_MESSAGE'
  title: string
  instruction: string
  key: CipherKeyEntry[]
  encryptedText: string
}

export type AlgorithmCard = {
  id: string
  text: string
}

export type AlgorithmPrompt = {
  kind: 'BUILD_ALGORITHM'
  title: string
  instruction: string
  cards: AlgorithmCard[]
}

export type SequencePrompt = {
  kind: 'SEQUENCE'
  title: string
  instruction: string
  items: string[]
  options?: string[]
}

export type TypingPrompt = {
  kind: 'SPEED_TYPING'
  title: string
  instruction: string
  text: string
}

export type MiniGamePrompt = DecryptPrompt | AlgorithmPrompt | SequencePrompt | TypingPrompt
