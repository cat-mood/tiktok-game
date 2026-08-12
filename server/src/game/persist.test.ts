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
})
