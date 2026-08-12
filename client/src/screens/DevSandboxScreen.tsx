import { useState } from 'react'
import {
  CLIENT_EVENTS,
  GAME_TYPES,
  GAME_TYPE_META,
  SCORE_BY_DIFFICULTY,
  TASK_DIFFICULTIES,
  type GameType,
  type MiniGamePrompt,
  type TaskDifficulty,
} from '@brainrot/shared'
import { MiniGameFlow } from '../minigames/MiniGameFlow'
import { emitAck } from '../socket'

type Props = {
  enabled: boolean
  serverNow: string
  onError: (message: string) => void
}

type SandboxSession = {
  sandboxId: string
  gameType: GameType
  difficulty: TaskDifficulty
  prompt: MiniGamePrompt
  timeLimitMs: number
  startedAt: string
  status: 'IN_PROGRESS' | 'COMPLETED' | 'FAILED'
  score: number
  revealAnswer?: string
}

export function DevSandboxScreen({ enabled, serverNow, onError }: Props) {
  const [session, setSession] = useState<SandboxSession | null>(null)
  const [busy, setBusy] = useState(false)

  if (!enabled) {
    return (
      <div className="mx-auto flex min-h-dvh max-w-xl flex-col items-center justify-center px-5 text-center">
        <h1 className="font-display text-4xl">Песочница только в dev</h1>
        <p className="mt-4 text-white/50">Запусти игру через npm run dev.</p>
        <a href="/" className="mt-8 text-cyan">
          На главную
        </a>
      </div>
    )
  }

  const start = async (gameType: GameType, difficulty: TaskDifficulty) => {
    setBusy(true)
    const ack = await emitAck(CLIENT_EVENTS.devStartMinigame, { gameType, difficulty })
    setBusy(false)
    if (!ack.ok || !ack.sandboxId || !ack.prompt || !ack.gameType || !ack.difficulty) {
      onError(ack.ok ? 'Не удалось начать игру' : ack.error)
      return
    }
    setSession({
      sandboxId: ack.sandboxId,
      gameType: ack.gameType,
      difficulty: ack.difficulty,
      prompt: ack.prompt,
      timeLimitMs: ack.timeLimitMs ?? 60_000,
      startedAt: new Date().toISOString(),
      status: 'IN_PROGRESS',
      score: 0,
    })
  }

  const submit = async (answer: unknown) => {
    if (!session) {
      return 'error' as const
    }
    const ack = await emitAck(CLIENT_EVENTS.devSubmitAnswer, {
      sandboxId: session.sandboxId,
      answer,
    })
    if (!ack.ok) {
      if (ack.error === 'Время вышло') {
        setSession({
          ...session,
          status: 'FAILED',
          score: 0,
        })
      } else {
        onError(ack.error)
      }
      return 'error' as const
    }
    if (ack.correct) {
      setSession({
        ...session,
        status: 'COMPLETED',
        score: SCORE_BY_DIFFICULTY[session.difficulty],
        revealAnswer: ack.revealAnswer,
      })
      return 'correct' as const
    }
    return 'wrong' as const
  }

  const expire = async () => {
    if (!session || session.status !== 'IN_PROGRESS') {
      return
    }
    const ack = await emitAck(CLIENT_EVENTS.devExpireMinigame, { sandboxId: session.sandboxId })
    setSession({
      ...session,
      status: 'FAILED',
      score: 0,
      revealAnswer: ack.ok ? ack.revealAnswer : undefined,
    })
  }

  const replay = () => {
    if (!session) {
      return
    }
    void start(session.gameType, session.difficulty)
  }

  if (session) {
    return (
      <MiniGameFlow
        gameType={session.gameType}
        difficulty={session.difficulty}
        prompt={session.prompt}
        timeLimitMs={session.timeLimitMs}
        startedAt={session.startedAt}
        serverNow={serverNow}
        departmentName="DEVELOPMENT · DEV"
        status={session.status}
        score={session.score}
        playerId="dev"
        onSubmit={submit}
        onExpire={() => void expire()}
        revealAnswer={session.revealAnswer}
        extraResult={
          <div className="mt-8 grid w-full max-w-sm grid-cols-2 gap-3">
            <button
              type="button"
              onClick={replay}
              className="rounded-2xl bg-cyan py-3 font-bold text-ink"
            >
              Ещё раз
            </button>
            <button
              type="button"
              onClick={() => setSession(null)}
              className="rounded-2xl border border-white/15 py-3 font-bold text-white/70"
            >
              К выбору игр
            </button>
          </div>
        }
      />
    )
  }

  return (
    <div className="mx-auto flex min-h-dvh max-w-xl flex-col px-5 py-8">
      <p className="text-xs font-semibold uppercase tracking-[0.35em] text-gold/70">Dev</p>
      <h1 className="mt-2 font-display text-4xl leading-none">Песочница мини-игр</h1>
      <p className="mt-3 text-white/55">
        Играй во все типы и сложности. Очки и спринт не затрагиваются.
      </p>
      <div className="mt-8 space-y-4">
        {GAME_TYPES.map((gameType) => (
          <section key={gameType} className="rounded-3xl border border-line bg-panel p-4">
            <div className="flex items-center gap-3">
              <span className="text-3xl">{GAME_TYPE_META[gameType].emoji}</span>
              <div>
                <h2 className="font-display text-2xl leading-none">
                  {GAME_TYPE_META[gameType].title}
                </h2>
                <p className="mt-1 text-sm text-white/40">{GAME_TYPE_META[gameType].short}</p>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-3 gap-2">
              {TASK_DIFFICULTIES.map((difficulty) => (
                <button
                  key={difficulty}
                  type="button"
                  disabled={busy}
                  onClick={() => void start(gameType, difficulty)}
                  className="rounded-2xl bg-white/10 py-3 text-sm font-bold hover:bg-white/15 disabled:opacity-40"
                >
                  {difficulty}
                </button>
              ))}
            </div>
          </section>
        ))}
      </div>
      <a href="/" className="mt-8 text-center text-cyan">
        На главную
      </a>
    </div>
  )
}
