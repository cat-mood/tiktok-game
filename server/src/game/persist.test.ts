import assert from 'node:assert/strict'
import { mkdtemp, readFile, rm } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { afterEach, describe, it } from 'node:test'
import { Persist } from './persist.js'
import { GameRuntime } from './runtime.js'
import { GameStore } from './store.js'

const tempDirs: string[] = []

async function tempDataDir() {
  const dir = await mkdtemp(path.join(os.tmpdir(), 'brainrot-'))
  tempDirs.push(dir)
  return dir
}

afterEach(async () => {
  await Promise.all(tempDirs.splice(0).map((dir) => rm(dir, { recursive: true, force: true })))
})

describe('Persist', () => {
  it('saves and loads the current snapshot', async () => {
    const dir = await tempDataDir()
    const persist = new Persist(dir)
    const store = new GameStore()
    store.join('Алекс', 'development')
    await persist.save(store.getState())
    const loaded = await persist.load()
    assert.equal(loaded?.sessionId, store.getState().sessionId)
    assert.equal(loaded?.players[0].name, 'Алекс')
  })

  it('overwrites an existing snapshot', async () => {
    const dir = await tempDataDir()
    const persist = new Persist(dir)
    const store = new GameStore()
    store.join('Алекс', 'development')
    await persist.save(store.getState())
    store.join('Маша', 'design')
    await persist.save(store.getState())
    const loaded = await persist.load()
    assert.equal(loaded?.players.length, 2)
    assert.equal(loaded?.players[1].name, 'Маша')
  })

  it('archives a session to a dedicated file', async () => {
    const dir = await tempDataDir()
    const persist = new Persist(dir)
    const store = new GameStore()
    store.join('Маша', 'design')
    const state = store.getState()
    const filePath = await persist.archive(state)
    const raw = await readFile(filePath, 'utf8')
    const parsed = JSON.parse(raw)
    assert.equal(parsed.sessionId, state.sessionId)
    assert.equal(parsed.players[0].name, 'Маша')
  })
})

describe('GameRuntime', () => {
  it('hydrates the same session from disk', async () => {
    const dir = await tempDataDir()
    const first = await GameRuntime.create(dir)
    await first.mutate((store) => store.join('Алекс', 'development'))
    const sessionId = first.store.getState().sessionId

    const second = await GameRuntime.create(dir)
    assert.equal(second.restoredFromDisk, true)
    assert.equal(second.store.getState().sessionId, sessionId)
    assert.equal(second.store.getState().players[0].name, 'Алекс')
    assert.equal(second.store.getState().players[0].connected, false)
  })

  it('keeps the roster after hydrate without wiping disconnected players', async () => {
    const dir = await tempDataDir()
    const first = await GameRuntime.create(dir)
    await first.mutate((store) => store.join('Алекс', 'development'))
    const second = await GameRuntime.create(dir)
    assert.equal(second.store.getState().players.length, 1)
    assert.equal(second.store.getState().players[0].connected, false)
  })

  it('archives the current game and starts a fresh lobby', async () => {
    const dir = await tempDataDir()
    const runtime = await GameRuntime.create(dir)
    const alex = await runtime.mutate((store) => store.join('Алекс', 'development'))
    const oldSession = runtime.store.getState().sessionId
    await runtime.newGame()
    const next = runtime.store.getState()
    assert.notEqual(next.sessionId, oldSession)
    assert.equal(next.players.length, 0)
    assert.equal(next.phase, 'LOBBY')
    assert.equal(runtime.restoredFromDisk, false)
    const archived = JSON.parse(
      await readFile(path.join(dir, 'archive', `${oldSession}.json`), 'utf8'),
    )
    assert.equal(archived.players[0].id, alex.id)
    assert.throws(() => runtime.store.reconnect(alex.id, oldSession), /другая игра/)
  })

  it('catches up expired sprint phases when hydrating from disk', async () => {
    const dir = await tempDataDir()
    const first = await GameRuntime.create(dir, { planningMs: 50, workMs: 50 })
    await first.mutate((store) => {
      store.fillLobby()
      store.startGame()
    })
    first.stop()
    await first.flush()

    const persist = new Persist(dir)
    const snapshot = await persist.load()
    assert.ok(snapshot)
    snapshot.phaseEndsAt = new Date(Date.now() - 60_000).toISOString()
    snapshot.phaseStartedAt = new Date(Date.now() - 120_000).toISOString()
    await persist.save(snapshot)

    const second = await GameRuntime.create(dir, { planningMs: 50, workMs: 50 })
    assert.equal(second.store.getState().phase, 'FINISHED')
    assert.equal(second.store.getState().currentSprint, 3)
    second.stop()
  })

  it('keeps remaining sprint time when hydrating a live phase', async () => {
    const dir = await tempDataDir()
    const first = await GameRuntime.create(dir, { planningMs: 60_000, workMs: 240_000 })
    await first.mutate((store) => {
      store.fillLobby()
      store.startGame()
    })
    const endsAt = first.store.getState().phaseEndsAt
    first.stop()
    await first.flush()

    const second = await GameRuntime.create(dir, { planningMs: 60_000, workMs: 240_000 })
    const restored = second.store.getState()
    assert.equal(restored.phase, 'PLANNING')
    assert.equal(restored.currentSprint, 1)
    assert.equal(restored.phaseEndsAt, endsAt)
    assert.ok(Date.parse(restored.phaseEndsAt!) > Date.now())
    assert.ok(second.getClientState().serverNow)
    second.stop()
  })
})
