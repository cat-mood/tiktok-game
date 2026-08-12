import { useEffect, useRef, useState } from 'react'
import {
  CLIENT_EVENTS,
  SERVER_EVENTS,
  type ClientGameState,
  type Identity,
} from '@brainrot/shared'
import { emitAck, socket } from '../socket'
import { clearIdentity, loadIdentity, saveIdentity } from '../storage'

const emptyState: ClientGameState = {
  sessionId: '',
  updatedAt: '',
  phase: 'LOBBY',
  players: [],
  restoredFromDisk: false,
  devTools: false,
}

export function useGame() {
  const [state, setState] = useState<ClientGameState>(emptyState)
  const [identity, setIdentity] = useState<Identity | null>(() => loadIdentity())
  const [error, setError] = useState<string | null>(null)
  const [connected, setConnected] = useState(socket.connected)
  const [reconnecting, setReconnecting] = useState(false)
  const reconnectingRef = useRef(false)

  const me = identity
    ? state.players.find((player) => player.id === identity.playerId) ?? null
    : null

  useEffect(() => {
    const onState = (next: ClientGameState) => setState(next)
    const onConnect = () => setConnected(true)
    const onDisconnect = () => setConnected(false)

    socket.on(SERVER_EVENTS.gameState, onState)
    socket.on('connect', onConnect)
    socket.on('disconnect', onDisconnect)

    return () => {
      socket.off(SERVER_EVENTS.gameState, onState)
      socket.off('connect', onConnect)
      socket.off('disconnect', onDisconnect)
    }
  }, [])

  useEffect(() => {
    if (!state.sessionId || !identity) {
      return
    }
    if (identity.sessionId !== state.sessionId) {
      clearIdentity()
      setIdentity(null)
      return
    }
    if (!me) {
      clearIdentity()
      setIdentity(null)
      return
    }
    if (me.connected || reconnectingRef.current) {
      return
    }

    reconnectingRef.current = true
    setReconnecting(true)
    void emitAck(CLIENT_EVENTS.playerReconnect, identity).then((ack) => {
      reconnectingRef.current = false
      setReconnecting(false)
      if (!ack.ok) {
        clearIdentity()
        setIdentity(null)
      }
    })
  }, [state.sessionId, identity, me])

  const remember = (playerId: string, sessionId: string) => {
    const next = { playerId, sessionId }
    saveIdentity(next)
    setIdentity(next)
  }

  return {
    state,
    identity,
    me,
    error,
    setError,
    connected,
    reconnecting,
    remember,
  }
}
