import type { Player } from '@brainrot/shared'
import { departmentById } from '../lib/departments'

export function GameStartingScreen({ me }: { me: Player }) {
  const dept = departmentById(me.departmentId)

  return (
    <div className="mx-auto flex min-h-dvh max-w-xl flex-col items-center justify-center px-5 text-center">
      <div className="rise text-7xl">🚀</div>
      <h1 className="mt-6 font-display text-5xl leading-none">ИГРА НАЧИНАЕТСЯ!</h1>
      <p className="mt-6 text-xl text-white/70">
        {me.name}, отдел {dept.emoji} {dept.name}
      </p>
      <p className="mt-3 text-white/40">Жди задание от ведущего.</p>
    </div>
  )
}
