import { useState } from 'react'
import {
  BUG_SEVERITIES,
  CLIENT_EVENTS,
  EVENT_LABELS,
  LOGIC_EVENTS,
  type BugSeverity,
  type ClientGameState,
  type LogicEvent,
  type Player,
  type TestCase,
} from '@brainrot/shared'
import { Onboarding } from '../components/Onboarding'
import { newId, patch } from '../lib/patch'

type Props = {
  me?: Player
  state: ClientGameState
  onError: (message: string) => void
  readOnly?: boolean
}

export function QaWorkspace({ me, state, onError, readOnly }: Props) {
  const project = state.project
  const [title, setTitle] = useState('Поставить лайк')
  const [startStateId, setStartStateId] = useState(project.logic.initialStateId ?? project.states[0]?.id ?? '')
  const [steps, setSteps] = useState<LogicEvent[]>(['CLICK_LIKE'])
  const [expectedStateId, setExpectedStateId] = useState(project.states[1]?.id ?? project.states[0]?.id ?? '')
  const [bugTitle, setBugTitle] = useState('')
  const [bugExpected, setBugExpected] = useState('')
  const [bugActual, setBugActual] = useState('')
  const [bugSteps, setBugSteps] = useState('')
  const [severity, setSeverity] = useState<BugSeverity>('HIGH')

  const send = (event: (typeof CLIENT_EVENTS)[keyof typeof CLIENT_EVENTS], payload: unknown) =>
    patch(event, payload, onError)

  const saveTest = async () => {
    const test: TestCase = {
      id: newId(),
      title,
      startStateId,
      steps: steps.map((event) => ({ event })),
      expectedStateId,
      lastResult: null,
    }
    await send(CLIENT_EVENTS.qaUpsertTest, { test })
  }

  return (
    <div className="space-y-4 pb-8">
      <Onboarding id="qa" steps={QA_STEPS} />
      <section className="space-y-3">
        <h2 className="font-display text-2xl">Тест-кейсы</h2>
        {project.qa.testCases.length === 0 && (
          <p className="rounded-3xl border border-line bg-panel p-4 text-white/50">Тестов пока нет</p>
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
              {nameOf(project, test.startStateId)} → {test.steps.map((step) => EVENT_LABELS[step.event]).join(' → ')}{' '}
              → {nameOf(project, test.expectedStateId)}
            </p>
            {test.lastResult && !test.lastResult.passed && (
              <p className="mt-2 text-sm text-mag">
                Expected: {nameOf(project, test.lastResult.expectedStateId)}
                <br />
                Actual: {nameOf(project, test.lastResult.actualStateId)}
              </p>
            )}
            {!readOnly && (
              <div className="mt-3 flex gap-3">
                <button
                  type="button"
                  onClick={() => void send(CLIENT_EVENTS.qaRunTest, { testId: test.id })}
                  className="rounded-2xl bg-cyan px-4 py-2 font-bold text-ink"
                >
                  RUN TEST
                </button>
                <button
                  type="button"
                  onClick={() => void send(CLIENT_EVENTS.qaDeleteTest, { testId: test.id })}
                  className="text-mag"
                >
                  Удалить
                </button>
              </div>
            )}
          </article>
        ))}
      </section>

      {!readOnly && (
        <section className="rounded-3xl border border-cyan/30 bg-panel p-4">
          <h2 className="font-display text-2xl">Новый тест</h2>
          <input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            className="mt-3 w-full rounded-2xl border border-line bg-ink px-3 py-3"
            placeholder="Название"
          />
          <p className="mt-3 text-xs uppercase tracking-[0.2em] text-white/40">Start</p>
          <StateSelect project={project} value={startStateId} onChange={setStartStateId} />
          <p className="mt-3 text-xs uppercase tracking-[0.2em] text-white/40">Steps</p>
          {steps.map((step, index) => (
            <div key={`${step}-${index}`} className="mt-2 flex gap-2">
              <select
                value={step}
                onChange={(event) => {
                  const next = [...steps]
                  next[index] = event.target.value as LogicEvent
                  setSteps(next)
                }}
                className="flex-1 rounded-2xl bg-ink px-3 py-3"
              >
                {LOGIC_EVENTS.map((item) => (
                  <option key={item} value={item}>
                    {EVENT_LABELS[item]}
                  </option>
                ))}
              </select>
              {steps.length > 1 && (
                <button
                  type="button"
                  onClick={() => setSteps(steps.filter((_, itemIndex) => itemIndex !== index))}
                  className="text-mag"
                >
                  ×
                </button>
              )}
            </div>
          ))}
          <button
            type="button"
            onClick={() => setSteps([...steps, 'CLICK'])}
            className="mt-2 text-sm text-cyan"
          >
            + шаг
          </button>
          <p className="mt-3 text-xs uppercase tracking-[0.2em] text-white/40">Expected</p>
          <StateSelect project={project} value={expectedStateId} onChange={setExpectedStateId} />
          <button
            type="button"
            onClick={() => void saveTest()}
            className="mt-4 w-full rounded-2xl bg-cyan py-4 text-lg font-bold text-ink"
          >
            Сохранить тест
          </button>
        </section>
      )}

      <section className="space-y-3">
        <h2 className="font-display text-2xl">Bugs</h2>
        {project.qa.bugs.map((bug) => (
          <article key={bug.id} className="rounded-3xl border border-mag/30 bg-panel p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-mag">{bug.severity}</p>
            <p className="mt-1 font-display text-xl">{bug.title}</p>
            <p className="mt-2 text-sm text-white/70">{bug.description}</p>
            <p className="mt-2 text-sm text-white/50">Expected: {bug.expected}</p>
            <p className="text-sm text-white/50">Actual: {bug.actual}</p>
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

      {!readOnly && (
        <section className="rounded-3xl border border-mag/30 bg-panel p-4">
          <h2 className="font-display text-2xl">Новый bug</h2>
          <input
            value={bugTitle}
            onChange={(event) => setBugTitle(event.target.value)}
            placeholder="Заголовок"
            className="mt-3 w-full rounded-2xl border border-line bg-ink px-3 py-3"
          />
          <textarea
            value={bugSteps}
            onChange={(event) => setBugSteps(event.target.value)}
            placeholder="Шаги"
            className="mt-3 w-full rounded-2xl border border-line bg-ink px-3 py-3"
          />
          <input
            value={bugExpected}
            onChange={(event) => setBugExpected(event.target.value)}
            placeholder="Expected"
            className="mt-3 w-full rounded-2xl border border-line bg-ink px-3 py-3"
          />
          <input
            value={bugActual}
            onChange={(event) => setBugActual(event.target.value)}
            placeholder="Actual"
            className="mt-3 w-full rounded-2xl border border-line bg-ink px-3 py-3"
          />
          <div className="mt-3 grid grid-cols-3 gap-2">
            {BUG_SEVERITIES.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setSeverity(item)}
                className={[
                  'rounded-2xl py-3 text-sm font-bold',
                  severity === item ? 'bg-mag text-white' : 'bg-white/10',
                ].join(' ')}
              >
                {item}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => {
              if (!bugTitle.trim()) {
                return
              }
              void send(CLIENT_EVENTS.qaUpsertBug, {
                bug: {
                  id: newId(),
                  title: bugTitle.trim(),
                  description: bugTitle.trim(),
                  steps: bugSteps,
                  expected: bugExpected,
                  actual: bugActual,
                  severity,
                  createdBy: me?.name ?? 'QA',
                },
              })
              setBugTitle('')
              setBugSteps('')
              setBugExpected('')
              setBugActual('')
            }}
            className="mt-4 w-full rounded-2xl bg-mag py-4 text-lg font-bold"
          >
            Создать bug
          </button>
        </section>
      )}
    </div>
  )
}

function nameOf(project: ClientGameState['project'], id: string) {
  return project.states.find((item) => item.id === id)?.name ?? id
}

function StateSelect({
  project,
  value,
  onChange,
}: {
  project: ClientGameState['project']
  value: string
  onChange: (value: string) => void
}) {
  return (
    <select
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className="mt-1 w-full rounded-2xl bg-ink px-3 py-3"
    >
      {project.states.map((item) => (
        <option key={item.id} value={item.id}>
          {item.screenKey} / {item.name}
        </option>
      ))}
    </select>
  )
}

const QA_STEPS = [
  {
    title: 'Вы проверяете чужую работу',
    body: 'Правильных ответов нет. Соберите сценарий: с какого состояния начать, какое действие нажать, куда должно прийти приложение.',
  },
  {
    title: 'RUN TEST — это настоящий запуск',
    body: 'Система прогоняет логику Development. PASS значит переход совпал. FAIL — покажем Expected и Actual. Если тест красный, заведите bug.',
  },
]
