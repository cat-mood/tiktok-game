import { mkdir, readFile, rename, writeFile } from 'node:fs/promises'
import { randomUUID } from 'node:crypto'
import path from 'node:path'
import type { GameState } from '@brainrot/shared'

export class Persist {
  constructor(private readonly dataDir: string) {}

  get currentPath(): string {
    return path.join(this.dataDir, 'current.json')
  }

  get archiveDir(): string {
    return path.join(this.dataDir, 'archive')
  }

  async load(): Promise<GameState | null> {
    try {
      const raw = await readFile(this.currentPath, 'utf8')
      const parsed = JSON.parse(raw) as GameState
      if (!parsed.sessionId || !Array.isArray(parsed.players)) {
        return null
      }
      return parsed
    } catch (error) {
      const code = (error as NodeJS.ErrnoException).code
      if (code === 'ENOENT') {
        return null
      }
      throw error
    }
  }

  async save(state: GameState): Promise<void> {
    await mkdir(this.dataDir, { recursive: true })
    const tmpPath = path.join(this.dataDir, `current.${randomUUID()}.tmp`)
    const payload = `${JSON.stringify(state, null, 2)}\n`
    await writeFile(tmpPath, payload, 'utf8')
    await rename(tmpPath, this.currentPath)
  }

  async archive(state: GameState): Promise<string> {
    await mkdir(this.archiveDir, { recursive: true })
    const filePath = path.join(this.archiveDir, `${state.sessionId}.json`)
    await writeFile(filePath, `${JSON.stringify(state, null, 2)}\n`, 'utf8')
    return filePath
  }
}
