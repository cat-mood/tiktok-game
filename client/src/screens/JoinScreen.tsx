import { useMemo, useState } from 'react'
import {
  CLIENT_EVENTS,
  DEPARTMENTS,
  type ClientGameState,
  type DepartmentId,
  type Player,
} from '@brainrot/shared'
import { DepartmentCard } from '../components/DepartmentCard'
import { departmentCount, playerCountLabel } from '../lib/departments'
import { emitAck } from '../socket'

type Props = {
  state: ClientGameState
  onJoined: (playerId: string) => void
  onError: (message: string) => void
}

export function JoinScreen({ state, onJoined, onError }: Props) {
  const [name, setName] = useState('')
  const [departmentId, setDepartmentId] = useState<DepartmentId | null>(null)
  const [busy, setBusy] = useState(false)

  const trimmed = name.trim()
  const showDepartments = trimmed.length > 0
  const gameLocked = state.phase !== 'LOBBY'

  const claimable = useMemo<Player | null>(() => {
    if (!trimmed) {
      return null
    }
    return (
      state.players.find(
        (player) => !player.connected && player.name.toLowerCase() === trimmed.toLowerCase(),
      ) ?? null
    )
  }, [state.players, trimmed])

  const join = async () => {
    if (!departmentId || !trimmed) {
      return
    }
    setBusy(true)
    const ack = await emitAck(CLIENT_EVENTS.playerJoin, { name: trimmed, departmentId })
    setBusy(false)
    if (!ack.ok || !ack.playerId) {
      onError(ack.ok ? 'Не удалось присоединиться' : ack.error)
      return
    }
    onJoined(ack.playerId)
  }

  const claim = async () => {
    if (!claimable) {
      return
    }
    setBusy(true)
    const ack = await emitAck(CLIENT_EVENTS.playerReconnect, {
      playerId: claimable.id,
      sessionId: state.sessionId,
    })
    setBusy(false)
    if (!ack.ok) {
      onError(ack.error)
      return
    }
    onJoined(claimable.id)
  }

  return (
    <div className="mx-auto flex min-h-dvh max-w-xl flex-col px-5 py-8">
      <p className="text-xs font-semibold uppercase tracking-[0.35em] text-cyan/70">IT Challenge</p>
      <h1 className="mt-3 font-display text-5xl leading-none tracking-tight sm:text-6xl">
        SHORTS
      </h1>
      <p className="mt-4 text-lg text-white/60">Четыре команды вместе собирают приложение коротких видео.</p>

      {gameLocked && (
        <div className="mt-6 rounded-2xl border border-mag/40 bg-mag/10 px-4 py-3 text-mag">
          Игра уже идёт. Подожди новую сессию.
        </div>
      )}

      <label className="mt-10 text-sm font-semibold uppercase tracking-[0.2em] text-white/50">
        Твоё имя
      </label>
      <input
        value={name}
        onChange={(event) => setName(event.target.value)}
        maxLength={20}
        placeholder="Как тебя зовут?"
        className="mt-3 w-full rounded-2xl border border-line bg-panel px-5 py-4 text-2xl outline-none ring-cyan/40 placeholder:text-white/25 focus:ring-2"
      />

      {claimable && (
        <button
          type="button"
          onClick={() => void claim()}
          disabled={busy}
          className="mt-4 rounded-2xl border border-gold/40 bg-gold/10 px-4 py-3 text-left text-gold"
        >
          Продолжить как {claimable.name}?
        </button>
      )}

      {showDepartments && (
        <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-2">
          {DEPARTMENTS.map((dept, index) => (
            <div key={dept.id} className="rise" style={{ animationDelay: `${index * 60}ms` }}>
              <DepartmentCard
                departmentId={dept.id}
                countLabel={playerCountLabel(departmentCount(state, dept.id))}
                selected={departmentId === dept.id}
                disabled={gameLocked}
                onSelect={setDepartmentId}
              />
            </div>
          ))}
        </div>
      )}

      {showDepartments && (
        <button
          type="button"
          disabled={!departmentId || busy || gameLocked}
          onClick={() => void join()}
          className="mt-8 w-full rounded-2xl bg-cyan py-4 text-xl font-bold text-ink disabled:cursor-not-allowed disabled:opacity-40"
        >
          Присоединиться
        </button>
      )}

      {state.devTools && (
        <a href="/dev" className="mt-8 self-center text-sm text-gold/70">
          Песочница workspace
        </a>
      )}
    </div>
  )
}
