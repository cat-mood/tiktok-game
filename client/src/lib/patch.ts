import { CLIENT_EVENTS, type Ack } from '@brainrot/shared'
import { emitAck } from '../socket'

export async function patch(
  event: (typeof CLIENT_EVENTS)[keyof typeof CLIENT_EVENTS],
  payload: unknown,
  onError: (message: string) => void,
): Promise<Ack> {
  const ack = await emitAck(event, payload)
  if (!ack.ok) {
    onError(ack.error)
  }
  return ack
}

export function newId(): string {
  return crypto.randomUUID()
}
