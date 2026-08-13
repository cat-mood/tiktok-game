import { useState } from 'react'
import { hasSeenOnboarding, markOnboardingSeen } from '../lib/onboarding'

export type OnboardingStep = {
  title: string
  body: string
}

type Props = {
  id: string
  steps: OnboardingStep[]
  onDone?: () => void
}

export function Onboarding({ id, steps, onDone }: Props) {
  const [open, setOpen] = useState(() => !hasSeenOnboarding(id))
  const [index, setIndex] = useState(0)

  if (!open || steps.length === 0) {
    return null
  }

  const step = steps[index]
  const last = index === steps.length - 1

  const close = () => {
    markOnboardingSeen(id)
    setOpen(false)
    onDone?.()
  }

  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center bg-black/70 px-4 py-6 sm:items-center">
      <div className="rise w-full max-w-md rounded-3xl border border-line bg-panel p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-cyan/70">
          Как работать · {index + 1}/{steps.length}
        </p>
        <h2 className="mt-3 font-display text-3xl leading-none">{step.title}</h2>
        <p className="mt-4 text-lg leading-relaxed text-white/75">{step.body}</p>
        <div className="mt-6 flex gap-3">
          <button
            type="button"
            onClick={() => {
              if (last) {
                close()
                return
              }
              setIndex((value) => value + 1)
            }}
            className="flex-1 rounded-2xl bg-cyan py-4 text-lg font-bold text-ink"
          >
            {last ? 'Понятно, начать' : 'Дальше'}
          </button>
          <button
            type="button"
            onClick={close}
            className="rounded-2xl bg-white/10 px-4 py-4 text-white/70"
          >
            Пропустить
          </button>
        </div>
      </div>
    </div>
  )
}
