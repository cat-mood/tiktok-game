import { useState } from 'react'
import { PRESET_STATES, SCREEN_LABELS, SCREEN_LOGIC, screenActions, type ClientGameState } from '@brainrot/shared'
import { Onboarding } from '../components/Onboarding'
import { ClipStudio } from './development/ClipStudio'
import { CommentsStudio } from './development/CommentsStudio'
import { ComposeStudio } from './development/ComposeStudio'
import { CreateStudio } from './development/CreateStudio'
import { FeedStudio } from './development/FeedStudio'
import { InboxStudio } from './development/InboxStudio'
import { ProfileStudio } from './development/ProfileStudio'
import { ShareStudio } from './development/ShareStudio'
import { StartStudio } from './development/StartStudio'

type Props = {
  state: ClientGameState
  onError: (message: string) => void
  readOnly?: boolean
}

const TABS = [
  { id: 'start', label: 'Старт', emoji: '🚀', hint: 'с чего начинается' },
  ...PRESET_STATES.map((item) => ({
    id: item.id,
    label: SCREEN_LABELS[item.screenKey],
    emoji: SCREEN_LOGIC[item.id]?.emoji ?? '📱',
    hint: SCREEN_LOGIC[item.id]?.tagline ?? item.hint,
  })),
] as const

type TabId = (typeof TABS)[number]['id']

export function DevelopmentWorkspace({ state, onError, readOnly }: Props) {
  const [tab, setTab] = useState<TabId>('start')
  const project = state.project

  return (
    <div className="min-w-0 space-y-4 overflow-x-hidden pb-8">
      <Onboarding id="development-screens" steps={DEV_STEPS} />
      <section className="rounded-3xl border border-line bg-panel p-3">
        <div className="grid grid-cols-3 gap-2">
          {TABS.map((item) => {
            const actions = screenActions(item.id).filter((action) => action.kind !== 'toggle')
            const count =
              item.id === 'start'
                ? project.logic.initialStateId
                  ? 1
                  : 0
                : project.logic.transitions.filter(
                    (script) =>
                      script.fromStateId === item.id && actions.some((action) => action.event === script.event),
                  ).length
            const total = item.id === 'start' ? 1 : actions.length
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setTab(item.id)}
                className={[
                  'min-w-0 rounded-2xl px-2 py-2.5 text-left transition',
                  tab === item.id ? 'bg-gold text-ink shadow-glow' : 'bg-white/5 text-white/80',
                ].join(' ')}
              >
                <p className="text-lg leading-none">{item.emoji}</p>
                <p className="mt-2 truncate font-display text-base leading-none">{item.label}</p>
                <p className={['mt-1 truncate text-[11px]', tab === item.id ? 'text-ink/60' : 'text-white/40'].join(' ')}>
                  {count}/{total} · {item.hint}
                </p>
              </button>
            )
          })}
        </div>
      </section>

      {tab === 'start' && <StartStudio state={state} onError={onError} readOnly={readOnly} />}
      {tab === 'video' && <ClipStudio state={state} onError={onError} readOnly={readOnly} />}
      {tab === 'comments' && <CommentsStudio state={state} onError={onError} readOnly={readOnly} />}
      {tab === 'share' && <ShareStudio state={state} onError={onError} readOnly={readOnly} />}
      {tab === 'feed' && <FeedStudio state={state} onError={onError} readOnly={readOnly} />}
      {tab === 'profile' && <ProfileStudio state={state} onError={onError} readOnly={readOnly} />}
      {tab === 'create' && <CreateStudio state={state} onError={onError} readOnly={readOnly} />}
      {tab === 'inbox' && <InboxStudio state={state} onError={onError} readOnly={readOnly} />}
      {tab === 'compose' && <ComposeStudio state={state} onError={onError} readOnly={readOnly} />}
    </div>
  )
}

const DEV_STEPS = [
  {
    title: 'Каждый экран — своя игрушка',
    body: 'Клип, комменты, чаты — это не «стейты». Это разные экраны. Зайди в каждый и реши, что делают кнопки.',
  },
  {
    title: 'Не if-then, а куда ведёт жест',
    body: 'Тап, свайп, крестик, отправить — выбираешь, какой экран открыть. Или остаться здесь, если это лайк или сообщение.',
  },
  {
    title: 'Старт — что видят первым',
    body: 'На вкладке «Старт» выбираешь картинку, с которой открывается приложение. QA потом проверит главные жесты.',
  },
]
