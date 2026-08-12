import { TOTAL_SPRINTS, type GamePhase } from '@brainrot/shared'
import { formatMmSs } from '../lib/time'
import { useCountdown } from '../hooks/useCountdown'

type Props = {
  sprint: number
  phase: GamePhase
  phaseEndsAt: string | null
  serverNow: string
  size?: 'player' | 'admin'
}

export function SprintTimer({ sprint, phase, phaseEndsAt, serverNow, size = 'player' }: Props) {
  const remaining = useCountdown(phaseEndsAt, serverNow)
  const large = size === 'admin'
  const showTimer = phase === 'PLANNING' || phase === 'WORK'

  return (
    <div className="text-center">
      {phase !== 'FINISHED' && phase !== 'LOBBY' && (
        <p
          className={[
            'font-semibold uppercase tracking-[0.35em] text-cyan/70',
            large ? 'text-sm' : 'text-xs',
          ].join(' ')}
        >
          SPRINT {sprint} / {TOTAL_SPRINTS}
        </p>
      )}
      {showTimer && (
        <div
          className={[
            'mt-3 font-display leading-none text-cyan',
            large ? 'text-8xl' : 'text-7xl',
          ].join(' ')}
        >
          {formatMmSs(remaining)}
        </div>
      )}
    </div>
  )
}
