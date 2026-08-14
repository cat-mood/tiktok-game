import type { ReactNode } from 'react'

export async function uploadFile(file: File): Promise<string> {
  const response = await fetch('/uploads', {
    method: 'POST',
    headers: {
      'Content-Type': file.type || 'application/octet-stream',
      'x-filename': file.name,
    },
    body: file,
  })
  if (!response.ok) {
    throw new Error('Не удалось загрузить файл')
  }
  const data = (await response.json()) as { url: string }
  return data.url
}

export function Field({
  label,
  children,
}: {
  label: string
  children: ReactNode
}) {
  return (
    <label className="block">
      <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-white/40">{label}</span>
      <div className="mt-1.5">{children}</div>
    </label>
  )
}

export const fieldClass =
  'w-full rounded-2xl border border-line bg-ink px-3 py-3 text-sm outline-none ring-cyan/0 transition focus:border-cyan/50 focus:ring-2 focus:ring-cyan/20 disabled:opacity-60'

export const areaClass = `${fieldClass} min-h-[120px] resize-y leading-relaxed`

export function ItemRail<T extends { id: string }>({
  items,
  selectedId,
  onSelect,
  onCreate,
  onDelete,
  createLabel,
  readOnly,
  render,
}: {
  items: T[]
  selectedId: string | null
  onSelect: (id: string) => void
  onCreate: () => void
  onDelete: (id: string) => void
  createLabel: string
  readOnly?: boolean
  render: (item: T, selected: boolean) => ReactNode
}) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-1">
      {items.map((item) => {
        const selected = item.id === selectedId
        return (
          <div key={item.id} className="relative shrink-0">
            <button
              type="button"
              onClick={() => onSelect(item.id)}
              className={[
                'block overflow-hidden rounded-2xl border text-left transition',
                selected ? 'border-cyan shadow-glow' : 'border-line bg-white/5',
              ].join(' ')}
            >
              {render(item, selected)}
            </button>
            {!readOnly && (
              <button
                type="button"
                onClick={() => onDelete(item.id)}
                className="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-ink/80 text-sm text-mag"
              >
                ×
              </button>
            )}
          </div>
        )
      })}
      {!readOnly && (
        <button
          type="button"
          onClick={onCreate}
          className="flex h-[88px] w-[108px] shrink-0 flex-col items-center justify-center rounded-2xl border border-dashed border-white/20 bg-white/5 text-sm font-bold text-white/70"
        >
          <span className="text-2xl leading-none">+</span>
          {createLabel}
        </button>
      )}
    </div>
  )
}

export function ChipRow<T extends string>({
  value,
  options,
  labels,
  onChange,
  disabled,
}: {
  value: T
  options: readonly T[]
  labels: Record<T, string>
  onChange: (value: T) => void
  disabled?: boolean
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((option) => (
        <button
          key={option}
          type="button"
          disabled={disabled}
          onClick={() => onChange(option)}
          className={[
            'rounded-full px-3 py-1.5 text-xs font-bold uppercase tracking-wide',
            value === option ? 'bg-gold text-ink' : 'bg-white/10 text-white/70',
          ].join(' ')}
        >
          {labels[option]}
        </button>
      ))}
    </div>
  )
}

export function ColorField({
  value,
  onChange,
  disabled,
}: {
  value: string
  onChange: (value: string) => void
  disabled?: boolean
}) {
  const hex = value.startsWith('#') ? value : '#ff2d6a'
  return (
    <div className="flex min-w-0 items-center gap-2 rounded-2xl border border-line bg-ink px-2 py-2">
      <input
        type="color"
        value={hex}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        className="h-10 w-12 shrink-0 cursor-pointer rounded-xl bg-transparent"
      />
      <input
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        className="min-w-0 flex-1 bg-transparent text-sm outline-none"
      />
    </div>
  )
}
