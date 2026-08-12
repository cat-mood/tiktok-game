import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
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
    assert.equal(store.getState().phase, 'RUNNING')
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
})
