import { useEffect, useState } from 'react'
import {
  CLIENT_EVENTS,
  VIDEO_PLATFORMS,
  VIDEO_PLATFORM_LABELS,
  createEmptyVideo,
  type ClientGameState,
  type MarketingVideo,
} from '@brainrot/shared'
import { newId, patch } from '../../lib/patch'
import { ChipRow, Field, ItemRail, areaClass, fieldClass, uploadFile } from './shared'

type Props = {
  state: ClientGameState
  onError: (message: string) => void
  readOnly?: boolean
}

export function VideosStudio({ state, onError, readOnly }: Props) {
  const videos = state.project.marketing.videos
  const [selectedId, setSelectedId] = useState<string | null>(videos[0]?.id ?? null)
  const [draft, setDraft] = useState<MarketingVideo | null>(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (selectedId && videos.some((item) => item.id === selectedId)) {
      return
    }
    setSelectedId(videos[0]?.id ?? null)
  }, [videos, selectedId])

  useEffect(() => {
    const next = videos.find((item) => item.id === selectedId)
    if (next) {
      setDraft((current) => (current?.id === next.id ? current : next))
      return
    }
    if (!selectedId) {
      setDraft(null)
    }
  }, [videos, selectedId])

  const send = (event: (typeof CLIENT_EVENTS)[keyof typeof CLIENT_EVENTS], payload: unknown) =>
    void patch(event, payload, onError)

  const save = (video: MarketingVideo) => {
    setDraft(video)
    send(CLIENT_EVENTS.marketingUpsertVideo, { video })
  }

  const create = () => {
    const video = createEmptyVideo(newId())
    setSelectedId(video.id)
    setDraft(video)
    send(CLIENT_EVENTS.marketingUpsertVideo, { video })
  }

  return (
    <div className="space-y-4">
      <section className="rounded-3xl border border-line bg-panel p-4">
        <h2 className="font-display text-2xl">Промо-ролики</h2>
        <p className="mt-1 text-sm text-white/45">
          Несколько роликов: тизер, хук, полный промо. Можно сначала написать сценарий, потом залить файл.
        </p>
        <div className="mt-4">
          <ItemRail
            items={videos}
            selectedId={selectedId}
            onSelect={setSelectedId}
            onCreate={create}
            onDelete={(videoId) => {
              send(CLIENT_EVENTS.marketingDeleteVideo, { videoId })
              if (selectedId === videoId) {
                setSelectedId(null)
                setDraft(null)
              }
            }}
            createLabel="Ролик"
            readOnly={readOnly}
            render={(item) => (
              <div className="relative h-[88px] w-[150px] overflow-hidden bg-ink">
                {item.url ? (
                  <video src={item.url} muted className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full items-center justify-center text-3xl">🎬</div>
                )}
                <p className="absolute inset-x-0 bottom-0 bg-ink/70 px-2 py-1 text-[11px]">
                  {item.title || item.name}
                </p>
              </div>
            )}
          />
        </div>
      </section>

      {draft && (
        <section className="rounded-3xl border border-line bg-panel p-4">
          <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
            <div>
              {draft.url ? (
                <video src={draft.url} controls className="w-full rounded-3xl bg-ink" />
              ) : (
                <div className="flex aspect-[9/16] max-h-[420px] w-full items-center justify-center rounded-3xl border border-dashed border-white/15 bg-ink text-white/40">
                  Файл ещё не загружен
                </div>
              )}
              {!readOnly && (
                <label className="mt-3 block rounded-2xl bg-cyan py-3 text-center font-bold text-ink">
                  {busy ? 'Загрузка…' : draft.url ? 'Заменить файл' : 'UPLOAD VIDEO'}
                  <input
                    type="file"
                    accept="video/*"
                    className="hidden"
                    disabled={busy}
                    onChange={async (event) => {
                      const file = event.target.files?.[0]
                      if (!file) {
                        return
                      }
                      setBusy(true)
                      try {
                        const url = await uploadFile(file)
                        save({
                          ...draft,
                          url,
                          name: file.name,
                          title: draft.title || file.name.replace(/\.[^.]+$/, ''),
                        })
                      } catch (error) {
                        onError(error instanceof Error ? error.message : 'Ошибка загрузки')
                      } finally {
                        setBusy(false)
                      }
                    }}
                  />
                </label>
              )}
            </div>
            <div className="space-y-3">
              <Field label="Название ролика">
                <input
                  value={draft.title ?? ''}
                  disabled={readOnly}
                  onChange={(event) => setDraft({ ...draft, title: event.target.value })}
                  onBlur={() => save(draft)}
                  className={`${fieldClass} font-display text-lg`}
                />
              </Field>
              <Field label="Площадка">
                <ChipRow
                  value={draft.platform ?? 'tiktok'}
                  options={VIDEO_PLATFORMS}
                  labels={VIDEO_PLATFORM_LABELS}
                  disabled={readOnly}
                  onChange={(platform) => save({ ...draft, platform })}
                />
              </Field>
              <Field label="Хук на старте">
                <input
                  value={draft.hook ?? ''}
                  disabled={readOnly}
                  onChange={(event) => setDraft({ ...draft, hook: event.target.value })}
                  onBlur={() => save(draft)}
                  placeholder="Первые 2 секунды"
                  className={fieldClass}
                />
              </Field>
              <Field label="Сценарий / раскадровка">
                <textarea
                  value={draft.script ?? ''}
                  disabled={readOnly}
                  onChange={(event) => setDraft({ ...draft, script: event.target.value })}
                  onBlur={() => save(draft)}
                  placeholder={'0:00 хук\n0:03 продукт\n0:08 CTA'}
                  className={`${areaClass} min-h-[180px] font-mono text-[13px]`}
                />
              </Field>
              <Field label="Заметки продакшена">
                <textarea
                  value={draft.notes ?? ''}
                  disabled={readOnly}
                  onChange={(event) => setDraft({ ...draft, notes: event.target.value })}
                  onBlur={() => save(draft)}
                  placeholder="Музыка, субтитры, кто в кадре"
                  className={areaClass}
                />
              </Field>
            </div>
          </div>
        </section>
      )}
    </div>
  )
}
