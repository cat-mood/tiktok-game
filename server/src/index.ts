import path from 'node:path'
import { fileURLToPath } from 'node:url'
import express from 'express'
import { createServer } from 'node:http'
import { Server } from 'socket.io'
import dotenv from 'dotenv'
import { mkdir, writeFile } from 'node:fs/promises'
import { randomUUID } from 'node:crypto'
import { DEFAULT_WORK_MS, PRODUCT_NAME } from '@brainrot/shared'
import { GameRuntime } from './game/runtime.js'
import { lanAddresses } from './lan.js'
import { registerSocketHandlers } from './socket/handlers.js'

const here = path.dirname(fileURLToPath(import.meta.url))
const repoRoot = path.resolve(here, '../..')

dotenv.config({ path: path.join(repoRoot, '.env') })

const PORT = Number(process.env.PORT) || 3000
const ADMIN_CODE = process.env.ADMIN_CODE || 'changeme'
const DATA_DIR = path.join(repoRoot, 'data')
const CLIENT_DIST = path.join(repoRoot, 'client/dist')

async function main() {
  const runtime = await GameRuntime.create(DATA_DIR, {
    devTools: process.env.DEV_TOOLS === 'true',
    workMs: envMs('WORK_MS', DEFAULT_WORK_MS),
  })
  const app = express()
  const httpServer = createServer(app)
  const io = new Server(httpServer, {
    cors: { origin: true },
    pingInterval: 10_000,
    pingTimeout: 20_000,
    maxHttpBufferSize: 5e6,
  })

  registerSocketHandlers(io, runtime, ADMIN_CODE)

  const uploadsDir = path.join(DATA_DIR, 'uploads')
  app.get('/api/lan', (_req, res) => {
    res.json({ addresses: lanAddresses() })
  })
  app.post('/uploads', express.raw({ type: '*/*', limit: '80mb' }), async (req, res) => {
    try {
      const ext = safeUploadExt(String(req.header('x-filename') ?? 'bin'))
      const filename = `${randomUUID()}${ext}`
      await mkdir(uploadsDir, { recursive: true })
      await writeFile(path.join(uploadsDir, filename), req.body)
      res.json({ url: `/uploads/${filename}` })
    } catch (error) {
      console.error('Upload failed', error)
      res.status(400).json({ error: 'Не удалось загрузить файл' })
    }
  })
  app.use('/uploads', express.static(uploadsDir))
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
    console.log(PRODUCT_NAME)
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
      console.log(`QR:     ${url}/qr`)
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

function safeUploadExt(filename: string): string {
  const match = filename.toLowerCase().match(/\.(mp4|webm|mov|png|jpe?g|gif|webp)$/)
  return match ? match[0].replace('jpeg', 'jpg') : '.bin'
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
