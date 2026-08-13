import { useState } from 'react'
import {
  CLIENT_EVENTS,
  MERCH_KINDS,
  MERCH_LABELS,
  POSTER_BACKGROUNDS,
  type ClientGameState,
  type MerchKind,
  type Poster,
} from '@brainrot/shared'
import { Onboarding } from '../components/Onboarding'
import { newId, patch } from '../lib/patch'

type Props = {
  state: ClientGameState
  onError: (message: string) => void
  readOnly?: boolean
}

export function MarketingWorkspace({ state, onError, readOnly }: Props) {
  const marketing = state.project.marketing
  const [slogan, setSlogan] = useState(marketing.slogan)
  const [idea, setIdea] = useState('')
  const [poster, setPoster] = useState<Poster>(
    marketing.posters[0] ?? {
      id: newId(),
      background: POSTER_BACKGROUNDS[0],
      layers: [{ id: newId(), kind: 'text', text: 'SHORTS', x: 24, y: 80, fontSize: 42, color: '#fff' }],
    },
  )
  const [merchKind, setMerchKind] = useState<MerchKind>('tshirt')
  const [merchText, setMerchText] = useState('SHORTS')
  const [merchColor, setMerchColor] = useState('#ff2d6a')

  const send = (event: (typeof CLIENT_EVENTS)[keyof typeof CLIENT_EVENTS], payload: unknown) =>
    void patch(event, payload, onError)

  const upload = async (file: File) => {
    const response = await fetch('/uploads', {
      method: 'POST',
      headers: {
        'Content-Type': file.type || 'application/octet-stream',
        'x-filename': file.name,
      },
      body: file,
    })
    if (!response.ok) {
      onError('Не удалось загрузить файл')
      return null
    }
    const data = (await response.json()) as { url: string }
    return data.url
  }

  return (
    <div className="space-y-5 pb-8">
      <Onboarding id="marketing" steps={MARKETING_STEPS} />
      <section className="rounded-3xl border border-line bg-panel p-4">
        <h2 className="font-display text-2xl">Слоган</h2>
        <input
          value={slogan}
          disabled={readOnly}
          onChange={(event) => setSlogan(event.target.value)}
          onBlur={() => send(CLIENT_EVENTS.marketingSetSlogan, { slogan })}
          placeholder="SHORTS — смотри. Снимай. Делись."
          className="mt-3 w-full rounded-2xl border border-line bg-ink px-3 py-3"
        />
        {marketing.slogan && <p className="mt-3 text-lg text-gold">{marketing.slogan}</p>}
      </section>

      <section className="rounded-3xl border border-line bg-panel p-4">
        <h2 className="font-display text-2xl">Рекламный ролик</h2>
        {!readOnly && (
          <label className="mt-3 block rounded-2xl bg-white/10 py-4 text-center font-bold">
            UPLOAD VIDEO
            <input
              type="file"
              accept="video/*"
              className="hidden"
              onChange={async (event) => {
                const file = event.target.files?.[0]
                if (!file) {
                  return
                }
                const url = await upload(file)
                if (!url) {
                  return
                }
                send(CLIENT_EVENTS.marketingUpsertVideo, {
                  video: { id: newId(), url, name: file.name },
                })
              }}
            />
          </label>
        )}
        {marketing.videos.map((video) => (
          <div key={video.id} className="mt-3">
            <video src={video.url} controls className="w-full rounded-2xl" />
            <p className="mt-1 text-sm text-white/50">{video.name}</p>
            {!readOnly && (
              <button
                type="button"
                onClick={() => send(CLIENT_EVENTS.marketingDeleteVideo, { videoId: video.id })}
                className="text-sm text-mag"
              >
                Удалить
              </button>
            )}
          </div>
        ))}
      </section>

      <section className="rounded-3xl border border-line bg-panel p-4">
        <h2 className="font-display text-2xl">Постер</h2>
        <div className="mt-3 flex gap-2 overflow-x-auto">
          {POSTER_BACKGROUNDS.map((background) => (
            <button
              key={background}
              type="button"
              disabled={readOnly}
              onClick={() => setPoster({ ...poster, background })}
              className="h-10 w-10 shrink-0 rounded-full border border-white/20"
              style={{ background }}
            />
          ))}
        </div>
        <div
          className="relative mt-3 overflow-hidden rounded-3xl"
          style={{ height: 220, background: poster.background }}
        >
          {poster.layers.map((layer) => (
            <div
              key={layer.id}
              className="absolute font-display"
              style={{ left: layer.x, top: layer.y, fontSize: layer.fontSize, color: layer.color }}
            >
              {layer.text}
            </div>
          ))}
        </div>
        {!readOnly && (
          <>
            <input
              value={poster.layers[0]?.text ?? ''}
              onChange={(event) =>
                setPoster({
                  ...poster,
                  layers: poster.layers.map((layer, index) =>
                    index === 0 ? { ...layer, text: event.target.value } : layer,
                  ),
                })
              }
              className="mt-3 w-full rounded-2xl border border-line bg-ink px-3 py-3"
              placeholder="Текст постера"
            />
            <button
              type="button"
              onClick={() => send(CLIENT_EVENTS.marketingUpsertPoster, { poster })}
              className="mt-3 w-full rounded-2xl bg-cyan py-3 font-bold text-ink"
            >
              Сохранить постер
            </button>
          </>
        )}
        {marketing.posters.map((item) => (
          <p key={item.id} className="mt-2 text-sm text-white/50">
            Постер сохранён · {item.layers[0]?.text}
          </p>
        ))}
      </section>

      <section className="rounded-3xl border border-line bg-panel p-4">
        <h2 className="font-display text-2xl">Идеи продвижения</h2>
        {marketing.ideas.map((item) => (
          <div key={item.id} className="mt-3 rounded-2xl bg-white/5 p-3">
            {item.text}
            {!readOnly && (
              <button
                type="button"
                onClick={() => send(CLIENT_EVENTS.marketingDeleteIdea, { ideaId: item.id })}
                className="ml-3 text-sm text-mag"
              >
                ×
              </button>
            )}
          </div>
        ))}
        {!readOnly && (
          <div className="mt-3 flex gap-2">
            <input
              value={idea}
              onChange={(event) => setIdea(event.target.value)}
              placeholder="Идея"
              className="flex-1 rounded-2xl border border-line bg-ink px-3 py-3"
            />
            <button
              type="button"
              onClick={() => {
                if (!idea.trim()) {
                  return
                }
                send(CLIENT_EVENTS.marketingUpsertIdea, { idea: { id: newId(), text: idea.trim() } })
                setIdea('')
              }}
              className="rounded-2xl bg-white/10 px-4 font-bold"
            >
              +
            </button>
          </div>
        )}
      </section>

      <section className="rounded-3xl border border-line bg-panel p-4">
        <h2 className="font-display text-2xl">Мерч</h2>
        <div className="mt-3 grid grid-cols-2 gap-2">
          {MERCH_KINDS.map((kind) => (
            <button
              key={kind}
              type="button"
              onClick={() => setMerchKind(kind)}
              className={[
                'rounded-2xl py-3 text-sm font-bold',
                merchKind === kind ? 'bg-gold text-ink' : 'bg-white/10',
              ].join(' ')}
            >
              {MERCH_LABELS[kind]}
            </button>
          ))}
        </div>
        <MerchMockup kind={merchKind} text={merchText} color={merchColor} />
        {!readOnly && (
          <>
            <input
              value={merchText}
              onChange={(event) => setMerchText(event.target.value)}
              className="mt-3 w-full rounded-2xl border border-line bg-ink px-3 py-3"
            />
            <input
              type="color"
              value={merchColor}
              onChange={(event) => setMerchColor(event.target.value)}
              className="mt-3 h-12 w-full rounded-2xl bg-ink"
            />
            <button
              type="button"
              onClick={() =>
                send(CLIENT_EVENTS.marketingUpsertMerch, {
                  merch: { id: newId(), kind: merchKind, text: merchText, color: merchColor },
                })
              }
              className="mt-3 w-full rounded-2xl bg-cyan py-3 font-bold text-ink"
            >
              Сохранить мерч
            </button>
          </>
        )}
        {marketing.merch.map((item) => (
          <div key={item.id} className="mt-3">
            <MerchMockup kind={item.kind} text={item.text} color={item.color} />
          </div>
        ))}
      </section>
    </div>
  )
}

export function MerchMockup({
  kind,
  text,
  color,
}: {
  kind: MerchKind
  text: string
  color: string
}) {
  return (
    <div className="mt-3 flex h-36 items-center justify-center rounded-3xl bg-white/5">
      <div
        className={[
          'flex items-center justify-center text-center font-display text-lg font-bold',
          kind === 'tshirt' ? 'h-28 w-24 rounded-t-[2rem] rounded-b-lg' : '',
          kind === 'sticker' ? 'h-24 w-24 rounded-full' : '',
          kind === 'cap' ? 'h-16 w-28 rounded-t-full' : '',
          kind === 'mug' ? 'h-20 w-16 rounded-2xl' : '',
        ].join(' ')}
        style={{ background: color, color: '#07070c' }}
      >
        {text}
      </div>
    </div>
  )
}

const MARKETING_STEPS = [
  {
    title: 'Вы готовите запуск SHORTS',
    body: 'Придумайте слоган, загрузите ролик, соберите постер и мерч. Это не оценивается автоматически — материалы покажут на финальном экране.',
  },
  {
    title: 'Ролик можно снять в CapCut',
    body: 'Здесь достаточно загрузить готовый файл. Постер собирается из фона и текста. Идеи продвижения — карточками.',
  },
]
