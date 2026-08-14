import { useEffect, useState } from 'react'
import {
  CLIENT_EVENTS,
  DEPARTMENTS,
  MERCH_LABELS,
  PRODUCT_NAME,
  WORK_DURATION_OPTIONS_MS,
  projectStats,
  type ClientGameState,
  type DepartmentId,
  type Player,
} from '@brainrot/shared'
import { PhaseBadge } from '../components/PhaseBadge'
import { WorkTimer } from '../components/WorkTimer'
import { emitAck, socket } from '../socket'
import { ClipsRuntime } from '../runtime/ClipsRuntime'
import { MerchMockup, PosterView } from '../workspaces/MarketingWorkspace'

type Props = {
  state: ClientGameState
  onError: (message: string) => void
}

export function AdminScreen({ state, onError }: Props) {
  const [confirmNew, setConfirmNew] = useState(false)
  const [confirmEnd, setConfirmEnd] = useState(false)
  const [busy, setBusy] = useState(false)
  const [workDurationMs, setWorkDurationMs] = useState(state.workDurationMs || 30 * 60 * 1000)
  const locked = state.phase !== 'LOBBY'

  const run = async (event: string, payload?: unknown) => {
    setBusy(true)
    const ack = await emitAck(event, payload)
    setBusy(false)
    if (!ack.ok) {
      onError(ack.error)
    }
    return ack.ok
  }

  return (
    <div className="min-h-dvh px-6 py-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-cyan/70">Admin</p>
          <h1 className="mt-1 font-display text-4xl">{PRODUCT_NAME}</h1>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <a
            href="/qr"
            className="rounded-2xl border border-line px-4 py-3 text-sm text-white/70"
          >
            QR
          </a>
          <PhaseBadge phase={state.phase} />
          {state.phase === 'LOBBY' && (
            <>
              <select
                value={workDurationMs}
                onChange={(event) => setWorkDurationMs(Number(event.target.value))}
                className="rounded-2xl bg-ink px-3 py-3"
              >
                {WORK_DURATION_OPTIONS_MS.map((ms) => (
                  <option key={ms} value={ms}>
                    {ms / 60000} мин
                  </option>
                ))}
              </select>
              <button
                type="button"
                disabled={busy || locked}
                onClick={() => void run(CLIENT_EVENTS.adminStartGame, { workDurationMs })}
                className="rounded-2xl bg-cyan px-5 py-3 text-lg font-bold text-ink disabled:opacity-40"
              >
                Начать работу
              </button>
            </>
          )}
          {state.phase === 'WORK' && (
            <button
              type="button"
              disabled={busy}
              onClick={() => setConfirmEnd(true)}
              className="rounded-2xl bg-gold px-5 py-3 text-lg font-bold text-ink disabled:opacity-40"
            >
              END WORK
            </button>
          )}
          {state.phase === 'RELEASE' && !state.release?.launchedAt && (
            <button
              type="button"
              disabled={busy}
              onClick={() => void run(CLIENT_EVENTS.adminRelease)}
              className="rounded-2xl bg-mag px-6 py-3 text-lg font-bold"
            >
              🚀 RELEASE
            </button>
          )}
          {state.phase === 'RELEASE' && state.release?.launchedAt && (
            <button
              type="button"
              disabled={busy}
              onClick={() => void run(CLIENT_EVENTS.adminFinish)}
              className="rounded-2xl border border-white/20 px-5 py-3 font-bold"
            >
              Завершить
            </button>
          )}
          <button
            type="button"
            disabled={busy}
            onClick={() => setConfirmNew(true)}
            className="rounded-2xl border border-mag/50 px-5 py-3 text-lg font-bold text-mag"
          >
            Новая игра
          </button>
          {state.devTools && (
            <button
              type="button"
              disabled={busy || locked}
              onClick={() => void run(CLIENT_EVENTS.adminFillLobby)}
              className="rounded-2xl border border-gold/50 px-5 py-3 text-lg font-bold text-gold"
            >
              Заполнить лобби
            </button>
          )}
          {state.devTools && (
            <a
              href="/dev"
              className="rounded-2xl border border-cyan/50 px-5 py-3 text-lg font-bold text-cyan"
            >
              Песочница
            </a>
          )}
        </div>
      </header>

      {state.restoredFromDisk && (
        <RestoreBanner
          state={state}
          busy={busy}
          onContinue={() => void run(CLIENT_EVENTS.adminDismissRestore)}
          onNewGame={() => setConfirmNew(true)}
        />
      )}

      {state.phase === 'LOBBY' ? (
        <LobbyRoster state={state} busy={busy} locked={locked} run={run} />
      ) : state.phase === 'RELEASE' || state.phase === 'FINISHED' ? (
        <ReleaseDashboard
          state={state}
          interactive={Boolean(state.release?.launchedAt) && state.phase === 'RELEASE'}
          onDispatch={(eventName) => void run(CLIENT_EVENTS.runtimeDispatch, { event: eventName })}
        />
      ) : (
        <AdminWorkHud state={state} />
      )}

      {confirmEnd && (
        <ConfirmModal
          title="Завершить работу?"
          body="Редактирование закроется. Затем нажмите RELEASE, чтобы запустить приложение."
          confirmLabel="END WORK"
          confirmClass="bg-gold text-ink"
          onCancel={() => setConfirmEnd(false)}
          onConfirm={async () => {
            const ok = await run(CLIENT_EVENTS.adminEndWork)
            if (ok) {
              setConfirmEnd(false)
            }
          }}
        />
      )}

      {confirmNew && (
        <ConfirmModal
          title="Начать новую игру?"
          body="Текущая сессия уйдёт в архив, игроки вернутся на экран входа."
          confirmLabel="Новая игра"
          confirmClass="bg-mag text-white"
          onCancel={() => setConfirmNew(false)}
          onConfirm={async () => {
            const ok = await run(CLIENT_EVENTS.adminNewGame)
            if (ok) {
              setConfirmNew(false)
            }
          }}
        />
      )}
    </div>
  )
}

function LobbyRoster({
  state,
  busy,
  locked,
  run,
}: {
  state: ClientGameState
  busy: boolean
  locked: boolean
  run: (event: string, payload?: unknown) => Promise<boolean>
}) {
  return (
    <div className="mt-8 grid grid-cols-1 gap-4 xl:grid-cols-4">
      {DEPARTMENTS.map((dept) => {
        const members = state.players.filter((player) => player.departmentId === dept.id)
        const hasLead = members.some((player) => player.isTeamLead)
        return (
          <section key={dept.id} className="rounded-3xl border border-line bg-panel p-4">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h2 className="font-display text-2xl">
                  {dept.emoji} {dept.name}
                </h2>
                <p className="mt-1 text-sm text-white/50">{dept.description}</p>
              </div>
              <span className="rounded-full bg-white/10 px-3 py-1 text-sm">{members.length}</span>
            </div>
            {!hasLead && (
              <p className="mt-3 rounded-xl bg-mag/15 px-3 py-2 text-sm text-mag">Нет тимлида</p>
            )}
            <div className="mt-4 space-y-3">
              {members.length === 0 && <p className="text-white/35">Пусто</p>}
              {members.map((player) => (
                <AdminPlayerCard
                  key={player.id}
                  player={player}
                  locked={locked || busy}
                  onLead={() => void run(CLIENT_EVENTS.adminSetTeamLead, { playerId: player.id })}
                  onMove={(departmentId) =>
                    void run(CLIENT_EVENTS.adminMovePlayer, {
                      playerId: player.id,
                      departmentId,
                    })
                  }
                  onRemove={() => void run(CLIENT_EVENTS.adminRemovePlayer, { playerId: player.id })}
                />
              ))}
              {state.devTools && (
                <button
                  type="button"
                  disabled={locked || busy}
                  onClick={() => void run(CLIENT_EVENTS.adminSpawnPlayer, { departmentId: dept.id })}
                  className="w-full rounded-2xl border border-dashed border-white/20 px-3 py-2 text-sm text-white/60 hover:border-cyan/40 hover:text-cyan disabled:opacity-40"
                >
                  + Игрок
                </button>
              )}
            </div>
          </section>
        )
      })}
    </div>
  )
}

function AdminWorkHud({ state }: { state: ClientGameState }) {
  const stats = projectStats(state.project)
  return (
    <div className="mt-8">
      <div className="rounded-3xl border border-line bg-panel px-6 py-8 text-center">
        <WorkTimer
          phase={state.phase}
          phaseEndsAt={state.phaseEndsAt}
          serverNow={state.serverNow}
          size="admin"
        />
        <p className="mt-6 font-display text-5xl tracking-[0.12em]">WORK</p>
        <p className="mt-2 text-xl text-white/60">Четыре команды собирают {PRODUCT_NAME}</p>
      </div>
      <div className="mt-6 grid grid-cols-1 gap-4 xl:grid-cols-4">
        {DEPARTMENTS.map((dept) => {
          const members = state.players.filter((player) => player.departmentId === dept.id)
          const lead = members.find((player) => player.isTeamLead)
          return (
            <section key={dept.id} className="rounded-3xl border border-line bg-panel p-5">
              <h2 className="font-display text-2xl">
                {dept.emoji} {dept.name}
              </h2>
              <p className="mt-3 text-lg text-gold">👑 {lead ? lead.name : 'Нет тимлида'}</p>
              <p className="mt-2 text-white/70">{members.length} в команде</p>
              {dept.id === 'design' && (
                <p className="mt-2 text-white/50">
                  {stats.screens} screens · {stats.states} states · {stats.components} components
                </p>
              )}
              {dept.id === 'development' && (
                <p className="mt-2 text-white/50">
                  {stats.transitions} transitions · {stats.conditions} conditions
                </p>
              )}
              {dept.id === 'qa' && (
                <p className="mt-2 text-white/50">
                  {stats.tests} tests · {stats.passed} pass · {stats.failed} fail · {stats.bugs} bugs
                </p>
              )}
              {dept.id === 'marketing' && (
                <p className="mt-2 text-white/50">
                  {stats.slogan ? 'слоган · ' : ''}
                  {stats.hasVideo ? 'видео · ' : ''}
                  {stats.hasPoster ? 'постер · ' : ''}
                  {stats.hasMerch ? 'мерч' : 'материалов мало'}
                </p>
              )}
            </section>
          )
        })}
      </div>
    </div>
  )
}

function ReleaseDashboard({
  state,
  interactive,
  onDispatch,
}: {
  state: ClientGameState
  interactive: boolean
  onDispatch: (event: string) => void
}) {
  const snapshot = state.release?.snapshot ?? state.project
  const stats = projectStats(snapshot)
  const results = state.release?.testResults ?? snapshot.qa.testCases.map((test) => test.lastResult).filter(Boolean)
  const passed = results.filter((item) => item?.passed).length
  const failed = results.filter((item) => item && !item.passed).length

  return (
    <div className="mt-8">
      <div className="rounded-3xl border border-line bg-panel px-6 py-8 text-center">
        <p className="text-sm uppercase tracking-[0.35em] text-cyan/70">🚀 {PRODUCT_NAME} — RELEASE</p>
        <h2 className="mt-3 font-display text-5xl">
          {state.release?.launchedAt ? 'LIVE APPLICATION' : 'Готово к запуску'}
        </h2>
        <div className="mt-8 flex flex-col items-center">
          <ClipsRuntime
            project={snapshot}
            stateId={state.release?.runtimeStateId ?? snapshot.logic.initialStateId}
            interactive={interactive}
            onAction={(eventName) => onDispatch(eventName)}
            flags={state.release?.runtimeFlags}
            scale={0.78}
          />
          {interactive && (
            <button
              type="button"
              onClick={() => onDispatch('BACK')}
              className="mt-4 rounded-2xl bg-white/10 px-6 py-3 font-bold"
            >
              BACK
            </button>
          )}
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 xl:grid-cols-4">
        <StatCard title="DESIGN" lines={[`${stats.screens} screens`, `${stats.states} states`, `${stats.components} components`]} />
        <StatCard title="DEVELOPMENT" lines={[`${stats.transitions} transitions`, `${stats.conditions} conditions`]} />
        <StatCard
          title="QA"
          lines={[
            `${stats.tests} tests`,
            `${passed} passed`,
            `${failed} failed`,
            `${stats.bugs} bugs · H${stats.highBugs} M${stats.mediumBugs} L${stats.lowBugs}`,
          ]}
        />
        <StatCard
          title="MARKETING"
          lines={[
            stats.hasVideo ? '🎬 Video' : 'нет видео',
            stats.hasPoster ? '🎨 Poster' : 'нет постера',
            stats.hasMerch ? '👕 Merch' : 'нет мерча',
            stats.slogan || 'нет слогана',
          ]}
        />
      </div>

      <section className="mt-6 rounded-3xl border border-line bg-panel p-5">
        <h3 className="font-display text-2xl">QA протестировали {stats.tests} сценариев</h3>
        <div className="mt-4 space-y-2">
          {snapshot.qa.bugs.map((bug) => (
            <p key={bug.id} className="text-white/70">
              🐛 {bug.severity}: {bug.title}
            </p>
          ))}
          {snapshot.qa.bugs.length === 0 && <p className="text-white/40">Багов не завели</p>}
        </div>
      </section>

      <section className="mt-6 rounded-3xl border border-line bg-panel p-5">
        <h3 className="font-display text-2xl">📢 MARKETING</h3>
        {snapshot.marketing.slogan && (
          <p className="mt-3 font-display text-3xl text-gold">{snapshot.marketing.slogan}</p>
        )}
        {snapshot.marketing.videos.map((video) => (
          <div key={video.id} className="mt-4 max-w-xl">
            {video.title && <p className="mb-2 font-display text-xl">{video.title}</p>}
            {video.url && <video src={video.url} controls className="w-full rounded-2xl" />}
            {video.hook && <p className="mt-2 text-sm text-white/50">{video.hook}</p>}
          </div>
        ))}
        <div className="mt-4 flex flex-wrap gap-4">
          {snapshot.marketing.posters.map((poster) => (
            <div key={poster.id}>
              <PosterView poster={poster} scale={0.42} className="rounded-3xl" />
              {poster.title && <p className="mt-2 text-sm text-white/50">{poster.title}</p>}
            </div>
          ))}
        </div>
        <div className="mt-4 flex flex-wrap gap-4">
          {snapshot.marketing.merch.map((item) => (
            <div key={item.id} className="w-28 text-center">
              <MerchMockup item={item} size="sm" />
              <p className="mt-1 text-xs text-white/50">{item.name || MERCH_LABELS[item.kind]}</p>
            </div>
          ))}
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          {snapshot.marketing.ideas.map((idea) => (
            <span
              key={idea.id}
              className="rounded-2xl px-3 py-2 font-display text-sm font-bold"
              style={{ background: idea.color ?? '#ffd166', color: '#16120a' }}
            >
              {idea.text}
            </span>
          ))}
        </div>
      </section>
    </div>
  )
}

function StatCard({ title, lines }: { title: string; lines: string[] }) {
  return (
    <section className="rounded-3xl border border-line bg-panel p-5">
      <h3 className="font-display text-2xl">{title}</h3>
      {lines.map((line) => (
        <p key={line} className="mt-2 text-white/70">
          {line}
        </p>
      ))}
    </section>
  )
}

function RestoreBanner({
  state,
  busy,
  onContinue,
  onNewGame,
}: {
  state: ClientGameState
  busy: boolean
  onContinue: () => void
  onNewGame: () => void
}) {
  const when = state.updatedAt
    ? new Date(state.updatedAt).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
    : ''

  return (
    <div className="mt-6 flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-gold/40 bg-gold/10 px-5 py-4">
      <div>
        <div className="font-display text-xl text-gold">Восстановлена игра</div>
        <p className="mt-1 text-white/70">
          {state.phase}, {state.players.length} игроков{when ? `, ${when}` : ''}
        </p>
      </div>
      <div className="flex gap-3">
        <button
          type="button"
          disabled={busy}
          onClick={onContinue}
          className="rounded-2xl bg-gold px-4 py-2 font-bold text-ink"
        >
          Продолжить
        </button>
        <button type="button" disabled={busy} onClick={onNewGame} className="rounded-2xl border border-white/20 px-4 py-2">
          Новая игра
        </button>
      </div>
    </div>
  )
}

function AdminPlayerCard({
  player,
  locked,
  onLead,
  onMove,
  onRemove,
}: {
  player: Player
  locked: boolean
  onLead: () => void
  onMove: (departmentId: DepartmentId) => void
  onRemove: () => void
}) {
  return (
    <div
      className={[
        'rounded-2xl p-3',
        player.isTeamLead ? 'bg-gold/15 ring-1 ring-gold/40' : 'bg-white/5',
        player.connected ? '' : 'opacity-60',
      ].join(' ')}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="text-lg font-medium">
          {player.isTeamLead ? `👑 ${player.name}` : player.name}
        </div>
        {!player.connected && (
          <span className="text-[10px] uppercase tracking-widest text-white/40">offline</span>
        )}
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          disabled={locked || player.isTeamLead}
          onClick={onLead}
          className="rounded-xl bg-white/10 px-3 py-1.5 text-sm disabled:opacity-40"
        >
          Тимлид
        </button>
        <select
          disabled={locked}
          value={player.departmentId}
          onChange={(event) => onMove(event.target.value as DepartmentId)}
          className="rounded-xl bg-ink px-2 py-1.5 text-sm"
        >
          {DEPARTMENTS.map((dept) => (
            <option key={dept.id} value={dept.id}>
              {dept.name}
            </option>
          ))}
        </select>
        <button
          type="button"
          disabled={locked}
          onClick={onRemove}
          className="rounded-xl px-3 py-1.5 text-sm text-mag disabled:opacity-40"
        >
          Удалить
        </button>
      </div>
    </div>
  )
}

function ConfirmModal({
  title,
  body,
  confirmLabel,
  confirmClass,
  onCancel,
  onConfirm,
}: {
  title: string
  body: string
  confirmLabel: string
  confirmClass: string
  onCancel: () => void
  onConfirm: () => void
}) {
  return (
    <div className="fixed inset-0 z-20 flex items-center justify-center bg-black/70 px-4">
      <div className="w-full max-w-md rounded-3xl border border-line bg-panel p-6">
        <h2 className="font-display text-3xl">{title}</h2>
        <p className="mt-3 text-white/70">{body}</p>
        <div className="mt-6 flex gap-3">
          <button type="button" onClick={onConfirm} className={`flex-1 rounded-2xl py-3 font-bold ${confirmClass}`}>
            {confirmLabel}
          </button>
          <button type="button" onClick={onCancel} className="flex-1 rounded-2xl bg-white/10 py-3">
            Отмена
          </button>
        </div>
      </div>
    </div>
  )
}

export function useAdminSession(onError: (message: string) => void) {
  const [authed, setAuthed] = useState(false)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const authenticate = (showError: boolean) => {
      const saved = sessionStorage.getItem('brainrot.adminCode')
      if (!saved) {
        setReady(true)
        setAuthed(false)
        return
      }
      void emitAck(CLIENT_EVENTS.adminAuth, { code: saved }).then((ack) => {
        setAuthed(ack.ok)
        if (!ack.ok) {
          sessionStorage.removeItem('brainrot.adminCode')
          if (showError) {
            onError(ack.error)
          }
        }
        setReady(true)
      })
    }

    authenticate(true)
    const onConnect = () => authenticate(false)
    socket.on('connect', onConnect)
    return () => {
      socket.off('connect', onConnect)
    }
  }, [onError])

  return { authed, setAuthed, ready }
}
