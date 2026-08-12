import { useEffect, useRef, useState } from 'react'
import type { TypingPrompt } from '@brainrot/shared'

type Props = {
  prompt: TypingPrompt
  value: string
  onChange: (value: string) => void
  onComplete?: (value: string) => void
}

export function SpeedTyping({ prompt, value, onChange, onComplete }: Props) {
  const target = prompt.text
  const inputRef = useRef<HTMLInputElement>(null)
  const [focused, setFocused] = useState(false)
  const [miss, setMiss] = useState(false)
  const completedRef = useRef(false)

  const index = value.length
  const done = index >= target.length
  const current = done ? '' : target[index]

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const applyTyped = (next: string) => {
    if (completedRef.current) {
      return
    }
    onChange(next)
    if (next.length >= target.length) {
      completedRef.current = true
      onComplete?.(next)
    }
  }

  const handleChange = (raw: string) => {
    if (raw.length < value.length) {
      applyTyped(raw)
      return
    }

    const incoming = raw.slice(value.length)
    let currentValue = value
    let hitMiss = false
    for (const char of incoming) {
      const expected = target[currentValue.length]
      if (expected !== undefined && charsMatch(char, expected)) {
        currentValue += expected
      } else {
        hitMiss = true
        break
      }
    }

    if (hitMiss) {
      setMiss(true)
      window.setTimeout(() => setMiss(false), 180)
    }
    if (currentValue !== value) {
      applyTyped(currentValue)
    }
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <h1 className="text-center font-display text-3xl leading-none">{prompt.title}</h1>
      <p className="mt-3 text-center text-white/60">Печатай букву за буквой. Ошибка — остаёшься на месте.</p>

      <div
        role="presentation"
        onClick={() => inputRef.current?.focus()}
        className={[
          'relative mt-6 flex flex-1 flex-col items-center justify-center rounded-3xl border px-4 py-6',
          miss ? 'border-mag bg-mag/15' : 'border-line bg-panel',
        ].join(' ')}
      >
        <input
          ref={inputRef}
          value={value}
          onChange={(event) => handleChange(event.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault()
            }
          }}
          autoCapitalize="off"
          autoCorrect="off"
          autoComplete="off"
          spellCheck={false}
          enterKeyHint="done"
          className="absolute inset-0 cursor-text opacity-0"
          style={{ fontSize: 16, caretColor: 'transparent' }}
          aria-label="Поле печати"
        />

        {!done && (
          <div className="pointer-events-none text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-white/35">
              Сейчас нажми
            </p>
            <div
              className={[
                'mt-3 font-display leading-none',
                current === ' ' ? 'text-5xl' : 'text-7xl',
                miss ? 'text-mag' : 'text-cyan',
              ].join(' ')}
            >
              {current === ' ' ? 'ПРОБЕЛ' : current}
            </div>
          </div>
        )}

        {done && <p className="pointer-events-none font-display text-3xl text-gold">Готово!</p>}

        <div className="pointer-events-none mt-8 flex flex-wrap justify-center gap-1">
          {[...target].map((char, charIndex) => {
            const typed = charIndex < index
            const active = charIndex === index && !done
            return (
              <span
                key={`${char}-${charIndex}`}
                className={[
                  'min-w-[0.7em] rounded-md px-0.5 text-center font-display text-3xl leading-tight',
                  typed ? 'text-cyan/70' : 'text-white/35',
                  active ? 'caret-blink bg-cyan text-ink' : '',
                  active && miss ? 'bg-mag text-white' : '',
                ].join(' ')}
              >
                {char === ' ' ? '·' : char}
              </span>
            )
          })}
        </div>

        <p className="pointer-events-none mt-6 text-sm text-white/40">
          {index} / {target.length}
          {!focused && !done ? ' · нажми, чтобы печатать' : ''}
        </p>
      </div>
    </div>
  )
}

function charsMatch(typed: string, expected: string): boolean {
  return typed.toUpperCase() === expected.toUpperCase()
}
