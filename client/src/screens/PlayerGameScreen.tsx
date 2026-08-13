import {
  projectStats,
  type ClientGameState,
  type DepartmentId,
  type Player,
} from '@brainrot/shared'
import { WorkTimer } from '../components/WorkTimer'
import { PlayerList } from '../components/PlayerList'
import { departmentById } from '../lib/departments'
import { DesignWorkspace } from '../workspaces/DesignWorkspace'
import { DevelopmentWorkspace } from '../workspaces/DevelopmentWorkspace'
import { QaWorkspace } from '../workspaces/QaWorkspace'
import { MarketingWorkspace } from '../workspaces/MarketingWorkspace'
import { ShortsRuntime } from '../runtime/ShortsRuntime'

type Props = {
  me: Player
  state: ClientGameState
  onError: (message: string) => void
}

export function PlayerGameScreen({ me, state, onError }: Props) {
  if (state.phase === 'FINISHED') {
    return <FinishedScreen />
  }
  if (state.phase === 'RELEASE') {
    return <PlayerRelease me={me} state={state} />
  }
  if (state.phase === 'WORK' || state.phase === 'LOBBY') {
    return <PlayerWork me={me} state={state} onError={onError} />
  }
  return null
}

function FinishedScreen() {
  return (
    <div className="mx-auto flex min-h-dvh max-w-xl flex-col items-center justify-center px-5 text-center">
      <div className="rise text-7xl">🚀</div>
      <h1 className="mt-6 font-display text-5xl leading-none">SHORTS ЗАПУЩЕН</h1>
    </div>
  )
}

function PlayerWork({ me, state, onError }: Props) {
  const dept = departmentById(me.departmentId)
  const teammates = state.players.filter((player) => player.departmentId === me.departmentId)

  return (
    <div className="mx-auto flex min-h-dvh max-w-xl flex-col px-5 py-6">
      <WorkTimer
        phase={state.phase}
        phaseEndsAt={state.phaseEndsAt}
        serverNow={state.serverNow}
      />
      <p className="mt-4 text-center text-xs uppercase tracking-[0.3em] text-white/40">
        {dept.emoji} {dept.name}
        {me.isTeamLead ? ' · Тимлид' : ''}
      </p>
      <div className="mt-4">
        <PlayerList players={teammates} />
      </div>
      <div className="mt-6">
        <DepartmentWorkspace departmentId={me.departmentId} me={me} state={state} onError={onError} />
      </div>
    </div>
  )
}

function PlayerRelease({ me, state }: { me: Player; state: ClientGameState }) {
  const launched = Boolean(state.release?.launchedAt)
  const snapshot = state.release?.snapshot ?? state.project
  const stats = projectStats(snapshot)

  return (
    <div className="mx-auto flex min-h-dvh max-w-xl flex-col items-center px-5 py-8">
      <p className="text-xs uppercase tracking-[0.35em] text-cyan/70">
        {launched ? 'LIVE' : 'RELEASE PREPARATION'}
      </p>
      <h1 className="mt-3 text-center font-display text-4xl">SHORTS</h1>
      {!launched && (
        <p className="pulse-soft mt-6 text-center text-xl text-gold">Ждём кнопку RELEASE у ведущего</p>
      )}
      {launched && (
        <>
          <div className="mt-6">
            <ShortsRuntime
              project={snapshot}
              stateId={state.release?.runtimeStateId ?? null}
              scale={0.62}
            />
          </div>
          <p className="mt-4 text-center text-white/50">Смотри на экран ведущего — там можно тыкать приложение</p>
        </>
      )}
      <div className="mt-8 w-full rounded-3xl border border-line bg-panel p-4 text-sm text-white/70">
        <p>Design · {stats.screens} screens · {stats.states} states · {stats.components} components</p>
        <p className="mt-1">Development · {stats.transitions} transitions</p>
        <p className="mt-1">QA · {stats.tests} tests · {stats.passed} pass · {stats.failed} fail · {stats.bugs} bugs</p>
        <p className="mt-1">{departmentById(me.departmentId).name}: вы в команде</p>
      </div>
    </div>
  )
}

export function DepartmentWorkspace({
  departmentId,
  me,
  state,
  onError,
  readOnly,
}: {
  departmentId: DepartmentId
  me?: Player
  state: ClientGameState
  onError: (message: string) => void
  readOnly?: boolean
}) {
  if (departmentId === 'design') {
    return <DesignWorkspace state={state} onError={onError} readOnly={readOnly} />
  }
  if (departmentId === 'development') {
    return <DevelopmentWorkspace state={state} onError={onError} readOnly={readOnly} />
  }
  if (departmentId === 'qa') {
    return <QaWorkspace me={me} state={state} onError={onError} readOnly={readOnly} />
  }
  return <MarketingWorkspace state={state} onError={onError} readOnly={readOnly} />
}
