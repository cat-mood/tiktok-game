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
    socket.emit(event, payload, (ack: Ack) => {
      resolve(ack ?? { ok: false, error: 'Нет ответа от сервера' })
    })
  })
}
