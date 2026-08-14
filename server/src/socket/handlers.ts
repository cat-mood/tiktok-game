import type { Server, Socket } from 'socket.io'
import {
  CLIENT_EVENTS,
  SERVER_EVENTS,
  isDepartmentId,
  type Ack,
  type AdminAddTimePayload,
  type AdminAuthPayload,
  type AdminMovePlayerPayload,
  type AdminPlayerPayload,
  type AdminResumeWorkPayload,
  type AdminSpawnPlayerPayload,
  type AdminStartGamePayload,
  type BugIdPayload,
  type DeleteComponentPayload,
  type DevOpenWorkspacePayload,
  type IdeaIdPayload,
  type MerchIdPayload,
  type PlayerChangeDepartmentPayload,
  type PlayerJoinPayload,
  type PlayerReconnectPayload,
  type PosterIdPayload,
  type RuntimeDispatchPayload,
  type SetSloganPayload,
  type StateIdPayload,
  type TestIdPayload,
  type TransitionIdPayload,
  type UpsertBugPayload,
  type UpsertComponentPayload,
  type UpsertIdeaPayload,
  type UpsertMerchPayload,
  type UpsertPosterPayload,
  type UpsertTestPayload,
  type UpsertTransitionPayload,
  type UpsertVideoPayload,
  type VideoIdPayload,
  type DepartmentId,
} from '@brainrot/shared'
import type { GameRuntime } from '../game/runtime.js'
import { GameError } from '../game/store.js'

const LOBBY_GRACE_MS = 20_000

type SocketData = {
  playerId?: string
  isAdmin?: boolean
  devDepartment?: DepartmentId
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

  const actorDepartment = (socket: Socket): DepartmentId => {
    const data = socket.data as SocketData
    if (runtime.devTools && data.devDepartment) {
      return data.devDepartment
    }
    const playerId = requirePlayerId(socket)
    const player = runtime.store.getState().players.find((item) => item.id === playerId)
    if (!player) {
      throw new GameError('Игрок не найден')
    }
    return player.departmentId
  }

  const ok = (playerId?: string): Ack => (playerId ? { ok: true, playerId } : { ok: true })

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
      CLIENT_EVENTS.devOpenWorkspace,
      (payload: DevOpenWorkspacePayload, ack?: (res: Ack) => void) => {
        try {
          requireDevTools()
          if (!payload || !isDepartmentId(payload.departmentId)) {
            throw new GameError('Выбери отдел')
          }
          ;(socket.data as SocketData).devDepartment = payload.departmentId
          ack?.(ok())
        } catch (error) {
          ack?.(fail(error))
        }
      },
    )

    socket.on(
      CLIENT_EVENTS.designUpsertComponent,
      async (payload: UpsertComponentPayload, ack?: (res: Ack) => void) => {
        try {
          const actor = actorDepartment(socket)
          if (!payload?.stateId || !payload.component) {
            throw new GameError('Нет компонента')
          }
          await runtime.mutate((store) =>
            store.upsertComponent(actor, payload.stateId, payload.component),
          )
          broadcast()
          ack?.(ok())
        } catch (error) {
          ack?.(fail(error))
        }
      },
    )

    socket.on(
      CLIENT_EVENTS.designDeleteComponent,
      async (payload: DeleteComponentPayload, ack?: (res: Ack) => void) => {
        try {
          const actor = actorDepartment(socket)
          if (!payload?.stateId || !payload.componentId) {
            throw new GameError('Компонент не выбран')
          }
          await runtime.mutate((store) =>
            store.deleteComponent(actor, payload.stateId, payload.componentId),
          )
          broadcast()
          ack?.(ok())
        } catch (error) {
          ack?.(fail(error))
        }
      },
    )

    socket.on(
      CLIENT_EVENTS.logicUpsertTransition,
      async (payload: UpsertTransitionPayload, ack?: (res: Ack) => void) => {
        try {
          const actor = actorDepartment(socket)
          if (!payload?.transition) {
            throw new GameError('Нет перехода')
          }
          await runtime.mutate((store) => store.upsertTransition(actor, payload.transition))
          broadcast()
          ack?.(ok())
        } catch (error) {
          ack?.(fail(error))
        }
      },
    )

    socket.on(
      CLIENT_EVENTS.logicDeleteTransition,
      async (payload: TransitionIdPayload, ack?: (res: Ack) => void) => {
        try {
          const actor = actorDepartment(socket)
          if (!payload?.transitionId) {
            throw new GameError('Переход не выбран')
          }
          await runtime.mutate((store) => store.deleteTransition(actor, payload.transitionId))
          broadcast()
          ack?.(ok())
        } catch (error) {
          ack?.(fail(error))
        }
      },
    )

    socket.on(
      CLIENT_EVENTS.logicSetInitialState,
      async (payload: StateIdPayload, ack?: (res: Ack) => void) => {
        try {
          const actor = actorDepartment(socket)
          if (!payload?.stateId) {
            throw new GameError('Состояние не выбрано')
          }
          await runtime.mutate((store) => store.setInitialState(actor, payload.stateId))
          broadcast()
          ack?.(ok())
        } catch (error) {
          ack?.(fail(error))
        }
      },
    )

    socket.on(
      CLIENT_EVENTS.qaUpsertTest,
      async (payload: UpsertTestPayload, ack?: (res: Ack) => void) => {
        try {
          const actor = actorDepartment(socket)
          if (!payload?.test) {
            throw new GameError('Нет теста')
          }
          await runtime.mutate((store) => store.upsertTest(actor, payload.test))
          broadcast()
          ack?.(ok())
        } catch (error) {
          ack?.(fail(error))
        }
      },
    )

    socket.on(
      CLIENT_EVENTS.qaDeleteTest,
      async (payload: TestIdPayload, ack?: (res: Ack) => void) => {
        try {
          const actor = actorDepartment(socket)
          if (!payload?.testId) {
            throw new GameError('Тест не выбран')
          }
          await runtime.mutate((store) => store.deleteTest(actor, payload.testId))
          broadcast()
          ack?.(ok())
        } catch (error) {
          ack?.(fail(error))
        }
      },
    )

    socket.on(
      CLIENT_EVENTS.qaRunTest,
      async (payload: TestIdPayload, ack?: (res: Ack) => void) => {
        try {
          const actor = actorDepartment(socket)
          if (!payload?.testId) {
            throw new GameError('Тест не выбран')
          }
          const testResult = await runtime.mutate((store) => store.runQaTest(actor, payload.testId))
          broadcast()
          ack?.({ ok: true, testResult })
        } catch (error) {
          ack?.(fail(error))
        }
      },
    )

    socket.on(
      CLIENT_EVENTS.qaUpsertBug,
      async (payload: UpsertBugPayload, ack?: (res: Ack) => void) => {
        try {
          const actor = actorDepartment(socket)
          if (!payload?.bug) {
            throw new GameError('Нет бага')
          }
          await runtime.mutate((store) => store.upsertBug(actor, payload.bug))
          broadcast()
          ack?.(ok())
        } catch (error) {
          ack?.(fail(error))
        }
      },
    )

    socket.on(
      CLIENT_EVENTS.qaDeleteBug,
      async (payload: BugIdPayload, ack?: (res: Ack) => void) => {
        try {
          const actor = actorDepartment(socket)
          if (!payload?.bugId) {
            throw new GameError('Баг не выбран')
          }
          await runtime.mutate((store) => store.deleteBug(actor, payload.bugId))
          broadcast()
          ack?.(ok())
        } catch (error) {
          ack?.(fail(error))
        }
      },
    )

    socket.on(
      CLIENT_EVENTS.marketingSetSlogan,
      async (payload: SetSloganPayload, ack?: (res: Ack) => void) => {
        try {
          const actor = actorDepartment(socket)
          await runtime.mutate((store) => store.setSlogan(actor, payload?.slogan ?? ''))
          broadcast()
          ack?.(ok())
        } catch (error) {
          ack?.(fail(error))
        }
      },
    )

    socket.on(
      CLIENT_EVENTS.marketingUpsertVideo,
      async (payload: UpsertVideoPayload, ack?: (res: Ack) => void) => {
        try {
          const actor = actorDepartment(socket)
          if (!payload?.video) {
            throw new GameError('Нет видео')
          }
          await runtime.mutate((store) => store.upsertVideo(actor, payload.video))
          broadcast()
          ack?.(ok())
        } catch (error) {
          ack?.(fail(error))
        }
      },
    )

    socket.on(
      CLIENT_EVENTS.marketingDeleteVideo,
      async (payload: VideoIdPayload, ack?: (res: Ack) => void) => {
        try {
          const actor = actorDepartment(socket)
          if (!payload?.videoId) {
            throw new GameError('Видео не выбрано')
          }
          await runtime.mutate((store) => store.deleteVideo(actor, payload.videoId))
          broadcast()
          ack?.(ok())
        } catch (error) {
          ack?.(fail(error))
        }
      },
    )

    socket.on(
      CLIENT_EVENTS.marketingUpsertPoster,
      async (payload: UpsertPosterPayload, ack?: (res: Ack) => void) => {
        try {
          const actor = actorDepartment(socket)
          if (!payload?.poster) {
            throw new GameError('Нет постера')
          }
          await runtime.mutate((store) => store.upsertPoster(actor, payload.poster))
          broadcast()
          ack?.(ok())
        } catch (error) {
          ack?.(fail(error))
        }
      },
    )

    socket.on(
      CLIENT_EVENTS.marketingDeletePoster,
      async (payload: PosterIdPayload, ack?: (res: Ack) => void) => {
        try {
          const actor = actorDepartment(socket)
          if (!payload?.posterId) {
            throw new GameError('Постер не выбран')
          }
          await runtime.mutate((store) => store.deletePoster(actor, payload.posterId))
          broadcast()
          ack?.(ok())
        } catch (error) {
          ack?.(fail(error))
        }
      },
    )

    socket.on(
      CLIENT_EVENTS.marketingUpsertIdea,
      async (payload: UpsertIdeaPayload, ack?: (res: Ack) => void) => {
        try {
          const actor = actorDepartment(socket)
          if (!payload?.idea) {
            throw new GameError('Нет идеи')
          }
          await runtime.mutate((store) => store.upsertIdea(actor, payload.idea))
          broadcast()
          ack?.(ok())
        } catch (error) {
          ack?.(fail(error))
        }
      },
    )

    socket.on(
      CLIENT_EVENTS.marketingDeleteIdea,
      async (payload: IdeaIdPayload, ack?: (res: Ack) => void) => {
        try {
          const actor = actorDepartment(socket)
          if (!payload?.ideaId) {
            throw new GameError('Идея не выбрана')
          }
          await runtime.mutate((store) => store.deleteIdea(actor, payload.ideaId))
          broadcast()
          ack?.(ok())
        } catch (error) {
          ack?.(fail(error))
        }
      },
    )

    socket.on(
      CLIENT_EVENTS.marketingUpsertMerch,
      async (payload: UpsertMerchPayload, ack?: (res: Ack) => void) => {
        try {
          const actor = actorDepartment(socket)
          if (!payload?.merch) {
            throw new GameError('Нет мерча')
          }
          await runtime.mutate((store) => store.upsertMerch(actor, payload.merch))
          broadcast()
          ack?.(ok())
        } catch (error) {
          ack?.(fail(error))
        }
      },
    )

    socket.on(
      CLIENT_EVENTS.marketingDeleteMerch,
      async (payload: MerchIdPayload, ack?: (res: Ack) => void) => {
        try {
          const actor = actorDepartment(socket)
          if (!payload?.merchId) {
            throw new GameError('Мерч не выбран')
          }
          await runtime.mutate((store) => store.deleteMerch(actor, payload.merchId))
          broadcast()
          ack?.(ok())
        } catch (error) {
          ack?.(fail(error))
        }
      },
    )

    socket.on(
      CLIENT_EVENTS.runtimeDispatch,
      async (payload: RuntimeDispatchPayload, ack?: (res: Ack) => void) => {
        try {
          requireAdmin(socket)
          if (!payload?.event) {
            throw new GameError('Нет действия')
          }
          await runtime.mutate((store) => store.dispatchRuntime(payload.event))
          broadcast()
          ack?.(ok())
        } catch (error) {
          ack?.(fail(error))
        }
      },
    )

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

    socket.on(
      CLIENT_EVENTS.adminStartGame,
      async (payload: AdminStartGamePayload, ack?: (res: Ack) => void) => {
        try {
          requireAdmin(socket)
          await runtime.mutate((store) => store.startGame(payload?.workDurationMs))
          broadcast()
          ack?.(ok())
        } catch (error) {
          ack?.(fail(error))
        }
      },
    )

    socket.on(
      CLIENT_EVENTS.adminAddTime,
      async (payload: AdminAddTimePayload, ack?: (res: Ack) => void) => {
        try {
          requireAdmin(socket)
          await runtime.mutate((store) => store.addWorkTime(payload?.extraMs))
          broadcast()
          ack?.(ok())
        } catch (error) {
          ack?.(fail(error))
        }
      },
    )

    socket.on(CLIENT_EVENTS.adminEndWork, async (_payload, ack?: (res: Ack) => void) => {
      try {
        requireAdmin(socket)
        await runtime.mutate((store) => store.endWork())
        broadcast()
        ack?.(ok())
      } catch (error) {
        ack?.(fail(error))
      }
    })

    socket.on(
      CLIENT_EVENTS.adminResumeWork,
      async (payload: AdminResumeWorkPayload, ack?: (res: Ack) => void) => {
        try {
          requireAdmin(socket)
          await runtime.mutate((store) => store.resumeWork(payload?.workDurationMs))
          broadcast()
          ack?.(ok())
        } catch (error) {
          ack?.(fail(error))
        }
      },
    )

    socket.on(CLIENT_EVENTS.adminRelease, async (_payload, ack?: (res: Ack) => void) => {
      try {
        requireAdmin(socket)
        await runtime.mutate((store) => store.launchRelease())
        broadcast()
        ack?.(ok())
      } catch (error) {
        ack?.(fail(error))
      }
    })

    socket.on(CLIENT_EVENTS.adminFinish, async (_payload, ack?: (res: Ack) => void) => {
      try {
        requireAdmin(socket)
        await runtime.mutate((store) => store.finish())
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
