import { useRef, useState } from 'react'
import type { AlgorithmPrompt } from '@brainrot/shared'

type Props = {
  prompt: AlgorithmPrompt
  value: string[]
  onChange: (value: string[]) => void
}

export function BuildAlgorithm({ prompt, value, onChange }: Props) {
  const selected = new Set(value)
  const pool = prompt.cards.filter((card) => !selected.has(card.id))
  const ordered = value
    .map((id) => prompt.cards.find((card) => card.id === id))
    .filter((card): card is NonNullable<typeof card> => Boolean(card))

  const dragIndex = useRef<number | null>(null)
  const [dragging, setDragging] = useState<number | null>(null)

  const add = (id: string) => onChange([...value, id])
  const remove = (id: string) => onChange(value.filter((item) => item !== id))

  const move = (from: number, to: number) => {
    if (from === to || to < 0 || to >= value.length) {
      return
    }
    const next = [...value]
    const [item] = next.splice(from, 1)
    next.splice(to, 0, item)
    onChange(next)
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <h1 className="text-center font-display text-3xl leading-none">{prompt.title}</h1>
      <p className="mt-3 text-center text-white/65">{prompt.instruction}</p>

      <p className="mt-5 text-xs font-semibold uppercase tracking-[0.2em] text-white/40">
        Твой порядок
      </p>
      <div className="mt-2 min-h-[8rem] space-y-2 rounded-3xl border border-cyan/30 bg-cyan/5 p-3">
        {ordered.length === 0 && (
          <p className="px-2 py-6 text-center text-white/40">Нажми карточки снизу</p>
        )}
        {ordered.map((card, index) => (
          <div
            key={card.id}
            className={[
              'flex touch-none select-none items-center gap-2 rounded-2xl border border-line bg-panel px-3 py-3',
              dragging === index ? 'opacity-60' : '',
            ].join(' ')}
            onPointerDown={(event) => {
              dragIndex.current = index
              setDragging(index)
              event.currentTarget.setPointerCapture(event.pointerId)
            }}
            onPointerMove={(event) => {
              if (dragIndex.current === null) {
                return
              }
              const target = document.elementFromPoint(event.clientX, event.clientY)
              const row = target?.closest('[data-algo-index]')
              if (!row) {
                return
              }
              const to = Number(row.getAttribute('data-algo-index'))
              if (!Number.isNaN(to) && to !== dragIndex.current) {
                move(dragIndex.current, to)
                dragIndex.current = to
                setDragging(to)
              }
            }}
            onPointerUp={() => {
              dragIndex.current = null
              setDragging(null)
            }}
            data-algo-index={index}
          >
            <span className="w-7 text-center font-display text-xl text-cyan">{index + 1}</span>
            <span className="flex-1 text-left text-lg">{card.text}</span>
            <button
              type="button"
              onClick={() => remove(card.id)}
              className="rounded-xl px-2 py-1 text-sm text-white/40"
            >
              ✕
            </button>
          </div>
        ))}
      </div>

      <p className="mt-5 text-xs font-semibold uppercase tracking-[0.2em] text-white/40">
        Карточки
      </p>
      <div className="mt-2 space-y-2">
        {pool.length === 0 && (
          <p className="text-center text-sm text-white/35">Все карточки уже в порядке</p>
        )}
        {pool.map((card) => (
          <button
            key={card.id}
            type="button"
            onClick={() => add(card.id)}
            className="w-full rounded-2xl border border-line bg-panel px-4 py-3 text-left text-lg"
          >
            {card.text}
          </button>
        ))}
      </div>
    </div>
  )
}
