import { useState } from 'react'
import type { ClientGameState } from '@brainrot/shared'
import { Onboarding } from '../components/Onboarding'
import { IdeasStudio } from './marketing/IdeasStudio'
import { MerchMockup } from './marketing/MerchMockup'
import { MerchStudio } from './marketing/MerchStudio'
import { PosterStudio } from './marketing/PosterStudio'
import { VideosStudio } from './marketing/VideosStudio'

type Props = {
  state: ClientGameState
  onError: (message: string) => void
  readOnly?: boolean
}

const TABS = [
  { id: 'ideas', label: 'Идеи', emoji: '💡', hint: 'стикеры с текстом' },
  { id: 'merch', label: 'Мерч', emoji: '👕', hint: 'реальные макеты' },
  { id: 'videos', label: 'Ролики', emoji: '🎬', hint: 'промо и сценарии' },
  { id: 'posters', label: 'Постеры', emoji: '🎨', hint: 'графический редактор' },
] as const

type TabId = (typeof TABS)[number]['id']

export function MarketingWorkspace({ state, onError, readOnly }: Props) {
  const [tab, setTab] = useState<TabId>('ideas')
  const marketing = state.project.marketing

  return (
    <div className="min-w-0 space-y-4 overflow-x-hidden pb-8">
      <Onboarding id="marketing" steps={MARKETING_STEPS} />
      <section className="rounded-3xl border border-line bg-panel p-3">
        <div className="grid grid-cols-2 gap-2">
          {TABS.map((item) => {
            const count =
              item.id === 'ideas'
                ? marketing.ideas.length
                : item.id === 'merch'
                  ? marketing.merch.length
                  : item.id === 'videos'
                    ? marketing.videos.length
                    : marketing.posters.length
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setTab(item.id)}
                className={[
                  'min-w-0 rounded-2xl px-2.5 py-2.5 text-left transition',
                  tab === item.id ? 'bg-gold text-ink shadow-glow' : 'bg-white/5 text-white/80',
                ].join(' ')}
              >
                <p className="text-lg leading-none">{item.emoji}</p>
                <p className="mt-2 truncate font-display text-lg leading-none">{item.label}</p>
                <p className={['mt-1 truncate text-[11px]', tab === item.id ? 'text-ink/60' : 'text-white/40'].join(' ')}>
                  {count} · {item.hint}
                </p>
              </button>
            )
          })}
        </div>
      </section>

      {tab === 'ideas' && <IdeasStudio state={state} onError={onError} readOnly={readOnly} />}
      {tab === 'merch' && <MerchStudio state={state} onError={onError} readOnly={readOnly} />}
      {tab === 'videos' && <VideosStudio state={state} onError={onError} readOnly={readOnly} />}
      {tab === 'posters' && <PosterStudio state={state} onError={onError} readOnly={readOnly} />}
    </div>
  )
}

export { MerchMockup }
export { PosterView } from './marketing/PosterView'

const MARKETING_STEPS = [
  {
    title: 'Маркетинг — четыре студии',
    body: 'Идеи, мерч, промо-ролики и постеры живут на отдельных вкладках. В каждой можно сделать несколько материалов.',
  },
  {
    title: 'Редакторы богатые специально',
    body: 'Идеи — это стикеры с текстом. Мерч рисуется на футболке, худи, кружке: свой текст, кисть и узоры. Ролик и постер — как раньше.',
  },
]
