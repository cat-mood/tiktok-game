import { useState } from 'react'
import { ActionList, BugStrip, MissionHints, useScreenLogic, type StudioProps } from './shared'

const APPS = [
  { id: 'chats', emoji: '💬', label: 'Чаты', event: 'CLICK' as const },
  { id: 'copy', emoji: '🔗', label: 'Ссылка', event: 'CLICK_SHARE' as const },
  { id: 'close', emoji: '✕', label: 'Закрыть', event: 'CLOSE' as const },
]

export function ShareStudio({ state, onError, readOnly }: StudioProps) {
  const logic = useScreenLogic(state, onError, 'share')
  const [copied, setCopied] = useState(false)

  return (
    <div className="space-y-4">
      <BugStrip state={state} screenName="Репост" />
      <MissionHints stateId="share" />
      <section className="dev-share overflow-hidden rounded-[2rem] border border-line p-4">
        <p className="text-xs font-bold uppercase tracking-[0.22em] text-white/45">Шаринг</p>
        <h2 className="mt-1 font-display text-3xl leading-none">Куда улетает ролик</h2>
        <p className="mt-2 text-sm text-white/55">
          Как в телефоне: иконки приложений, а не развилка «если то». Ссылку можно просто копировать.
        </p>
        <div className="mt-4 rounded-[1.6rem] bg-[#12121a] p-4">
          <div className="flex items-center gap-3 rounded-2xl bg-white/5 p-3">
            <div className="h-14 w-10 rounded-lg bg-gradient-to-b from-mag to-ink" />
            <div>
              <p className="font-bold">Клип недели</p>
              <p className="text-xs text-white/45">брейнрот клипы</p>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-3 gap-3">
            {APPS.map((item) => {
              const wired = Boolean(logic.byEvent(item.event))
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    if (item.id === 'copy') {
                      setCopied(true)
                      window.setTimeout(() => setCopied(false), 900)
                    }
                  }}
                  className={[
                    'flex flex-col items-center rounded-2xl bg-white/5 py-3',
                    wired ? 'ring-2 ring-cyan' : '',
                  ].join(' ')}
                >
                  <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-2xl">
                    {item.emoji}
                  </span>
                  <span className="mt-2 text-xs font-bold">{item.label}</span>
                </button>
              )
            })}
          </div>
          {copied && <p className="mt-3 text-center text-sm font-bold text-gold">Ссылка скопирована</p>}
        </div>
      </section>
      <ActionList
        stateId="share"
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
