import { ActionList, BugStrip, MissionHints, useScreenLogic, type StudioProps } from './shared'

const CHATS = [
  { name: 'кися', preview: 'скинь этот клип', time: 'сейчас', color: '#ff2d6a' },
  { name: 'тим', preview: 'го в коллаб', time: '2м', color: '#00f0ff' },
  { name: 'класс 7б', preview: 'звук в избранное', time: 'вчера', color: '#ffd166' },
]

export function InboxStudio({ state, onError, readOnly }: StudioProps) {
  const logic = useScreenLogic(state, onError, 'inbox')

  return (
    <div className="space-y-4">
      <BugStrip state={state} screenName="Чаты" />
      <MissionHints stateId="inbox" />
      <section className="dev-inbox overflow-hidden rounded-[2rem] border border-line p-4">
        <p className="text-xs font-bold uppercase tracking-[0.22em] text-white/45">Входящие</p>
        <h2 className="mt-1 font-display text-3xl leading-none">Список чатов</h2>
        <p className="mt-2 text-sm text-white/55">
          Как мессенджер: строка — это человек. Тап открывает переписку. Поиск никуда не уводит.
        </p>
        <div className="mt-4 overflow-hidden rounded-[1.4rem] bg-[#12161a]">
          <div className="m-3 rounded-full bg-white/8 px-4 py-2 text-sm text-white/40">🔍 поиск</div>
          {CHATS.map((chat) => (
            <div key={chat.name} className="flex items-center gap-3 border-t border-white/6 px-4 py-3">
              <span
                className="flex h-11 w-11 items-center justify-center rounded-full text-sm font-bold text-ink"
                style={{ background: chat.color }}
              >
                {chat.name.slice(0, 1)}
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex justify-between text-sm">
                  <span className="font-bold">{chat.name}</span>
                  <span className="text-white/35">{chat.time}</span>
                </span>
                <span className="mt-0.5 block truncate text-sm text-white/50">{chat.preview}</span>
              </span>
            </div>
          ))}
        </div>
      </section>
      <ActionList
        stateId="inbox"
        states={logic.states}
        byEvent={logic.byEvent}
        readOnly={readOnly}
        accent="#7cff6b"
        onChange={logic.setAction}
        onLock={logic.setLocked}
      />
    </div>
  )
}
