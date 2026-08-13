import type { Project, ReleaseState, TestRun } from './project.js'

export type DepartmentId = 'development' | 'design' | 'marketing' | 'qa'

export type GamePhase = 'LOBBY' | 'WORK' | 'RELEASE' | 'FINISHED'

export type Player = {
  id: string
  name: string
  departmentId: DepartmentId
  isTeamLead: boolean
  connected: boolean
}

export type GameState = {
  sessionId: string
  updatedAt: string
  phase: GamePhase
  phaseStartedAt: string | null
  phaseEndsAt: string | null
  workDurationMs: number
  players: Player[]
  project: Project
  release: ReleaseState | null
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
  | {
      ok: true
      playerId?: string
      testResult?: TestRun
    }
  | { ok: false; error: string }
