import { useEffect, useRef, useState, type PointerEvent } from 'react'
import {
  CLIENT_EVENTS,
  PRODUCT_NAME,
  POSTER_BACKGROUNDS,
  POSTER_HEIGHT,
  POSTER_STICKERS,
  POSTER_WIDTH,
  createEmptyPoster,
  type ClientGameState,
  type Poster,
  type PosterLayer,
  type PosterShape,
} from '@brainrot/shared'
import { newId, patch } from '../../lib/patch'
import { PosterLayerView, PosterView, hitLayer, layerBox } from './PosterView'
import { ColorField, Field, ItemRail, fieldClass, uploadFile } from './shared'

type Tool = 'select' | 'text' | 'image' | 'brush' | 'rect' | 'circle' | 'star' | 'banner' | 'sticker' | 'erase'

type Props = {
  state: ClientGameState
  onError: (message: string) => void
  readOnly?: boolean
}

const TOOLS: Array<{ id: Tool; label: string }> = [
  { id: 'select', label: 'Выбор' },
  { id: 'text', label: 'Текст' },
  { id: 'image', label: 'Фото' },
  { id: 'brush', label: 'Кисть' },
  { id: 'rect', label: 'Прямоуг.' },
  { id: 'circle', label: 'Круг' },
  { id: 'star', label: 'Звезда' },
  { id: 'banner', label: 'Баннер' },
  { id: 'sticker', label: 'Стикер' },
  { id: 'erase', label: 'Ластик' },
]

export function PosterStudio({ state, onError, readOnly }: Props) {
  const posters = state.project.marketing.posters
  const [selectedId, setSelectedId] = useState<string | null>(posters[0]?.id ?? null)
  const [draft, setDraft] = useState<Poster | null>(null)
  const [tool, setTool] = useState<Tool>('select')
  const [layerId, setLayerId] = useState<string | null>(null)
  const [color, setColor] = useState('#ffffff')
  const [brush, setBrush] = useState(8)
  const [sticker, setSticker] = useState(POSTER_STICKERS[0])
  const [livePath, setLivePath] = useState<string | null>(null)
  const frameRef = useRef<HTMLDivElement>(null)
  const frameWrapRef = useRef<HTMLDivElement>(null)
  const [frameW, setFrameW] = useState(300)
  const drag = useRef<{ id: string; dx: number; dy: number } | null>(null)
  const drawing = useRef<string | null>(null)
  const imageInput = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (selectedId && posters.some((item) => item.id === selectedId)) {
      return
    }
    setSelectedId(posters[0]?.id ?? null)
  }, [posters, selectedId])

  useEffect(() => {
    const next = posters.find((item) => item.id === selectedId)
    if (next) {
      setDraft((current) => (current?.id === next.id ? current : next))
      return
    }
    if (!selectedId) {
      setDraft(null)
      setLayerId(null)
    }
  }, [posters, selectedId])

  useEffect(() => {
    const next = posters.find((item) => item.id === selectedId)
    if (next) {
      setLayerId(next.layers[0]?.id ?? null)
    }
  }, [selectedId])

  const send = (event: (typeof CLIENT_EVENTS)[keyof typeof CLIENT_EVENTS], payload: unknown) =>
    void patch(event, payload, onError)

  const save = (poster: Poster) => {
    setDraft(poster)
    send(CLIENT_EVENTS.marketingUpsertPoster, { poster })
  }

  const create = () => {
    const poster = createEmptyPoster(newId())
    setSelectedId(poster.id)
    setDraft(poster)
    setLayerId(poster.layers[0]?.id ?? null)
    send(CLIENT_EVENTS.marketingUpsertPoster, { poster })
  }

  useEffect(() => {
    const node = frameWrapRef.current
    if (!node) {
      return
    }
    const sync = () => setFrameW(node.clientWidth)
    sync()
    const observer = new ResizeObserver(sync)
    observer.observe(node)
    return () => observer.disconnect()
  }, [draft?.id])

  const selected = draft?.layers.find((layer) => layer.id === layerId) ?? null
  const scale = Math.min(1, Math.max(0.4, frameW / POSTER_WIDTH))

  const point = (event: PointerEvent<HTMLDivElement>) => {
    const rect = frameRef.current?.getBoundingClientRect()
    if (!rect) {
      return { x: 0, y: 0 }
    }
    return {
      x: Math.round((event.clientX - rect.left) / scale),
      y: Math.round((event.clientY - rect.top) / scale),
    }
  }

  const addLayer = (layer: PosterLayer) => {
    if (!draft || readOnly) {
      return
    }
    setLayerId(layer.id)
    save({ ...draft, layers: [...draft.layers, layer] })
  }

  const updateLayer = (next: PosterLayer) => {
    if (!draft) {
      return
    }
    save({
      ...draft,
      layers: draft.layers.map((layer) => (layer.id === next.id ? next : layer)),
    })
  }

  const removeLayer = (id: string) => {
    if (!draft) {
      return
    }
    const layers = draft.layers.filter((layer) => layer.id !== id)
    setLayerId(layers.at(-1)?.id ?? null)
    save({ ...draft, layers })
  }

  const moveLayer = (id: string, dir: 1 | -1) => {
    if (!draft) {
      return
    }
    const index = draft.layers.findIndex((layer) => layer.id === id)
    const next = index + dir
    if (index < 0 || next < 0 || next >= draft.layers.length) {
      return
    }
    const layers = [...draft.layers]
    const [item] = layers.splice(index, 1)
    layers.splice(next, 0, item)
    save({ ...draft, layers })
  }

  const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (!draft || readOnly) {
      return
    }
    const { x, y } = point(event)
    event.currentTarget.setPointerCapture(event.pointerId)

    if (tool === 'brush') {
      drawing.current = `M ${x} ${y}`
      setLivePath(drawing.current)
      return
    }

    if (tool === 'text') {
      addLayer({
        id: newId(),
        kind: 'text',
        text: PRODUCT_NAME,
        x,
        y,
        fontSize: 42,
        color,
      })
      setTool('select')
      return
    }

    if (tool === 'image') {
      imageInput.current?.click()
      return
    }

    if (tool === 'sticker') {
      addLayer({
        id: newId(),
        kind: 'sticker',
        text: sticker,
        x,
        y,
        fontSize: 56,
      })
      return
    }

    if (tool === 'rect' || tool === 'circle' || tool === 'star' || tool === 'banner') {
      addLayer({
        id: newId(),
        kind: 'shape',
        shape: tool as PosterShape,
        x,
        y,
        w: tool === 'banner' ? 200 : 120,
        h: tool === 'circle' ? 120 : 72,
        fill: color,
        color,
      })
      setTool('select')
      return
    }

    const hit = hitLayer(draft.layers, x, y)
    if (tool === 'erase') {
      if (hit) {
        removeLayer(hit.id)
      }
      return
    }

    if (hit) {
      setLayerId(hit.id)
      drag.current = { id: hit.id, dx: x - hit.x, dy: y - hit.y }
    } else {
      setLayerId(null)
    }
  }

  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (!draft) {
      return
    }
    const { x, y } = point(event)
    if (drawing.current) {
      drawing.current += ` L ${x} ${y}`
      setLivePath(drawing.current)
      return
    }
    if (!drag.current) {
      return
    }
    const layer = draft.layers.find((item) => item.id === drag.current?.id)
    if (!layer) {
      return
    }
    const next = { ...layer, x: x - drag.current.dx, y: y - drag.current.dy }
    setDraft({
      ...draft,
      layers: draft.layers.map((item) => (item.id === next.id ? next : item)),
    })
  }

  const onPointerUp = () => {
    if (drawing.current && draft) {
      addLayer({
        id: newId(),
        kind: 'draw',
        path: drawing.current,
        color,
        strokeWidth: brush,
        x: 0,
        y: 0,
      })
    } else if (drag.current && draft) {
      save(draft)
    }
    drawing.current = null
    drag.current = null
    setLivePath(null)
  }

  return (
    <div className="min-w-0 space-y-4 overflow-x-hidden">
      <section className="min-w-0 overflow-hidden rounded-3xl border border-line bg-panel p-4">
        <h2 className="font-display text-2xl">Постеры</h2>
        <p className="mt-1 text-sm text-white/45">
          Несколько макетов. Текст, фигуры, стикеры, фото и кисть — как в простом графическом редакторе.
        </p>
        <div className="mt-4">
          <ItemRail
            items={posters}
            selectedId={selectedId}
            onSelect={setSelectedId}
            onCreate={create}
            onDelete={(posterId) => {
              send(CLIENT_EVENTS.marketingDeletePoster, { posterId })
              if (selectedId === posterId) {
                setSelectedId(null)
                setDraft(null)
              }
            }}
            createLabel="Постер"
            readOnly={readOnly}
            render={(item) => (
              <div className="bg-ink p-1">
                <PosterView poster={item} scale={88 / POSTER_HEIGHT} className="rounded-xl" />
                <p className="max-w-[72px] truncate px-1 py-1 text-center text-[11px] text-white/55">
                  {item.title || 'Постер'}
                </p>
              </div>
            )}
          />
        </div>
      </section>

      {draft && (
        <section className="min-w-0 overflow-hidden rounded-3xl border border-line bg-panel p-4">
          <Field label="Название макета">
            <input
              value={draft.title ?? ''}
              disabled={readOnly}
              onChange={(event) => setDraft({ ...draft, title: event.target.value })}
              onBlur={() => save(draft)}
              className={`${fieldClass} font-display text-lg`}
            />
          </Field>

          <div className="mt-4 grid grid-cols-3 gap-2">
            {TOOLS.map((item) => (
              <button
                key={item.id}
                type="button"
                disabled={readOnly}
                onClick={() => {
                  setTool(item.id)
                  if (item.id === 'image') {
                    imageInput.current?.click()
                  }
                }}
                className={[
                  'min-w-0 truncate rounded-2xl px-2 py-2 text-[11px] font-bold uppercase',
                  tool === item.id ? 'bg-cyan text-ink' : 'bg-white/10',
                ].join(' ')}
              >
                {item.label}
              </button>
            ))}
          </div>

          <div className="mt-3 grid grid-cols-6 gap-2">
            {POSTER_BACKGROUNDS.map((background) => (
              <button
                key={background}
                type="button"
                disabled={readOnly}
                onClick={() => save({ ...draft, background })}
                className={[
                  'aspect-square w-full rounded-full border',
                  draft.background === background ? 'border-white' : 'border-white/20',
                ].join(' ')}
                style={{ background }}
              />
            ))}
          </div>

          {tool === 'sticker' && (
            <div className="mt-3 grid grid-cols-6 gap-2">
              {POSTER_STICKERS.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setSticker(item)}
                  className={[
                    'aspect-square w-full rounded-2xl text-xl',
                    sticker === item ? 'bg-gold' : 'bg-white/10',
                  ].join(' ')}
                >
                  {item}
                </button>
              ))}
            </div>
          )}

          <div className="mt-4 grid min-w-0 gap-4">
            <div ref={frameWrapRef} className="min-w-0 w-full">
            <div
              ref={frameRef}
              className="poster-canvas relative mx-auto overflow-hidden rounded-[1.6rem] border border-white/10"
              style={{ width: POSTER_WIDTH * scale, height: POSTER_HEIGHT * scale, background: draft.background }}
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
              onPointerCancel={onPointerUp}
            >
              <div
                className="absolute left-0 top-0 origin-top-left"
                style={{ width: POSTER_WIDTH, height: POSTER_HEIGHT, transform: `scale(${scale})` }}
              >
                {draft.layers.map((layer) => (
                  <PosterLayerView key={layer.id} layer={layer} selected={layer.id === layerId} />
                ))}
                {livePath && (
                  <svg className="pointer-events-none absolute inset-0 h-full w-full" viewBox={`0 0 ${POSTER_WIDTH} ${POSTER_HEIGHT}`}>
                    <path
                      d={livePath}
                      fill="none"
                      stroke={color}
                      strokeWidth={brush}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                )}
              </div>
            </div>
            </div>

            <div className="min-w-0 space-y-3">
              <Field label="Цвет инструмента">
                <ColorField value={color} disabled={readOnly} onChange={setColor} />
              </Field>
              {tool === 'brush' && (
                <Field label="Толщина кисти">
                  <input
                    type="range"
                    min={2}
                    max={28}
                    value={brush}
                    disabled={readOnly}
                    onChange={(event) => setBrush(Number(event.target.value))}
                    className="w-full accent-cyan"
                  />
                </Field>
              )}
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-white/40">Слои</p>
                <div className="mt-2 space-y-2">
                  {[...draft.layers].reverse().map((layer) => (
                    <button
                      key={layer.id}
                      type="button"
                      onClick={() => {
                        setLayerId(layer.id)
                        setTool('select')
                      }}
                      className={[
                        'flex w-full min-w-0 items-center justify-between gap-2 rounded-2xl px-3 py-2 text-left text-sm',
                        layer.id === layerId ? 'bg-cyan/20 text-cyan' : 'bg-white/5',
                      ].join(' ')}
                    >
                      <span className="min-w-0 truncate">{layerLabel(layer)}</span>
                      {!readOnly && (
                        <span className="flex shrink-0 gap-2 text-white/50">
                          <span
                            onClick={(event) => {
                              event.stopPropagation()
                              moveLayer(layer.id, 1)
                            }}
                          >
                            ↑
                          </span>
                          <span
                            onClick={(event) => {
                              event.stopPropagation()
                              moveLayer(layer.id, -1)
                            }}
                          >
                            ↓
                          </span>
                          <span
                            className="text-mag"
                            onClick={(event) => {
                              event.stopPropagation()
                              removeLayer(layer.id)
                            }}
                          >
                            ×
                          </span>
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {selected && selected.kind !== 'draw' && (
                <div className="space-y-3 rounded-2xl border border-white/10 p-3">
                  <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-white/40">Свойства слоя</p>
                  {(selected.kind === 'text' || selected.kind === 'sticker') && (
                    <Field label="Текст">
                      <input
                        value={selected.text ?? ''}
                        disabled={readOnly}
                        onChange={(event) => updateLayer({ ...selected, text: event.target.value })}
                        className={fieldClass}
                      />
                    </Field>
                  )}
                  {selected.kind === 'text' && (
                    <Field label="Кегль">
                      <input
                        type="range"
                        min={16}
                        max={96}
                        value={selected.fontSize ?? 32}
                        disabled={readOnly}
                        onChange={(event) => updateLayer({ ...selected, fontSize: Number(event.target.value) })}
                        className="w-full accent-cyan"
                      />
                    </Field>
                  )}
                  {(selected.kind === 'text' || selected.kind === 'shape') && (
                    <Field label="Цвет слоя">
                      <ColorField
                        value={selected.color ?? selected.fill ?? '#ffffff'}
                        disabled={readOnly}
                        onChange={(next) =>
                          updateLayer({
                            ...selected,
                            color: next,
                            fill: selected.kind === 'shape' ? next : selected.fill,
                          })
                        }
                      />
                    </Field>
                  )}
                  {selected.kind === 'shape' && (
                    <div className="grid grid-cols-2 gap-3">
                      <Field label="Ширина">
                        <input
                          type="range"
                          min={32}
                          max={340}
                          value={layerBox(selected).w}
                          disabled={readOnly}
                          onChange={(event) => updateLayer({ ...selected, w: Number(event.target.value) })}
                          className="w-full accent-cyan"
                        />
                      </Field>
                      <Field label="Высота">
                        <input
                          type="range"
                          min={32}
                          max={400}
                          value={layerBox(selected).h}
                          disabled={readOnly}
                          onChange={(event) => updateLayer({ ...selected, h: Number(event.target.value) })}
                          className="w-full accent-cyan"
                        />
                      </Field>
                    </div>
                  )}
                  <Field label="Поворот">
                    <input
                      type="range"
                      min={-180}
                      max={180}
                      value={selected.rotation ?? 0}
                      disabled={readOnly}
                      onChange={(event) => updateLayer({ ...selected, rotation: Number(event.target.value) })}
                      className="w-full accent-cyan"
                    />
                  </Field>
                  <Field label="Прозрачность">
                    <input
                      type="range"
                      min={0.15}
                      max={1}
                      step={0.05}
                      value={selected.opacity ?? 1}
                      disabled={readOnly}
                      onChange={(event) => updateLayer({ ...selected, opacity: Number(event.target.value) })}
                      className="w-full accent-cyan"
                    />
                  </Field>
                </div>
              )}
            </div>
          </div>

          <input
            ref={imageInput}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={async (event) => {
              const file = event.target.files?.[0]
              event.target.value = ''
              if (!file || !draft) {
                return
              }
              try {
                const src = await uploadFile(file)
                addLayer({
                  id: newId(),
                  kind: 'image',
                  src,
                  x: 40,
                  y: 120,
                  w: 220,
                  h: 220,
                })
                setTool('select')
              } catch (error) {
                onError(error instanceof Error ? error.message : 'Ошибка загрузки')
              }
            }}
          />
        </section>
      )}
    </div>
  )
}

function layerLabel(layer: PosterLayer): string {
  if (layer.kind === 'text') {
    return `Текст · ${layer.text || 'без текста'}`
  }
  if (layer.kind === 'image') {
    return 'Фото'
  }
  if (layer.kind === 'sticker') {
    return `Стикер · ${layer.text ?? ''}`
  }
  if (layer.kind === 'draw') {
    return 'Штрих'
  }
  return `Фигура · ${layer.shape ?? 'rect'}`
}
