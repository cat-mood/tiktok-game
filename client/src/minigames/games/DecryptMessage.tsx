import type { DecryptPrompt } from '@brainrot/shared'

type Props = {
  prompt: DecryptPrompt
  value: string
  onChange: (value: string) => void
}

export function DecryptMessage({ prompt, value, onChange }: Props) {
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <h1 className="text-center font-display text-3xl leading-none">{prompt.title}</h1>
      <p className="mt-3 text-center text-white/65">{prompt.instruction}</p>

      <div className="mt-5 rounded-3xl border border-line bg-panel p-3">
        <p className="mb-2 text-center text-xs font-semibold uppercase tracking-[0.2em] text-white/40">
          Ключ
        </p>
        <div className="grid grid-cols-8 gap-1">
          {prompt.key.map((entry) => (
            <div
              key={`${entry.from}-${entry.to}`}
              className="rounded-lg bg-white/5 px-0.5 py-1 text-center"
            >
              <div className="text-[10px] text-cyan/80">{entry.from}</div>
              <div className="text-sm font-bold">{entry.to}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-4 rounded-3xl border border-gold/30 bg-gold/10 px-4 py-4 text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold/70">Сообщение</p>
        <p className="mt-2 font-display text-2xl leading-snug tracking-wide text-gold">
          {prompt.encryptedText}
        </p>
      </div>

      <label className="mt-5 text-xs font-semibold uppercase tracking-[0.2em] text-white/40">
        Твой ответ
      </label>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        autoCapitalize="characters"
        autoCorrect="off"
        spellCheck={false}
        placeholder="Введи слово или фразу"
        className="mt-2 w-full rounded-2xl border border-line bg-panel px-4 py-4 text-xl uppercase outline-none ring-cyan/40 placeholder:text-white/25 focus:ring-2"
      />
    </div>
  )
}
