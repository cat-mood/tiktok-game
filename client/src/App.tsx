import { JoinScreen } from './screens/JoinScreen'
import { LobbyScreen } from './screens/LobbyScreen'
import { PlayerGameScreen } from './screens/PlayerGameScreen'
import { AdminLogin } from './screens/AdminLogin'
import { AdminScreen, useAdminSession } from './screens/AdminScreen'
import { useGame } from './hooks/useGame'

export function App() {
  const isAdmin = window.location.pathname.startsWith('/admin')
  return isAdmin ? <AdminApp /> : <PlayerApp />
}

function PlayerApp() {
  const game = useGame()
  const inGame =
    game.me &&
    (game.state.phase === 'PLANNING' || game.state.phase === 'WORK' || game.state.phase === 'FINISHED')

  return (
    <div className="grid-overlay min-h-dvh">
      <ConnectionBar connected={game.connected} error={game.error} onDismiss={() => game.setError(null)} />
      {inGame && game.me ? (
        <PlayerGameScreen me={game.me} state={game.state} onError={game.setError} />
      ) : game.me ? (
        <LobbyScreen me={game.me} state={game.state} onError={game.setError} />
      ) : (
        <JoinScreen
          state={game.state}
          onError={game.setError}
          onJoined={(playerId) => game.remember(playerId, game.state.sessionId)}
        />
      )}
    </div>
  )
}

function AdminApp() {
  const game = useGame()
  const session = useAdminSession(game.setError)

  return (
    <div className="grid-overlay min-h-dvh">
      <ConnectionBar connected={game.connected} error={game.error} onDismiss={() => game.setError(null)} />
      {!session.ready ? null : session.authed ? (
        <AdminScreen state={game.state} onError={game.setError} />
      ) : (
        <AdminLogin onAuthed={() => session.setAuthed(true)} />
      )}
    </div>
  )
}

function ConnectionBar({
  connected,
  error,
  onDismiss,
}: {
  connected: boolean
  error: string | null
  onDismiss: () => void
}) {
  if (connected && !error) {
    return null
  }

  return (
    <div className="sticky top-0 z-10 px-4 pt-4">
      {!connected && (
        <div className="rounded-2xl bg-mag/20 px-4 py-3 text-center text-mag">
          Нет связи с сервером. Переподключаемся...
        </div>
      )}
      {error && (
        <button
          type="button"
          onClick={onDismiss}
          className="mt-2 w-full rounded-2xl bg-gold/15 px-4 py-3 text-gold"
        >
          {error}
        </button>
      )}
    </div>
  )
}
