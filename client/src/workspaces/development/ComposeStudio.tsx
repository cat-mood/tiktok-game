import { ActionList, BugStrip, MissionHints, useScreenLogic, type StudioProps } from './shared'

const BUBBLES = [
  { me: false, text: 'видел новый клип?' },
  { me: true, text: 'да, звук огонь' },
  { me: false, text: 'скинь ссылку' },
]

export function ComposeStudio({ state, onError, readOnly }: StudioProps) {
  const logic = useScreenLogic(state, onError, 'compose')

  return (
    <div className="space-y-4">
      <BugStrip state={state} screenName="Сообщение" />
      <MissionHints stateId="compose" />
      <section className="dev-compose overflow-hidden rounded-[2rem] border border-line p-4">
        <p className="text-xs font-bold uppercase tracking-[0.22em] text-white/45">Переписка</p>
        <h2 className="mt-1 font-display text-3xl leading-none">Пузыри сообщений</h2>
        <p className="mt-2 text-sm text-white/55">
          Отправить — остаёмся в чате, появляется пузырь. Стрелка возвращает к списку.
        </p>
        <div className="mt-4 overflow-hidden rounded-[1.4rem] bg-[#0e1418]">
          <div className="flex items-center gap-2 border-b border-white/8 px-3 py-3">
            <span className="text-lg">←</span>
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#ff2d6a] text-xs font-bold text-ink">
              к
            </span>
            <span className="font-bold">кися</span>
          </div>
          <div className="space-y-2 px-3 py-4">
            {BUBBLES.map((item) => (
              <div
                key={item.text}
                className={[
                  'max-w-[80%] rounded-2xl px-3 py-2 text-sm',
                  item.me ? 'ml-auto bg-cyan text-ink' : 'bg-white/10',
                ].join(' ')}
              >
                {item.text}
              </div>
            ))}
          </div>
          <div className="flex items-center gap-2 border-t border-white/8 px-3 py-3">
            <span className="flex-1 rounded-full bg-white/8 px-3 py-2 text-sm text-white/40">сообщение</span>
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-cyan text-ink">➤</span>
          </div>
        </div>
      </section>
      <ActionList
        stateId="compose"
        states={logic.states}
        byEvent={logic.byEvent}
        readOnly={readOnly}
        accent="#00f0ff"
        onChange={logic.setAction}
        onLock={logic.setLocked}
      />
    </div>
  )
}
