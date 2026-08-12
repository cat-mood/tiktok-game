import { randomUUID } from 'node:crypto'
import {
  TIME_LIMIT_MS_BY_DIFFICULTY,
  isGameType,
  isTaskDifficulty,
  type GameType,
  type MiniGamePrompt,
  type TaskDifficulty,
} from '@brainrot/shared'
import { formatPuzzleAnswer } from './catalog.js'
import { pickPuzzle, requirePuzzle } from './pick.js'
import { answersMatch } from './validate.js'
import { GameError } from '../game/store.js'

type SandboxStatus = 'IN_PROGRESS' | 'COMPLETED' | 'FAILED'

type SandboxSession = {
  id: string
  puzzleId: string
  gameType: GameType
  difficulty: TaskDifficulty
  timeLimitMs: number
  startedAt: number
  status: SandboxStatus
}

export type SandboxStartResult = {
  sandboxId: string
  prompt: MiniGamePrompt
  timeLimitMs: number
  gameType: GameType
  difficulty: TaskDifficulty
}

export class MinigameSandbox {
  private readonly sessions = new Map<string, SandboxSession>()

  start(gameType: unknown, difficulty: unknown, now: number = Date.now()): SandboxStartResult {
    if (!isGameType(gameType)) {
      throw new GameError('Неизвестный тип игры')
    }
    if (!isTaskDifficulty(difficulty)) {
      throw new GameError('Выбери сложность')
    }
    const puzzle = pickPuzzle(gameType, difficulty)
    const id = randomUUID()
    const timeLimitMs = puzzle.timeLimitMs ?? TIME_LIMIT_MS_BY_DIFFICULTY[difficulty]
    this.sessions.set(id, {
      id,
      puzzleId: puzzle.id,
      gameType,
      difficulty,
      timeLimitMs,
      startedAt: now,
      status: 'IN_PROGRESS',
    })
    return {
      sandboxId: id,
      prompt: puzzle.prompt,
      timeLimitMs,
      gameType,
      difficulty,
    }
  }

  submit(
    sandboxId: string,
    answer: unknown,
    now: number = Date.now(),
  ): { correct: boolean; revealAnswer?: string } {
    const session = this.requireSession(sandboxId)
    if (session.status !== 'IN_PROGRESS') {
      throw new GameError('Эту игру уже нельзя пройти')
    }
    if (this.isExpired(session, now)) {
      session.status = 'FAILED'
      throw new GameError('Время вышло')
    }
    const puzzle = requirePuzzle(session.puzzleId)
    if (!answersMatch(puzzle.answer, answer)) {
      return { correct: false }
    }
    session.status = 'COMPLETED'
    return { correct: true, revealAnswer: formatPuzzleAnswer(puzzle.answer) }
  }

  expire(sandboxId: string, now: number = Date.now()): { revealAnswer: string } {
    const session = this.requireSession(sandboxId)
    if (session.status === 'FAILED') {
      return { revealAnswer: formatPuzzleAnswer(requirePuzzle(session.puzzleId).answer) }
    }
    if (session.status !== 'IN_PROGRESS') {
      throw new GameError('Эту игру уже нельзя завершить')
    }
    if (!this.isExpired(session, now)) {
      throw new GameError('Время ещё не вышло')
    }
    session.status = 'FAILED'
    return { revealAnswer: formatPuzzleAnswer(requirePuzzle(session.puzzleId).answer) }
  }

  private requireSession(sandboxId: string): SandboxSession {
    const session = this.sessions.get(sandboxId)
    if (!session) {
      throw new GameError('Игра не найдена')
    }
    return session
  }

  private isExpired(session: SandboxSession, now: number): boolean {
    return now >= session.startedAt + session.timeLimitMs
  }
}
