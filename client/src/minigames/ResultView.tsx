import type { ReactNode } from 'react'
import { SCORE_BY_DIFFICULTY, type TaskDifficulty } from '@brainrot/shared'

type Props = {
  success: boolean
  difficulty: TaskDifficulty
  score?: number
  revealAnswer?: string
  extra?: ReactNode
}

export function ResultView({ success, difficulty, score, revealAnswer, extra }: Props) {
  const points = score ?? SCORE_BY_DIFFICULTY[difficulty]

  if (success) {
    return (
      <div className="flex min-h-0 flex-1 flex-col items-center justify-center text-center">
        <div className="text-6xl">🎉</div>
        <h1 className="mt-6 font-display text-4xl leading-none">ЗАДАЧА ВЫПОЛНЕНА!</h1>
        <p className="mt-6 font-display text-5xl text-gold">+{points}</p>
        {revealAnswer && (
          <p className="mt-6 text-sm text-white/40">Ответ: {revealAnswer}</p>
        )}
        {extra}
      </div>
    )
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col items-center justify-center text-center">
      <div className="text-6xl">⏰</div>
      <h1 className="mt-6 font-display text-4xl leading-none">ВРЕМЯ ВЫШЛО</h1>
      <p className="mt-5 text-xl text-white/60">Задача не выполнена.</p>
      {revealAnswer && <p className="mt-6 text-sm text-white/40">Ответ: {revealAnswer}</p>}
      {extra}
    </div>
  )
}
