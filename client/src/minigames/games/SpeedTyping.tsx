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
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const activeRef = useRef<HTMLSpanElement>(null)
  const [focused, setFocused] = useState(false)
  const [miss, setMiss] = useState(false)
  const completedRef = useRef(false)

  const index = value.length
  const done = index >= target.length
  const current = done ? '' : target[index]

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  useEffect(() => {
    activeRef.current?.scrollIntoView({ block: 'center', inline: 'nearest' })
  }, [index])

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
      <p className="mt-2 text-center text-white/55">Печатай текст. Ошибка — курсор не двигается.</p>

      <div
        role="presentation"
        onClick={() => inputRef.current?.focus()}
        className={[
          'relative mt-4 flex min-h-0 flex-1 flex-col rounded-3xl border px-4 py-5',
          miss ? 'border-mag bg-mag/15' : 'border-line bg-panel',
        ].join(' ')}
      >
        <textarea
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
          className="absolute inset-0 resize-none opacity-0"
          style={{ fontSize: 16, caretColor: 'transparent' }}
          aria-label="Поле печати"
        />

        {!done && (
          <div className="pointer-events-none shrink-0 text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-white/35">
              Сейчас нажми
            </p>
            <div
              className={[
                'mt-2 font-display leading-none',
                current === ' ' ? 'text-4xl' : 'text-6xl',
                miss ? 'text-mag' : 'text-cyan',
              ].join(' ')}
            >
              {current === ' ' ? 'ПРОБЕЛ' : current}
            </div>
          </div>
        )}

        {done && (
          <p className="pointer-events-none shrink-0 text-center font-display text-3xl text-gold">
            Готово!
          </p>
        )}

        <div className="pointer-events-none mt-4 min-h-0 flex-1 overflow-y-auto">
          <p className="text-left text-xl leading-relaxed">
            {[...target].map((char, charIndex) => {
              const typed = charIndex < index
              const active = charIndex === index && !done
              return (
                <span
                  key={`${char}-${charIndex}`}
                  ref={active ? activeRef : undefined}
                  className={[
                    'rounded-sm',
                    typed ? 'text-cyan/80' : 'text-white/35',
                    active ? 'caret-blink bg-cyan text-ink' : '',
                    active && miss ? 'bg-mag text-white' : '',
                  ].join(' ')}
                >
                  {char}
                </span>
              )
            })}
          </p>
        </div>

        <p className="pointer-events-none mt-3 shrink-0 text-center text-sm text-white/40">
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
