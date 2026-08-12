import type { GamePhase } from '@brainrot/shared'

const LABELS: Record<GamePhase, string> = {
  LOBBY: 'LOBBY',
  PLANNING: 'PLANNING',
  WORK: 'WORK',
  FINISHED: 'FINISHED',
}

export function PhaseBadge({ phase }: { phase: GamePhase }) {
  const active = phase === 'PLANNING' || phase === 'WORK'
  return (
    <span
      className={[
        'rounded-full px-4 py-1.5 font-display text-sm tracking-[0.2em]',
        active ? 'bg-mag/20 text-mag shadow-mag' : 'bg-cyan/15 text-cyan',
      ].join(' ')}
    >
      {LABELS[phase]}
    </span>
  )
}
