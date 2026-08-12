import type { Server, Socket } from 'socket.io'
import {
  CLIENT_EVENTS,
  SERVER_EVENTS,
  isDepartmentId,
  isTaskDifficulty,
  type Ack,
  type AdminAuthPayload,
  type AdminMovePlayerPayload,
  type AdminPlayerPayload,
  type AdminSpawnPlayerPayload,
  type PlayerChangeDepartmentPayload,
  type PlayerJoinPayload,
  type PlayerReconnectPayload,
  type TeamLeadAssignDifficultyPayload,
} from '@brainrot/shared'
import type { GameRuntime } from '../game/runtime.js'
import { GameError } from '../game/store.js'

const LOBBY_GRACE_MS = 20_000

type SocketData = {
  playerId?: string
  isAdmin?: boolean
}

export function registerSocketHandlers(
  io: Server,
  runtime: GameRuntime,
  adminCode: string,
): void {
  const playerSockets = new Map<string, Set<string>>()
  const graceTimers = new Map<string, NodeJS.Timeout>()

  const broadcast = () => {
    io.emit(SERVER_EVENTS.gameState, runtime.getClientState())
  }

  runtime.setBroadcaster(broadcast)

  const requirePlayerId = (socket: Socket): string => {
    const playerId = (socket.data as SocketData).playerId
    if (!playerId) {
      throw new GameError('Сначала присоединись к игре')
    }
    return playerId
  }

  const ok = (playerId?: string): Ack =>
    playerId ? { ok: true, playerId } : { ok: true }

  const fail = (error: unknown): Ack => ({
    ok: false,
    error: error instanceof GameError ? error.message : 'Что-то пошло не так',
  })

  const requireAdmin = (socket: Socket) => {
    if (!(socket.data as SocketData).isAdmin) {
      throw new GameError('Нет доступа')
    }
  }

  const requireDevTools = () => {
    if (!runtime.devTools) {
      throw new GameError('Спавн игроков доступен только в dev')
    }
  }

  const bindPlayer = (socket: Socket, playerId: string) => {
    const data = socket.data as SocketData
    if (data.playerId && data.playerId !== playerId) {
      unbindSocketFromPlayer(socket, data.playerId)
    }
    data.playerId = playerId
    let sockets = playerSockets.get(playerId)
    if (!sockets) {
      sockets = new Set()
      playerSockets.set(playerId, sockets)
    }
    sockets.add(socket.id)
    const timer = graceTimers.get(playerId)
    if (timer) {
      clearTimeout(timer)
      graceTimers.delete(playerId)
    }
  }

  const unbindSocketFromPlayer = (socket: Socket, playerId: string) => {
    const sockets = playerSockets.get(playerId)
    sockets?.delete(socket.id)
    if (sockets && sockets.size === 0) {
      playerSockets.delete(playerId)
    }
  }

  const scheduleLobbyRemoval = (playerId: string) => {
    const existing = graceTimers.get(playerId)
    if (existing) {
      clearTimeout(existing)
    }
    const timer = setTimeout(() => {
      graceTimers.delete(playerId)
      void runtime
        .mutate((store) => store.removeIfDisconnected(playerId))
        .then((removed) => {
          if (removed) {
            broadcast()
          }
        })
        .catch((error) => {
          console.error('Failed to remove disconnected player', error)
        })
    }, LOBBY_GRACE_MS)
    timer.unref()
    graceTimers.set(playerId, timer)
  }

  io.on('connection', (socket) => {
    socket.emit(SERVER_EVENTS.gameState, runtime.getClientState())

    socket.on(
      CLIENT_EVENTS.playerJoin,
      async (payload: PlayerJoinPayload, ack?: (res: Ack) => void) => {
        try {
          if (!payload || !isDepartmentId(payload.departmentId)) {
            throw new GameError('Выбери отдел')
          }
          const player = await runtime.mutate((store) =>
            store.join(payload.name, payload.departmentId),
          )
          bindPlayer(socket, player.id)
          broadcast()
          ack?.(ok(player.id))
        } catch (error) {
          ack?.(fail(error))
        }
      },
    )

    socket.on(
      CLIENT_EVENTS.playerChangeDepartment,
      async (payload: PlayerChangeDepartmentPayload, ack?: (res: Ack) => void) => {
        try {
          const playerId = (socket.data as SocketData).playerId
          if (!playerId) {
            throw new GameError('Сначала присоединись к игре')
          }
          if (!payload || !isDepartmentId(payload.departmentId)) {
            throw new GameError('Выбери отдел')
          }
          await runtime.mutate((store) =>
            store.changeDepartment(playerId, payload.departmentId),
          )
          broadcast()
          ack?.(ok())
        } catch (error) {
          ack?.(fail(error))
        }
      },
    )

    socket.on(
      CLIENT_EVENTS.playerReconnect,
      async (payload: PlayerReconnectPayload, ack?: (res: Ack) => void) => {
        try {
          if (!payload?.playerId || !payload.sessionId) {
            throw new GameError('Нет сохранённого игрока')
          }
          const player = await runtime.mutate((store) =>
            store.reconnect(payload.playerId, payload.sessionId),
          )
          bindPlayer(socket, player.id)
          broadcast()
          ack?.(ok(player.id))
        } catch (error) {
          ack?.(fail(error))
        }
      },
    )

    socket.on(
      CLIENT_EVENTS.teamLeadAssignDifficulty,
      async (payload: TeamLeadAssignDifficultyPayload, ack?: (res: Ack) => void) => {
        try {
          const leadId = requirePlayerId(socket)
          if (!payload?.playerId || !isTaskDifficulty(payload.difficulty)) {
            throw new GameError('Выбери сложность')
          }
          await runtime.mutate((store) =>
            store.assignDifficulty(leadId, payload.playerId, payload.difficulty),
          )
          broadcast()
          ack?.(ok())
        } catch (error) {
          ack?.(fail(error))
        }
      },
    )

    socket.on(CLIENT_EVENTS.playerStartTask, async (_payload, ack?: (res: Ack) => void) => {
      try {
        const playerId = requirePlayerId(socket)
        await runtime.mutate((store) => store.startTask(playerId))
        broadcast()
        ack?.(ok())
      } catch (error) {
        ack?.(fail(error))
      }
    })

    socket.on(CLIENT_EVENTS.playerCompleteTask, async (_payload, ack?: (res: Ack) => void) => {
      try {
        const playerId = requirePlayerId(socket)
        await runtime.mutate((store) => store.completeTask(playerId))
        broadcast()
        ack?.(ok())
      } catch (error) {
        ack?.(fail(error))
      }
    })

    socket.on(
      CLIENT_EVENTS.adminAuth,
      (payload: AdminAuthPayload, ack?: (res: Ack) => void) => {
        if (!payload?.code || payload.code !== adminCode) {
          ack?.(fail(new GameError('Неверный код')))
          return
        }
        ;(socket.data as SocketData).isAdmin = true
        ack?.(ok())
      },
    )

    socket.on(
      CLIENT_EVENTS.adminSetTeamLead,
      async (payload: AdminPlayerPayload, ack?: (res: Ack) => void) => {
        try {
          requireAdmin(socket)
          if (!payload?.playerId) {
            throw new GameError('Игрок не выбран')
          }
          await runtime.mutate((store) => store.setTeamLead(payload.playerId))
          broadcast()
          ack?.(ok())
        } catch (error) {
          ack?.(fail(error))
        }
      },
    )

    socket.on(
      CLIENT_EVENTS.adminMovePlayer,
      async (payload: AdminMovePlayerPayload, ack?: (res: Ack) => void) => {
        try {
          requireAdmin(socket)
          if (!payload?.playerId || !isDepartmentId(payload.departmentId)) {
            throw new GameError('Некорректное перемещение')
          }
          await runtime.mutate((store) =>
            store.movePlayer(payload.playerId, payload.departmentId),
          )
          broadcast()
          ack?.(ok())
        } catch (error) {
          ack?.(fail(error))
        }
      },
    )

    socket.on(
      CLIENT_EVENTS.adminRemovePlayer,
      async (payload: AdminPlayerPayload, ack?: (res: Ack) => void) => {
        try {
          requireAdmin(socket)
          if (!payload?.playerId) {
            throw new GameError('Игрок не выбран')
          }
          const timer = graceTimers.get(payload.playerId)
          if (timer) {
            clearTimeout(timer)
            graceTimers.delete(payload.playerId)
          }
          playerSockets.delete(payload.playerId)
          await runtime.mutate((store) => store.removePlayer(payload.playerId))
          broadcast()
          ack?.(ok())
        } catch (error) {
          ack?.(fail(error))
        }
      },
    )

    socket.on(CLIENT_EVENTS.adminStartGame, async (_payload, ack?: (res: Ack) => void) => {
      try {
        requireAdmin(socket)
        await runtime.mutate((store) => store.startGame())
        broadcast()
        ack?.(ok())
      } catch (error) {
        ack?.(fail(error))
      }
    })

    socket.on(CLIENT_EVENTS.adminEndPhase, async (_payload, ack?: (res: Ack) => void) => {
      try {
        requireAdmin(socket)
        await runtime.mutate((store) => store.endPhase())
        broadcast()
        ack?.(ok())
      } catch (error) {
        ack?.(fail(error))
      }
    })

    socket.on(CLIENT_EVENTS.adminNewGame, async (_payload, ack?: (res: Ack) => void) => {
      try {
        requireAdmin(socket)
        for (const timer of graceTimers.values()) {
          clearTimeout(timer)
        }
        graceTimers.clear()
        playerSockets.clear()
        await runtime.newGame()
        broadcast()
        ack?.(ok())
      } catch (error) {
        ack?.(fail(error))
      }
    })

    socket.on(CLIENT_EVENTS.adminDismissRestore, (_payload, ack?: (res: Ack) => void) => {
      try {
        requireAdmin(socket)
        runtime.dismissRestore()
        broadcast()
        ack?.(ok())
      } catch (error) {
        ack?.(fail(error))
      }
    })

    socket.on(
      CLIENT_EVENTS.adminSpawnPlayer,
      async (payload: AdminSpawnPlayerPayload, ack?: (res: Ack) => void) => {
        try {
          requireAdmin(socket)
          requireDevTools()
          if (!payload || !isDepartmentId(payload.departmentId)) {
            throw new GameError('Выбери отдел')
          }
          await runtime.mutate((store) => store.spawnPlayer(payload.departmentId))
          broadcast()
          ack?.(ok())
        } catch (error) {
          ack?.(fail(error))
        }
      },
    )

    socket.on(CLIENT_EVENTS.adminFillLobby, async (_payload, ack?: (res: Ack) => void) => {
      try {
        requireAdmin(socket)
        requireDevTools()
        await runtime.mutate((store) => store.fillLobby())
        broadcast()
        ack?.(ok())
      } catch (error) {
        ack?.(fail(error))
      }
    })

    socket.on('disconnect', () => {
      const playerId = (socket.data as SocketData).playerId
      if (!playerId) {
        return
      }
      unbindSocketFromPlayer(socket, playerId)
      if (playerSockets.has(playerId)) {
        return
      }
      const phase = runtime.store.getState().phase
      void runtime
        .mutate((store) => store.setConnected(playerId, false))
        .then(() => {
          broadcast()
          if (phase === 'LOBBY') {
            scheduleLobbyRemoval(playerId)
          }
        })
        .catch((error) => {
          console.error('Failed to mark player disconnected', error)
        })
    })
  })
}
