import { useState, type ReactNode } from 'react'
import {
  CLIENT_EVENTS,
  QA_MISSIONS,
  SCREEN_LOGIC,
  expectedFlow,
  screenActions,
  type AppState,
  type ClientGameState,
  type LogicEvent,
  type LogicTransition,
  type ScreenLogicAction,
} from '@brainrot/shared'
import { newId, patch } from '../../lib/patch'

export type StudioProps = {
  state: ClientGameState
  onError: (message: string) => void
  readOnly?: boolean
}

export function useScreenLogic(state: ClientGameState, onError: (message: string) => void, fromStateId: string) {
  const scripts = state.project.logic.transitions.filter((item) => item.fromStateId === fromStateId)
  const states = state.project.states

  const send = (eventName: (typeof CLIENT_EVENTS)[keyof typeof CLIENT_EVENTS], payload: unknown) =>
    void patch(eventName, payload, onError)

  const byEvent = (event: LogicEvent) => scripts.find((item) => item.event === event) ?? null

  const setAction = (action: ScreenLogicAction, toStateId: string | null, locked?: boolean) => {
    const existing = byEvent(action.event)
    if (!toStateId) {
      if (existing) {
        send(CLIENT_EVENTS.logicDeleteTransition, { transitionId: existing.id })
      }
      return
    }
    const useLock = Boolean(action.lock && (locked ?? Boolean(existing?.condition)))
    const transition: LogicTransition = {
      id: existing?.id ?? newId(),
      fromStateId,
      event: action.event,
      toStateId,
      elseStateId: useLock ? fromStateId : null,
      condition:
        useLock && action.lock
          ? { property: action.lock.property, operator: 'eq', value: true }
          : null,
    }
    send(CLIENT_EVENTS.logicUpsertTransition, { transition })
  }

  const setLocked = (action: ScreenLogicAction, locked: boolean) => {
    const existing = byEvent(action.event)
    const toStateId = existing?.toStateId ?? action.suggestedToId ?? fromStateId
    setAction(action, toStateId, locked)
  }

  return { states, byEvent, setAction, setLocked }
}

export function destinationLabel(states: AppState[], id: string | null | undefined, stayId?: string) {
  if (!id) {
    return 'не решили'
  }
  if (stayId && id === stayId) {
    return 'остаёмся здесь'
  }
  return states.find((item) => item.id === id)?.name ?? 'не решили'
}

export function MissionHints({ stateId }: { stateId: string }) {
  const missions = QA_MISSIONS.filter((item) => item.startStateId === stateId)
  if (missions.length === 0) {
    return null
  }
  return (
    <p className="text-sm text-white/50">
      QA потом проверит:{' '}
      {missions
        .map((item) => `${item.emoji} ${item.title}`)
        .join(' · ')}
    </p>
  )
}

export function BugStrip({
  state,
  screenName,
}: {
  state: ClientGameState
  screenName?: string
}) {
  const bugs = state.project.qa.bugs.filter((bug) => {
    if (!screenName) {
      return true
    }
    const blob = `${bug.title} ${bug.steps} ${bug.expected} ${bug.actual}`
    return blob.toLowerCase().includes(screenName.toLowerCase())
  })
  if (bugs.length === 0) {
    return null
  }
  return (
    <section className="space-y-2">
      <h2 className="font-display text-xl text-mag">Баги от QA</h2>
      {bugs.map((bug) => (
        <article key={bug.id} className="rounded-3xl border border-mag/30 bg-panel p-4">
          <p className="font-display text-lg">{bug.title}</p>
          <p className="mt-1 text-sm text-white/65">{bug.steps}</p>
          <p className="mt-1 text-sm text-white/45">Должно: {bug.expected}</p>
          <p className="text-sm text-white/45">Сейчас: {bug.actual}</p>
        </article>
      ))}
    </section>
  )
}

export function DestinationPicker({
  states,
  value,
  currentId,
  allowStay,
  stayLabel = 'остаёмся здесь',
  allowOff = true,
  disabled,
  onChange,
}: {
  states: AppState[]
  value: string | null
  currentId: string
  allowStay?: boolean
  stayLabel?: string
  allowOff?: boolean
  disabled?: boolean
  onChange: (stateId: string | null) => void
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {allowOff && (
        <Chip active={!value} disabled={disabled} onClick={() => onChange(null)}>
          ещё не решили
        </Chip>
      )}
      {allowStay && (
        <Chip active={value === currentId} disabled={disabled} onClick={() => onChange(currentId)}>
          {stayLabel}
        </Chip>
      )}
      {states
        .filter((item) => !allowStay || item.id !== currentId)
        .map((item) => (
          <Chip
            key={item.id}
            active={value === item.id}
            disabled={disabled}
            onClick={() => onChange(item.id)}
          >
            {SCREEN_LOGIC[item.id]?.emoji ?? '📱'} {item.name}
          </Chip>
        ))}
    </div>
  )
}

function Chip({
  active,
  disabled,
  onClick,
  children,
}: {
  active?: boolean
  disabled?: boolean
  onClick: () => void
  children: ReactNode
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={[
        'rounded-full px-3 py-2 text-sm font-bold',
        active ? 'bg-gold text-ink' : 'bg-white/10 text-white/80',
        disabled ? 'opacity-50' : '',
      ].join(' ')}
    >
      {children}
    </button>
  )
}

export function ActionCard({
  action,
  currentId,
  states,
  transition,
  readOnly,
  accent,
  onChange,
  onLock,
}: {
  action: ScreenLogicAction
  currentId: string
  states: AppState[]
  transition: LogicTransition | null
  readOnly?: boolean
  accent?: string
  onChange: (toStateId: string | null) => void
  onLock?: (locked: boolean) => void
}) {
  const [open, setOpen] = useState(false)
  const locked = Boolean(transition?.condition)
  const value = transition?.toStateId ?? null
  const suggested = expectedFlow(currentId, action.event)?.expectedStateId ?? action.suggestedToId
  const stay = action.kind === 'stay' || action.kind === 'toggle'

  return (
    <article
      className="overflow-hidden rounded-3xl border border-line bg-panel"
      style={open ? { boxShadow: `0 0 0 1px ${accent ?? '#ffd166'}55` } : undefined}
    >
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex w-full items-center gap-3 px-4 py-3 text-left"
      >
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/8 text-2xl">
          {action.emoji}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block font-display text-xl leading-none">{action.title}</span>
          <span className="mt-1 block truncate text-sm text-white/50">{action.hint}</span>
        </span>
        <span
          className={[
            'shrink-0 rounded-full px-3 py-1 text-xs font-bold',
            action.kind === 'toggle' || value ? 'bg-cyan/20 text-cyan' : 'bg-white/8 text-white/40',
          ].join(' ')}
        >
          {action.kind === 'toggle'
            ? 'загорается здесь'
            : destinationLabel(states, value, stay ? currentId : undefined)}
        </span>
      </button>
      {open && (
        <div className="space-y-3 border-t border-white/8 px-4 py-3">
          {action.kind === 'toggle' && (
            <p className="text-sm text-white/55">
              Это не переход на другой экран. Лайк просто загорается и гаснет — уже работает, настраивать не нужно.
            </p>
          )}
          {action.kind !== 'toggle' && (
            <DestinationPicker
              states={states}
              value={value}
              currentId={currentId}
              allowStay={stay}
              stayLabel="остаёмся здесь"
              disabled={readOnly}
              onChange={onChange}
            />
          )}
          {action.kind !== 'toggle' && suggested && !value && (
            <button
              type="button"
              disabled={readOnly}
              onClick={() => onChange(suggested)}
              className="text-sm font-bold text-gold"
            >
              Подставить «{states.find((item) => item.id === suggested)?.name ?? suggested}»
            </button>
          )}
          {action.lock && onLock && action.kind !== 'toggle' && (
            <label className="flex items-center gap-2 text-sm font-bold text-white/80">
              <input
                type="checkbox"
                checked={locked}
                disabled={readOnly || !value}
                onChange={(event) => onLock(event.target.checked)}
                className="h-5 w-5 accent-[#ffd166]"
              />
              🔒 {action.lock.label}
            </label>
          )}
        </div>
      )}
    </article>
  )
}

export function ActionList({
  stateId,
  states,
  byEvent,
  readOnly,
  accent,
  onChange,
  onLock,
}: {
  stateId: string
  states: AppState[]
  byEvent: (event: LogicEvent) => LogicTransition | null
  readOnly?: boolean
  accent?: string
  onChange: (action: ScreenLogicAction, toStateId: string | null) => void
  onLock: (action: ScreenLogicAction, locked: boolean) => void
}) {
  return (
    <div className="space-y-2">
      {screenActions(stateId).map((action) => (
        <ActionCard
          key={action.event}
          action={action}
          currentId={stateId}
          states={states}
          transition={byEvent(action.event)}
          readOnly={readOnly}
          accent={accent}
          onChange={(toStateId) => onChange(action, toStateId)}
          onLock={action.lock ? (locked) => onLock(action, locked) : undefined}
        />
      ))}
    </div>
  )
}
