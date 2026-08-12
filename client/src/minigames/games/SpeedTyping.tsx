import type { TypingPrompt } from '@brainrot/shared'

type Props = {
  prompt: TypingPrompt
  value: string
  onChange: (value: string) => void
}

export function SpeedTyping({ prompt, value, onChange }: Props) {
  const target = prompt.text
  const matched = matchLength(target, value)

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <h1 className="text-center font-display text-3xl leading-none">{prompt.title}</h1>
      <p className="mt-3 text-center text-white/65">{prompt.instruction}</p>

      <div className="mt-8 rounded-3xl border border-line bg-panel px-4 py-5 text-center font-display text-2xl leading-snug">
        <span className="text-cyan">{target.slice(0, matched)}</span>
        <span className="text-white">{target.slice(matched)}</span>
      </div>

      <label className="mt-6 text-xs font-semibold uppercase tracking-[0.2em] text-white/40">
        Печатай здесь
      </label>
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        autoCapitalize="characters"
        autoCorrect="off"
        spellCheck={false}
        rows={3}
        placeholder="Напечатай фразу"
        className="mt-2 w-full resize-none rounded-2xl border border-line bg-panel px-4 py-4 text-xl uppercase outline-none ring-cyan/40 placeholder:text-white/25 focus:ring-2"
      />
    </div>
  )
}

function matchLength(target: string, typed: string): number {
  const left = target.toUpperCase()
  const right = typed.trimStart().toUpperCase()
  let index = 0
  while (index < left.length && index < right.length && left[index] === right[index]) {
    index += 1
  }
  return index
}
