import { randomUUID } from 'node:crypto'
import {
  DEFAULT_PLANNING_MS,
  DEFAULT_WORK_MS,
  DEPARTMENTS,
  SCORE_BY_DIFFICULTY,
  TOTAL_SPRINTS,
  isDepartmentId,
  type DepartmentId,
  type GamePhase,
  type GameState,
  type Player,
  type Task,
  type TaskDifficulty,
} from '@brainrot/shared'

export type GameStoreOptions = {
  planningMs?: number
  workMs?: number
  now?: () => number
}

export function createEmptyState(): GameState {
  return {
    sessionId: randomUUID(),
    updatedAt: new Date().toISOString(),
    phase: 'LOBBY',
    currentSprint: 0,
    phaseStartedAt: null,
    phaseEndsAt: null,
    players: [],
    tasks: [],
    autoAssignedCount: 0,
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

const ACTIVE_PHASES: GamePhase[] = ['LOBBY', 'PLANNING', 'WORK', 'FINISHED']

export function normalizeSnapshot(snapshot: GameState): GameState {
  const rawPhase = snapshot.phase as string
  const phase: GamePhase = ACTIVE_PHASES.includes(rawPhase as GamePhase)
    ? (rawPhase as GamePhase)
    : 'LOBBY'

  return {
    sessionId: snapshot.sessionId,
    updatedAt: snapshot.updatedAt,
    phase,
    currentSprint: snapshot.currentSprint ?? 0,
    phaseStartedAt: snapshot.phaseStartedAt ?? null,
    phaseEndsAt: snapshot.phaseEndsAt ?? null,
    players: Array.isArray(snapshot.players) ? snapshot.players.map((player) => ({ ...player })) : [],
    tasks: Array.isArray(snapshot.tasks) ? snapshot.tasks.map((task) => ({ ...task })) : [],
    autoAssignedCount: snapshot.autoAssignedCount ?? 0,
  }
}

export class GameStore {
  private state: GameState
  private readonly planningMs: number
  private readonly workMs: number
  private readonly now: () => number

  constructor(state: GameState = createEmptyState(), options: GameStoreOptions = {}) {
    this.state = cloneState(state)
    this.planningMs = options.planningMs ?? DEFAULT_PLANNING_MS
    this.workMs = options.workMs ?? DEFAULT_WORK_MS
    this.now = options.now ?? Date.now
  }

  static fromSnapshot(snapshot: GameState, options: GameStoreOptions = {}): GameStore {
    const normalized = normalizeSnapshot(snapshot)
    return new GameStore(
      {
        ...normalized,
        players: normalized.players.map((player) => ({
          ...player,
          connected: false,
        })),
      },
      options,
    )
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
    this.state.currentSprint = 1
    this.state.autoAssignedCount = 0
    this.createTasksForSprint(1)
    this.beginTimedPhase('PLANNING', this.now())
    this.touch()
  }

  assignDifficulty(leadId: string, playerId: string, difficulty: TaskDifficulty): void {
    if (this.state.phase !== 'PLANNING') {
      throw new GameError('Назначать сложность можно только во время планирования')
    }
    const lead = this.requirePlayer(leadId)
    if (!lead.isTeamLead) {
      throw new GameError('Только тимлид может назначать задачи')
    }
    const target = this.requirePlayer(playerId)
    if (target.id === lead.id) {
      throw new GameError('Тимлид не назначает задачу себе')
    }
    if (target.departmentId !== lead.departmentId) {
      throw new GameError('Можно назначать задачи только своей команде')
    }
    const task = this.requireCurrentTask(playerId)
    task.difficulty = difficulty
    task.status = 'ASSIGNED'
    this.touch()
  }

  startTask(playerId: string): void {
    if (this.state.phase !== 'WORK') {
      throw new GameError('Задачу можно начать только во время спринта')
    }
    const task = this.requireCurrentTask(playerId)
    if (task.status !== 'ASSIGNED') {
      throw new GameError('Задачу нельзя начать')
    }
    task.status = 'IN_PROGRESS'
    this.touch()
  }

  completeTask(playerId: string): void {
    if (this.state.phase !== 'WORK') {
      throw new GameError('Задачу можно завершить только во время спринта')
    }
    const task = this.requireCurrentTask(playerId)
    if (task.status !== 'IN_PROGRESS') {
      throw new GameError('Сначала начни задачу')
    }
    if (!task.difficulty) {
      throw new GameError('У задачи нет сложности')
    }
    task.status = 'COMPLETED'
    task.score = SCORE_BY_DIFFICULTY[task.difficulty]
    this.touch()
  }

  isPhaseDue(now: number = this.now()): boolean {
    if (this.state.phase !== 'PLANNING' && this.state.phase !== 'WORK') {
      return false
    }
    if (!this.state.phaseEndsAt) {
      return false
    }
    return now >= Date.parse(this.state.phaseEndsAt)
  }

  advancePhase(startAt: number = this.now()): void {
    if (this.state.phase === 'PLANNING') {
      this.autoAssignEasy()
      this.beginTimedPhase('WORK', startAt)
      this.touch()
      return
    }
    if (this.state.phase === 'WORK') {
      if (this.state.currentSprint < TOTAL_SPRINTS) {
        this.state.currentSprint += 1
        this.state.autoAssignedCount = 0
        this.createTasksForSprint(this.state.currentSprint)
        this.beginTimedPhase('PLANNING', startAt)
      } else {
        this.state.phase = 'FINISHED'
        this.state.phaseStartedAt = null
        this.state.phaseEndsAt = null
      }
      this.touch()
      return
    }
    throw new GameError('Нельзя сменить фазу')
  }

  endPhase(): void {
    if (this.state.phase !== 'PLANNING' && this.state.phase !== 'WORK') {
      throw new GameError('Сейчас нет активного этапа')
    }
    this.advancePhase(this.now())
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

  private createTasksForSprint(sprint: number): void {
    for (const player of this.state.players) {
      const task: Task = {
        id: randomUUID(),
        playerId: player.id,
        teamId: player.departmentId,
        sprint,
        difficulty: null,
        status: 'NOT_ASSIGNED',
        score: 0,
        gameType: null,
      }
      this.state.tasks.push(task)
    }
  }

  private autoAssignEasy(): void {
    let count = 0
    for (const player of this.state.players) {
      const task = this.requireCurrentTask(player.id)
      if (!task.difficulty) {
        task.difficulty = 'EASY'
        task.status = 'ASSIGNED'
        count += 1
      }
    }
    this.state.autoAssignedCount = count
  }

  private beginTimedPhase(phase: 'PLANNING' | 'WORK', startAt: number): void {
    const duration = phase === 'PLANNING' ? this.planningMs : this.workMs
    this.state.phase = phase
    this.state.phaseStartedAt = new Date(startAt).toISOString()
    this.state.phaseEndsAt = new Date(startAt + duration).toISOString()
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

  private requireCurrentTask(playerId: string): Task {
    const task = this.state.tasks.find(
      (item) => item.playerId === playerId && item.sprint === this.state.currentSprint,
    )
    if (!task) {
      throw new GameError('Задача не найдена')
    }
    return task
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
    currentSprint: state.currentSprint,
    phaseStartedAt: state.phaseStartedAt,
    phaseEndsAt: state.phaseEndsAt,
    players: state.players.map((player) => ({ ...player })),
    tasks: state.tasks.map((task) => ({ ...task })),
    autoAssignedCount: state.autoAssignedCount,
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
