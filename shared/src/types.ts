export type DepartmentId = 'development' | 'design' | 'marketing' | 'qa'

export type GamePhase = 'LOBBY' | 'READY' | 'RUNNING' | 'FINISHED'

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
  players: Player[]
}

export type ClientGameState = GameState & {
  restoredFromDisk: boolean
  devTools: boolean
}

export type Identity = {
  playerId: string
  sessionId: string
}

export type Ack =
  | { ok: true; playerId?: string }
  | { ok: false; error: string }
