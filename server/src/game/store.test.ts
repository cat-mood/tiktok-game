import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { GAME_TYPES } from '@brainrot/shared'
import { getPuzzle } from '../minigames/catalog.js'
import { GameError, GameStore } from './store.js'

function seedFourLeads(store: GameStore) {
  const alex = store.join('Алекс', 'development')
  const masha = store.join('Маша', 'design')
  const ivan = store.join('Иван', 'marketing')
  const petya = store.join('Петя', 'qa')
  store.setTeamLead(alex.id)
  store.setTeamLead(masha.id)
  store.setTeamLead(ivan.id)
  store.setTeamLead(petya.id)
  return { alex, masha, ivan, petya }
}

function currentTask(store: GameStore, playerId: string) {
  const state = store.getState()
  return state.tasks.find((task) => task.playerId === playerId && task.sprint === state.currentSprint)!
}

function completeMinigame(store: GameStore, playerId: string) {
  const task = currentTask(store, playerId)
  const puzzle = getPuzzle(task.puzzleId ?? '')
  assert.ok(puzzle, 'puzzle must be assigned')
  return store.submitAnswer(playerId, task.id, puzzle.answer)
}

describe('GameStore', () => {
  it('joins a player into a department', () => {
    const store = new GameStore()
    const player = store.join('  Алекс  ', 'development')
    assert.equal(player.name, 'Алекс')
    assert.equal(player.departmentId, 'development')
    assert.equal(player.isTeamLead, false)
    assert.equal(store.getState().players.length, 1)
  })

  it('rejects empty names', () => {
    const store = new GameStore()
    assert.throws(() => store.join('   ', 'design'), GameError)
  })

  it('keeps a single team lead per department', () => {
    const store = new GameStore()
    const alex = store.join('Алекс', 'development')
    const ivan = store.join('Иван', 'development')
    store.setTeamLead(alex.id)
    store.setTeamLead(ivan.id)
    const players = store.getState().players
    assert.equal(players.find((p) => p.id === alex.id)?.isTeamLead, false)
    assert.equal(players.find((p) => p.id === ivan.id)?.isTeamLead, true)
  })

  it('strips team lead when admin moves a player', () => {
    const store = new GameStore()
    const alex = store.join('Алекс', 'development')
    store.setTeamLead(alex.id)
    store.movePlayer(alex.id, 'design')
    const moved = store.getState().players[0]
    assert.equal(moved.departmentId, 'design')
    assert.equal(moved.isTeamLead, false)
  })

  it('does not let a team lead change department themselves', () => {
    const store = new GameStore()
    const alex = store.join('Алекс', 'development')
    store.setTeamLead(alex.id)
    assert.throws(() => store.changeDepartment(alex.id, 'qa'), /Тимлид не может сменить отдел/)
  })

  it('lets a regular player change department in lobby', () => {
    const store = new GameStore()
    const masha = store.join('Маша', 'design')
    store.changeDepartment(masha.id, 'qa')
    assert.equal(store.getState().players[0].departmentId, 'qa')
  })

  it('blocks start without players', () => {
    const store = new GameStore()
    assert.throws(() => store.startGame(), /нет игроков/)
  })

  it('blocks start if a department has no team lead', () => {
    const store = new GameStore()
    const alex = store.join('Алекс', 'development')
    const masha = store.join('Маша', 'design')
    store.setTeamLead(alex.id)
    store.setTeamLead(masha.id)
    assert.throws(() => store.startGame(), /в Marketing не назначен тимлид/)
  })

  it('starts the game when all four departments have a team lead', () => {
    const store = new GameStore()
    seedFourLeads(store)
    store.startGame()
    const state = store.getState()
    assert.equal(state.phase, 'PLANNING')
    assert.equal(state.currentSprint, 1)
    assert.equal(state.tasks.length, 4)
    assert.ok(state.phaseEndsAt)
  })

  it('freezes roster after the game starts', () => {
    const store = new GameStore()
    const { alex, masha } = seedFourLeads(store)
    store.startGame()
    assert.throws(() => store.join('Кира', 'qa'), /Состав зафиксирован/)
    assert.throws(() => store.changeDepartment(masha.id, 'qa'), /Состав зафиксирован/)
    assert.throws(() => store.setTeamLead(alex.id), /Состав зафиксирован/)
    assert.throws(() => store.movePlayer(alex.id, 'qa'), /Состав зафиксирован/)
    assert.throws(() => store.removePlayer(masha.id), /Состав зафиксирован/)
  })

  it('reconnects a player in the same session', () => {
    const store = new GameStore()
    const alex = store.join('Алекс', 'development')
    store.setConnected(alex.id, false)
    const sessionId = store.getState().sessionId
    const again = store.reconnect(alex.id, sessionId)
    assert.equal(again.connected, true)
  })

  it('rejects reconnect from another session', () => {
    const store = new GameStore()
    const alex = store.join('Алекс', 'development')
    assert.throws(() => store.reconnect(alex.id, 'other-session'), /другая игра/)
  })

  it('removes a disconnected player in lobby', () => {
    const store = new GameStore()
    const alex = store.join('Алекс', 'development')
    store.setConnected(alex.id, false)
    assert.equal(store.removeIfDisconnected(alex.id), true)
    assert.equal(store.getState().players.length, 0)
  })

  it('does not auto-remove a connected player', () => {
    const store = new GameStore()
    const alex = store.join('Алекс', 'development')
    assert.equal(store.removeIfDisconnected(alex.id), false)
    assert.equal(store.getState().players.length, 1)
  })

  it('does not auto-remove after the game is running', () => {
    const store = new GameStore()
    const { alex } = seedFourLeads(store)
    store.startGame()
    store.setConnected(alex.id, false)
    assert.equal(store.removeIfDisconnected(alex.id), false)
    assert.equal(store.getState().players.length, 4)
  })

  it('hydrates a snapshot with everyone disconnected', () => {
    const live = new GameStore()
    seedFourLeads(live)
    const snapshot = live.getState()
    snapshot.players[0].connected = true
    const restored = GameStore.fromSnapshot(snapshot)
    assert.equal(restored.getState().sessionId, snapshot.sessionId)
    assert.ok(restored.getState().players.every((player) => player.connected === false))
    assert.equal(restored.getState().players.length, 4)
  })

  it('reset creates a new empty session', () => {
    const store = new GameStore()
    const alex = store.join('Алекс', 'development')
    const oldSession = store.getState().sessionId
    store.reset()
    const next = store.getState()
    assert.notEqual(next.sessionId, oldSession)
    assert.equal(next.players.length, 0)
    assert.equal(next.phase, 'LOBBY')
    assert.throws(() => store.reconnect(alex.id, oldSession), /другая игра/)
  })

  it('spawns uniquely named players and fills all departments with leads', () => {
    const store = new GameStore()
    const first = store.spawnPlayer('development')
    assert.equal(first.name, 'Алекс')
    store.spawnPlayer('development')
    store.fillLobby()
    const state = store.getState()
    assert.equal(state.players.filter((p) => p.departmentId === 'development').length, 2)
    for (const dept of ['development', 'design', 'marketing', 'qa'] as const) {
      assert.equal(
        state.players.some((p) => p.departmentId === dept && p.isTeamLead),
        true,
      )
    }
    store.startGame()
    assert.equal(store.getState().phase, 'PLANNING')
  })
})

describe('GameStore sprints', () => {
  it('lets a team lead assign and change difficulty during planning', () => {
    const store = new GameStore()
    const { alex } = seedFourLeads(store)
    const kira = store.join('Кира', 'development')
    store.startGame()
    store.assignDifficulty(alex.id, kira.id, 'HARD')
    store.assignDifficulty(alex.id, kira.id, 'MEDIUM')
    const task = store.getState().tasks.find((item) => item.playerId === kira.id)!
    assert.equal(task.difficulty, 'MEDIUM')
    assert.equal(task.status, 'ASSIGNED')
    assert.equal(task.score, 0)
  })

  it('rejects assignment from a non-lead and from another team', () => {
    const store = new GameStore()
    const { alex, masha } = seedFourLeads(store)
    const kira = store.join('Кира', 'development')
    store.startGame()
    assert.throws(() => store.assignDifficulty(kira.id, alex.id, 'EASY'), /Только тимлид/)
    assert.throws(() => store.assignDifficulty(masha.id, kira.id, 'EASY'), /своей команде/)
    assert.throws(() => store.assignDifficulty(alex.id, alex.id, 'EASY'), /не назначает задачу себе/)
  })

  it('auto-assigns EASY when planning ends without a difficulty', () => {
    const store = new GameStore()
    const { alex } = seedFourLeads(store)
    const kira = store.join('Кира', 'development')
    store.startGame()
    store.assignDifficulty(alex.id, kira.id, 'HARD')
    store.advancePhase()
    const state = store.getState()
    assert.equal(state.phase, 'WORK')
    assert.equal(state.autoAssignedCount, 4)
    const kiraTask = state.tasks.find((task) => task.playerId === kira.id)!
    assert.equal(kiraTask.difficulty, 'HARD')
    const alexTask = state.tasks.find((task) => task.playerId === alex.id)!
    assert.equal(alexTask.difficulty, 'EASY')
    assert.ok(state.tasks.every((task) => task.status === 'ASSIGNED' && task.difficulty))
  })

  it('locks difficulty after planning and awards score on complete', () => {
    const store = new GameStore()
    const { alex } = seedFourLeads(store)
    const kira = store.join('Кира', 'development')
    store.startGame()
    store.assignDifficulty(alex.id, kira.id, 'HARD')
    store.advancePhase()
    assert.throws(() => store.assignDifficulty(alex.id, kira.id, 'EASY'), /только во время планирования/)
    store.startTask(kira.id)
    assert.equal(store.getState().tasks.find((task) => task.playerId === kira.id)?.status, 'IN_PROGRESS')
    completeMinigame(store, kira.id)
    const done = store.getState().tasks.find((task) => task.playerId === kira.id)!
    assert.equal(done.status, 'COMPLETED')
    assert.equal(done.score, 300)
  })

  it('creates new tasks for sprint 2 and keeps old scores', () => {
    const store = new GameStore()
    const { alex } = seedFourLeads(store)
    const kira = store.join('Кира', 'development')
    store.startGame()
    store.assignDifficulty(alex.id, kira.id, 'MEDIUM')
    store.advancePhase()
    store.startTask(kira.id)
    completeMinigame(store, kira.id)
    const sprint1Id = store.getState().tasks.find((task) => task.playerId === kira.id && task.sprint === 1)!.id
    store.advancePhase()
    const state = store.getState()
    assert.equal(state.phase, 'PLANNING')
    assert.equal(state.currentSprint, 2)
    assert.equal(state.tasks.length, 10)
    const oldTask = state.tasks.find((task) => task.id === sprint1Id)!
    assert.equal(oldTask.status, 'COMPLETED')
    assert.equal(oldTask.score, 200)
    const next = state.tasks.find((task) => task.playerId === kira.id && task.sprint === 2)!
    assert.equal(next.status, 'NOT_ASSIGNED')
    assert.notEqual(next.id, sprint1Id)
  })

  it('finishes after the third work phase', () => {
    const store = new GameStore()
    seedFourLeads(store)
    store.startGame()
    store.advancePhase()
    store.advancePhase()
    store.advancePhase()
    store.advancePhase()
    store.advancePhase()
    store.advancePhase()
    const state = store.getState()
    assert.equal(state.phase, 'FINISHED')
    assert.equal(state.currentSprint, 3)
    assert.equal(state.phaseEndsAt, null)
    assert.equal(state.tasks.length, 12)
  })

  it('lets admin end the current phase immediately', () => {
    const store = new GameStore()
    seedFourLeads(store)
    assert.throws(() => store.endPhase(), /нет активного этапа/)
    store.startGame()
    store.endPhase()
    assert.equal(store.getState().phase, 'WORK')
    store.endPhase()
    assert.equal(store.getState().phase, 'PLANNING')
    assert.equal(store.getState().currentSprint, 2)
  })

  it('normalizes a legacy RUNNING snapshot into a lobby', () => {
    const store = new GameStore()
    seedFourLeads(store)
    const snapshot = store.getState()
    const restored = GameStore.fromSnapshot({
      ...snapshot,
      phase: 'RUNNING' as never,
    })
    assert.equal(restored.getState().phase, 'LOBBY')
    assert.equal(restored.getState().tasks.length, 0)
  })

  it('reports a phase as due after phaseEndsAt', () => {
    const store = new GameStore({ ...new GameStore().getState() }, { planningMs: 1_000, workMs: 1_000 })
    seedFourLeads(store)
    store.startGame()
    assert.equal(store.isPhaseDue(Date.now() - 5_000), false)
    assert.equal(store.isPhaseDue(Date.parse(store.getState().phaseEndsAt!) + 1), true)
  })
})

describe('GameStore minigames', () => {
  it('assigns a stable development gameType and a puzzle after difficulty', () => {
    const store = new GameStore(undefined, { randomInt: () => 0 })
    const { alex, masha } = seedFourLeads(store)
    const kira = store.join('Кира', 'development')
    store.startGame()
    const created = currentTask(store, kira.id)
    assert.equal(created.gameType, GAME_TYPES[0])
    assert.equal(created.puzzleId, null)
    assert.equal(currentTask(store, masha.id).gameType, null)

    store.assignDifficulty(alex.id, kira.id, 'EASY')
    const assigned = currentTask(store, kira.id)
    assert.equal(assigned.gameType, GAME_TYPES[0])
    assert.ok(assigned.puzzleId)
    assert.ok(assigned.prompt)
    assert.equal(assigned.timeLimitMs, 60_000)

    store.assignDifficulty(alex.id, kira.id, 'HARD')
    const harder = currentTask(store, kira.id)
    assert.equal(harder.gameType, GAME_TYPES[0])
    assert.equal(harder.difficulty, 'HARD')
    assert.ok(harder.puzzleId)
    assert.equal(harder.timeLimitMs, 40_000)
  })

  it('awards score on a correct answer and rejects a second submit', () => {
    const store = new GameStore()
    const { alex } = seedFourLeads(store)
    const kira = store.join('Кира', 'development')
    store.startGame()
    store.assignDifficulty(alex.id, kira.id, 'EASY')
    store.advancePhase()
    store.startTask(kira.id)
    assert.equal(completeMinigame(store, kira.id), true)
    const done = currentTask(store, kira.id)
    assert.equal(done.status, 'COMPLETED')
    assert.equal(done.score, 100)
    assert.throws(() => completeMinigame(store, kira.id), /уже нельзя выполнить/)
    assert.equal(currentTask(store, kira.id).score, 100)
  })

  it('keeps the task open after a wrong answer', () => {
    const store = new GameStore()
    const { alex } = seedFourLeads(store)
    const kira = store.join('Кира', 'development')
    store.startGame()
    store.assignDifficulty(alex.id, kira.id, 'MEDIUM')
    store.advancePhase()
    store.startTask(kira.id)
    const task = currentTask(store, kira.id)
    assert.equal(store.submitAnswer(kira.id, task.id, 'НЕТ'), false)
    const again = currentTask(store, kira.id)
    assert.equal(again.status, 'IN_PROGRESS')
    assert.equal(again.score, 0)
    assert.equal(completeMinigame(store, kira.id), true)
    assert.equal(currentTask(store, kira.id).score, 200)
  })

  it('fails the task when time runs out and rejects a late correct answer', () => {
    let now = 1_000_000
    const store = new GameStore(undefined, { now: () => now })
    const { alex } = seedFourLeads(store)
    const kira = store.join('Кира', 'development')
    store.startGame()
    store.assignDifficulty(alex.id, kira.id, 'HARD')
    store.advancePhase()
    store.startTask(kira.id)
    const task = currentTask(store, kira.id)
    const startedAt = task.startedAt
    assert.ok(startedAt)
    now += (task.timeLimitMs ?? 40_000) + 1
    const puzzle = getPuzzle(task.puzzleId ?? '')
    assert.ok(puzzle)
    assert.throws(() => store.submitAnswer(kira.id, task.id, puzzle.answer), /Время вышло/)
    const failed = currentTask(store, kira.id)
    assert.equal(failed.status, 'FAILED')
    assert.equal(failed.score, 0)
    store.expireTask(kira.id, task.id)
    assert.throws(() => store.submitAnswer(kira.id, task.id, puzzle.answer), /уже нельзя выполнить/)
  })

  it('rejects another player submitting someone else\'s task', () => {
    const store = new GameStore()
    const { alex, masha } = seedFourLeads(store)
    const kira = store.join('Кира', 'development')
    store.startGame()
    store.assignDifficulty(alex.id, kira.id, 'EASY')
    store.advancePhase()
    store.startTask(kira.id)
    const task = currentTask(store, kira.id)
    const puzzle = getPuzzle(task.puzzleId ?? '')
    assert.ok(puzzle)
    assert.throws(() => store.submitAnswer(masha.id, task.id, puzzle.answer), /не твоя задача/)
    assert.equal(currentTask(store, kira.id).status, 'IN_PROGRESS')
  })

  it('restores startedAt so the remaining time can be computed', () => {
    const store = new GameStore()
    const { alex } = seedFourLeads(store)
    const kira = store.join('Кира', 'development')
    store.startGame()
    store.assignDifficulty(alex.id, kira.id, 'EASY')
    store.advancePhase()
    store.startTask(kira.id)
    const snapshot = store.getState()
    const live = currentTask(store, kira.id)
    const restored = GameStore.fromSnapshot(snapshot)
    const task = restored.getState().tasks.find((item) => item.id === live.id)!
    assert.equal(task.status, 'IN_PROGRESS')
    assert.equal(task.startedAt, live.startedAt)
    assert.equal(task.timeLimitMs, live.timeLimitMs)
    assert.equal(task.gameType, live.gameType)
    assert.ok(task.prompt)
  })

  it('still lets non-development players complete without a minigame', () => {
    const store = new GameStore()
    const { masha } = seedFourLeads(store)
    store.startGame()
    store.advancePhase()
    store.startTask(masha.id)
    store.completeTask(masha.id)
    const done = currentTask(store, masha.id)
    assert.equal(done.status, 'COMPLETED')
    assert.equal(done.score, 100)
    assert.equal(done.gameType, null)
  })

  it('rejects completeTask for a development minigame', () => {
    const store = new GameStore()
    const { alex } = seedFourLeads(store)
    const kira = store.join('Кира', 'development')
    store.startGame()
    store.assignDifficulty(alex.id, kira.id, 'EASY')
    store.advancePhase()
    store.startTask(kira.id)
    assert.throws(() => store.completeTask(kira.id), /мини-игру/)
  })

  it('does not pick the same puzzle twice for one player if another remains', () => {
    const store = new GameStore(undefined, { randomInt: () => 0 })
    const { alex } = seedFourLeads(store)
    const kira = store.join('Кира', 'development')
    store.startGame()
    store.assignDifficulty(alex.id, kira.id, 'EASY')
    const firstId = currentTask(store, kira.id).puzzleId
    store.advancePhase()
    store.advancePhase()
    store.assignDifficulty(alex.id, kira.id, 'EASY')
    const secondId = currentTask(store, kira.id).puzzleId
    assert.ok(firstId)
    assert.ok(secondId)
    assert.notEqual(secondId, firstId)
  })
})
