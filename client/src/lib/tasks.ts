import { SCORE_BY_DIFFICULTY, type ClientGameState, type Task, type TaskDifficulty } from '@brainrot/shared'

export function currentTaskFor(state: ClientGameState, playerId: string): Task | null {
  return (
    state.tasks.find((task) => task.playerId === playerId && task.sprint === state.currentSprint) ??
    null
  )
}

export const DIFFICULTY_META: Record<
  TaskDifficulty,
  { title: string; icon: string; stars: string; label: string }
> = {
  EASY: { title: 'Лёгкая задача', icon: '🟢', stars: '⭐', label: 'EASY' },
  MEDIUM: { title: 'Средняя задача', icon: '🟡', stars: '⭐⭐', label: 'MEDIUM' },
  HARD: { title: 'Сложная задача', icon: '🔴', stars: '⭐⭐⭐', label: 'HARD' },
}

export function taskReward(difficulty: TaskDifficulty | null): number {
  if (!difficulty) {
    return 0
  }
  return SCORE_BY_DIFFICULTY[difficulty]
}
