import { useEffect, useRef, useState } from 'react'
import {
  CANVAS_WIDTH,
  CLIENT_EVENTS,
  LOGIC_EVENTS,
  applyAction,
  flagsForState,
  initialRuntimeStateId,
  layoutForState,
  runTest,
  type ClientGameState,
  type LogicEvent,
  type Player,
  type RuntimeFlags,
  type TestCase,
} from '@brainrot/shared'
import { Onboarding } from '../components/Onboarding'
import { newId, patch } from '../lib/patch'
import { ClipsRuntime } from '../runtime/ClipsRuntime'

type Props = {
  me?: Player
  state: ClientGameState
  onError: (message: string) => void
  readOnly?: boolean
}

export function QaWorkspace({ me, state, onError, readOnly }: Props) {
  const project = state.project
  const startFallback = initialRuntimeStateId(project) ?? project.states[0]?.id ?? ''
  const [startStateId, setStartStateId] = useState(startFallback)
  const [stateId, setStateId] = useState(startFallback)
  const [flags, setFlags] = useState<RuntimeFlags>(() => flagsForState(project, startFallback))
  const [steps, setSteps] = useState<LogicEvent[]>([])
  const [expectedStateId, setExpectedStateId] = useState(project.states[1]?.id ?? startFallback)
  const [lastEvent, setLastEvent] = useState<LogicEvent | null>(null)
  const [replaying, setReplaying] = useState(false)
  const playGen = useRef(0)

  const currentId = project.states.some((item) => item.id === stateId) ? stateId : startFallback
  const layout = layoutForState(project.design, currentId)
  const empty = !layout || layout.components.length === 0
  const scale = Math.min(0.62, (typeof window === 'undefined' ? 320 : window.innerWidth - 40) / CANVAS_WIDTH)

  const send = (event: (typeof CLIENT_EVENTS)[keyof typeof CLIENT_EVENTS], payload: unknown) =>
    patch(event, payload, onError)

  const resetTo = (nextId: string) => {
    playGen.current += 1
    setReplaying(false)
    setStartStateId(nextId)
    setStateId(nextId)
    setFlags(flagsForState(project, nextId))
    setSteps([])
    setLastEvent(null)
    setExpectedStateId(project.states.find((item) => item.id !== nextId)?.id ?? nextId)
  }

  useEffect(
    () => () => {
      playGen.current += 1
    },
    [],
  )

  const fire = (event: LogicEvent) => {
    if (readOnly || replaying) {
      return
    }
    const next = applyAction(project, currentId, event, flags)
    setSteps((items) => [...items, event])
    setStateId(next.stateId)
    setFlags(next.flags)
    setLastEvent(event)
  }

  const save = async () => {
    if (readOnly || steps.length === 0 || !startStateId || !expectedStateId) {
      return
    }
    const test: TestCase = {
      id: newId(),
      title: caseTitle(project, startStateId, steps, expectedStateId),
      startStateId,
      steps: steps.map((event) => ({ event })),
      expectedStateId,
      lastResult: null,
    }
    const origin = startStateId
    resetTo(origin)
    const ack = await send(CLIENT_EVENTS.qaUpsertTest, { test })
    if (!ack.ok) {
      return
    }
  }

  const replay = async (test: TestCase) => {
    const gen = ++playGen.current
    setReplaying(true)
    setStartStateId(test.startStateId)
    setStateId(test.startStateId)
    setFlags(flagsForState(project, test.startStateId))
    setSteps([])
    setExpectedStateId(test.expectedStateId)
    setLastEvent(null)

    let cursor = test.startStateId
    let cursorFlags = flagsForState(project, test.startStateId)
    const played: LogicEvent[] = []
    for (const step of test.steps) {
      setLastEvent(step.event)
      await sleep(280)
      if (playGen.current !== gen) {
        return
      }
      const next = applyAction(project, cursor, step.event, cursorFlags)
      played.push(step.event)
      cursor = next.stateId
      cursorFlags = next.flags
      setStateId(cursor)
      setFlags(cursorFlags)
      setSteps([...played])
      await sleep(480)
      if (playGen.current !== gen) {
        return
      }
    }

    setLastEvent(null)
    if (!readOnly) {
      await send(CLIENT_EVENTS.qaRunTest, { testId: test.id })
    } else {
      runTest(project, test)
    }
    if (playGen.current === gen) {
      setReplaying(false)
    }
  }

  const fileBug = (test: TestCase) => {
    if (!test.lastResult || test.lastResult.passed) {
      return
    }
    void send(CLIENT_EVENTS.qaUpsertBug, {
      bug: {
        id: newId(),
        title: test.title.slice(0, 40),
        description: test.title,
        steps: caseTitle(
          project,
          test.startStateId,
          test.steps.map((step) => step.event),
          test.expectedStateId,
        ),
        expected: nameOf(project, test.lastResult.expectedStateId),
        actual: nameOf(project, test.lastResult.actualStateId),
        severity: 'HIGH',
        createdBy: me?.name ?? 'QA',
      },
    })
  }

  return (
    <div className="space-y-4 pb-8">
      <Onboarding id="qa-record" steps={QA_STEPS} />

      <p className="text-xs uppercase tracking-[0.25em] text-white/40">Стартовый экран</p>
      <div className="-mt-2 flex gap-2 overflow-x-auto">
        {project.states.map((item) => (
          <button
            key={item.id}
            type="button"
            disabled={replaying}
            onClick={() => resetTo(item.id)}
            className={[
              'shrink-0 rounded-2xl px-3 py-2 text-sm font-bold',
              item.id === startStateId && steps.length === 0 ? 'bg-cyan text-ink' : 'bg-white/10',
              item.id === currentId && steps.length > 0 ? 'ring-2 ring-cyan' : '',
            ].join(' ')}
          >
            {item.name}
          </button>
        ))}
      </div>

      <div className="relative flex justify-center">
        <div className={steps.length > 0 && !replaying ? 'rec-pulse rounded-[2rem]' : ''}>
          <ClipsRuntime
            project={project}
            stateId={currentId || null}
            interactive={!readOnly && !replaying}
            onAction={fire}
            activeEvent={lastEvent}
            flags={flags}
            scale={scale}
          />
        </div>
      </div>

      <p className="text-center text-sm text-white/55">
        Сейчас: <span className="font-bold text-white">{nameOf(project, currentId)}</span>
        {empty ? ' · кнопок на макете нет' : ''}
        {replaying ? ' · прогон кейса' : steps.length > 0 ? ' · запись' : ''}
      </p>

      {steps.length > 0 && (
        <p className="text-center text-sm text-white/60">
          {nameOf(project, startStateId)} → {steps.map((step) => ACTION_NAME[step]).join(' → ')} →{' '}
          {nameOf(project, currentId)}
        </p>
      )}

      {empty && !readOnly && (
        <div className="grid grid-cols-4 gap-2">
          {LOGIC_EVENTS.map((event) => (
            <button
              key={event}
              type="button"
              disabled={replaying}
              onClick={() => fire(event)}
              className="rounded-2xl bg-white/10 py-3 text-sm font-bold"
            >
              {ACTION_NAME[event]}
            </button>
          ))}
        </div>
      )}

      {!readOnly && (
        <section className="rounded-3xl border border-line bg-panel p-4">
          <p className="text-xs uppercase tracking-[0.2em] text-white/40">Ожидаемый экран</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {project.states.map((item) => (
              <button
                key={item.id}
                type="button"
                disabled={replaying}
                onClick={() => setExpectedStateId(item.id)}
                className={[
                  'rounded-2xl px-3 py-2 text-sm font-bold',
                  item.id === expectedStateId ? 'bg-cyan text-ink' : 'bg-white/10',
                ].join(' ')}
              >
                {item.name}
              </button>
            ))}
          </div>
          {steps.length > 0 && (
            <p className="mt-3 text-sm text-white/55">
              Кейс: {caseTitle(project, startStateId, steps, expectedStateId)}
            </p>
          )}
          <div className="mt-4 grid grid-cols-2 gap-3">
            <button
              type="button"
              disabled={replaying}
              onClick={() => resetTo(startStateId)}
              className="rounded-2xl bg-white/10 py-3 font-bold"
            >
              Сбросить
            </button>
            <button
              type="button"
              disabled={replaying || steps.length === 0}
              onClick={() => void save()}
              className="rounded-2xl bg-cyan py-3 font-bold text-ink disabled:opacity-40"
            >
              Сохранить кейс
            </button>
          </div>
        </section>
      )}

      <section className="space-y-3">
        <h2 className="font-display text-2xl">Тест-кейсы</h2>
        {project.qa.testCases.length === 0 && (
          <p className="rounded-3xl border border-line bg-panel p-4 text-white/50">Пока нет ни одного кейса</p>
        )}
        {project.qa.testCases.map((test) => (
          <article key={test.id} className="rounded-3xl border border-line bg-panel p-4">
            <div className="flex items-start justify-between gap-2">
              <p className="font-display text-xl">{test.title}</p>
              {test.lastResult && (
                <span className={test.lastResult.passed ? 'text-cyan' : 'text-mag'}>
                  {test.lastResult.passed ? 'PASS' : 'FAIL'}
                </span>
              )}
            </div>
            <p className="mt-2 text-sm text-white/60">
              {nameOf(project, test.startStateId)} → {test.steps.map((step) => ACTION_NAME[step.event]).join(' → ')} →{' '}
              {nameOf(project, test.expectedStateId)}
            </p>
            {test.lastResult && !test.lastResult.passed && (
              <p className="mt-2 text-sm text-mag">
                Ожидали «{nameOf(project, test.lastResult.expectedStateId)}», получили «
                {nameOf(project, test.lastResult.actualStateId)}»
              </p>
            )}
            <div className="mt-3 flex flex-wrap gap-3">
              <button
                type="button"
                disabled={replaying}
                onClick={() => void replay(test)}
                className="rounded-2xl bg-cyan px-4 py-2 font-bold text-ink"
              >
                Запустить
              </button>
              {!readOnly && test.lastResult && !test.lastResult.passed && (
                <button type="button" onClick={() => fileBug(test)} className="rounded-2xl bg-mag px-4 py-2 font-bold">
                  Завести баг
                </button>
              )}
              {!readOnly && (
                <button
                  type="button"
                  onClick={() => void send(CLIENT_EVENTS.qaDeleteTest, { testId: test.id })}
                  className="text-mag"
                >
                  Удалить
                </button>
              )}
            </div>
          </article>
        ))}
      </section>

      {project.qa.bugs.length > 0 && (
        <section className="space-y-3">
          <h2 className="font-display text-2xl">Баги</h2>
          {project.qa.bugs.map((bug) => (
            <article key={bug.id} className="rounded-3xl border border-mag/30 bg-panel p-4">
              <p className="font-display text-xl">{bug.title}</p>
              <p className="mt-2 text-sm text-white/60">{bug.steps}</p>
              <p className="mt-2 text-sm text-white/50">Ожидали: {bug.expected}</p>
              <p className="text-sm text-white/50">Получили: {bug.actual}</p>
              {!readOnly && (
                <button
                  type="button"
                  onClick={() => void send(CLIENT_EVENTS.qaDeleteBug, { bugId: bug.id })}
                  className="mt-3 text-sm text-mag"
                >
                  Удалить
                </button>
              )}
            </article>
          ))}
        </section>
      )}
    </div>
  )
}

function caseTitle(
  project: ClientGameState['project'],
  startStateId: string,
  steps: LogicEvent[],
  expectedStateId: string,
) {
  return `${nameOf(project, startStateId)} → ${steps.map((step) => ACTION_NAME[step]).join(' → ')} → ${nameOf(project, expectedStateId)}`
}

function nameOf(project: ClientGameState['project'], id: string) {
  return project.states.find((item) => item.id === id)?.name ?? id
}

function sleep(ms: number) {
  return new Promise<void>((resolve) => {
    window.setTimeout(resolve, ms)
  })
}

const ACTION_NAME: Record<LogicEvent, string> = {
  CLICK: 'Тап',
  CLICK_LIKE: 'Лайк',
  CLICK_COMMENT: 'Коммент',
  CLICK_SHARE: 'Репост',
  SWIPE: 'Свайп',
  BACK: 'Назад',
  SUBMIT: 'Отправить',
  CLOSE: 'Закрыть',
}

const QA_STEPS = [
  {
    title: 'Кейс пишется на телефоне',
    body: 'Выберите стартовый экран и нажимайте кнопки в приложении. Каждый тап — шаг тест-кейса.',
  },
  {
    title: 'Потом укажите ожидаемый экран',
    body: 'Куда логика должна привести. Если Development ещё не сделал переход, экран не сменится — это нормально, ожидаемый всё равно выбираете вы.',
  },
  {
    title: 'Запуск повторяет запись',
    body: 'Кейс прогоняется по телефону и по настоящей логике. FAIL — можно завести баг в Development.',
  },
]
