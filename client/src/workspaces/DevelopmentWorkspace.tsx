import { useState } from 'react'
import {
  CLIENT_EVENTS,
  CONDITION_PROPERTIES,
  EVENT_LABELS,
  LOGIC_EVENTS,
  presetHint,
  type ClientGameState,
  type LogicEvent,
  type LogicTransition,
} from '@brainrot/shared'
import { Onboarding } from '../components/Onboarding'
import { newId, patch } from '../lib/patch'

type Props = {
  state: ClientGameState
  onError: (message: string) => void
  readOnly?: boolean
}

export function DevelopmentWorkspace({ state, onError, readOnly }: Props) {
  const project = state.project
  const [fromStateId, setFromStateId] = useState(project.logic.initialStateId ?? project.states[0]?.id ?? '')
  const [event, setEvent] = useState<LogicEvent>('CLICK_LIKE')
  const [toStateId, setToStateId] = useState(project.states[1]?.id ?? project.states[0]?.id ?? '')
  const [elseStateId, setElseStateId] = useState('')
  const [useCondition, setUseCondition] = useState(false)
  const [property, setProperty] = useState<(typeof CONDITION_PROPERTIES)[number]>('video.isLiked')
  const [equalsFalse, setEqualsFalse] = useState(true)

  const send = (eventName: (typeof CLIENT_EVENTS)[keyof typeof CLIENT_EVENTS], payload: unknown) =>
    void patch(eventName, payload, onError)

  const addTransition = () => {
    if (!fromStateId || !toStateId) {
      return
    }
    const transition: LogicTransition = {
      id: newId(),
      fromStateId,
      event,
      toStateId,
      elseStateId: useCondition && elseStateId ? elseStateId : null,
      condition: useCondition
        ? { property, operator: 'eq', value: !equalsFalse }
        : null,
    }
    send(CLIENT_EVENTS.logicUpsertTransition, { transition })
  }

  return (
    <div className="space-y-4 pb-8">
      <Onboarding id="development" steps={DEV_STEPS} />
      <section className="rounded-3xl border border-line bg-panel p-4">
        <p className="text-xs uppercase tracking-[0.2em] text-white/40">Начальное состояние</p>
        <select
          disabled={readOnly}
          value={project.logic.initialStateId ?? ''}
          onChange={(eventChange) =>
            send(CLIENT_EVENTS.logicSetInitialState, { stateId: eventChange.target.value })
          }
          className="mt-2 w-full rounded-2xl bg-ink px-3 py-3"
        >
          {project.states.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name}
            </option>
          ))}
        </select>
      </section>

      <div className="space-y-3">
        {project.states.map((item) => (
          <article key={item.id} className="rounded-3xl border border-line bg-panel p-4">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="font-display text-2xl">{item.name}</p>
                <p className="mt-1 text-sm text-white/55">{presetHint(item.id)}</p>
              </div>
              {project.logic.initialStateId === item.id && (
                <span className="rounded-full bg-cyan/20 px-2 py-1 text-xs text-cyan">START</span>
              )}
            </div>
          </article>
        ))}
      </div>

      {project.qa.bugs.length > 0 && (
        <section className="space-y-3">
          <h2 className="font-display text-2xl">Bugs от QA</h2>
          {project.qa.bugs.map((bug) => (
            <article key={bug.id} className="rounded-3xl border border-mag/30 bg-panel p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-mag">{bug.severity}</p>
              <p className="mt-1 font-display text-xl">{bug.title}</p>
              <p className="mt-2 text-sm text-white/70">{bug.steps}</p>
              <p className="mt-1 text-sm text-white/50">Expected: {bug.expected}</p>
              <p className="text-sm text-white/50">Actual: {bug.actual}</p>
            </article>
          ))}
        </section>
      )}

      <section className="space-y-3">
        <h2 className="font-display text-2xl">Переходы</h2>
        {project.logic.transitions.length === 0 && (
          <p className="rounded-3xl border border-line bg-panel p-4 text-white/50">Пока нет переходов</p>
        )}
        {project.logic.transitions.map((item) => (
          <article key={item.id} className="rounded-3xl border border-line bg-panel p-4">
            <p className="font-display text-xl">{nameOf(project, item.fromStateId)}</p>
            <p className="mt-1 text-cyan">{EVENT_LABELS[item.event]}</p>
            {item.condition && (
              <p className="mt-1 text-sm text-gold">
                IF {item.condition.property} {item.condition.operator === 'eq' ? '=' : '≠'}{' '}
                {String(item.condition.value)}
              </p>
            )}
            <p className="mt-2 text-white/80">→ {nameOf(project, item.toStateId)}</p>
            {item.elseStateId && (
              <p className="text-white/50">ELSE → {nameOf(project, item.elseStateId)}</p>
            )}
            {!readOnly && (
              <button
                type="button"
                onClick={() => send(CLIENT_EVENTS.logicDeleteTransition, { transitionId: item.id })}
                className="mt-3 text-sm text-mag"
              >
                Удалить
              </button>
            )}
          </article>
        ))}
      </section>

      {!readOnly && (
        <section className="rounded-3xl border border-cyan/30 bg-panel p-4">
          <h2 className="font-display text-2xl">Новый переход</h2>
          <label className="mt-3 block text-xs uppercase tracking-[0.2em] text-white/40">From</label>
          <StateSelect states={project.states} value={fromStateId} onChange={setFromStateId} />
          <label className="mt-3 block text-xs uppercase tracking-[0.2em] text-white/40">Event</label>
          <select
            value={event}
            onChange={(eventChange) => setEvent(eventChange.target.value as LogicEvent)}
            className="mt-1 w-full rounded-2xl bg-ink px-3 py-3"
          >
            {LOGIC_EVENTS.map((item) => (
              <option key={item} value={item}>
                {EVENT_LABELS[item]}
              </option>
            ))}
          </select>
          <label className="mt-3 block text-xs uppercase tracking-[0.2em] text-white/40">To</label>
          <StateSelect states={project.states} value={toStateId} onChange={setToStateId} />
          <label className="mt-4 flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={useCondition}
              onChange={(eventChange) => setUseCondition(eventChange.target.checked)}
            />
            Условие
          </label>
          {useCondition && (
            <div className="mt-3 space-y-2">
              <select
                value={property}
                onChange={(eventChange) =>
                  setProperty(eventChange.target.value as (typeof CONDITION_PROPERTIES)[number])
                }
                className="w-full rounded-2xl bg-ink px-3 py-3"
              >
                {CONDITION_PROPERTIES.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => setEqualsFalse((value) => !value)}
                className="w-full rounded-2xl bg-white/10 py-3"
              >
                = {equalsFalse ? 'false' : 'true'}
              </button>
              <p className="text-xs uppercase tracking-[0.2em] text-white/40">ELSE</p>
              <StateSelect
                states={project.states}
                value={elseStateId}
                onChange={setElseStateId}
                allowEmpty
              />
            </div>
          )}
          <button
            type="button"
            onClick={addTransition}
            className="mt-4 w-full rounded-2xl bg-cyan py-4 text-lg font-bold text-ink"
          >
            Добавить переход
          </button>
        </section>
      )}
    </div>
  )
}

function nameOf(project: ClientGameState['project'], id: string) {
  const state = project.states.find((item) => item.id === id)
  return state ? state.name : id
}

function StateSelect({
  states,
  value,
  onChange,
  allowEmpty,
}: {
  states: ClientGameState['project']['states']
  value: string
  onChange: (value: string) => void
  allowEmpty?: boolean
}) {
  return (
    <select
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className="mt-1 w-full rounded-2xl bg-ink px-3 py-3"
    >
      {allowEmpty && <option value="">—</option>}
      {states.map((item) => (
        <option key={item.id} value={item.id}>
          {item.name}
        </option>
      ))}
    </select>
  )
}

const DEV_STEPS = [
  {
    title: 'Экраны уже придуманы',
    body: 'Клип, Съёмка, Чаты, Сообщение и остальные экраны уже есть. Твоя задача: связать их переходами.',
  },
  {
    title: 'Пример для лайка',
    body: 'FROM: Клип. EVENT: CLICK LIKE. TO: Клип с лайком. Если поставить TO обратно в Клип — лайк в приложении не сработает. Это не ошибка игры, а вашей логики.',
  },
  {
    title: 'Баги от QA',
    body: 'Если тестировщики найдут сломанный переход, карточка бага появится здесь. Исправлять логику или нет — решаете вы.',
  },
]