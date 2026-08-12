export type {
  Ack,
  ClientGameState,
  DepartmentId,
  GamePhase,
  GameState,
  Identity,
  Player,
} from './types.js'

export {
  DEPARTMENTS,
  DEPARTMENT_IDS,
  getDepartment,
  isDepartmentId,
  type DepartmentInfo,
} from './departments.js'

export {
  CLIENT_EVENTS,
  SERVER_EVENTS,
  type AdminAuthPayload,
  type AdminMovePlayerPayload,
  type AdminPlayerPayload,
  type PlayerChangeDepartmentPayload,
  type PlayerJoinPayload,
  type PlayerReconnectPayload,
} from './events.js'
