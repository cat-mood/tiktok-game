import { ActionList, BugStrip, MissionHints, useScreenLogic, type StudioProps } from './shared'

const CARDS = [
  { title: 'клип 1', tint: 'linear-gradient(180deg, #ff2d6a, #1a1030)', rotate: '-8deg' },
  { title: 'клип 2', tint: 'linear-gradient(180deg, #00f0ff, #12121a)', rotate: '3deg' },
  { title: 'клип 3', tint: 'linear-gradient(180deg, #ffd166, #2a1030)', rotate: '0deg' },
]

export function FeedStudio({ state, onError, readOnly }: StudioProps) {
  const logic = useScreenLogic(state, onError, 'feed')

  return (
    <div className="space-y-4">
      <BugStrip state={state} screenName="Лента" />
      <MissionHints stateId="feed" />
      <section className="dev-feed overflow-hidden rounded-[2rem] border border-line p-4">
        <p className="text-xs font-bold uppercase tracking-[0.22em] text-white/45">Лента</p>
        <h2 className="mt-1 font-display text-3xl leading-none">Стопка роликов</h2>
        <p className="mt-2 text-sm text-white/55">
          Тап открывает клип. Свайп листает стопку — лента одна, поэтому можно остаться на этом экране.
        </p>
        <div className="relative mx-auto mt-6 h-[280px] w-[200px]">
          {CARDS.map((card, index) => (
            <div
              key={card.title}
              className="absolute inset-x-0 top-0 h-[240px] rounded-[1.5rem] shadow-glow"
              style={{
                background: card.tint,
                transform: `translateY(${index * 10}px) rotate(${card.rotate})`,
                zIndex: index,
              }}
            >
              <p className="absolute bottom-4 left-4 font-display text-2xl">{card.title}</p>
              {index === 2 && (
                <p className="absolute left-1/2 top-1/2 -translate-x-1/2 rounded-full bg-black/50 px-3 py-1 text-xs font-bold">
                  👆 свайп вверх
                </p>
              )}
            </div>
          ))}
        </div>
      </section>
      <ActionList
        stateId="feed"
        states={logic.states}
        byEvent={logic.byEvent}
        readOnly={readOnly}
        accent="#ffd166"
        onChange={logic.setAction}
        onLock={logic.setLocked}
      />
    </div>
  )
}
