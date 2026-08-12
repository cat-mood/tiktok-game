import type { ReactNode } from 'react'
import { formatMmSs } from '../lib/time'
import { useCountdown } from '../hooks/useCountdown'

type Props = {
  sprint?: number
  departmentName: string
  endsAt: string | null
  serverNow: string
  children: ReactNode
  footer?: ReactNode
}

export function GameShell({
  sprint,
  departmentName,
  endsAt,
  serverNow,
  children,
  footer,
}: Props) {
  const remaining = useCountdown(endsAt, serverNow)
  const urgent = remaining > 0 && remaining <= 10_000

  return (
    <div className="mx-auto flex min-h-dvh max-w-xl flex-col px-5 py-6">
      <header className="text-center">
        {sprint != null && (
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-cyan/70">
            SPRINT {sprint}
          </p>
        )}
        <p className="mt-2 text-sm font-semibold uppercase tracking-[0.25em] text-white/50">
          {departmentName}
        </p>
        {endsAt && (
          <div
            className={[
              'mt-3 font-display text-6xl leading-none',
              urgent ? 'text-mag' : 'text-cyan',
            ].join(' ')}
          >
            {formatMmSs(remaining)}
          </div>
        )}
      </header>
      <div className="mt-6 flex min-h-0 flex-1 flex-col">{children}</div>
      {footer && <div className="mt-4 pb-2">{footer}</div>}
    </div>
  )
}
