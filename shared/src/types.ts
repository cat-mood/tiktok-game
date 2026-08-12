export type DepartmentId = 'development' | 'design' | 'marketing' | 'qa'

export type GamePhase = 'LOBBY' | 'PLANNING' | 'WORK' | 'FINISHED'

export type TaskDifficulty = 'EASY' | 'MEDIUM' | 'HARD'

export type TaskStatus = 'NOT_ASSIGNED' | 'ASSIGNED' | 'IN_PROGRESS' | 'COMPLETED'

export type Player = {
  id: string
  name: string
  departmentId: DepartmentId
  isTeamLead: boolean
  connected: boolean
}

export type Task = {
  id: string
  playerId: string
  teamId: DepartmentId
  sprint: number
  difficulty: TaskDifficulty | null
  status: TaskStatus
  score: number
  gameType: string | null
}

export type GameState = {
  sessionId: string
  updatedAt: string
  phase: GamePhase
  currentSprint: number
  phaseStartedAt: string | null
  phaseEndsAt: string | null
  players: Player[]
  tasks: Task[]
  autoAssignedCount: number
}

export type ClientGameState = GameState & {
  restoredFromDisk: boolean
  devTools: boolean
  serverNow: string
}

export type Identity = {
  playerId: string
  sessionId: string
}

export type Ack =
  | { ok: true; playerId?: string }
  | { ok: false; error: string }
