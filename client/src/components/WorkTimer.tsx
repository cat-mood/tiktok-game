import type { GamePhase } from '@brainrot/shared'
import { formatMmSs } from '../lib/time'
import { useCountdown } from '../hooks/useCountdown'

type Props = {
  phase: GamePhase
  phaseEndsAt: string | null
  serverNow: string
  size?: 'player' | 'admin'
  label?: string
}

export function WorkTimer({ phase, phaseEndsAt, serverNow, size = 'player', label }: Props) {
  const remaining = useCountdown(phaseEndsAt, serverNow)
  const large = size === 'admin'
  const showTimer = phase === 'WORK'

  return (
    <div className="text-center">
      {showTimer && (
        <>
          <p
            className={[
              'font-semibold uppercase tracking-[0.35em] text-cyan/70',
              large ? 'text-sm' : 'text-xs',
            ].join(' ')}
          >
            {label ?? 'До RELEASE'}
          </p>
          <div
            className={[
              'mt-3 font-display leading-none text-cyan',
              large ? 'text-8xl' : 'text-6xl',
            ].join(' ')}
          >
            {formatMmSs(remaining)}
          </div>
        </>
      )}
    </div>
  )
}
