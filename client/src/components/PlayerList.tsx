import type { Player } from '@brainrot/shared'

type Props = {
  players: Player[]
}

export function PlayerList({ players }: Props) {
  const ordered = [...players].sort((a, b) => Number(b.isTeamLead) - Number(a.isTeamLead))

  if (ordered.length === 0) {
    return <p className="text-white/50">Пока никого нет</p>
  }

  return (
    <ul className="space-y-2">
      {ordered.map((player) => (
        <li
          key={player.id}
          className={[
            'flex items-center justify-between rounded-2xl px-4 py-3',
            player.isTeamLead
              ? 'bg-gold/15 text-gold ring-1 ring-gold/40'
              : 'bg-white/5 text-white',
            !player.connected ? 'opacity-50' : '',
          ].join(' ')}
        >
          <span className="text-lg font-medium">
            {player.isTeamLead ? `👑 ${player.name}` : player.name}
          </span>
          {!player.connected && (
            <span className="text-xs uppercase tracking-widest text-white/40">offline</span>
          )}
        </li>
      ))}
    </ul>
  )
}
