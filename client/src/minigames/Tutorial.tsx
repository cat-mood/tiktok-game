import type { GameType } from '@brainrot/shared'
import { TUTORIALS } from './tutorials'

type Props = {
  gameType: GameType
  onContinue: () => void
}

export function Tutorial({ gameType, onContinue }: Props) {
  const tutorial = TUTORIALS[gameType]

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <h1 className="text-center font-display text-4xl leading-none">{tutorial.title}</h1>
      <p className="mt-5 text-center text-lg text-white/70">{tutorial.body}</p>
      <div className="mt-8 rounded-3xl border border-line bg-panel p-5">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/40">
          {tutorial.exampleTitle}
        </p>
        <div className="mt-3 space-y-1 text-lg text-white/85">
          {tutorial.example.map((line) => (
            <p key={line}>{line}</p>
          ))}
        </div>
      </div>
      <p className="mt-6 text-center text-white/50">Теперь попробуй сам.</p>
      <div className="mt-auto grid grid-cols-2 gap-3 pt-8">
        <button
          type="button"
          onClick={onContinue}
          className="rounded-2xl border border-white/15 py-4 text-lg font-bold text-white/70"
        >
          ПРОПУСТИТЬ
        </button>
        <button
          type="button"
          onClick={onContinue}
          className="rounded-2xl bg-cyan py-4 text-lg font-bold text-ink"
        >
          ПОНЯТНО
        </button>
      </div>
    </div>
  )
}
