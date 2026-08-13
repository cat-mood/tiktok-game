import { useEffect, useState } from 'react'
import {
  CLIENT_EVENTS,
  DEPARTMENTS,
  type ClientGameState,
  type DepartmentId,
} from '@brainrot/shared'
import { DepartmentWorkspace } from './PlayerGameScreen'
import { emitAck } from '../socket'

type Props = {
  enabled: boolean
  state: ClientGameState
  onError: (message: string) => void
}

export function DevSandboxScreen({ enabled, state, onError }: Props) {
  const [departmentId, setDepartmentId] = useState<DepartmentId>('design')

  useEffect(() => {
    if (!enabled) {
      return
    }
    void emitAck(CLIENT_EVENTS.devOpenWorkspace, { departmentId: 'design' })
  }, [enabled])

  if (!enabled) {
    return (
      <div className="mx-auto flex min-h-dvh max-w-xl items-center justify-center px-5 text-center text-white/50">
        Песочница доступна только в dev
      </div>
    )
  }

  const open = async (id: DepartmentId) => {
    setDepartmentId(id)
    const ack = await emitAck(CLIENT_EVENTS.devOpenWorkspace, { departmentId: id })
    if (!ack.ok) {
      onError(ack.error)
    }
  }

  return (
    <div className="mx-auto min-h-dvh max-w-xl px-5 py-6">
      <p className="text-xs uppercase tracking-[0.35em] text-gold/70">Dev sandbox</p>
      <h1 className="mt-2 font-display text-4xl">SHORTS workspace</h1>
      <div className="mt-4 grid grid-cols-2 gap-2">
        {DEPARTMENTS.map((dept) => (
          <button
            key={dept.id}
            type="button"
            onClick={() => void open(dept.id)}
            className={[
              'rounded-2xl px-3 py-3 text-sm font-bold',
              departmentId === dept.id ? 'bg-cyan text-ink' : 'bg-white/10',
            ].join(' ')}
          >
            {dept.emoji} {dept.name}
          </button>
        ))}
      </div>
      <div className="mt-6">
        <DepartmentWorkspace
          departmentId={departmentId}
          state={state}
          onError={onError}
          readOnly={state.phase !== 'WORK' && state.phase !== 'LOBBY'}
        />
      </div>
    </div>
  )
}
