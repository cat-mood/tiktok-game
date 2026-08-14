import { ActionList, BugStrip, MissionHints, useScreenLogic, type StudioProps } from './shared'

export function ProfileStudio({ state, onError, readOnly }: StudioProps) {
  const logic = useScreenLogic(state, onError, 'profile')

  return (
    <div className="space-y-4">
      <BugStrip state={state} screenName="Профиль" />
      <MissionHints stateId="profile" />
      <section className="dev-profile overflow-hidden rounded-[2rem] border border-line p-4">
        <p className="text-xs font-bold uppercase tracking-[0.22em] text-white/45">Автор</p>
        <h2 className="mt-1 font-display text-3xl leading-none">Страница профиля</h2>
        <p className="mt-2 text-sm text-white/55">
          Подписка остаётся здесь. Тап по превью открывает клип. Назад — к ролику, с которого пришли.
        </p>
        <div className="mt-4 rounded-[1.6rem] bg-[#14121c] p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-[#c084fc] to-[#ff2d6a] text-2xl">
              🙂
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-display text-2xl leading-none">@brainrot</p>
              <p className="mt-1 text-sm text-white/45">12 клипов · 4.2k</p>
            </div>
            <span className="rounded-full bg-mag px-3 py-1 text-xs font-bold">Подписка</span>
          </div>
          <div className="mt-4 grid grid-cols-3 gap-1.5">
            {['#ff2d6a', '#00f0ff', '#ffd166', '#c084fc', '#7cff6b', '#ff8c1a'].map((color) => (
              <div key={color} className="aspect-[9/14] rounded-xl" style={{ background: color }} />
            ))}
          </div>
        </div>
      </section>
      <ActionList
        stateId="profile"
        states={logic.states}
        byEvent={logic.byEvent}
        readOnly={readOnly}
        accent="#c084fc"
        onChange={logic.setAction}
        onLock={logic.setLocked}
      />
    </div>
  )
}
