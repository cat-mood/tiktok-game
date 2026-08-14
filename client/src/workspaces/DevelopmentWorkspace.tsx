import { useState } from 'react'
import {
  BLOCK_EVENT_SHORT,
  CLIENT_EVENTS,
  LOGIC_EVENTS,
  QA_MISSIONS,
  expectedFlow,
  presetHint,
  type ClientGameState,
  type ConditionProperty,
  type LogicEvent,
  type LogicTransition,
} from '@brainrot/shared'
import { Onboarding } from '../components/Onboarding'
import { WhenAppOpensScript, WhenGoToScript } from '../components/ScratchBlocks'
import { newId, patch } from '../lib/patch'

type Props = {
  state: ClientGameState
  onError: (message: string) => void
  readOnly?: boolean
}

export function DevelopmentWorkspace({ state, onError, readOnly }: Props) {
  const project = state.project
  const [stateId, setStateId] = useState(project.logic.initialStateId ?? project.states[0]?.id ?? '')
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const currentId = project.states.some((item) => item.id === stateId) ? stateId : project.states[0]?.id ?? ''
  const currentState = project.states.find((item) => item.id === currentId)
  const scripts = project.logic.transitions.filter((item) => item.fromStateId === currentId)
  const selected = scripts.find((item) => item.id === selectedId) ?? null
  const target = selected ?? scripts.at(-1) ?? null

  const send = (eventName: (typeof CLIENT_EVENTS)[keyof typeof CLIENT_EVENTS], payload: unknown) =>
    void patch(eventName, payload, onError)

  const save = (transition: LogicTransition) => {
    send(CLIENT_EVENTS.logicUpsertTransition, { transition })
  }

  const addWhen = (event: LogicEvent) => {
    if (!currentId) {
      return
    }
    const otherId = project.states.find((item) => item.id !== currentId)?.id ?? currentId
    const transition: LogicTransition = {
      id: newId(),
      fromStateId: currentId,
      event,
      toStateId: expectedFlow(currentId, event)?.expectedStateId ?? otherId,
      elseStateId: null,
      condition: null,
    }
    setSelectedId(transition.id)
    save(transition)
  }

  const addOrToggleIf = () => {
    if (!currentId) {
      return
    }
    if (!target) {
      const event = defaultEvent(currentId)
      const otherId = project.states.find((item) => item.id !== currentId)?.id ?? currentId
      const transition: LogicTransition = {
        id: newId(),
        fromStateId: currentId,
        event,
        toStateId: expectedFlow(currentId, event)?.expectedStateId ?? otherId,
        elseStateId: currentId,
        condition: {
          property: defaultCondition(currentId, event),
          operator: 'eq',
          value: true,
        },
      }
      setSelectedId(transition.id)
      save(transition)
      return
    }
    if (target.condition) {
      save({ ...target, condition: null, elseStateId: null })
      return
    }
    save({
      ...target,
      elseStateId: target.elseStateId ?? currentId,
      condition: {
        property: defaultCondition(currentId, target.event),
        operator: 'eq',
        value: true,
      },
    })
  }

  return (
    <div className="space-y-4 pb-52">
      <Onboarding id="development-scratch" steps={DEV_STEPS} />

      <WhenAppOpensScript
        stateId={project.logic.initialStateId ?? ''}
        states={project.states}
        readOnly={readOnly}
        onChange={(nextId) => send(CLIENT_EVENTS.logicSetInitialState, { stateId: nextId })}
      />

      <p className="text-xs font-semibold uppercase tracking-[0.25em] text-white/40">Скрипты экрана</p>
      <div className="flex gap-2 overflow-x-auto">
        {project.states.map((item) => {
          const count = project.logic.transitions.filter((script) => script.fromStateId === item.id).length
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                setStateId(item.id)
                setSelectedId(null)
              }}
              className={[
                'shrink-0 rounded-2xl px-3 py-2 text-sm font-bold',
                item.id === currentId ? 'bg-cyan text-ink' : 'bg-white/10',
              ].join(' ')}
            >
              {item.name}
              {count > 0 ? ` · ${count}` : ''}
            </button>
          )
        })}
      </div>
      {currentState && <p className="text-sm text-white/55">{presetHint(currentState.id)}</p>}

      {project.qa.bugs.length > 0 && (
        <section className="space-y-3">
          <h2 className="font-display text-2xl">Баги от QA</h2>
          {project.qa.bugs.map((bug) => (
            <article key={bug.id} className="rounded-3xl border border-mag/30 bg-panel p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-mag">Сломано</p>
              <p className="mt-1 font-display text-xl">{bug.title}</p>
              <p className="mt-2 text-sm text-white/70">{bug.steps}</p>
              <p className="mt-1 text-sm text-white/50">Должно открыться: {bug.expected}</p>
              <p className="text-sm text-white/50">Сейчас открывается: {bug.actual}</p>
            </article>
          ))}
        </section>
      )}

      <div className="space-y-5">
        {scripts.length === 0 && (
          <p className="rounded-3xl border border-dashed border-line bg-panel/60 px-4 py-6 text-center text-white/50">
            На «{currentState?.name ?? 'экране'}» пока пусто. Внизу нажми жёлтый блок «когда».
          </p>
        )}
        {scripts.map((item) => (
          <WhenGoToScript
            key={item.id}
            transition={item}
            states={project.states}
            readOnly={readOnly}
            selected={item.id === selectedId}
            onSelect={() => setSelectedId(item.id)}
            onChange={save}
            onDelete={() => send(CLIENT_EVENTS.logicDeleteTransition, { transitionId: item.id })}
          />
        ))}
      </div>

      {!readOnly && (
        <div className="fixed inset-x-0 bottom-0 z-50 border-t border-line bg-[#07070c]/95 px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur-md">
          <p className="mb-1 text-sm font-bold">Блоки для «{currentState ? currentState.name : 'экрана'}»</p>
          <p className="mb-3 text-xs text-white/45">Как в Scratch: «когда» — что нажали, «если» — развилка</p>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {LOGIC_EVENTS.map((event) => (
              <button
                key={event}
                type="button"
                onClick={() => addWhen(event)}
                className="sb-chip is-event"
              >
                <span className="text-[11px] uppercase tracking-[0.14em] opacity-70">когда</span>
                <span className="mt-1 text-sm">{BLOCK_EVENT_SHORT[event]}</span>
              </button>
            ))}
            <button type="button" onClick={addOrToggleIf} className="sb-chip is-if">
              <span className="text-[11px] uppercase tracking-[0.14em] opacity-70">контроль</span>
              <span className="mt-1 text-sm">{target?.condition ? 'Убрать если' : 'Если'}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function defaultEvent(stateId: string): LogicEvent {
  return QA_MISSIONS.find((item) => item.startStateId === stateId)?.event ?? 'CLICK'
}

function defaultCondition(stateId: string, event: LogicEvent): ConditionProperty {
  if (event === 'CLICK_LIKE' || stateId === 'video') {
    return 'video.isLiked'
  }
  if (stateId === 'comments') {
    return 'comments.isOpen'
  }
  if (stateId === 'share') {
    return 'share.isOpen'
  }
  return 'video.isLiked'
}

const DEV_STEPS = [
  {
    title: 'Это как Scratch',
    body: 'Сверху выбери экран — как спрайт. Потом сложи скрипт из цветных блоков: что нажали и какой экран открыть.',
  },
  {
    title: 'Когда → открыть',
    body: 'Жёлтый блок — событие. Синий — куда пойти. Пример: когда нажали коммент → открыть Комменты.',
  },
  {
    title: 'Если — развилка',
    body: 'Оранжевый блок проверяет флаг: лайк стоит, комменты открыты. Баги от QA появятся над скриптами.',
  },
]
