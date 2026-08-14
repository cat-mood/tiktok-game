import { ActionList, BugStrip, MissionHints, useScreenLogic, type StudioProps } from './shared'

const COMMENTS = [
  { name: 'кися', text: 'это уже классика' },
  { name: 'негррот', text: 'звук в fav сразу' },
  { name: 'майк', text: 'скинь шаблон плиз' },
]

export function CommentsStudio({ state, onError, readOnly }: StudioProps) {
  const logic = useScreenLogic(state, onError, 'comments')

  return (
    <div className="space-y-4">
      <BugStrip state={state} screenName="Комменты" />
      <MissionHints stateId="comments" />
      <section className="dev-comments overflow-hidden rounded-[2rem] border border-line p-4">
        <p className="text-xs font-bold uppercase tracking-[0.22em] text-white/45">Шторка</p>
        <h2 className="mt-1 font-display text-3xl leading-none">Комменты поверх клипа</h2>
        <p className="mt-2 text-sm text-white/55">
          Это не список «если». Это шторка: её закрывают, в неё пишут, из неё выходят назад.
        </p>
        <div className="relative mt-4 h-[360px] overflow-hidden rounded-[1.6rem] bg-[#1a0c14]">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/80" />
          <div className="absolute inset-x-0 bottom-0 rounded-t-[1.6rem] bg-[#16161f] px-4 pb-4 pt-3">
            <div className="mx-auto mb-3 h-1 w-12 rounded-full bg-white/25" />
            <div className="mb-3 flex items-center justify-between">
              <p className="font-display text-xl">Комментарии</p>
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-sm">✕</span>
            </div>
            <div className="space-y-2">
              {COMMENTS.map((item) => (
                <div key={item.name} className="flex gap-2">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-xs">
                    {item.name.slice(0, 1)}
                  </span>
                  <p className="text-sm">
                    <span className="font-bold">{item.name}</span>
                    <span className="ml-2 text-white/70">{item.text}</span>
                  </p>
                </div>
              ))}
            </div>
            <div className="mt-3 flex items-center gap-2 rounded-full bg-white/8 px-3 py-2">
              <span className="flex-1 text-sm text-white/40">Добавить комментарий...</span>
              <span className="text-cyan">➤</span>
            </div>
          </div>
        </div>
      </section>
      <ActionList
        stateId="comments"
        states={logic.states}
        byEvent={logic.byEvent}
        readOnly={readOnly}
        accent="#ffffff"
        onChange={logic.setAction}
        onLock={logic.setLocked}
      />
    </div>
  )
}
