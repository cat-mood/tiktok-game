import {
  DEFAULT_PLANNING_MS,
  DEFAULT_WORK_MS,
  type ClientGameState,
  type GameState,
} from '@brainrot/shared'
import { Persist } from './persist.js'
import { GameStore, type GameStoreOptions } from './store.js'

export type GameRuntimeOptions = {
  devTools?: boolean
  planningMs?: number
  workMs?: number
}

export class GameRuntime {
  restoredFromDisk: boolean
  readonly devTools: boolean
  private writeChain: Promise<void> = Promise.resolve()
  private phaseTimer: NodeJS.Timeout | undefined
  private onBroadcast: (() => void) | undefined

  private constructor(
    readonly store: GameStore,
    private readonly persist: Persist,
    restoredFromDisk: boolean,
    devTools: boolean,
  ) {
    this.restoredFromDisk = restoredFromDisk
    this.devTools = devTools
  }

  static async create(dataDir: string, options: GameRuntimeOptions = {}): Promise<GameRuntime> {
    const persist = new Persist(dataDir)
    const snapshot = await persist.load()
    const devTools = Boolean(options.devTools)
    const storeOptions: GameStoreOptions = {
      planningMs: options.planningMs ?? DEFAULT_PLANNING_MS,
      workMs: options.workMs ?? DEFAULT_WORK_MS,
    }
    if (snapshot) {
      const meaningful = snapshot.players.length > 0 || snapshot.phase !== 'LOBBY'
      const store = GameStore.fromSnapshot(snapshot, storeOptions)
      const runtime = new GameRuntime(store, persist, meaningful, devTools)
      runtime.catchUp()
      await runtime.persist.save(store.getState())
      return runtime
    }
    const runtime = new GameRuntime(new GameStore(undefined, storeOptions), persist, false, devTools)
    await runtime.persist.save(runtime.store.getState())
    return runtime
  }

  getClientState(): ClientGameState {
    return {
      ...this.store.getState(),
      restoredFromDisk: this.restoredFromDisk,
      devTools: this.devTools,
      serverNow: new Date().toISOString(),
    }
  }

  setBroadcaster(fn: () => void): void {
    this.onBroadcast = fn
    this.armPhaseTimer()
  }

  stop(): void {
    this.clearPhaseTimer()
    this.onBroadcast = undefined
  }

  private enqueueWrite(): Promise<void> {
    const state = this.store.getState()
    const next = this.writeChain.then(() => this.persist.save(state))
    this.writeChain = next.catch((error) => {
      console.error('Failed to persist game state', error)
    })
    return next
  }

  async mutate<T>(fn: (store: GameStore) => T): Promise<T> {
    const result = fn(this.store)
    await this.enqueueWrite()
    this.armPhaseTimer()
    return result
  }

  async newGame(): Promise<GameState> {
    this.clearPhaseTimer()
    const current = this.store.getState()
    await this.writeChain.catch(() => undefined)
    await this.persist.archive(current)
    this.store.reset()
    this.restoredFromDisk = false
    await this.enqueueWrite()
    this.armPhaseTimer()
    return this.store.getState()
  }

  dismissRestore(): void {
    this.restoredFromDisk = false
  }

  async flush(): Promise<void> {
    await this.writeChain.catch(() => undefined)
  }

  private catchUp(now: number = Date.now()): void {
    while (this.store.isPhaseDue(now)) {
      const endsAt = this.store.getState().phaseEndsAt
      const endedAt = endsAt ? Date.parse(endsAt) : now
      this.store.advancePhase(endedAt)
    }
  }

  private armPhaseTimer(): void {
    this.clearPhaseTimer()
    const state = this.store.getState()
    if (state.phase !== 'PLANNING' && state.phase !== 'WORK') {
      return
    }
    if (!state.phaseEndsAt) {
      return
    }
    const delay = Math.max(0, Date.parse(state.phaseEndsAt) - Date.now())
    this.phaseTimer = setTimeout(() => {
      void this.tickPhase()
    }, delay)
  }

  private async tickPhase(): Promise<void> {
    try {
      await this.mutate((store) => {
        const now = Date.now()
        while (store.isPhaseDue(now)) {
          const endsAt = store.getState().phaseEndsAt
          const endedAt = endsAt ? Date.parse(endsAt) : now
          store.advancePhase(endedAt)
        }
      })
      this.onBroadcast?.()
    } catch (error) {
      console.error('Failed to advance phase', error)
    }
  }

  private clearPhaseTimer(): void {
    if (this.phaseTimer) {
      clearTimeout(this.phaseTimer)
      this.phaseTimer = undefined
    }
  }
}
