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
    const running = await alex.state.wait((s) => s.phase === 'RUNNING')
    assert.equal(running.phase, 'RUNNING')
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
