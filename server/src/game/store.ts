import { randomUUID } from 'node:crypto'
import {
  CANVAS_HEIGHT,
  CANVAS_WIDTH,
  DEFAULT_WORK_MS,
  DEPARTMENTS,
  PRODUCT_NAME,
  defaultFlags,
  ensurePresetProject,
  isBugSeverity,
  isComponentType,
  isConditionProperty,
  isDepartmentId,
  isLogicEvent,
  isMerchKind,
  isScreenKey,
  type AppState,
  type BugReport,
  type CampaignIdea,
  type DepartmentId,
  type DesignComponent,
  type GamePhase,
  type GameState,
  type LogicTransition,
  type MarketingVideo,
  type MerchItem,
  type Player,
  type Poster,
  type Project,
  type RuntimeFlags,
  type TestCase,
  type TestRun,
} from '@brainrot/shared'
import { applyAction, flagsForState, initialRuntimeStateId, runAllTests, runTest } from './interpreter.js'
import { createEmptyProject } from './project.js'

export type GameStoreOptions = {
  workMs?: number
  now?: () => number
}

const ACTIVE_PHASES: GamePhase[] = ['LOBBY', 'WORK', 'RELEASE', 'FINISHED']
const MAX_NAME = 40
const MAX_TEXT = 280

export function createEmptyState(workDurationMs: number = DEFAULT_WORK_MS): GameState {
  return {
    sessionId: randomUUID(),
    updatedAt: new Date().toISOString(),
    phase: 'LOBBY',
    phaseStartedAt: null,
    phaseEndsAt: null,
    workDurationMs,
    players: [],
    project: createEmptyProject(),
    release: null,
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

export function normalizeSnapshot(snapshot: GameState, workDurationMs: number = DEFAULT_WORK_MS): GameState {
  const rawPhase = snapshot.phase as string
  const phase: GamePhase = ACTIVE_PHASES.includes(rawPhase as GamePhase)
    ? (rawPhase as GamePhase)
    : 'LOBBY'

  return {
    sessionId: snapshot.sessionId,
    updatedAt: snapshot.updatedAt,
    phase,
    phaseStartedAt: snapshot.phaseStartedAt ?? null,
    phaseEndsAt: snapshot.phaseEndsAt ?? null,
    workDurationMs:
      typeof snapshot.workDurationMs === 'number' && snapshot.workDurationMs > 0
        ? snapshot.workDurationMs
        : workDurationMs,
    players: Array.isArray(snapshot.players) ? snapshot.players.map((player) => ({ ...player })) : [],
    project: normalizeProject(snapshot.project),
    release: snapshot.release
      ? {
          frozenAt: snapshot.release.frozenAt,
          launchedAt: snapshot.release.launchedAt ?? null,
          snapshot: normalizeProject(snapshot.release.snapshot),
          testResults: Array.isArray(snapshot.release.testResults) ? snapshot.release.testResults : [],
          runtimeStateId: snapshot.release.runtimeStateId ?? null,
          runtimeFlags: snapshot.release.runtimeFlags ?? defaultFlags(),
        }
      : null,
  }
}

export class GameStore {
  private state: GameState
  private readonly defaultWorkMs: number
  private readonly now: () => number

  constructor(state: GameState = createEmptyState(), options: GameStoreOptions = {}) {
    this.state = cloneState(state)
    this.defaultWorkMs = options.workMs ?? DEFAULT_WORK_MS
    this.now = options.now ?? Date.now
  }

  static fromSnapshot(snapshot: GameState, options: GameStoreOptions = {}): GameStore {
    const normalized = normalizeSnapshot(snapshot, options.workMs ?? DEFAULT_WORK_MS)
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

  startGame(workDurationMs?: number): void {
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
    const duration =
      typeof workDurationMs === 'number' && workDurationMs > 0 ? workDurationMs : this.defaultWorkMs
    this.state.workDurationMs = duration
    const startAt = this.now()
    this.state.phase = 'WORK'
    this.state.phaseStartedAt = new Date(startAt).toISOString()
    this.state.phaseEndsAt = new Date(startAt + duration).toISOString()
    this.touch()
  }

  isPhaseDue(now: number = this.now()): boolean {
    if (this.state.phase !== 'WORK') {
      return false
    }
    if (!this.state.phaseEndsAt) {
      return false
    }
    return now >= Date.parse(this.state.phaseEndsAt)
  }

  advancePhase(startAt: number = this.now()): void {
    if (this.state.phase === 'WORK') {
      this.freezeWork(startAt)
      return
    }
    throw new GameError('Нельзя сменить фазу')
  }

  endWork(): void {
    if (this.state.phase !== 'WORK') {
      throw new GameError('Сейчас нет активного этапа работы')
    }
    this.freezeWork(this.now())
  }

  launchRelease(): void {
    if (this.state.phase !== 'RELEASE' || !this.state.release) {
      throw new GameError('Сначала завершите работу')
    }
    if (this.state.release.launchedAt) {
      return
    }
    const snapshot = cloneProject(this.state.release.snapshot)
    const ranAt = new Date(this.now()).toISOString()
    const testResults = runAllTests(snapshot, ranAt)
    const runtimeStateId = initialRuntimeStateId(snapshot)
    this.state.release.launchedAt = ranAt
    this.state.release.testResults = testResults
    this.state.release.runtimeStateId = runtimeStateId
    this.state.release.runtimeFlags = runtimeStateId
      ? flagsForState(snapshot, runtimeStateId)
      : defaultFlags()
    this.touch()
  }

  finish(): void {
    if (this.state.phase !== 'RELEASE') {
      throw new GameError('Сначала сделайте RELEASE')
    }
    this.state.phase = 'FINISHED'
    this.state.phaseStartedAt = null
    this.state.phaseEndsAt = null
    this.touch()
  }

  reset(): void {
    this.state = createEmptyState(this.defaultWorkMs)
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

  upsertComponent(actor: DepartmentId, stateId: string, component: DesignComponent): void {
    this.requireEditable(actor, 'design')
    this.requireState(stateId)
    const layout = this.requireLayout(stateId)
    const next = normalizeComponent(component)
    const index = layout.components.findIndex((item) => item.id === next.id)
    if (index >= 0) {
      layout.components[index] = next
    } else {
      layout.components.push(next)
    }
    this.bumpProject()
  }

  deleteComponent(actor: DepartmentId, stateId: string, componentId: string): void {
    this.requireEditable(actor, 'design')
    const layout = this.requireLayout(stateId)
    const before = layout.components.length
    layout.components = layout.components.filter((item) => item.id !== componentId)
    if (layout.components.length === before) {
      throw new GameError('Компонент не найден')
    }
    this.bumpProject()
  }

  upsertTransition(actor: DepartmentId, transition: LogicTransition): void {
    this.requireEditable(actor, 'development')
    const next = normalizeTransition(transition)
    this.requireState(next.fromStateId)
    this.requireState(next.toStateId)
    if (next.elseStateId) {
      this.requireState(next.elseStateId)
    }
    const index = this.state.project.logic.transitions.findIndex((item) => item.id === next.id)
    if (index >= 0) {
      this.state.project.logic.transitions[index] = next
    } else {
      this.state.project.logic.transitions.push(next)
    }
    this.bumpProject()
  }

  deleteTransition(actor: DepartmentId, transitionId: string): void {
    this.requireEditable(actor, 'development')
    const before = this.state.project.logic.transitions.length
    this.state.project.logic.transitions = this.state.project.logic.transitions.filter(
      (item) => item.id !== transitionId,
    )
    if (this.state.project.logic.transitions.length === before) {
      throw new GameError('Переход не найден')
    }
    this.bumpProject()
  }

  setInitialState(actor: DepartmentId, stateId: string): void {
    this.requireEditable(actor, 'development')
    this.requireState(stateId)
    this.state.project.logic.initialStateId = stateId
    this.bumpProject()
  }

  upsertTest(actor: DepartmentId, test: TestCase): void {
    this.requireEditable(actor, 'qa')
    const next = normalizeTest(test)
    this.requireState(next.startStateId)
    this.requireState(next.expectedStateId)
    const index = this.state.project.qa.testCases.findIndex((item) => item.id === next.id)
    if (index >= 0) {
      next.lastResult = this.state.project.qa.testCases[index].lastResult
      this.state.project.qa.testCases[index] = next
    } else {
      this.state.project.qa.testCases.push(next)
    }
    this.bumpProject()
  }

  deleteTest(actor: DepartmentId, testId: string): void {
    this.requireEditable(actor, 'qa')
    const before = this.state.project.qa.testCases.length
    this.state.project.qa.testCases = this.state.project.qa.testCases.filter((item) => item.id !== testId)
    if (this.state.project.qa.testCases.length === before) {
      throw new GameError('Тест не найден')
    }
    this.bumpProject()
  }

  runQaTest(actor: DepartmentId, testId: string): TestRun {
    this.requireEditable(actor, 'qa')
    const test = this.state.project.qa.testCases.find((item) => item.id === testId)
    if (!test) {
      throw new GameError('Тест не найден')
    }
    const result = runTest(this.state.project, test, new Date(this.now()).toISOString())
    test.lastResult = result
    this.bumpProject()
    return { ...result }
  }

  upsertBug(actor: DepartmentId, bug: BugReport): void {
    this.requireEditable(actor, 'qa')
    const next = normalizeBug(bug)
    const index = this.state.project.qa.bugs.findIndex((item) => item.id === next.id)
    if (index >= 0) {
      this.state.project.qa.bugs[index] = next
    } else {
      this.state.project.qa.bugs.push(next)
    }
    this.bumpProject()
  }

  deleteBug(actor: DepartmentId, bugId: string): void {
    this.requireEditable(actor, 'qa')
    const before = this.state.project.qa.bugs.length
    this.state.project.qa.bugs = this.state.project.qa.bugs.filter((item) => item.id !== bugId)
    if (this.state.project.qa.bugs.length === before) {
      throw new GameError('Баг не найден')
    }
    this.bumpProject()
  }

  setSlogan(actor: DepartmentId, slogan: string): void {
    this.requireEditable(actor, 'marketing')
    this.state.project.marketing.slogan = slogan.trim().slice(0, 120)
    this.bumpProject()
  }

  upsertVideo(actor: DepartmentId, video: MarketingVideo): void {
    this.requireEditable(actor, 'marketing')
    const next: MarketingVideo = {
      id: video.id || randomUUID(),
      url: String(video.url ?? '').slice(0, 500),
      name: clampName(video.name || 'Ролик'),
    }
    if (!next.url) {
      throw new GameError('Нет видео')
    }
    const index = this.state.project.marketing.videos.findIndex((item) => item.id === next.id)
    if (index >= 0) {
      this.state.project.marketing.videos[index] = next
    } else {
      this.state.project.marketing.videos.push(next)
    }
    this.bumpProject()
  }

  deleteVideo(actor: DepartmentId, videoId: string): void {
    this.requireEditable(actor, 'marketing')
    this.state.project.marketing.videos = this.state.project.marketing.videos.filter(
      (item) => item.id !== videoId,
    )
    this.bumpProject()
  }

  upsertPoster(actor: DepartmentId, poster: Poster): void {
    this.requireEditable(actor, 'marketing')
    const next = normalizePoster(poster)
    const index = this.state.project.marketing.posters.findIndex((item) => item.id === next.id)
    if (index >= 0) {
      this.state.project.marketing.posters[index] = next
    } else {
      this.state.project.marketing.posters.push(next)
    }
    this.bumpProject()
  }

  deletePoster(actor: DepartmentId, posterId: string): void {
    this.requireEditable(actor, 'marketing')
    this.state.project.marketing.posters = this.state.project.marketing.posters.filter(
      (item) => item.id !== posterId,
    )
    this.bumpProject()
  }

  upsertIdea(actor: DepartmentId, idea: CampaignIdea): void {
    this.requireEditable(actor, 'marketing')
    const next: CampaignIdea = {
      id: idea.id || randomUUID(),
      text: idea.text.trim().slice(0, MAX_TEXT),
    }
    if (!next.text) {
      throw new GameError('Напиши идею')
    }
    const index = this.state.project.marketing.ideas.findIndex((item) => item.id === next.id)
    if (index >= 0) {
      this.state.project.marketing.ideas[index] = next
    } else {
      this.state.project.marketing.ideas.push(next)
    }
    this.bumpProject()
  }

  deleteIdea(actor: DepartmentId, ideaId: string): void {
    this.requireEditable(actor, 'marketing')
    this.state.project.marketing.ideas = this.state.project.marketing.ideas.filter(
      (item) => item.id !== ideaId,
    )
    this.bumpProject()
  }

  upsertMerch(actor: DepartmentId, merch: MerchItem): void {
    this.requireEditable(actor, 'marketing')
    if (!isMerchKind(merch.kind)) {
      throw new GameError('Неизвестный шаблон мерча')
    }
    const next: MerchItem = {
      id: merch.id || randomUUID(),
      kind: merch.kind,
      text: (merch.text ?? '').trim().slice(0, 40),
      color: String(merch.color ?? '#ff2d6a').slice(0, 40),
      logoSrc: merch.logoSrc ? String(merch.logoSrc).slice(0, 500) : undefined,
    }
    const index = this.state.project.marketing.merch.findIndex((item) => item.id === next.id)
    if (index >= 0) {
      this.state.project.marketing.merch[index] = next
    } else {
      this.state.project.marketing.merch.push(next)
    }
    this.bumpProject()
  }

  deleteMerch(actor: DepartmentId, merchId: string): void {
    this.requireEditable(actor, 'marketing')
    this.state.project.marketing.merch = this.state.project.marketing.merch.filter(
      (item) => item.id !== merchId,
    )
    this.bumpProject()
  }

  dispatchRuntime(event: string): void {
    if (this.state.phase !== 'RELEASE' || !this.state.release?.launchedAt) {
      throw new GameError('Приложение ещё не запущено')
    }
    if (!isLogicEvent(event)) {
      throw new GameError('Неизвестное действие')
    }
    const snapshot = this.state.release.snapshot
    const current = this.state.release.runtimeStateId
    if (!current) {
      throw new GameError('Нет начального состояния')
    }
    const next = applyAction(snapshot, current, event, this.state.release.runtimeFlags)
    this.state.release.runtimeStateId = next.stateId
    this.state.release.runtimeFlags = next.flags
    this.touch()
  }

  private freezeWork(at: number): void {
    this.state.phase = 'RELEASE'
    this.state.phaseStartedAt = new Date(at).toISOString()
    this.state.phaseEndsAt = null
    this.state.release = {
      frozenAt: new Date(at).toISOString(),
      launchedAt: null,
      snapshot: cloneProject(this.state.project),
      testResults: [],
      runtimeStateId: null,
      runtimeFlags: defaultFlags(),
    }
    this.touch()
  }

  private requireEditable(actor: DepartmentId, slice: DepartmentId | 'any'): void {
    if (this.state.phase !== 'WORK' && this.state.phase !== 'LOBBY') {
      throw new GameError('Редактирование закрыто')
    }
    if (slice !== 'any' && actor !== slice) {
      throw new GameError('Это не ваш отдел')
    }
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

  private requireState(stateId: string): AppState {
    const state = this.state.project.states.find((item) => item.id === stateId)
    if (!state) {
      throw new GameError('Состояние не найдено')
    }
    return state
  }

  private requireLayout(stateId: string) {
    this.requireState(stateId)
    let layout = this.state.project.design.layouts.find((item) => item.stateId === stateId)
    if (!layout) {
      layout = { stateId, components: [] }
      this.state.project.design.layouts.push(layout)
    }
    return layout
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

  private bumpProject(): void {
    this.state.project.revision += 1
    this.touch()
  }

  private touch(): void {
    this.state.updatedAt = new Date().toISOString()
  }
}

function clampName(value: string): string {
  const trimmed = value.trim()
  if (!trimmed) {
    throw new GameError('Нужно название')
  }
  return trimmed.slice(0, MAX_NAME)
}

function clampCoord(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) {
    return min
  }
  return Math.min(max, Math.max(min, Math.round(value)))
}

function normalizeComponent(component: DesignComponent): DesignComponent {
  if (!component?.id || !isComponentType(component.type)) {
    throw new GameError('Некорректный компонент')
  }
  return {
    id: component.id,
    type: component.type,
    x: clampCoord(component.x, -40, CANVAS_WIDTH),
    y: clampCoord(component.y, -40, CANVAS_HEIGHT),
    w: clampCoord(component.w, 24, CANVAS_WIDTH),
    h: clampCoord(component.h, 24, CANVAS_HEIGHT),
    props: {
      text: component.props?.text?.slice(0, MAX_TEXT),
      color: component.props?.color?.slice(0, 40),
      background: component.props?.background?.slice(0, 80),
      active: Boolean(component.props?.active),
      src: component.props?.src?.slice(0, 500),
      placeholder: component.props?.placeholder?.slice(0, 80),
    },
  }
}

function normalizeTransition(transition: LogicTransition): LogicTransition {
  if (!transition?.id || !isLogicEvent(transition.event)) {
    throw new GameError('Некорректный переход')
  }
  const condition = transition.condition
  return {
    id: transition.id,
    fromStateId: transition.fromStateId,
    event: transition.event,
    toStateId: transition.toStateId,
    elseStateId: transition.elseStateId ?? null,
    condition:
      condition && isConditionProperty(condition.property)
        ? {
            property: condition.property,
            operator: condition.operator === 'neq' ? 'neq' : 'eq',
            value: Boolean(condition.value),
          }
        : null,
  }
}

function normalizeTest(test: TestCase): TestCase {
  if (!test?.id) {
    throw new GameError('Некорректный тест')
  }
  const steps = Array.isArray(test.steps)
    ? test.steps.filter((step) => isLogicEvent(step.event)).map((step) => ({ event: step.event }))
    : []
  if (steps.length === 0) {
    throw new GameError('Добавь хотя бы один шаг')
  }
  return {
    id: test.id,
    title: clampName(test.title || 'Тест'),
    startStateId: test.startStateId,
    steps,
    expectedStateId: test.expectedStateId,
    lastResult: null,
  }
}

function normalizeBug(bug: BugReport): BugReport {
  if (!bug?.id) {
    throw new GameError('Некорректный баг')
  }
  return {
    id: bug.id,
    title: clampName(bug.title || 'Баг'),
    description: (bug.description ?? '').trim().slice(0, 400),
    steps: (bug.steps ?? '').trim().slice(0, 400),
    expected: (bug.expected ?? '').trim().slice(0, 200),
    actual: (bug.actual ?? '').trim().slice(0, 200),
    severity: isBugSeverity(bug.severity) ? bug.severity : 'MEDIUM',
    createdBy: (bug.createdBy ?? '').slice(0, 40),
  }
}

function normalizePoster(poster: Poster): Poster {
  if (!poster?.id) {
    throw new GameError('Некорректный постер')
  }
  return {
    id: poster.id,
    background: String(poster.background ?? '#07070c').slice(0, 120),
    layers: Array.isArray(poster.layers)
      ? poster.layers.slice(0, 8).map((layer) => ({
          id: layer.id || randomUUID(),
          kind: layer.kind === 'image' ? 'image' : 'text',
          text: layer.text?.slice(0, 80),
          src: layer.src?.slice(0, 500),
          x: clampCoord(layer.x, 0, 360),
          y: clampCoord(layer.y, 0, 480),
          fontSize: clampCoord(layer.fontSize ?? 28, 12, 72),
          color: layer.color?.slice(0, 40),
        }))
      : [],
  }
}

function normalizeProject(project: Project | undefined): Project {
  if (!project || !Array.isArray(project.states)) {
    return createEmptyProject()
  }
  const flags = (value: RuntimeFlags | undefined): RuntimeFlags => ({
    'video.isLiked': Boolean(value?.['video.isLiked']),
    'comments.isOpen': Boolean(value?.['comments.isOpen']),
    'share.isOpen': Boolean(value?.['share.isOpen']),
  })
  return ensurePresetProject({
    name: project.name || PRODUCT_NAME,
    revision: typeof project.revision === 'number' ? project.revision : 0,
    states: project.states.map((state) => ({
      id: state.id,
      name: state.name || 'STATE',
      screenKey: isScreenKey(state.screenKey) ? state.screenKey : 'VIDEO',
      flags: flags(state.flags),
    })),
    design: {
      screens: Array.isArray(project.design?.screens)
        ? project.design.screens.filter(isScreenKey)
        : ['VIDEO'],
      layouts: Array.isArray(project.design?.layouts)
        ? project.design.layouts.map((layout) => ({
            stateId: layout.stateId,
            components: Array.isArray(layout.components)
              ? layout.components.map((item) => normalizeComponent(item))
              : [],
          }))
        : [],
    },
    logic: {
      initialStateId: project.logic?.initialStateId ?? null,
      transitions: Array.isArray(project.logic?.transitions)
        ? project.logic.transitions.map((item) => normalizeTransition(item))
        : [],
    },
    marketing: {
      slogan: project.marketing?.slogan ?? '',
      videos: Array.isArray(project.marketing?.videos) ? project.marketing.videos : [],
      posters: Array.isArray(project.marketing?.posters)
        ? project.marketing.posters.map((item) => normalizePoster(item))
        : [],
      ideas: Array.isArray(project.marketing?.ideas) ? project.marketing.ideas : [],
      merch: Array.isArray(project.marketing?.merch) ? project.marketing.merch : [],
    },
    qa: {
      testCases: Array.isArray(project.qa?.testCases)
        ? project.qa.testCases.map((test) => ({
            ...normalizeTest({ ...test, steps: test.steps?.length ? test.steps : [{ event: 'CLICK' }] }),
            lastResult: test.lastResult ?? null,
          }))
        : [],
      bugs: Array.isArray(project.qa?.bugs) ? project.qa.bugs.map((bug) => normalizeBug(bug)) : [],
    },
  })
}

function cloneProject(project: Project): Project {
  return structuredClone(project)
}

function cloneState(state: GameState): GameState {
  return structuredClone(state)
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
