import type { ClientGameState, GameState } from '@brainrot/shared'
import { Persist } from './persist.js'
import { GameStore } from './store.js'

export class GameRuntime {
  restoredFromDisk: boolean
  readonly devTools: boolean
  private writeChain: Promise<void> = Promise.resolve()

  private constructor(
    readonly store: GameStore,
    private readonly persist: Persist,
    restoredFromDisk: boolean,
    devTools: boolean,
  ) {
    this.restoredFromDisk = restoredFromDisk
    this.devTools = devTools
  }

  static async create(
    dataDir: string,
    options: { devTools?: boolean } = {},
  ): Promise<GameRuntime> {
    const persist = new Persist(dataDir)
    const snapshot = await persist.load()
    const devTools = Boolean(options.devTools)
    if (snapshot) {
      const meaningful = snapshot.players.length > 0 || snapshot.phase !== 'LOBBY'
      const store = GameStore.fromSnapshot(snapshot)
      const runtime = new GameRuntime(store, persist, meaningful, devTools)
      await runtime.persist.save(store.getState())
      return runtime
    }
    const runtime = new GameRuntime(new GameStore(), persist, false, devTools)
    await runtime.persist.save(runtime.store.getState())
    return runtime
  }

  getClientState(): ClientGameState {
    return {
      ...this.store.getState(),
      restoredFromDisk: this.restoredFromDisk,
      devTools: this.devTools,
    }
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
    return result
  }

  async newGame(): Promise<GameState> {
    const current = this.store.getState()
    await this.writeChain.catch(() => undefined)
    await this.persist.archive(current)
    this.store.reset()
    this.restoredFromDisk = false
    await this.enqueueWrite()
    return this.store.getState()
  }

  dismissRestore(): void {
    this.restoredFromDisk = false
  }

  async flush(): Promise<void> {
    await this.writeChain.catch(() => undefined)
  }
}
