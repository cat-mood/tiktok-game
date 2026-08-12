import { useEffect, useRef, useState, type ReactNode } from 'react'
import type { GameType, MiniGamePrompt, TaskDifficulty } from '@brainrot/shared'
import { useCountdown } from '../hooks/useCountdown'
import { GameRenderer } from './GameRenderer'
import { GameShell } from './GameShell'
import { ResultView } from './ResultView'
import { Tutorial } from './Tutorial'
import { hasSeenTutorial, markTutorialSeen } from './tutorialStorage'

type Props = {
  gameType: GameType
  difficulty: TaskDifficulty
  prompt: MiniGamePrompt
  timeLimitMs: number
  startedAt: string | null
  serverNow: string
  sprint?: number
  departmentName: string
  status: 'IN_PROGRESS' | 'COMPLETED' | 'FAILED'
  score: number
  playerId: string
  onSubmit: (answer: unknown) => Promise<'correct' | 'wrong' | 'error'>
  onExpire: () => void
  revealAnswer?: string
  extraResult?: ReactNode
}

export function MiniGameFlow({
  gameType,
  difficulty,
  prompt,
  timeLimitMs,
  startedAt,
  serverNow,
  sprint,
  departmentName,
  status,
  score,
  playerId,
  onSubmit,
  onExpire,
  revealAnswer,
  extraResult,
}: Props) {
  const [showTutorial, setShowTutorial] = useState(
    () => !hasSeenTutorial(playerId, gameType),
  )
  const [answer, setAnswer] = useState<unknown>(emptyAnswer(prompt))
  const [wrong, setWrong] = useState(false)
  const [busy, setBusy] = useState(false)
  const expiredRef = useRef(false)

  const endsAt =
    status === 'IN_PROGRESS' && startedAt
      ? new Date(Date.parse(startedAt) + timeLimitMs).toISOString()
      : null
  const remaining = useCountdown(endsAt, serverNow)

  useEffect(() => {
    if (status !== 'IN_PROGRESS' || !endsAt || remaining > 0 || expiredRef.current) {
      return
    }
    expiredRef.current = true
    onExpire()
  }, [endsAt, onExpire, remaining, status])

  const finishTutorial = () => {
    markTutorialSeen(playerId, gameType)
    setShowTutorial(false)
  }

  const submit = async () => {
    if (busy || status !== 'IN_PROGRESS') {
      return
    }
    setBusy(true)
    setWrong(false)
    const result = await onSubmit(answer)
    setBusy(false)
    if (result === 'wrong') {
      setWrong(true)
    }
  }

  const ready = canSubmit(prompt, answer)

  if (status === 'COMPLETED' || status === 'FAILED') {
    return (
      <GameShell
        sprint={sprint}
        departmentName={departmentName}
        endsAt={null}
        serverNow={serverNow}
      >
        <ResultView
          success={status === 'COMPLETED'}
          difficulty={difficulty}
          score={score}
          revealAnswer={revealAnswer}
          extra={extraResult}
        />
      </GameShell>
    )
  }

  if (showTutorial) {
    return (
      <GameShell
        sprint={sprint}
        departmentName={departmentName}
        endsAt={endsAt}
        serverNow={serverNow}
      >
        <Tutorial gameType={gameType} onContinue={finishTutorial} />
      </GameShell>
    )
  }

  return (
    <GameShell
      sprint={sprint}
      departmentName={departmentName}
      endsAt={endsAt}
      serverNow={serverNow}
      footer={
        <div>
          {wrong && (
            <p className="mb-3 text-center text-lg text-mag">Неправильно, попробуй ещё раз</p>
          )}
          <button
            type="button"
            disabled={busy || !ready}
            onClick={() => void submit()}
            className="w-full rounded-2xl bg-cyan py-4 text-2xl font-bold text-ink disabled:opacity-40"
          >
            ПРОВЕРИТЬ
          </button>
        </div>
      }
    >
      <GameRenderer
        prompt={prompt}
        answer={answer}
        onAnswerChange={(next) => {
          setWrong(false)
          setAnswer(next)
        }}
      />
    </GameShell>
  )
}

function emptyAnswer(prompt: MiniGamePrompt): unknown {
  return prompt.kind === 'BUILD_ALGORITHM' ? [] : ''
}

function canSubmit(prompt: MiniGamePrompt, answer: unknown): boolean {
  if (prompt.kind === 'BUILD_ALGORITHM') {
    return Array.isArray(answer) && answer.length > 0
  }
  return typeof answer === 'string' && answer.trim().length > 0
}
