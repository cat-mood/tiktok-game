import { CLIENT_EVENTS, SCREEN_LOGIC } from '@brainrot/shared'
import { patch } from '../../lib/patch'
import { BugStrip, type StudioProps } from './shared'

export function StartStudio({ state, onError, readOnly }: StudioProps) {
  const initial = state.project.logic.initialStateId
  const send = (stateId: string) => void patch(CLIENT_EVENTS.logicSetInitialState, { stateId }, onError)

  return (
    <div className="space-y-4">
      <BugStrip state={state} />
      <section className="dev-start overflow-hidden rounded-[2rem] border border-line p-4">
        <p className="text-xs font-bold uppercase tracking-[0.22em] text-white/45">Когда открыли приложение</p>
        <h2 className="mt-2 font-display text-3xl leading-none">Что человек видит первым?</h2>
        <p className="mt-2 text-sm text-white/55">
          Не «стейт» и не код. Просто стартовая картинка: клип, лента, профиль — что угодно.
        </p>
        <div className="mt-4 grid grid-cols-2 gap-2">
          {state.project.states.map((item) => {
            const meta = SCREEN_LOGIC[item.id]
            const active = item.id === initial
            return (
              <button
                key={item.id}
                type="button"
                disabled={readOnly}
                onClick={() => send(item.id)}
                className={[
                  'rounded-3xl p-3 text-left transition',
                  active ? 'bg-gold text-ink shadow-glow' : 'bg-black/25 text-white',
                ].join(' ')}
              >
                <p className="text-2xl leading-none">{meta?.emoji ?? '📱'}</p>
                <p className="mt-2 font-display text-xl leading-none">{item.name}</p>
                <p className={['mt-1 text-[11px]', active ? 'text-ink/60' : 'text-white/45'].join(' ')}>
                  {meta?.tagline}
                </p>
              </button>
            )
          })}
        </div>
      </section>
    </div>
  )
}
