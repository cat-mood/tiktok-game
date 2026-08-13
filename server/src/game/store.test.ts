import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { defaultFlags, type LogicTransition, type TestCase } from '@brainrot/shared'
import { applyAction, runTest } from './interpreter.js'
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

function defaultStateId(store: GameStore) {
  return store.getState().project.states[0].id
}

describe('GameStore lobby', () => {
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

  it('starts WORK when all four departments have a team lead', () => {
    const store = new GameStore()
    seedFourLeads(store)
    store.startGame(10 * 60 * 1000)
    const state = store.getState()
    assert.equal(state.phase, 'WORK')
    assert.equal(state.workDurationMs, 10 * 60 * 1000)
    assert.ok(state.phaseEndsAt)
    assert.equal(state.project.name, 'SHORTS')
    assert.equal(state.project.states[0].name, 'DEFAULT')
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
    assert.equal(store.getState().phase, 'WORK')
  })
})

describe('GameStore project and release', () => {
  it('blocks other departments from editing design', () => {
    const store = new GameStore()
    seedFourLeads(store)
    store.startGame()
    const stateId = defaultStateId(store)
    assert.throws(
      () =>
        store.upsertComponent('development', stateId, {
          id: 'c1',
          type: 'LIKE',
          x: 10,
          y: 10,
          w: 48,
          h: 48,
          props: {},
        }),
      /не ваш отдел/,
    )
  })

  it('lets design add a component and development add a wrong transition', () => {
    const store = new GameStore()
    seedFourLeads(store)
    store.startGame()
    const fromId = defaultStateId(store)
    const liked = store.createState('design', { name: 'LIKED', screenKey: 'VIDEO' })
    store.upsertComponent('design', fromId, {
      id: 'like',
      type: 'LIKE',
      x: 300,
      y: 400,
      w: 52,
      h: 52,
      props: { active: false },
    })
    const transition: LogicTransition = {
      id: 't1',
      fromStateId: fromId,
      event: 'CLICK_LIKE',
      toStateId: fromId,
      elseStateId: null,
      condition: null,
    }
    store.upsertTransition('development', transition)
    const project = store.getState().project
    assert.equal(project.design.layouts[0].components[0].type, 'LIKE')
    assert.equal(project.logic.transitions[0].toStateId, fromId)
    assert.notEqual(project.logic.transitions[0].toStateId, liked.id)
  })

  it('runs a QA test against the real logic and can fail', () => {
    const store = new GameStore()
    seedFourLeads(store)
    store.startGame()
    const fromId = defaultStateId(store)
    const liked = store.createState('design', { name: 'LIKED', screenKey: 'VIDEO' })
    store.upsertTransition('development', {
      id: 't1',
      fromStateId: fromId,
      event: 'CLICK_LIKE',
      toStateId: fromId,
      elseStateId: null,
      condition: null,
    })
    const test: TestCase = {
      id: 'test1',
      title: 'Лайк',
      startStateId: fromId,
      steps: [{ event: 'CLICK_LIKE' }],
      expectedStateId: liked.id,
      lastResult: null,
    }
    store.upsertTest('qa', test)
    const result = store.runQaTest('qa', 'test1')
    assert.equal(result.passed, false)
    assert.equal(result.actualStateId, fromId)
    assert.equal(result.expectedStateId, liked.id)
  })

  it('freezes the project on endWork and launches a runtime snapshot', () => {
    const store = new GameStore()
    seedFourLeads(store)
    store.startGame()
    const fromId = defaultStateId(store)
    const liked = store.createState('design', { name: 'LIKED', screenKey: 'VIDEO' })
    store.upsertTransition('development', {
      id: 't1',
      fromStateId: fromId,
      event: 'CLICK_LIKE',
      toStateId: liked.id,
      elseStateId: null,
      condition: null,
    })
    store.endWork()
    const frozen = store.getState()
    assert.equal(frozen.phase, 'RELEASE')
    assert.ok(frozen.release)
    assert.equal(frozen.release?.launchedAt, null)
    assert.throws(
      () => store.upsertTransition('development', frozen.project.logic.transitions[0]),
      /закрыто/,
    )
    store.launchRelease()
    const live = store.getState().release!
    assert.ok(live.launchedAt)
    assert.equal(live.runtimeStateId, fromId)
    store.dispatchRuntime('CLICK_LIKE')
    assert.equal(store.getState().release?.runtimeStateId, liked.id)
  })

  it('keeps a wrong transition in the released runtime', () => {
    const store = new GameStore()
    seedFourLeads(store)
    store.startGame()
    const fromId = defaultStateId(store)
    store.createState('design', { name: 'LIKED', screenKey: 'VIDEO' })
    store.upsertTransition('development', {
      id: 't1',
      fromStateId: fromId,
      event: 'CLICK_LIKE',
      toStateId: fromId,
      elseStateId: null,
      condition: null,
    })
    store.endWork()
    store.launchRelease()
    store.dispatchRuntime('CLICK_LIKE')
    assert.equal(store.getState().release?.runtimeStateId, fromId)
  })

  it('reports a WORK phase as due after phaseEndsAt', () => {
    const store = new GameStore({ ...new GameStore().getState() }, { workMs: 1_000 })
    seedFourLeads(store)
    store.startGame()
    assert.equal(store.isPhaseDue(Date.now() - 5_000), false)
    assert.equal(store.isPhaseDue(Date.parse(store.getState().phaseEndsAt!) + 1), true)
  })

  it('advances from WORK to RELEASE when the timer is due', () => {
    const store = new GameStore()
    seedFourLeads(store)
    store.startGame()
    store.advancePhase()
    assert.equal(store.getState().phase, 'RELEASE')
    assert.ok(store.getState().release)
  })

  it('does not invent a design layout when development creates a state', () => {
    const store = new GameStore()
    seedFourLeads(store)
    store.startGame()
    const liked = store.createState('development', { name: 'LIKED', screenKey: 'VIDEO' })
    const layout = store.getState().project.design.layouts.find((item) => item.stateId === liked.id)
    assert.equal(layout, undefined)
  })

  it('normalizes a legacy PLANNING snapshot into a lobby', () => {
    const store = new GameStore()
    seedFourLeads(store)
    const snapshot = store.getState()
    const restored = GameStore.fromSnapshot({
      ...snapshot,
      phase: 'PLANNING' as never,
    })
    assert.equal(restored.getState().phase, 'LOBBY')
  })
})

describe('interpreter', () => {
  it('applies a matching transition and stays put when none exists', () => {
    const store = new GameStore()
    const fromId = defaultStateId(store)
    const liked = store.createState('design', { name: 'LIKED', screenKey: 'VIDEO' })
    store.upsertTransition('development', {
      id: 't1',
      fromStateId: fromId,
      event: 'CLICK_LIKE',
      toStateId: liked.id,
      elseStateId: null,
      condition: null,
    })
    const project = store.getState().project
    assert.equal(applyAction(project, fromId, 'CLICK_LIKE').stateId, liked.id)
    assert.equal(applyAction(project, fromId, 'CLICK_COMMENT').stateId, fromId)
  })

  it('does not invent a correct LIKE transition', () => {
    const store = new GameStore()
    const fromId = defaultStateId(store)
    const liked = store.createState('design', { name: 'LIKED', screenKey: 'VIDEO' })
    store.upsertTransition('development', {
      id: 't1',
      fromStateId: fromId,
      event: 'CLICK_LIKE',
      toStateId: fromId,
      elseStateId: null,
      condition: null,
    })
    const result = applyAction(store.getState().project, fromId, 'CLICK_LIKE')
    assert.equal(result.stateId, fromId)
    assert.notEqual(result.stateId, liked.id)
  })

  it('evaluates a condition without writing code', () => {
    const store = new GameStore()
    const fromId = defaultStateId(store)
    const liked = store.createState('design', { name: 'LIKED', screenKey: 'VIDEO' })
    store.setStateFlags('development', liked.id, {
      ...defaultFlags(),
      'video.isLiked': true,
    })
    store.upsertTransition('development', {
      id: 't1',
      fromStateId: fromId,
      event: 'CLICK_LIKE',
      toStateId: liked.id,
      elseStateId: fromId,
      condition: { property: 'video.isLiked', operator: 'eq', value: false },
    })
    const project = store.getState().project
    const first = applyAction(project, fromId, 'CLICK_LIKE', defaultFlags())
    assert.equal(first.stateId, liked.id)
    const second = applyAction(project, fromId, 'CLICK_LIKE', first.flags)
    assert.equal(second.stateId, fromId)
  })

  it('marks a QA test as failed when actual state differs', () => {
    const store = new GameStore()
    const fromId = defaultStateId(store)
    const liked = store.createState('design', { name: 'LIKED', screenKey: 'VIDEO' })
    const test: TestCase = {
      id: 't',
      title: 'like',
      startStateId: fromId,
      steps: [{ event: 'CLICK_LIKE' }],
      expectedStateId: liked.id,
      lastResult: null,
    }
    const result = runTest(store.getState().project, test, 'now')
    assert.equal(result.passed, false)
    assert.equal(result.actualStateId, fromId)
  })
})
