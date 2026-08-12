import type { DepartmentId } from '@brainrot/shared'
import { departmentById } from '../lib/departments'

type Props = {
  departmentId: DepartmentId
  countLabel: string
  selected?: boolean
  disabled?: boolean
  onSelect?: (id: DepartmentId) => void
}

export function DepartmentCard({
  departmentId,
  countLabel,
  selected,
  disabled,
  onSelect,
}: Props) {
  const dept = departmentById(departmentId)

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => onSelect?.(departmentId)}
      className={[
        'rise rounded-3xl border p-5 text-left transition duration-200',
        selected
          ? 'border-cyan bg-cyan/10 shadow-glow'
          : 'border-line bg-panel/80 hover:border-cyan/50 hover:bg-panel',
        disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer',
      ].join(' ')}
    >
      <div className="text-4xl">{dept.emoji}</div>
      <div className="mt-3 font-display text-2xl tracking-wide">{dept.name}</div>
      <p className="mt-2 text-base leading-snug text-white/70">{dept.description}</p>
      <div className="mt-4 text-sm font-medium uppercase tracking-[0.18em] text-cyan/80">
        {countLabel}
      </div>
    </button>
  )
}
