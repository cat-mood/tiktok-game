import path from 'node:path'
import { fileURLToPath } from 'node:url'
import os from 'node:os'
import express from 'express'
import { createServer } from 'node:http'
import { Server } from 'socket.io'
import dotenv from 'dotenv'
import { DEFAULT_PLANNING_MS, DEFAULT_WORK_MS } from '@brainrot/shared'
import { GameRuntime } from './game/runtime.js'
import { registerSocketHandlers } from './socket/handlers.js'

const here = path.dirname(fileURLToPath(import.meta.url))
const repoRoot = path.resolve(here, '../..')

dotenv.config({ path: path.join(repoRoot, '.env') })

const PORT = Number(process.env.PORT) || 3000
const ADMIN_CODE = process.env.ADMIN_CODE || 'changeme'
const DATA_DIR = path.join(repoRoot, 'data')
const CLIENT_DIST = path.join(repoRoot, 'client/dist')

function isIPv4(adapter: os.NetworkInterfaceInfo): boolean {
  return adapter.family === 'IPv4' || (adapter.family as unknown as number) === 4
}

function isUsefulLan(address: string): boolean {
  if (address.startsWith('169.254.') || address.startsWith('198.18.')) {
    return false
  }
  return (
    address.startsWith('192.168.') ||
    address.startsWith('10.') ||
    /^172\.(1[6-9]|2\d|3[0-1])\./.test(address)
  )
}

function lanAddresses(): string[] {
  const all: string[] = []
  for (const adapters of Object.values(os.networkInterfaces())) {
    for (const adapter of adapters ?? []) {
      if (isIPv4(adapter) && !adapter.internal) {
        all.push(adapter.address)
      }
    }
  }
  const lan = all.filter(isUsefulLan)
  return lan.length > 0 ? lan : all
}

async function main() {
  const runtime = await GameRuntime.create(DATA_DIR, {
    devTools: process.env.DEV_TOOLS === 'true',
    planningMs: envMs('PLANNING_MS', DEFAULT_PLANNING_MS),
    workMs: envMs('WORK_MS', DEFAULT_WORK_MS),
  })
  const app = express()
  const httpServer = createServer(app)
  const io = new Server(httpServer, {
    cors: { origin: true },
    pingInterval: 10_000,
    pingTimeout: 20_000,
  })

  registerSocketHandlers(io, runtime, ADMIN_CODE)

  app.use(express.static(CLIENT_DIST))
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/socket.io')) {
      next()
      return
    }
    res.sendFile(path.join(CLIENT_DIST, 'index.html'), (error) => {
      if (error) {
        next()
      }
    })
  })

  httpServer.listen(PORT, '0.0.0.0', () => {
    const urls = ['http://localhost:' + PORT, ...lanAddresses().map((ip) => `http://${ip}:${PORT}`)]
    console.log('Брейнрот клипы')
    console.log(`Фаза: ${runtime.store.getState().phase}`)
    console.log(`Сессия: ${runtime.store.getState().sessionId}`)
    if (runtime.restoredFromDisk) {
      console.log('Состояние восстановлено с диска')
    }
    if (runtime.devTools) {
      console.log('Dev tools: спавн игроков в /admin')
    }
    for (const url of urls) {
      console.log(`Игроки: ${url}`)
      console.log(`Админ:  ${url}/admin`)
    }
  })

  const shutdown = async () => {
    runtime.stop()
    await runtime.flush()
    io.close()
    httpServer.close(() => process.exit(0))
  }
  for (const signal of ['SIGINT', 'SIGTERM', 'SIGBREAK'] as const) {
    process.on(signal, () => {
      void shutdown()
    })
  }
}

function envMs(name: string, fallback: number): number {
  const raw = process.env[name]
  if (!raw) {
    return fallback
  }
  const value = Number(raw)
  return Number.isFinite(value) && value > 0 ? value : fallback
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
