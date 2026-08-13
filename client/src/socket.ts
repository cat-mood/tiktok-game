import { io, type Socket } from 'socket.io-client'
import type { Ack } from '@brainrot/shared'

export const socket: Socket = io({
  autoConnect: true,
  reconnection: true,
  reconnectionDelay: 500,
  reconnectionAttempts: Infinity,
})

export function emitAck<T>(event: string, payload?: T): Promise<Ack> {
  return new Promise((resolve) => {
    let settled = false
    const done = (ack: Ack) => {
      if (settled) {
        return
      }
      settled = true
      resolve(ack)
    }
    if (!socket.connected) {
      done({ ok: false, error: 'Нет связи с сервером' })
      return
    }
    const timer = setTimeout(() => {
      done({ ok: false, error: 'Сервер не отвечает' })
    }, 4000)
    socket.emit(event, payload, (ack: Ack) => {
      clearTimeout(timer)
      done(ack ?? { ok: false, error: 'Нет ответа от сервера' })
    })
  })
}
