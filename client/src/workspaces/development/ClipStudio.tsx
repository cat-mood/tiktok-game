import { useState } from 'react'
import { ActionList, BugStrip, MissionHints, destinationLabel, useScreenLogic, type StudioProps } from './shared'

export function ClipStudio({ state, onError, readOnly }: StudioProps) {
  const logic = useScreenLogic(state, onError, 'video')
  const [liked, setLiked] = useState(false)
  const [picked, setPicked] = useState<'comment' | 'share' | 'swipe' | 'author' | null>(null)

  return (
    <div className="space-y-4">
      <BugStrip state={state} screenName="Клип" />
      <MissionHints stateId="video" />
      <section className="dev-clip overflow-hidden rounded-[2rem] border border-line p-4">
        <p className="text-xs font-bold uppercase tracking-[0.22em] text-white/45">Клип</p>
        <h2 className="mt-1 font-display text-3xl leading-none">Собери жесты ролика</h2>
        <p className="mt-2 text-sm text-white/55">
          Тапни иконку на телефоне — и скажи, куда она ведёт. Лайк никуда не ведёт: он просто загорается.
        </p>
        <div className="mt-4 flex justify-center">
          <div className="relative h-[340px] w-[210px] overflow-hidden rounded-[1.8rem] bg-[#120814] shadow-[0_0_0_3px_#3a3a46]">
            <div className="clip-sun absolute left-10 top-16 h-40 w-40 rounded-full bg-[#ff8c5a]/80 blur-2xl" />
            <div className="absolute inset-x-6 top-24 h-36 rounded-full bg-[#2a1030]" />
            <div className="absolute bottom-16 left-4 right-16">
              <p className="text-sm font-bold">@brainrot</p>
              <p className="clip-music mt-1 text-xs text-white/70">оригинальный звук · клип недели · </p>
            </div>
            <div className="absolute bottom-3 left-3 right-3 h-1 overflow-hidden rounded-full bg-white/20">
              <div className="clip-progress h-full bg-white" />
            </div>
            <div className="absolute bottom-20 right-2 flex flex-col items-center gap-3">
              <button
                type="button"
                onClick={() => setLiked((value) => !value)}
                className="flex h-11 w-11 flex-col items-center justify-center rounded-full bg-black/35 text-lg"
              >
                {liked ? '❤️' : '🤍'}
              </button>
              <Hot
                active={picked === 'comment'}
                wired={Boolean(logic.byEvent('CLICK_COMMENT'))}
                onClick={() => setPicked('comment')}
              >
                💬
              </Hot>
              <Hot
                active={picked === 'share'}
                wired={Boolean(logic.byEvent('CLICK_SHARE'))}
                onClick={() => setPicked('share')}
              >
                📤
              </Hot>
            </div>
            <button
              type="button"
              onClick={() => setPicked('author')}
              className={[
                'absolute left-3 top-10 flex h-10 w-10 items-center justify-center rounded-full bg-white/15 text-lg',
                picked === 'author' ? 'ring-2 ring-gold' : '',
              ].join(' ')}
            >
              🙂
            </button>
            <button
              type="button"
              onClick={() => setPicked('swipe')}
              className={[
                'absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-8 rounded-full bg-black/40 px-3 py-1 text-xs font-bold',
                picked === 'swipe' ? 'ring-2 ring-gold' : '',
              ].join(' ')}
            >
              👆 свайп
            </button>
          </div>
        </div>
        {picked && (
          <p className="mt-3 text-center text-sm text-gold">
            {picked === 'comment' && `Комменты → ${destinationLabel(logic.states, logic.byEvent('CLICK_COMMENT')?.toStateId)}`}
            {picked === 'share' && `Репост → ${destinationLabel(logic.states, logic.byEvent('CLICK_SHARE')?.toStateId)}`}
            {picked === 'swipe' && `Свайп → ${destinationLabel(logic.states, logic.byEvent('SWIPE')?.toStateId)}`}
            {picked === 'author' && `Автор → ${destinationLabel(logic.states, logic.byEvent('CLICK')?.toStateId)}`}
          </p>
        )}
      </section>
      <ActionList
        stateId="video"
        states={logic.states}
        byEvent={logic.byEvent}
        readOnly={readOnly}
        accent="#ff2d6a"
        onChange={logic.setAction}
        onLock={logic.setLocked}
      />
    </div>
  )
}

function Hot({
  active,
  wired,
  onClick,
  children,
}: {
  active?: boolean
  wired?: boolean
  onClick: () => void
  children: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        'flex h-11 w-11 items-center justify-center rounded-full bg-black/35 text-lg',
        active ? 'ring-2 ring-gold' : '',
        wired ? 'shadow-[0_0_0_2px_#00f0ff]' : '',
      ].join(' ')}
    >
      {children}
    </button>
  )
}
