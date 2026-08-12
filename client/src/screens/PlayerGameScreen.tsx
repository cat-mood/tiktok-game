import { useState } from 'react'
import {
  CLIENT_EVENTS,
  TASK_DIFFICULTIES,
  TOTAL_SPRINTS,
  type ClientGameState,
  type Player,
  type TaskDifficulty,
} from '@brainrot/shared'
import { SprintTimer } from '../components/SprintTimer'
import { currentTaskFor, DIFFICULTY_META, taskReward } from '../lib/tasks'
import { departmentById } from '../lib/departments'
import { emitAck } from '../socket'

type Props = {
  me: Player
  state: ClientGameState
  onError: (message: string) => void
}

export function PlayerGameScreen({ me, state, onError }: Props) {
  if (state.phase === 'FINISHED') {
    return <FinishedScreen />
  }
  if (state.phase === 'PLANNING') {
    return me.isTeamLead ? (
      <TeamLeadPlanning me={me} state={state} onError={onError} />
    ) : (
      <PlayerPlanning me={me} state={state} />
    )
  }
  if (state.phase === 'WORK') {
    return <PlayerWork me={me} state={state} onError={onError} />
  }
  return null
}

function FinishedScreen() {
  return (
    <div className="mx-auto flex min-h-dvh max-w-xl flex-col items-center justify-center px-5 text-center">
      <div className="rise text-7xl">🎉</div>
      <h1 className="mt-6 font-display text-5xl leading-none">ИГРА ЗАВЕРШЕНА!</h1>
    </div>
  )
}

function PlayerPlanning({ me, state }: { me: Player; state: ClientGameState }) {
  const task = currentTaskFor(state, me.id)
  const assigned = task?.difficulty

  return (
    <div className="mx-auto flex min-h-dvh max-w-xl flex-col px-5 py-8">
      <SprintTimer
        sprint={state.currentSprint}
        phase={state.phase}
        phaseEndsAt={state.phaseEndsAt}
        serverNow={state.serverNow}
      />
      <h1 className="mt-8 text-center font-display text-5xl leading-none">ПЛАНИРОВАНИЕ</h1>
      <p className="mt-4 text-center text-xl text-white/60">До начала работы</p>
      <p className="pulse-soft mt-10 text-center text-xl text-cyan">
        Твой тимлид распределяет задачи.
      </p>
      {assigned && (
        <div className="mt-8 rounded-3xl border border-line bg-panel p-5 text-center">
          <p className="text-sm uppercase tracking-[0.2em] text-white/40">Тебе назначено</p>
          <p className="mt-2 font-display text-3xl text-gold">
            {DIFFICULTY_META[assigned].stars} {DIFFICULTY_META[assigned].label}
          </p>
        </div>
      )}
    </div>
  )
}

function TeamLeadPlanning({ me, state, onError }: Props) {
  const [busy, setBusy] = useState(false)
  const dept = departmentById(me.departmentId)
  const teammates = state.players.filter(
    (player) => player.departmentId === me.departmentId && player.id !== me.id,
  )

  const assign = async (playerId: string, difficulty: TaskDifficulty) => {
    setBusy(true)
    const ack = await emitAck(CLIENT_EVENTS.teamLeadAssignDifficulty, { playerId, difficulty })
    setBusy(false)
    if (!ack.ok) {
      onError(ack.error)
    }
  }

  return (
    <div className="mx-auto flex min-h-dvh max-w-xl flex-col px-5 py-8">
      <SprintTimer
        sprint={state.currentSprint}
        phase={state.phase}
        phaseEndsAt={state.phaseEndsAt}
        serverNow={state.serverNow}
      />
      <h1 className="mt-6 text-center font-display text-4xl leading-none">ПЛАНИРОВАНИЕ</h1>
      <p className="mt-3 text-center text-white/60">Распределите задачи между сотрудниками</p>
      <p className="mt-2 text-center text-sm text-white/40">
        {dept.emoji} {dept.name} · спринт {state.currentSprint} / {TOTAL_SPRINTS}
      </p>
      <p className="mt-2 text-center text-sm text-white/35">
        Себе сложность выбирать не нужно — ты тоже получишь задачу.
      </p>

      <div className="mt-8 space-y-4">
        {teammates.length === 0 && (
          <p className="rounded-3xl border border-line bg-panel p-5 text-center text-white/50">
            В отделе пока только ты. Задачу себе назначать не нужно.
          </p>
        )}
        {teammates.map((player) => {
          const task = currentTaskFor(state, player.id)
          const selected = task?.difficulty
          return (
            <section
              key={player.id}
              className={[
                'rounded-3xl border p-4',
                selected ? 'border-gold/40 bg-gold/10' : 'border-line bg-panel',
              ].join(' ')}
            >
              <div className="flex items-center justify-between gap-2">
                <div>
                  <div className="text-xl font-medium">{player.name}</div>
                  <div className="mt-1 text-sm text-white/50">{dept.name}</div>
                </div>
                {selected && (
                  <span className="rounded-full bg-gold/20 px-3 py-1 text-sm text-gold">
                    {DIFFICULTY_META[selected].label}
                  </span>
                )}
              </div>
              <p className="mt-3 text-xs font-semibold uppercase tracking-[0.2em] text-white/40">
                Сложность
              </p>
              <div className="mt-2 grid grid-cols-3 gap-2">
                {TASK_DIFFICULTIES.map((difficulty) => (
                  <button
                    key={difficulty}
                    type="button"
                    disabled={busy}
                    onClick={() => void assign(player.id, difficulty)}
                    className={[
                      'rounded-2xl px-2 py-3 text-sm font-bold disabled:opacity-40',
                      selected === difficulty
                        ? 'bg-gold text-ink'
                        : 'bg-white/10 text-white hover:bg-white/15',
                    ].join(' ')}
                  >
                    {difficulty}
                  </button>
                ))}
              </div>
            </section>
          )
        })}
      </div>
    </div>
  )
}

function PlayerWork({ me, state, onError }: Props) {
  const [busy, setBusy] = useState(false)
  const [showPlaceholder, setShowPlaceholder] = useState(false)
  const task = currentTaskFor(state, me.id)
  const difficulty = task?.difficulty
  const meta = difficulty ? DIFFICULTY_META[difficulty] : null

  const run = async (event: string) => {
    setBusy(true)
    const ack = await emitAck(event)
    setBusy(false)
    if (!ack.ok) {
      onError(ack.error)
      return false
    }
    return true
  }

  const start = async () => {
    const ok = await run(CLIENT_EVENTS.playerStartTask)
    if (ok) {
      setShowPlaceholder(true)
    }
  }

  return (
    <div className="mx-auto flex min-h-dvh max-w-xl flex-col px-5 py-8">
      <SprintTimer
        sprint={state.currentSprint}
        phase={state.phase}
        phaseEndsAt={state.phaseEndsAt}
        serverNow={state.serverNow}
      />
      <p className="mt-4 text-center text-xl text-white/60">До конца</p>

      {task && meta ? (
        <section className="mt-8 rounded-3xl border border-line bg-panel p-6 text-center">
          <p className="text-sm uppercase tracking-[0.2em] text-white/40">Твоя задача</p>
          <div className="mt-4 text-6xl">{meta.icon}</div>
          <h1 className="mt-4 font-display text-4xl leading-none">{meta.title}</h1>
          <p className="mt-5 text-lg text-white/70">
            Сложность:
            <span className="ml-2 text-gold">
              {meta.stars} {meta.label}
            </span>
          </p>
          <p className="mt-2 text-lg text-white/70">
            Награда: <span className="text-cyan">{taskReward(task.difficulty)} очков</span>
          </p>

          {task.status === 'ASSIGNED' && (
            <button
              type="button"
              disabled={busy}
              onClick={() => void start()}
              className="mt-8 w-full rounded-2xl bg-cyan py-4 text-2xl font-bold text-ink disabled:opacity-40"
            >
              НАЧАТЬ
            </button>
          )}

          {(task.status === 'IN_PROGRESS' || showPlaceholder) && task.status !== 'COMPLETED' && (
            <p className="mt-8 rounded-2xl bg-white/5 px-4 py-4 text-white/55">
              Мини-игра будет добавлена на следующем этапе.
            </p>
          )}

          {task.status === 'IN_PROGRESS' && (
            <button
              type="button"
              disabled={busy}
              onClick={() => void run(CLIENT_EVENTS.playerCompleteTask)}
              className="mt-6 w-full rounded-2xl border border-dashed border-gold/40 px-3 py-2 text-xs uppercase tracking-[0.2em] text-gold/70 disabled:opacity-40"
            >
              DEV: ЗАВЕРШИТЬ ЗАДАЧУ
            </button>
          )}

          {task.status === 'COMPLETED' && (
            <p className="mt-8 font-display text-3xl text-gold">Готово · +{task.score}</p>
          )}
        </section>
      ) : (
        <p className="mt-10 text-center text-white/50">Задача ещё не назначена.</p>
      )}
    </div>
  )
}
