import type { TaskDifficulty } from './types.js'

export const TOTAL_SPRINTS = 3
export const DEFAULT_PLANNING_MS = 60_000
export const DEFAULT_WORK_MS = 240_000

export const SCORE_BY_DIFFICULTY: Record<TaskDifficulty, number> = {
  EASY: 100,
  MEDIUM: 200,
  HARD: 300,
}

export const TASK_DIFFICULTIES: TaskDifficulty[] = ['EASY', 'MEDIUM', 'HARD']

export function isTaskDifficulty(value: string): value is TaskDifficulty {
  return TASK_DIFFICULTIES.includes(value as TaskDifficulty)
}
