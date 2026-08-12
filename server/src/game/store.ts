import { randomUUID } from 'node:crypto'
import {
  DEPARTMENTS,
  isDepartmentId,
  type DepartmentId,
  type GameState,
  type Player,
} from '@brainrot/shared'

export function createEmptyState(): GameState {
  return {
    sessionId: randomUUID(),
    updatedAt: new Date().toISOString(),
    phase: 'LOBBY',
    players: [],
  }
}

export class GameError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'GameError'
  }
}

function assertDepartment(id: string): asserts id is DepartmentId {
  if (!isDepartmentId(id)) {
    throw new GameError('Неизвестный отдел')
  }
}

export class GameStore {
  private state: GameState

  constructor(state: GameState = createEmptyState()) {
    this.state = cloneState(state)
  }

  static fromSnapshot(snapshot: GameState): GameStore {
    return new GameStore({
      ...snapshot,
      players: snapshot.players.map((player) => ({
        ...player,
        connected: false,
      })),
    })
  }

  getState(): GameState {
    return cloneState(this.state)
  }

  join(name: string, departmentId: DepartmentId): Player {
    this.requireLobby()
    assertDepartment(departmentId)
    const trimmed = name.trim()
    if (!trimmed) {
      throw new GameError('Введи имя')
    }
    if (trimmed.length > 20) {
      throw new GameError('Имя слишком длинное')
    }

    const player: Player = {
      id: randomUUID(),
      name: trimmed,
      departmentId,
      isTeamLead: false,
      connected: true,
    }
    this.state.players.push(player)
    this.touch()
    return { ...player }
  }

  changeDepartment(playerId: string, departmentId: DepartmentId): void {
    this.requireLobby()
    assertDepartment(departmentId)
    const player = this.requirePlayer(playerId)
    if (player.isTeamLead) {
      throw new GameError('Тимлид не может сменить отдел. Попроси ведущего.')
    }
    player.departmentId = departmentId
    this.touch()
  }

  reconnect(playerId: string, sessionId: string): Player {
    if (sessionId !== this.state.sessionId) {
      throw new GameError('Это уже другая игра')
    }
    const player = this.requirePlayer(playerId)
    player.connected = true
    this.touch()
    return { ...player }
  }

  setConnected(playerId: string, connected: boolean): void {
    const player = this.state.players.find((item) => item.id === playerId)
    if (!player) {
      return
    }
    player.connected = connected
    this.touch()
  }

  removePlayer(playerId: string): void {
    this.requireLobby()
    const before = this.state.players.length
    this.state.players = this.state.players.filter((item) => item.id !== playerId)
    if (this.state.players.length === before) {
      throw new GameError('Игрок не найден')
    }
    this.touch()
  }

  removeIfDisconnected(playerId: string): boolean {
    if (this.state.phase !== 'LOBBY') {
      return false
    }
    const player = this.state.players.find((item) => item.id === playerId)
    if (!player || player.connected) {
      return false
    }
    this.state.players = this.state.players.filter((item) => item.id !== playerId)
    this.touch()
    return true
  }

  setTeamLead(playerId: string): void {
    this.requireLobby()
    const player = this.requirePlayer(playerId)
    for (const item of this.state.players) {
      if (item.departmentId === player.departmentId) {
        item.isTeamLead = item.id === playerId
      }
    }
    this.touch()
  }

  movePlayer(playerId: string, departmentId: DepartmentId): void {
    this.requireLobby()
    assertDepartment(departmentId)
    const player = this.requirePlayer(playerId)
    if (player.departmentId === departmentId) {
      return
    }
    player.departmentId = departmentId
    player.isTeamLead = false
    this.touch()
  }

  startGame(): void {
    if (this.state.phase !== 'LOBBY') {
      throw new GameError('Игра уже запущена')
    }
    if (this.state.players.length === 0) {
      throw new GameError('Нельзя начать игру: нет игроков')
    }
    for (const dept of DEPARTMENTS) {
      const hasLead = this.state.players.some(
        (player) => player.departmentId === dept.id && player.isTeamLead,
      )
      if (!hasLead) {
        throw new GameError(`Нельзя начать игру: в ${dept.name} не назначен тимлид`)
      }
    }
    this.state.phase = 'RUNNING'
    this.touch()
  }

  reset(): void {
    this.state = createEmptyState()
  }

  spawnPlayer(departmentId: DepartmentId): Player {
    return this.join(this.nextSpawnName(), departmentId)
  }

  fillLobby(): Player[] {
    this.requireLobby()
    const created: Player[] = []
    for (const dept of DEPARTMENTS) {
      const members = this.state.players.filter((player) => player.departmentId === dept.id)
      if (members.length === 0) {
        created.push(this.join(this.nextSpawnName(), dept.id))
      }
      const roster = this.state.players.filter((player) => player.departmentId === dept.id)
      if (!roster.some((player) => player.isTeamLead)) {
        this.setTeamLead(roster[0].id)
      }
    }
    return created
  }

  private nextSpawnName(): string {
    const taken = new Set(this.state.players.map((player) => player.name))
    for (const name of SPAWN_NAMES) {
      if (!taken.has(name)) {
        return name
      }
    }
    let index = 2
    while (taken.has(`Бот ${index}`)) {
      index += 1
    }
    return `Бот ${index}`
  }

  private requireLobby(): void {
    if (this.state.phase !== 'LOBBY') {
      throw new GameError('Состав зафиксирован — игра уже началась')
    }
  }

  private requirePlayer(playerId: string): Player {
    const player = this.state.players.find((item) => item.id === playerId)
    if (!player) {
      throw new GameError('Игрок не найден')
    }
    return player
  }

  private touch(): void {
    this.state.updatedAt = new Date().toISOString()
  }
}

function cloneState(state: GameState): GameState {
  return {
    sessionId: state.sessionId,
    updatedAt: state.updatedAt,
    phase: state.phase,
    players: state.players.map((player) => ({ ...player })),
  }
}

const SPAWN_NAMES = [
  'Алекс',
  'Маша',
  'Иван',
  'Петя',
  'Кира',
  'Лена',
  'Саша',
  'Дима',
  'Ника',
  'Тимур',
  'Оля',
  'Макс',
]
