import path from 'node:path'
import { fileURLToPath } from 'node:url'
import os from 'node:os'
import express from 'express'
import { createServer } from 'node:http'
import { Server } from 'socket.io'
import dotenv from 'dotenv'
import { GameRuntime } from './game/runtime.js'
import { registerSocketHandlers } from './socket/handlers.js'

const here = path.dirname(fileURLToPath(import.meta.url))
const repoRoot = path.resolve(here, '../..')

dotenv.config({ path: path.join(repoRoot, '.env') })

const PORT = Number(process.env.PORT) || 3000
const ADMIN_CODE = process.env.ADMIN_CODE || 'changeme'
const DATA_DIR = path.join(repoRoot, 'data')
const CLIENT_DIST = path.join(repoRoot, 'client/dist')

function lanAddresses(): string[] {
  const addresses: string[] = []
  for (const adapters of Object.values(os.networkInterfaces())) {
    for (const adapter of adapters ?? []) {
      if (adapter.family === 'IPv4' && !adapter.internal) {
        addresses.push(adapter.address)
      }
    }
  }
  return addresses
}

async function main() {
  const runtime = await GameRuntime.create(DATA_DIR)
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
    for (const url of urls) {
      console.log(`Игроки: ${url}`)
      console.log(`Админ:  ${url}/admin`)
    }
  })

  const shutdown = async () => {
    await runtime.flush()
    io.close()
    httpServer.close(() => process.exit(0))
  }
  process.on('SIGINT', () => {
    void shutdown()
  })
  process.on('SIGTERM', () => {
    void shutdown()
  })
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
