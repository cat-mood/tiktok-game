import type { SequencePrompt } from '@brainrot/shared'

type Props = {
  prompt: SequencePrompt
  value: string
  onChange: (value: string) => void
}

export function SequenceGame({ prompt, value, onChange }: Props) {
  const numeric = !prompt.options && prompt.items.every((item) => /^\d+$/.test(item))

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <h1 className="text-center font-display text-3xl leading-none">{prompt.title}</h1>
      <p className="mt-3 text-center text-white/65">{prompt.instruction}</p>

      <div className="mt-8 flex flex-wrap items-center justify-center gap-2">
        {prompt.items.map((item, index) => (
          <div
            key={`${item}-${index}`}
            className="min-w-[3.5rem] rounded-2xl border border-line bg-panel px-3 py-3 text-center font-display text-3xl"
          >
            {item}
          </div>
        ))}
        <div className="min-w-[3.5rem] rounded-2xl border border-dashed border-gold/50 bg-gold/10 px-3 py-3 text-center font-display text-3xl text-gold">
          ?
        </div>
      </div>

      {prompt.options ? (
        <div className="mt-8 grid grid-cols-2 gap-3">
          {prompt.options.map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => onChange(option)}
              className={[
                'rounded-3xl border py-6 font-display text-4xl',
                value === option
                  ? 'border-cyan bg-cyan text-ink'
                  : 'border-line bg-panel text-white',
              ].join(' ')}
            >
              {option}
            </button>
          ))}
        </div>
      ) : (
        <>
          <label className="mt-8 text-xs font-semibold uppercase tracking-[0.2em] text-white/40">
            Твой ответ
          </label>
          <input
            value={value}
            onChange={(event) => onChange(event.target.value)}
            inputMode={numeric ? 'numeric' : 'text'}
            autoCorrect="off"
            spellCheck={false}
            placeholder="Что дальше?"
            className="mt-2 w-full rounded-2xl border border-line bg-panel px-4 py-4 text-center font-display text-3xl outline-none ring-cyan/40 placeholder:text-white/25 focus:ring-2"
          />
        </>
      )}
    </div>
  )
}
