import { useEffect, useState } from 'react'
import {
  CLIENT_EVENTS,
  IDEA_STICKER_COLORS,
  createEmptyIdea,
  type CampaignIdea,
  type ClientGameState,
} from '@brainrot/shared'
import { newId, patch } from '../../lib/patch'

type Props = {
  state: ClientGameState
  onError: (message: string) => void
  readOnly?: boolean
}

export function IdeasStudio({ state, onError, readOnly }: Props) {
  const ideas = state.project.marketing.ideas
  const [selectedId, setSelectedId] = useState<string | null>(ideas[0]?.id ?? null)
  const selected = ideas.find((item) => item.id === selectedId) ?? null
  const [text, setText] = useState(selected?.text ?? '')

  useEffect(() => {
    setText(ideas.find((item) => item.id === selectedId)?.text ?? '')
  }, [selectedId])

  const send = (event: (typeof CLIENT_EVENTS)[keyof typeof CLIENT_EVENTS], payload: unknown) =>
    void patch(event, payload, onError)

  const save = (idea: CampaignIdea) => {
    send(CLIENT_EVENTS.marketingUpsertIdea, { idea: { ...idea, text: idea.text.trim() || 'идея' } })
  }

  const create = () => {
    const idea = {
      ...createEmptyIdea(newId()),
      color: IDEA_STICKER_COLORS[ideas.length % IDEA_STICKER_COLORS.length],
      text: 'идея',
    }
    setSelectedId(idea.id)
    setText(idea.text)
    send(CLIENT_EVENTS.marketingUpsertIdea, { idea })
  }

  return (
    <section className="sticker-board rounded-3xl border border-line p-4">
      <div className="mb-4 flex items-end justify-between gap-3">
        <div className="min-w-0">
          <h2 className="font-display text-2xl">Стикеры с идеями</h2>
          <p className="text-sm text-white/45">Лепи на доску короткие мысли. Один стикер — одна идея.</p>
        </div>
        {!readOnly && (
          <button
            type="button"
            onClick={create}
            className="shrink-0 rounded-2xl bg-gold px-3 py-2 text-sm font-bold text-ink"
          >
            + стикер
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3 overflow-hidden px-1">
        {ideas.map((idea, index) => {
          const active = idea.id === selectedId
          return (
            <IdeaSticker
              key={idea.id}
              idea={idea}
              text={active ? text : idea.text}
              tilt={((index * 11) % 6) - 3}
              selected={active}
              onSelect={() => setSelectedId(idea.id)}
              onText={(value) => {
                setSelectedId(idea.id)
                setText(value)
              }}
              onCommit={(value) => save({ ...idea, text: value })}
              onDelete={() => {
                send(CLIENT_EVENTS.marketingDeleteIdea, { ideaId: idea.id })
                if (selectedId === idea.id) {
                  setSelectedId(null)
                }
              }}
              readOnly={readOnly}
            />
          )
        })}
        {!readOnly && (
          <button
            type="button"
            onClick={create}
            className="flex min-h-[160px] items-center justify-center rounded-[1.6rem] border border-dashed border-white/20 bg-white/5 text-sm font-bold text-white/50"
          >
            + ещё стикер
          </button>
        )}
      </div>

      {selected && !readOnly && (
        <div className="mt-4 flex flex-wrap gap-2">
          {IDEA_STICKER_COLORS.map((color) => (
            <button
              key={color}
              type="button"
              onClick={() => save({ ...selected, text, color })}
              className={[
                'h-8 w-8 rounded-full border-2',
                selected.color === color ? 'border-white' : 'border-transparent',
              ].join(' ')}
              style={{ background: color }}
            />
          ))}
        </div>
      )}
    </section>
  )
}

function IdeaSticker({
  idea,
  text,
  tilt,
  selected,
  onSelect,
  onText,
  onCommit,
  onDelete,
  readOnly,
}: {
  idea: CampaignIdea
  text: string
  tilt: number
  selected: boolean
  onSelect: () => void
  onText: (value: string) => void
  onCommit: (value: string) => void
  onDelete: () => void
  readOnly?: boolean
}) {
  const dark = isDark(idea.color ?? '#ffd166')
  return (
    <div
      className={['idea-sticker relative min-h-[160px] rounded-[1.4rem] p-3 shadow-lg', selected ? 'ring-2 ring-cyan' : ''].join(
        ' ',
      )}
      style={{
        background: idea.color ?? '#ffd166',
        color: dark ? '#fff' : '#16120a',
        transform: `rotate(${tilt}deg)`,
      }}
      onClick={onSelect}
    >
      <div className="idea-sticker-shine" />
      <textarea
        value={text}
        disabled={readOnly}
        onFocus={onSelect}
        onChange={(event) => onText(event.target.value)}
        onBlur={(event) => onCommit(event.target.value)}
        placeholder="Напиши идею"
        className="relative z-[1] h-28 w-full resize-none bg-transparent font-display text-xl leading-tight outline-none placeholder:opacity-40"
      />
      {!readOnly && (
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation()
            onDelete()
          }}
          className="absolute right-2 top-2 z-[1] text-lg leading-none opacity-50"
        >
          ×
        </button>
      )}
    </div>
  )
}

function isDark(color: string): boolean {
  const hex = color.replace('#', '')
  if (hex.length < 6) {
    return false
  }
  const r = Number.parseInt(hex.slice(0, 2), 16)
  const g = Number.parseInt(hex.slice(2, 4), 16)
  const b = Number.parseInt(hex.slice(4, 6), 16)
  return (r * 299 + g * 587 + b * 114) / 1000 < 140
}
