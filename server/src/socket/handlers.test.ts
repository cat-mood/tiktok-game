import assert from 'node:assert/strict'
import { createServer } from 'node:http'
import { mkdtemp, rm } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { after, before, describe, it } from 'node:test'
import { Server } from 'socket.io'
import { io as ioc, type Socket as ClientSocket } from 'socket.io-client'
import {
  CLIENT_EVENTS,
  SERVER_EVENTS,
  type Ack,
  type ClientGameState,
} from '@brainrot/shared'
import { getPuzzle } from '../minigames/catalog.js'
import { GameRuntime } from '../game/runtime.js'
import { registerSocketHandlers } from './handlers.js'

const ADMIN_CODE = 'secret'

async function emitAck<T>(socket: ClientSocket, event: string, payload?: T): Promise<Ack> {
  return await new Promise((resolve) => {
    socket.emit(event, payload, (ack: Ack) => resolve(ack))
  })
}

function trackState(socket: ClientSocket) {
  let current: ClientGameState | null = null
  const waiters: Array<(state: ClientGameState) => void> = []

  socket.on(SERVER_EVENTS.gameState, (state: ClientGameState) => {
    current = state
    for (const waiter of [...waiters]) {
      waiter(state)
    }
  })

  return {
    wait(predicate: (state: ClientGameState) => boolean): Promise<ClientGameState> {
      if (current && predicate(current)) {
        return Promise.resolve(current)
      }
      return new Promise((resolve) => {
        const waiter = (state: ClientGameState) => {
          if (predicate(state)) {
            const index = waiters.indexOf(waiter)
            if (index >= 0) {
              waiters.splice(index, 1)
            }
            resolve(state)
          }
        }
        waiters.push(waiter)
      })
    },
  }
}

describe('socket lobby flow', () => {
  let dataDir = ''
  let url = ''
  let io: Server
  let httpServer: ReturnType<typeof createServer>
  let runtime: GameRuntime
  const clients: ClientSocket[] = []

  before(async () => {
    dataDir = await mkdtemp(path.join(os.tmpdir(), 'brainrot-socket-'))
    runtime = await GameRuntime.create(dataDir)
    httpServer = createServer()
    io = new Server(httpServer, { cors: { origin: true } })
    registerSocketHandlers(io, runtime, ADMIN_CODE)
    await new Promise<void>((resolve) => httpServer.listen(0, '127.0.0.1', resolve))
    const address = httpServer.address()
    if (!address || typeof address === 'string') {
      throw new Error('No listen address')
    }
    url = `http://127.0.0.1:${address.port}`
  })

  after(async () => {
    for (const client of clients) {
      client.close()
    }
    io.close()
    runtime.stop()
    await new Promise<void>((resolve) => httpServer.close(() => resolve()))
    await runtime.flush()
    await rm(dataDir, { recursive: true, force: true })
  })

  async function connect() {
    const client = ioc(url, { transports: ['websocket'] })
    const state = trackState(client)
    clients.push(client)
    await new Promise<void>((resolve) => client.on('connect', () => resolve()))
    return { client, state }
  }

  it('runs the workshop lobby scenario', async () => {
    const alex = await connect()
    const masha = await connect()
    const admin = await connect()

    assert.equal(
      (
        await emitAck(alex.client, CLIENT_EVENTS.playerJoin, {
          name: 'Алекс',
          departmentId: 'development',
        })
      ).ok,
      true,
    )
    assert.equal(
      (
        await emitAck(masha.client, CLIENT_EVENTS.playerJoin, {
          name: 'Маша',
          departmentId: 'design',
        })
      ).ok,
      true,
    )

    const auth = await emitAck(admin.client, CLIENT_EVENTS.adminAuth, { code: ADMIN_CODE })
    assert.equal(auth.ok, true)
    assert.equal((await emitAck(admin.client, CLIENT_EVENTS.adminFillLobby)).ok, false)

    const seen = await admin.state.wait((s) => s.players.length === 2)
    const alexId = seen.players.find((p) => p.name === 'Алекс')!.id
    const mashaId = seen.players.find((p) => p.name === 'Маша')!.id

    assert.equal(
      (await emitAck(admin.client, CLIENT_EVENTS.adminSetTeamLead, { playerId: alexId })).ok,
      true,
    )
    assert.equal(
      (await emitAck(admin.client, CLIENT_EVENTS.adminSetTeamLead, { playerId: mashaId })).ok,
      true,
    )

    const startTooEarly = await emitAck(admin.client, CLIENT_EVENTS.adminStartGame)
    assert.equal(startTooEarly.ok, false)
    if (!startTooEarly.ok) {
      assert.match(startTooEarly.error, /не назначен тимлид/)
    }

    const ivan = await connect()
    const petya = await connect()
    assert.equal(
      (
        await emitAck(ivan.client, CLIENT_EVENTS.playerJoin, {
          name: 'Иван',
          departmentId: 'marketing',
        })
      ).ok,
      true,
    )
    assert.equal(
      (
        await emitAck(petya.client, CLIENT_EVENTS.playerJoin, {
          name: 'Петя',
          departmentId: 'qa',
        })
      ).ok,
      true,
    )

    const four = await admin.state.wait((s) => s.players.length === 4)
    const ivanId = four.players.find((p) => p.name === 'Иван')!.id
    const petyaId = four.players.find((p) => p.name === 'Петя')!.id
    assert.equal(
      (await emitAck(admin.client, CLIENT_EVENTS.adminSetTeamLead, { playerId: ivanId })).ok,
      true,
    )
    assert.equal(
      (await emitAck(admin.client, CLIENT_EVENTS.adminSetTeamLead, { playerId: petyaId })).ok,
      true,
    )

    const kira = await connect()
    assert.equal(
      (
        await emitAck(kira.client, CLIENT_EVENTS.playerJoin, {
          name: 'Кира',
          departmentId: 'development',
        })
      ).ok,
      true,
    )
    const withKira = await admin.state.wait((s) => s.players.length === 5)
    const kiraId = withKira.players.find((p) => p.name === 'Кира')!.id
    assert.equal(
      (await emitAck(admin.client, CLIENT_EVENTS.adminSetTeamLead, { playerId: kiraId })).ok,
      true,
    )
    await alex.state.wait(
      (s) =>
        s.players.find((p) => p.id === kiraId)?.isTeamLead === true &&
        s.players.find((p) => p.id === alexId)?.isTeamLead === false,
    )
    assert.equal(
      (await emitAck(admin.client, CLIENT_EVENTS.adminSetTeamLead, { playerId: alexId })).ok,
      true,
    )

    assert.equal((await emitAck(admin.client, CLIENT_EVENTS.adminStartGame)).ok, true)
    const running = await alex.state.wait((s) => s.phase === 'PLANNING')
    assert.equal(running.phase, 'PLANNING')
    assert.equal(running.currentSprint, 1)
    assert.equal(running.tasks.length, 5)
    assert.equal(
      (
        await emitAck(alex.client, CLIENT_EVENTS.playerChangeDepartment, {
          departmentId: 'qa',
        })
      ).ok,
      false,
    )

    const oldSession = running.sessionId
    assert.equal((await emitAck(admin.client, CLIENT_EVENTS.adminNewGame)).ok, true)
    const fresh = await admin.state.wait((s) => s.sessionId !== oldSession)
    assert.equal(fresh.players.length, 0)
    assert.equal(fresh.phase, 'LOBBY')
  })
})

describe('socket spawn in dev', () => {
  let dataDir = ''
  let url = ''
  let io: Server
  let httpServer: ReturnType<typeof createServer>
  let runtime: GameRuntime
  const clients: ClientSocket[] = []

  before(async () => {
    dataDir = await mkdtemp(path.join(os.tmpdir(), 'brainrot-spawn-'))
    runtime = await GameRuntime.create(dataDir, { devTools: true })
    httpServer = createServer()
    io = new Server(httpServer, { cors: { origin: true } })
    registerSocketHandlers(io, runtime, ADMIN_CODE)
    await new Promise<void>((resolve) => httpServer.listen(0, '127.0.0.1', resolve))
    const address = httpServer.address()
    if (!address || typeof address === 'string') {
      throw new Error('No listen address')
    }
    url = `http://127.0.0.1:${address.port}`
  })

  after(async () => {
    for (const client of clients) {
      client.close()
    }
    io.close()
    runtime.stop()
    await new Promise<void>((resolve) => httpServer.close(() => resolve()))
    await runtime.flush()
    await rm(dataDir, { recursive: true, force: true })
  })

  it('lets admin fill the lobby and spawn extra players', async () => {
    const client = ioc(url, { transports: ['websocket'] })
    const state = trackState(client)
    clients.push(client)
    await new Promise<void>((resolve) => client.on('connect', () => resolve()))

    assert.equal((await emitAck(client, CLIENT_EVENTS.adminAuth, { code: ADMIN_CODE })).ok, true)
    assert.equal((await emitAck(client, CLIENT_EVENTS.adminFillLobby)).ok, true)
    const filled = await state.wait((s) => s.players.length === 4)
    assert.equal(filled.devTools, true)
    assert.equal(
      filled.players.filter((p) => p.isTeamLead).length,
      4,
    )

    assert.equal(
      (await emitAck(client, CLIENT_EVENTS.adminSpawnPlayer, { departmentId: 'qa' })).ok,
      true,
    )
    const extra = await state.wait((s) => s.players.length === 5)
    assert.equal(extra.players.filter((p) => p.departmentId === 'qa').length, 2)
  })

  it('lets admin end the current phase', async () => {
    const client = ioc(url, { transports: ['websocket'] })
    const state = trackState(client)
    clients.push(client)
    await new Promise<void>((resolve) => client.on('connect', () => resolve()))

    assert.equal((await emitAck(client, CLIENT_EVENTS.adminAuth, { code: ADMIN_CODE })).ok, true)
    assert.equal((await emitAck(client, CLIENT_EVENTS.adminStartGame)).ok, true)
    await state.wait((s) => s.phase === 'PLANNING')
    assert.equal((await emitAck(client, CLIENT_EVENTS.adminEndPhase)).ok, true)
    const work = await state.wait((s) => s.phase === 'WORK')
    assert.equal(work.currentSprint, 1)
    assert.equal((await emitAck(client, CLIENT_EVENTS.adminEndPhase)).ok, true)
    const next = await state.wait((s) => s.phase === 'PLANNING' && s.currentSprint === 2)
    assert.equal(next.currentSprint, 2)
  })
})

describe('socket sprint flow', () => {
  let dataDir = ''
  let url = ''
  let io: Server
  let httpServer: ReturnType<typeof createServer>
  let runtime: GameRuntime
  const clients: ClientSocket[] = []

  before(async () => {
    dataDir = await mkdtemp(path.join(os.tmpdir(), 'brainrot-sprint-'))
    runtime = await GameRuntime.create(dataDir, {
      devTools: true,
      planningMs: 150,
      workMs: 500,
    })
    httpServer = createServer()
    io = new Server(httpServer, { cors: { origin: true } })
    registerSocketHandlers(io, runtime, ADMIN_CODE)
    await new Promise<void>((resolve) => httpServer.listen(0, '127.0.0.1', resolve))
    const address = httpServer.address()
    if (!address || typeof address === 'string') {
      throw new Error('No listen address')
    }
    url = `http://127.0.0.1:${address.port}`
  })

  after(async () => {
    for (const client of clients) {
      client.close()
    }
    io.close()
    runtime.stop()
    await new Promise<void>((resolve) => httpServer.close(() => resolve()))
    await runtime.flush()
    await rm(dataDir, { recursive: true, force: true })
  })

  async function connect() {
    const client = ioc(url, { transports: ['websocket'] })
    const state = trackState(client)
    clients.push(client)
    await new Promise<void>((resolve) => client.on('connect', () => resolve()))
    return { client, state }
  }

  it('assigns tasks, auto-advances phases, completes work, and restores on reconnect', async () => {
    const admin = await connect()
    assert.equal((await emitAck(admin.client, CLIENT_EVENTS.adminAuth, { code: ADMIN_CODE })).ok, true)
    assert.equal((await emitAck(admin.client, CLIENT_EVENTS.adminFillLobby)).ok, true)
    assert.equal(
      (await emitAck(admin.client, CLIENT_EVENTS.adminSpawnPlayer, { departmentId: 'development' })).ok,
      true,
    )
    const roster = await admin.state.wait((s) => s.players.length === 5)
    const lead = roster.players.find((p) => p.departmentId === 'development' && p.isTeamLead)!
    const kira = roster.players.find((p) => p.departmentId === 'development' && !p.isTeamLead)!

    assert.equal((await emitAck(admin.client, CLIENT_EVENTS.adminStartGame)).ok, true)
    const planning = await admin.state.wait((s) => s.phase === 'PLANNING')
    assert.equal(planning.currentSprint, 1)
    assert.ok(planning.serverNow)

    const leadSock = await connect()
    assert.equal(
      (
        await emitAck(leadSock.client, CLIENT_EVENTS.playerReconnect, {
          playerId: lead.id,
          sessionId: planning.sessionId,
        })
      ).ok,
      true,
    )
    assert.equal(
      (
        await emitAck(leadSock.client, CLIENT_EVENTS.teamLeadAssignDifficulty, {
          playerId: kira.id,
          difficulty: 'HARD',
        })
      ).ok,
      true,
    )
    await admin.state.wait((s) =>
      s.tasks.some((task) => task.playerId === kira.id && task.difficulty === 'HARD'),
    )

    const work = await admin.state.wait((s) => s.phase === 'WORK')
    assert.equal(work.currentSprint, 1)
    assert.equal(work.autoAssignedCount, 4)
    const kiraTask = work.tasks.find((task) => task.playerId === kira.id && task.sprint === 1)!
    assert.equal(kiraTask.difficulty, 'HARD')
    assert.equal(kiraTask.status, 'ASSIGNED')

    const kiraSock = await connect()
    assert.equal(
      (
        await emitAck(kiraSock.client, CLIENT_EVENTS.playerReconnect, {
          playerId: kira.id,
          sessionId: work.sessionId,
        })
      ).ok,
      true,
    )
    assert.equal((await emitAck(kiraSock.client, CLIENT_EVENTS.playerStartTask)).ok, true)
    const inProgress = await admin.state.wait((s) =>
      s.tasks.some((task) => task.playerId === kira.id && task.status === 'IN_PROGRESS'),
    )
    const kiraLive = inProgress.tasks.find((task) => task.playerId === kira.id && task.sprint === 1)!
    const puzzle = getPuzzle(kiraLive.puzzleId ?? '')
    assert.ok(puzzle)
    assert.equal(kiraLive.gameType, puzzle.gameType)
    assert.ok(kiraLive.prompt)
    assert.equal(
      (
        await emitAck(kiraSock.client, CLIENT_EVENTS.playerCompleteTask)
      ).ok,
      false,
    )
    const wrong = await emitAck(kiraSock.client, CLIENT_EVENTS.playerSubmitAnswer, {
      taskId: kiraLive.id,
      answer: 'НЕТ',
    })
    assert.equal(wrong.ok, true)
    assert.equal(wrong.correct, false)
    const stolen = await emitAck(leadSock.client, CLIENT_EVENTS.playerSubmitAnswer, {
      taskId: kiraLive.id,
      answer: puzzle.answer,
    })
    assert.equal(stolen.ok, false)
    const stillOpen = runtime.store.getState().tasks.find((task) => task.id === kiraLive.id)!
    assert.equal(stillOpen.status, 'IN_PROGRESS')
    const submitted = await emitAck(kiraSock.client, CLIENT_EVENTS.playerSubmitAnswer, {
      taskId: kiraLive.id,
      answer: puzzle.answer,
    })
    assert.equal(submitted.ok, true)
    assert.equal(submitted.correct, true)
    const completed = await admin.state.wait((s) =>
      s.tasks.some((task) => task.playerId === kira.id && task.status === 'COMPLETED'),
    )
    assert.equal(
      completed.tasks.find((task) => task.playerId === kira.id && task.sprint === 1)?.score,
      300,
    )

    kiraSock.client.close()
    const again = await connect()
    assert.equal(
      (
        await emitAck(again.client, CLIENT_EVENTS.playerReconnect, {
          playerId: kira.id,
          sessionId: work.sessionId,
        })
      ).ok,
      true,
    )
    const restored = await again.state.wait((s) => s.phase === 'WORK' || s.phase === 'PLANNING')
    const restoredTask = restored.tasks.find((task) => task.playerId === kira.id && task.sprint === 1)!
    assert.equal(restoredTask.status, 'COMPLETED')
    assert.equal(restoredTask.score, 300)
    assert.ok(restored.currentSprint >= 1)

    const sprint2 = await admin.state.wait((s) => s.phase === 'PLANNING' && s.currentSprint === 2)
    assert.equal(sprint2.tasks.filter((task) => task.sprint === 2).length, 5)
    assert.equal(
      sprint2.tasks.find((task) => task.playerId === kira.id && task.sprint === 1)?.status,
      'COMPLETED',
    )
  })
})

describe('socket minigame sandbox', () => {
  let dataDir = ''
  let url = ''
  let io: Server
  let httpServer: ReturnType<typeof createServer>
  let runtime: GameRuntime
  const clients: ClientSocket[] = []

  after(async () => {
    for (const client of clients) {
      client.close()
    }
    if (io) {
      io.close()
    }
    runtime?.stop()
    if (httpServer) {
      await new Promise<void>((resolve) => httpServer.close(() => resolve()))
    }
    if (runtime) {
      await runtime.flush()
    }
    if (dataDir) {
      await rm(dataDir, { recursive: true, force: true })
    }
  })

  async function boot(devTools: boolean) {
    dataDir = await mkdtemp(path.join(os.tmpdir(), 'brainrot-sandbox-'))
    runtime = await GameRuntime.create(dataDir, { devTools })
    httpServer = createServer()
    io = new Server(httpServer, { cors: { origin: true } })
    registerSocketHandlers(io, runtime, ADMIN_CODE)
    await new Promise<void>((resolve) => httpServer.listen(0, '127.0.0.1', resolve))
    const address = httpServer.address()
    if (!address || typeof address === 'string') {
      throw new Error('No listen address')
    }
    url = `http://127.0.0.1:${address.port}`
  }

  it('lets a client play a sandbox game without changing live tasks', async () => {
    await boot(true)
    const client = ioc(url, { transports: ['websocket'] })
    clients.push(client)
    await new Promise<void>((resolve) => client.on('connect', () => resolve()))

    const started = await emitAck(client, CLIENT_EVENTS.devStartMinigame, {
      gameType: 'SEQUENCE',
      difficulty: 'EASY',
    })
    assert.equal(started.ok, true)
    assert.ok(started.sandboxId)
    assert.ok(started.prompt)
    assert.equal(runtime.store.getState().tasks.length, 0)

    const wrong = await emitAck(client, CLIENT_EVENTS.devSubmitAnswer, {
      sandboxId: started.sandboxId,
      answer: '0',
    })
    assert.equal(wrong.ok, true)
    assert.equal(wrong.correct, false)

    const prompt = started.prompt
    assert.ok(prompt && prompt.kind === 'SEQUENCE')
    const fromCatalog = getPuzzle(
      runtime.store.getState().tasks[0]?.puzzleId ?? '',
    )
    assert.equal(fromCatalog, undefined)

    const second = await emitAck(client, CLIENT_EVENTS.devStartMinigame, {
      gameType: 'SPEED_TYPING',
      difficulty: 'EASY',
    })
    assert.equal(second.ok, true)
    assert.equal(runtime.store.getState().tasks.length, 0)
  })
})

describe('socket sandbox requires dev tools', () => {
  let dataDir = ''
  let url = ''
  let io: Server
  let httpServer: ReturnType<typeof createServer>
  let runtime: GameRuntime
  const clients: ClientSocket[] = []

  before(async () => {
    dataDir = await mkdtemp(path.join(os.tmpdir(), 'brainrot-nodev-'))
    runtime = await GameRuntime.create(dataDir)
    httpServer = createServer()
    io = new Server(httpServer, { cors: { origin: true } })
    registerSocketHandlers(io, runtime, ADMIN_CODE)
    await new Promise<void>((resolve) => httpServer.listen(0, '127.0.0.1', resolve))
    const address = httpServer.address()
    if (!address || typeof address === 'string') {
      throw new Error('No listen address')
    }
    url = `http://127.0.0.1:${address.port}`
  })

  after(async () => {
    for (const client of clients) {
      client.close()
    }
    io.close()
    runtime.stop()
    await new Promise<void>((resolve) => httpServer.close(() => resolve()))
    await runtime.flush()
    await rm(dataDir, { recursive: true, force: true })
  })

  it('rejects sandbox events when DEV_TOOLS is off', async () => {
    const client = ioc(url, { transports: ['websocket'] })
    clients.push(client)
    await new Promise<void>((resolve) => client.on('connect', () => resolve()))
    const ack = await emitAck(client, CLIENT_EVENTS.devStartMinigame, {
      gameType: 'SEQUENCE',
      difficulty: 'EASY',
    })
    assert.equal(ack.ok, false)
  })
})
