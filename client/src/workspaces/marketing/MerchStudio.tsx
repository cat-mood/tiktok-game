import { useEffect, useRef, useState } from 'react'
import {
  CLIENT_EVENTS,
  PRODUCT_NAME,
  MERCH_KINDS,
  MERCH_LABELS,
  MERCH_PATTERNS,
  MERCH_PATTERN_LABELS,
  POSTER_STICKERS,
  createEmptyMerch,
  merchPrintLayers,
  type ClientGameState,
  type MerchItem,
  type MerchKind,
  type MerchPattern,
  type MerchPrintLayer,
} from '@brainrot/shared'
import { newId, patch } from '../../lib/patch'
import { MerchMockup } from './MerchMockup'
import { ColorField, Field, ItemRail, fieldClass } from './shared'

type Tool = 'select' | 'text' | 'brush' | 'pattern' | 'sticker' | 'erase'

type Props = {
  state: ClientGameState
  onError: (message: string) => void
  readOnly?: boolean
}

const TOOLS: Array<{ id: Tool; label: string }> = [
  { id: 'select', label: 'Выбор' },
  { id: 'text', label: 'Текст' },
  { id: 'brush', label: 'Кисть' },
  { id: 'pattern', label: 'Узор' },
  { id: 'sticker', label: 'Стикер' },
  { id: 'erase', label: 'Ластик' },
]

export function MerchStudio({ state, onError, readOnly }: Props) {
  const items = state.project.marketing.merch
  const [selectedId, setSelectedId] = useState<string | null>(items[0]?.id ?? null)
  const [draft, setDraft] = useState<MerchItem | null>(null)
  const [tool, setTool] = useState<Tool>('select')
  const [layerId, setLayerId] = useState<string | null>(null)
  const [ink, setInk] = useState('#111111')
  const [brush, setBrush] = useState(4)
  const [stamp, setStamp] = useState<MerchPattern>('stars')
  const [sticker, setSticker] = useState(POSTER_STICKERS[0])
  const [livePath, setLivePath] = useState<string | null>(null)
  const drawing = useRef<string | null>(null)
  const drag = useRef<{ id: string; dx: number; dy: number } | null>(null)
  const draftRef = useRef<MerchItem | null>(null)
  draftRef.current = draft

  useEffect(() => {
    if (selectedId && items.some((item) => item.id === selectedId)) {
      return
    }
    setSelectedId(items[0]?.id ?? null)
  }, [items, selectedId])

  useEffect(() => {
    const next = items.find((item) => item.id === selectedId)
    if (next) {
      setDraft((current) => (current?.id === next.id ? current : next))
      setLayerId((current) => {
        const nextLayers = merchPrintLayers(next)
        if (current && nextLayers.some((layer) => layer.id === current)) {
          return current
        }
        return nextLayers.find((layer) => layer.kind === 'text' || layer.kind === 'sticker')?.id ?? nextLayers[0]?.id ?? null
      })
      return
    }
    if (!selectedId) {
      setDraft(null)
      setLayerId(null)
    }
  }, [items, selectedId])

  const send = (event: (typeof CLIENT_EVENTS)[keyof typeof CLIENT_EVENTS], payload: unknown) =>
    void patch(event, payload, onError)

  const save = (merch: MerchItem) => {
    const layers = merchPrintLayers(merch)
    const text = layers.find((layer) => layer.kind === 'text')?.text ?? merch.text
    const next = { ...merch, layers, text }
    setDraft(next)
    send(CLIENT_EVENTS.marketingUpsertMerch, { merch: next })
  }

  const create = (kind: MerchKind = 'tshirt') => {
    const merch = {
      ...createEmptyMerch(newId()),
      kind,
      name: MERCH_LABELS[kind],
      color: kind === 'mug' ? '#f4f0ea' : kind === 'sticker' ? '#ff2d6a' : '#e8e4dc',
    }
    setSelectedId(merch.id)
    setDraft(merch)
    setLayerId(merch.layers?.[0]?.id ?? null)
    send(CLIENT_EVENTS.marketingUpsertMerch, { merch })
  }

  const layers = draft ? merchPrintLayers(draft) : []
  const selected = layers.find((layer) => layer.id === layerId) ?? null

  const persist = (merch: MerchItem) => {
    save(merch)
  }

  const setLayers = (nextLayers: MerchPrintLayer[], commit = true) => {
    if (!draft) {
      return
    }
    const next = { ...draft, layers: nextLayers }
    draftRef.current = next
    setDraft(next)
    if (commit) {
      persist(next)
    }
  }

  const addLayer = (layer: MerchPrintLayer) => {
    setLayerId(layer.id)
    setLayers([...layers, layer])
  }

  const updateLayer = (next: MerchPrintLayer, commit = true) => {
    setLayers(
      layers.map((layer) => (layer.id === next.id ? next : layer)),
      commit,
    )
  }

  const onPrintDown = (x: number, y: number) => {
    if (!draft || readOnly) {
      return
    }
    if (tool === 'brush') {
      drawing.current = `M ${x.toFixed(1)} ${y.toFixed(1)}`
      setLivePath(drawing.current)
      return
    }
    const hit = hitPrintLayer(layers, x, y)
    if (tool === 'erase') {
      if (hit) {
        setLayers(layers.filter((layer) => layer.id !== hit.id))
      }
      return
    }
    if (hit && (tool === 'select' || tool === 'text' || tool === 'sticker')) {
      setLayerId(hit.id)
      setTool('select')
      drag.current = { id: hit.id, dx: x - hit.x, dy: y - hit.y }
      return
    }
    if (tool === 'text') {
      addLayer({
        id: newId(),
        kind: 'text',
        text: PRODUCT_NAME,
        x: clampPrint(x),
        y: clampPrint(y),
        fontSize: 16,
        color: ink,
      })
      setTool('select')
      return
    }
    if (tool === 'sticker') {
      addLayer({
        id: newId(),
        kind: 'sticker',
        text: sticker,
        x: clampPrint(x),
        y: clampPrint(y),
        fontSize: 22,
      })
      setTool('select')
      return
    }
    if (tool === 'pattern') {
      addLayer({
        id: newId(),
        kind: 'pattern',
        pattern: stamp,
        x: 0,
        y: 0,
        w: 100,
        h: 100,
        color: ink,
        opacity: 0.7,
      })
      setTool('select')
      return
    }
    setLayerId(null)
  }

  const onPrintMove = (x: number, y: number) => {
    if (drawing.current) {
      drawing.current += ` L ${x.toFixed(1)} ${y.toFixed(1)}`
      setLivePath(drawing.current)
      return
    }
    if (!drag.current) {
      return
    }
    const current = draftRef.current
    if (!current) {
      return
    }
    const currentLayers = merchPrintLayers(current)
    const moved = currentLayers.find((layer) => layer.id === drag.current?.id)
    if (!moved) {
      return
    }
    const next: MerchItem = {
      ...current,
      layers: currentLayers.map((layer) =>
        layer.id === moved.id
          ? { ...layer, x: clampPrint(x - drag.current!.dx), y: clampPrint(y - drag.current!.dy) }
          : layer,
      ),
    }
    draftRef.current = next
    setDraft(next)
  }

  const onPrintUp = () => {
    if (drawing.current) {
      addLayer({
        id: newId(),
        kind: 'draw',
        path: drawing.current,
        color: ink,
        strokeWidth: brush,
        x: 0,
        y: 0,
      })
    } else if (drag.current && draftRef.current) {
      persist(draftRef.current)
    }
    drawing.current = null
    drag.current = null
    setLivePath(null)
  }

  return (
    <div className="space-y-4">
      <section className="rounded-3xl border border-line bg-panel p-4">
        <h2 className="font-display text-2xl">Макеты мерча</h2>
        <p className="mt-1 text-sm text-white/45">
          Реальные изделия: пиши текст на ткани, рисуй кистью, клади узоры.
        </p>
        <div className="mt-4">
          <ItemRail
            items={items}
            selectedId={selectedId}
            onSelect={setSelectedId}
            onCreate={() => create()}
            onDelete={(merchId) => {
              send(CLIENT_EVENTS.marketingDeleteMerch, { merchId })
              if (selectedId === merchId) {
                setSelectedId(null)
                setDraft(null)
              }
            }}
            createLabel="Макет"
            readOnly={readOnly}
            render={(item) => (
              <div className="w-28 bg-[#0b0b12] p-1">
                <MerchMockup item={item} size="sm" />
                <p className="truncate px-1 pb-1 text-center text-[11px] text-white/55">
                  {item.name || MERCH_LABELS[item.kind]}
                </p>
              </div>
            )}
          />
        </div>
      </section>

      {draft && (
        <section className="min-w-0 overflow-hidden rounded-3xl border border-line bg-panel p-4">
          <div className="grid min-w-0 gap-5">
            <div className="min-w-0 rounded-[2rem] border border-white/10 bg-ink/70 p-3">
              <MerchMockup
                item={draft}
                size="lg"
                selectedLayerId={layerId}
                livePath={livePath}
                liveColor={ink}
                liveWidth={brush}
                interactive={!readOnly}
                onPrintPointerDown={onPrintDown}
                onPrintPointerMove={onPrintMove}
                onPrintPointerUp={onPrintUp}
              />
              <p className="mt-2 text-center text-xs text-white/40">
                Потяни надпись в пунктирной зоне. «Текст» ставит новую, «Выбор» двигает.
              </p>
            </div>

            <div className="min-w-0 space-y-3">
              <Field label="Название">
                <input
                  value={draft.name ?? ''}
                  disabled={readOnly}
                  onChange={(event) => setDraft({ ...draft, name: event.target.value })}
                  onBlur={() => save(draft)}
                  className={fieldClass}
                />
              </Field>
              <Field label="Изделие">
                <div className="grid grid-cols-2 gap-2">
                  {MERCH_KINDS.map((kind) => (
                    <button
                      key={kind}
                      type="button"
                      disabled={readOnly}
                      onClick={() => save({ ...draft, kind, name: draft.name || MERCH_LABELS[kind] })}
                      className={[
                        'min-w-0 truncate rounded-2xl px-2 py-2.5 text-sm font-bold',
                        draft.kind === kind ? 'bg-gold text-ink' : 'bg-white/10',
                      ].join(' ')}
                    >
                      {MERCH_LABELS[kind]}
                    </button>
                  ))}
                </div>
              </Field>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Цвет изделия">
                  <ColorField
                    value={draft.color}
                    disabled={readOnly}
                    onChange={(color) => save({ ...draft, color })}
                  />
                </Field>
                <Field label="Кайма / акцент">
                  <ColorField
                    value={draft.accent ?? '#2a2a32'}
                    disabled={readOnly}
                    onChange={(accent) => save({ ...draft, accent })}
                  />
                </Field>
              </div>
              <Field label="Узор ткани">
                <div className="grid grid-cols-3 gap-2">
                  {MERCH_PATTERNS.map((pattern) => (
                    <button
                      key={pattern}
                      type="button"
                      disabled={readOnly}
                      onClick={() => save({ ...draft, pattern })}
                      className={[
                        'min-w-0 truncate rounded-full px-2 py-1.5 text-[11px] font-bold',
                        (draft.pattern ?? 'none') === pattern ? 'bg-cyan text-ink' : 'bg-white/10',
                      ].join(' ')}
                    >
                      {MERCH_PATTERN_LABELS[pattern]}
                    </button>
                  ))}
                </div>
              </Field>

              <Field label="Инструмент принта">
                <div className="grid grid-cols-3 gap-2">
                  {TOOLS.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      disabled={readOnly}
                      onClick={() => setTool(item.id)}
                      className={[
                        'min-w-0 truncate rounded-2xl px-2 py-2 text-[11px] font-bold uppercase',
                        tool === item.id ? 'bg-cyan text-ink' : 'bg-white/10',
                      ].join(' ')}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </Field>
              <Field label="Краска принта">
                <ColorField value={ink} disabled={readOnly} onChange={setInk} />
              </Field>
              {tool === 'brush' && (
                <Field label="Толщина кисти">
                  <input
                    type="range"
                    min={1}
                    max={12}
                    value={brush}
                    disabled={readOnly}
                    onChange={(event) => setBrush(Number(event.target.value))}
                    className="w-full accent-cyan"
                  />
                </Field>
              )}
              {tool === 'pattern' && (
                <Field label="Штамп узора">
                  <div className="grid grid-cols-3 gap-2">
                    {MERCH_PATTERNS.filter((item) => item !== 'none').map((pattern) => (
                      <button
                        key={pattern}
                        type="button"
                        onClick={() => setStamp(pattern)}
                        className={[
                          'min-w-0 truncate rounded-full px-2 py-1.5 text-[11px] font-bold',
                          stamp === pattern ? 'bg-gold text-ink' : 'bg-white/10',
                        ].join(' ')}
                      >
                        {MERCH_PATTERN_LABELS[pattern]}
                      </button>
                    ))}
                  </div>
                </Field>
              )}
              {tool === 'sticker' && (
                <div className="flex flex-wrap gap-2">
                  {POSTER_STICKERS.map((item) => (
                    <button
                      key={item}
                      type="button"
                      onClick={() => setSticker(item)}
                      className={[
                        'h-11 w-11 rounded-2xl text-xl',
                        sticker === item ? 'bg-gold' : 'bg-white/10',
                      ].join(' ')}
                    >
                      {item}
                    </button>
                  ))}
                </div>
              )}

              {selected && selected.kind !== 'draw' && (
                <>
                  {(selected.kind === 'text' || selected.kind === 'sticker') && (
                    <Field label="Свой текст">
                      <input
                        value={selected.text ?? ''}
                        disabled={readOnly}
                        onChange={(event) => updateLayer({ ...selected, text: event.target.value }, false)}
                        onBlur={() => {
                          if (draftRef.current) {
                            persist(draftRef.current)
                          }
                        }}
                        className={`${fieldClass} font-display text-lg`}
                        placeholder="Напиши что угодно"
                      />
                    </Field>
                  )}
                  {selected.kind === 'text' && (
                    <Field label="Размер текста">
                      <input
                        type="range"
                        min={8}
                        max={36}
                        value={selected.fontSize ?? 16}
                        disabled={readOnly}
                        onChange={(event) => updateLayer({ ...selected, fontSize: Number(event.target.value) })}
                        className="w-full accent-cyan"
                      />
                    </Field>
                  )}
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Влево / вправо">
                      <input
                        type="range"
                        min={6}
                        max={94}
                        value={selected.x}
                        disabled={readOnly}
                        onChange={(event) =>
                          updateLayer({ ...selected, x: Number(event.target.value) })
                        }
                        className="w-full accent-cyan"
                      />
                    </Field>
                    <Field label="Вверх / вниз">
                      <input
                        type="range"
                        min={8}
                        max={92}
                        value={selected.y}
                        disabled={readOnly}
                        onChange={(event) =>
                          updateLayer({ ...selected, y: Number(event.target.value) })
                        }
                        className="w-full accent-cyan"
                      />
                    </Field>
                  </div>
                </>
              )}
              {selected && !readOnly && (
                <button
                  type="button"
                  onClick={() => {
                    setLayers(layers.filter((layer) => layer.id !== selected.id))
                    setLayerId(null)
                  }}
                  className="text-sm text-mag"
                >
                  Удалить слой
                </button>
              )}
            </div>
          </div>
        </section>
      )}
    </div>
  )
}

function clampPrint(value: number): number {
  return Math.round(Math.min(94, Math.max(6, value)))
}

function hitPrintLayer(layers: MerchPrintLayer[], x: number, y: number): MerchPrintLayer | undefined {
  for (let index = layers.length - 1; index >= 0; index -= 1) {
    const layer = layers[index]
    if (layer.kind === 'draw') {
      continue
    }
    if (layer.kind === 'pattern') {
      const w = layer.w ?? 100
      const h = layer.h ?? 100
      if (x >= layer.x && y >= layer.y && x <= layer.x + w && y <= layer.y + h) {
        return layer
      }
      continue
    }
    const size = layer.fontSize ?? 16
    const width = Math.max(22, (layer.text?.length ?? 1) * size * 0.62)
    const height = Math.max(18, size * 1.4)
    if (x >= layer.x - width / 2 && x <= layer.x + width / 2 && y >= layer.y - height / 2 && y <= layer.y + height / 2) {
      return layer
    }
  }
  return undefined
}
