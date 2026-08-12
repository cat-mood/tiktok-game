import { useEffect, useState } from 'react'
import {
  CLIENT_EVENTS,
  DEPARTMENTS,
  type ClientGameState,
  type DepartmentId,
  type Player,
} from '@brainrot/shared'
import { PhaseBadge } from '../components/PhaseBadge'
import { emitAck, socket } from '../socket'

type Props = {
  state: ClientGameState
  onError: (message: string) => void
}

export function AdminScreen({ state, onError }: Props) {
  const [confirmNew, setConfirmNew] = useState(false)
  const [busy, setBusy] = useState(false)
  const locked = state.phase !== 'LOBBY'

  const run = async (event: string, payload?: unknown) => {
    setBusy(true)
    const ack = await emitAck(event, payload)
    setBusy(false)
    if (!ack.ok) {
      onError(ack.error)
    }
    return ack.ok
  }

  return (
    <div className="min-h-dvh px-6 py-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-cyan/70">Admin</p>
          <h1 className="mt-1 font-display text-4xl">Управление игрой</h1>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <PhaseBadge phase={state.phase} />
          <button
            type="button"
            disabled={busy || locked}
            onClick={() => void run(CLIENT_EVENTS.adminStartGame)}
            className="rounded-2xl bg-cyan px-5 py-3 text-lg font-bold text-ink disabled:opacity-40"
          >
            Начать игру
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => setConfirmNew(true)}
            className="rounded-2xl border border-mag/50 px-5 py-3 text-lg font-bold text-mag"
          >
            Новая игра
          </button>
        </div>
      </header>

      {state.restoredFromDisk && (
        <RestoreBanner
          state={state}
          busy={busy}
          onContinue={() => void run(CLIENT_EVENTS.adminDismissRestore)}
          onNewGame={() => setConfirmNew(true)}
        />
      )}

      <div className="mt-8 grid grid-cols-1 gap-4 xl:grid-cols-4">
        {DEPARTMENTS.map((dept) => {
          const members = state.players.filter((player) => player.departmentId === dept.id)
          const hasLead = members.some((player) => player.isTeamLead)
          return (
            <section key={dept.id} className="rounded-3xl border border-line bg-panel p-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h2 className="font-display text-2xl">
                    {dept.emoji} {dept.name}
                  </h2>
                  <p className="mt-1 text-sm text-white/50">{dept.description}</p>
                </div>
                <span className="rounded-full bg-white/10 px-3 py-1 text-sm">{members.length}</span>
              </div>
              {!hasLead && (
                <p className="mt-3 rounded-xl bg-mag/15 px-3 py-2 text-sm text-mag">
                  Нет тимлида
                </p>
              )}
              <div className="mt-4 space-y-3">
                {members.length === 0 && (
                  <p className="text-white/35">Пусто</p>
                )}
                {members.map((player) => (
                  <AdminPlayerCard
                    key={player.id}
                    player={player}
                    locked={locked || busy}
                    onLead={() => void run(CLIENT_EVENTS.adminSetTeamLead, { playerId: player.id })}
                    onMove={(departmentId) =>
                      void run(CLIENT_EVENTS.adminMovePlayer, {
                        playerId: player.id,
                        departmentId,
                      })
                    }
                    onRemove={() => void run(CLIENT_EVENTS.adminRemovePlayer, { playerId: player.id })}
                  />
                ))}
              </div>
            </section>
          )
        })}
      </div>

      {confirmNew && (
        <ConfirmModal
          onCancel={() => setConfirmNew(false)}
          onConfirm={async () => {
            const ok = await run(CLIENT_EVENTS.adminNewGame)
            if (ok) {
              setConfirmNew(false)
            }
          }}
        />
      )}
    </div>
  )
}

function RestoreBanner({
  state,
  busy,
  onContinue,
  onNewGame,
}: {
  state: ClientGameState
  busy: boolean
  onContinue: () => void
  onNewGame: () => void
}) {
  const when = state.updatedAt
    ? new Date(state.updatedAt).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
    : ''

  return (
    <div className="mt-6 flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-gold/40 bg-gold/10 px-5 py-4">
      <div>
        <div className="font-display text-xl text-gold">Восстановлена игра</div>
        <p className="mt-1 text-white/70">
          {state.phase}, {state.players.length} игроков{when ? `, ${when}` : ''}
        </p>
      </div>
      <div className="flex gap-3">
        <button
          type="button"
          disabled={busy}
          onClick={onContinue}
          className="rounded-2xl bg-gold px-4 py-2 font-bold text-ink"
        >
          Продолжить
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={onNewGame}
          className="rounded-2xl border border-white/20 px-4 py-2"
        >
          Новая игра
        </button>
      </div>
    </div>
  )
}

function AdminPlayerCard({
  player,
  locked,
  onLead,
  onMove,
  onRemove,
}: {
  player: Player
  locked: boolean
  onLead: () => void
  onMove: (departmentId: DepartmentId) => void
  onRemove: () => void
}) {
  return (
    <div
      className={[
        'rounded-2xl p-3',
        player.isTeamLead ? 'bg-gold/15 ring-1 ring-gold/40' : 'bg-white/5',
        player.connected ? '' : 'opacity-60',
      ].join(' ')}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="text-lg font-medium">
          {player.isTeamLead ? `👑 ${player.name}` : player.name}
        </div>
        {!player.connected && (
          <span className="text-[10px] uppercase tracking-widest text-white/40">offline</span>
        )}
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          disabled={locked || player.isTeamLead}
          onClick={onLead}
          className="rounded-xl bg-white/10 px-3 py-1.5 text-sm disabled:opacity-40"
        >
          Тимлид
        </button>
        <select
          disabled={locked}
          value={player.departmentId}
          onChange={(event) => onMove(event.target.value as DepartmentId)}
          className="rounded-xl bg-ink px-2 py-1.5 text-sm"
        >
          {DEPARTMENTS.map((dept) => (
            <option key={dept.id} value={dept.id}>
              {dept.name}
            </option>
          ))}
        </select>
        <button
          type="button"
          disabled={locked}
          onClick={onRemove}
          className="rounded-xl px-3 py-1.5 text-sm text-mag disabled:opacity-40"
        >
          Удалить
        </button>
      </div>
    </div>
  )
}

function ConfirmModal({
  onCancel,
  onConfirm,
}: {
  onCancel: () => void
  onConfirm: () => void
}) {
  return (
    <div className="fixed inset-0 z-20 flex items-center justify-center bg-black/70 px-4">
      <div className="w-full max-w-md rounded-3xl border border-line bg-panel p-6">
        <h2 className="font-display text-3xl">Начать новую игру?</h2>
        <p className="mt-3 text-white/70">
          Текущая сессия уйдёт в архив, игроки вернутся на экран входа.
        </p>
        <div className="mt-6 flex gap-3">
          <button
            type="button"
            onClick={onConfirm}
            className="flex-1 rounded-2xl bg-mag py-3 font-bold text-white"
          >
            Новая игра
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 rounded-2xl bg-white/10 py-3"
          >
            Отмена
          </button>
        </div>
      </div>
    </div>
  )
}

export function useAdminSession(onError: (message: string) => void) {
  const [authed, setAuthed] = useState(false)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const authenticate = (showError: boolean) => {
      const saved = sessionStorage.getItem('brainrot.adminCode')
      if (!saved) {
        setReady(true)
        setAuthed(false)
        return
      }
      void emitAck(CLIENT_EVENTS.adminAuth, { code: saved }).then((ack) => {
        setAuthed(ack.ok)
        if (!ack.ok) {
          sessionStorage.removeItem('brainrot.adminCode')
          if (showError) {
            onError(ack.error)
          }
        }
        setReady(true)
      })
    }

    authenticate(true)
    const onConnect = () => authenticate(false)
    socket.on('connect', onConnect)
    return () => {
      socket.off('connect', onConnect)
    }
  }, [onError])

  return { authed, setAuthed, ready }
}
