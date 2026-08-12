import type { GameType } from './minigames.js'
import type { DepartmentId, TaskDifficulty } from './types.js'

export const CLIENT_EVENTS = {
  playerJoin: 'player:join',
  playerChangeDepartment: 'player:changeDepartment',
  playerReconnect: 'player:reconnect',
  teamLeadAssignDifficulty: 'teamLead:assignDifficulty',
  playerStartTask: 'player:startTask',
  playerCompleteTask: 'player:completeTask',
  playerSubmitAnswer: 'player:submitAnswer',
  playerExpireTask: 'player:expireTask',
  adminAuth: 'admin:auth',
  adminSetTeamLead: 'admin:setTeamLead',
  adminMovePlayer: 'admin:movePlayer',
  adminRemovePlayer: 'admin:removePlayer',
  adminStartGame: 'admin:startGame',
  adminEndPhase: 'admin:endPhase',
  adminNewGame: 'admin:newGame',
  adminDismissRestore: 'admin:dismissRestore',
  adminSpawnPlayer: 'admin:spawnPlayer',
  adminFillLobby: 'admin:fillLobby',
  devStartMinigame: 'dev:startMinigame',
  devSubmitAnswer: 'dev:submitAnswer',
  devExpireMinigame: 'dev:expireMinigame',
} as const

export const SERVER_EVENTS = {
  gameState: 'game:state',
  gameError: 'game:error',
} as const

export type PlayerJoinPayload = {
  name: string
  departmentId: DepartmentId
}

export type PlayerChangeDepartmentPayload = {
  departmentId: DepartmentId
}

export type PlayerReconnectPayload = {
  playerId: string
  sessionId: string
}

export type AdminAuthPayload = {
  code: string
}

export type AdminPlayerPayload = {
  playerId: string
}

export type AdminMovePlayerPayload = {
  playerId: string
  departmentId: DepartmentId
}

export type AdminSpawnPlayerPayload = {
  departmentId: DepartmentId
}

export type TeamLeadAssignDifficultyPayload = {
  playerId: string
  difficulty: TaskDifficulty
}

export type PlayerSubmitAnswerPayload = {
  taskId: string
  answer: unknown
}

export type PlayerExpireTaskPayload = {
  taskId: string
}

export type DevStartMinigamePayload = {
  gameType: GameType
  difficulty: TaskDifficulty
}

export type DevSubmitAnswerPayload = {
  sandboxId: string
  answer: unknown
}

export type DevExpireMinigamePayload = {
  sandboxId: string
}
