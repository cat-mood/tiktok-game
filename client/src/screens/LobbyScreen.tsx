import { useState } from 'react'
import {
  CLIENT_EVENTS,
  DEPARTMENTS,
  type ClientGameState,
  type DepartmentId,
  type Player,
} from '@brainrot/shared'
import { DepartmentCard } from '../components/DepartmentCard'
import { PlayerList } from '../components/PlayerList'
import { departmentById, departmentCount, playerCountLabel } from '../lib/departments'
import { emitAck } from '../socket'

type Props = {
  me: Player
  state: ClientGameState
  onError: (message: string) => void
}

export function LobbyScreen({ me, state, onError }: Props) {
  const [busy, setBusy] = useState(false)
  const dept = departmentById(me.departmentId)
  const teammates = state.players.filter((player) => player.departmentId === me.departmentId)
  const lead = teammates.find((player) => player.isTeamLead)
  const canSwitch = state.phase === 'LOBBY' && !me.isTeamLead

  const switchDepartment = async (departmentId: DepartmentId) => {
    if (departmentId === me.departmentId || !canSwitch) {
      return
    }
    setBusy(true)
    const ack = await emitAck(CLIENT_EVENTS.playerChangeDepartment, { departmentId })
    setBusy(false)
    if (!ack.ok) {
      onError(ack.error)
    }
  }

  return (
    <div className="mx-auto flex min-h-dvh max-w-xl flex-col px-5 py-8">
      <p className="text-xs font-semibold uppercase tracking-[0.35em] text-cyan/70">Lobby</p>
      <h1 className="mt-3 font-display text-4xl leading-none">
        Ты в команде {dept.name}
      </h1>

      <section className="mt-8 rounded-3xl border border-line bg-panel p-5">
        <div className="text-3xl font-display">{me.name}</div>
        <div className="mt-2 text-white/70">
          {dept.emoji} {dept.name}
        </div>
        <div className="mt-3 inline-flex rounded-full bg-white/10 px-3 py-1 text-sm uppercase tracking-widest">
          {me.isTeamLead ? 'Тимлид' : 'Участник'}
        </div>
      </section>

      <section className="mt-6">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-white/50">
          Твоя команда
        </h2>
        <PlayerList players={teammates} />
      </section>

      <p className="mt-6 text-lg">
        {lead ? `Тимлид: ${lead.name}` : 'Тимлид пока не выбран'}
      </p>
      <p className="pulse-soft mt-2 text-xl font-medium text-cyan">Ждём начала игры...</p>

      {me.isTeamLead && state.phase === 'LOBBY' && (
        <p className="mt-6 text-white/50">Тимлид не может сменить отдел. Попроси ведущего.</p>
      )}

      {canSwitch && (
        <div className="mt-8">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-white/50">
            Сменить отдел
          </h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {DEPARTMENTS.map((item) => (
              <DepartmentCard
                key={item.id}
                departmentId={item.id}
                countLabel={playerCountLabel(departmentCount(state, item.id))}
                selected={item.id === me.departmentId}
                disabled={busy}
                onSelect={(id) => void switchDepartment(id)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
