import { useRef, useState, type PointerEvent } from 'react'
import {
  CANVAS_HEIGHT,
  CANVAS_WIDTH,
  CLIENT_EVENTS,
  COMPONENT_HINTS,
  COMPONENT_ICONS,
  COMPONENT_LABELS,
  DEFAULT_COMPONENT_BOX,
  SCREEN_COMPONENTS,
  SCREEN_LABELS,
  SIZE_PRESETS,
  SIZE_PRESET_BOX,
  layoutForState,
  presetHint,
  type ClientGameState,
  type ComponentType,
  type DesignComponent,
} from '@brainrot/shared'
import { ComponentView, PhoneFrame } from '../runtime/ShortsRuntime'
import { Onboarding } from '../components/Onboarding'
import { newId, patch } from '../lib/patch'

type Props = {
  state: ClientGameState
  onError: (message: string) => void
  readOnly?: boolean
}

export function DesignWorkspace({ state, onError, readOnly }: Props) {
  const project = state.project
  const [stateId, setStateId] = useState(project.logic.initialStateId ?? project.states[0]?.id ?? '')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [pending, setPending] = useState<DesignComponent[]>([])
  const [flash, setFlash] = useState<string | null>(null)
  const drag = useRef<{ id: string; dx: number; dy: number } | null>(null)
  const frameRef = useRef<HTMLDivElement>(null)

  const currentId = project.states.some((item) => item.id === stateId) ? stateId : project.states[0]?.id
  const currentState = project.states.find((item) => item.id === currentId)
  const layout = currentId ? layoutForState(project.design, currentId) : undefined
  const serverIds = new Set((layout?.components ?? []).map((item) => item.id))
  const components = [
    ...(layout?.components ?? []),
    ...pending.filter((item) => !serverIds.has(item.id)),
  ]
  const selected = components.find((item) => item.id === selectedId) ?? null
  const scale = Math.min(0.58, (typeof window === 'undefined' ? 320 : window.innerWidth - 40) / CANVAS_WIDTH)

  const send = (event: (typeof CLIENT_EVENTS)[keyof typeof CLIENT_EVENTS], payload: unknown) =>
    patch(event, payload, onError)

  const addComponent = (type: ComponentType) => {
    if (readOnly) {
      onError('Сейчас нельзя редактировать макет')
      return
    }
    if (!currentId) {
      onError('Нет экрана для макета')
      return
    }
    const box = DEFAULT_COMPONENT_BOX[type]
    const stack = components.filter((item) => item.type === type).length
    const y = Math.min(box.y + stack * (box.h + 8), CANVAS_HEIGHT - box.h)
    const x =
      type === 'BUBBLE' && stack % 2 === 1
        ? Math.max(16, CANVAS_WIDTH - box.w - 16)
        : box.x
    const component: DesignComponent = {
      id: newId(),
      type,
      ...box,
      x,
      y,
      props: {
        ...defaultProps(type, currentState?.screenKey),
        ...(type === 'BUBBLE' ? { active: stack % 2 === 1 } : {}),
      },
    }
    setSelectedId(component.id)
    setPending((items) => [...items, component])
    setFlash(`${COMPONENT_ICONS[type]} ${COMPONENT_LABELS[type]}: ${COMPONENT_HINTS[type]}`)
    window.setTimeout(() => setFlash(null), 1400)
    void send(CLIENT_EVENTS.designUpsertComponent, { stateId: currentId, component }).then((ack) => {
      if (!ack.ok) {
        setPending((items) => items.filter((item) => item.id !== component.id))
      }
    })
  }

  const upsert = (component: DesignComponent) => {
    if (!currentId || readOnly) {
      return
    }
    void send(CLIENT_EVENTS.designUpsertComponent, { stateId: currentId, component })
  }

  const removeComponent = (componentId: string) => {
    if (readOnly) {
      return
    }
    setPending((items) => items.filter((item) => item.id !== componentId))
    setSelectedId((id) => (id === componentId ? null : id))
    if (!currentId || !serverIds.has(componentId)) {
      return
    }
    void send(CLIENT_EVENTS.designDeleteComponent, { stateId: currentId, componentId })
  }

  const onPointerDown = (event: PointerEvent<HTMLDivElement>, component: DesignComponent) => {
    if (readOnly) {
      return
    }
    event.preventDefault()
    event.currentTarget.setPointerCapture(event.pointerId)
    setSelectedId(component.id)
    const rect = frameRef.current?.getBoundingClientRect()
    if (!rect) {
      return
    }
    drag.current = {
      id: component.id,
      dx: (event.clientX - rect.left) / scale - component.x,
      dy: (event.clientY - rect.top) / scale - component.y,
    }
  }

  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (!drag.current || !currentId) {
      return
    }
    const rect = frameRef.current?.getBoundingClientRect()
    if (!rect) {
      return
    }
    const component = components.find((item) => item.id === drag.current?.id)
    if (!component) {
      return
    }
    const x = Math.round((event.clientX - rect.left) / scale - drag.current.dx)
    const y = Math.round((event.clientY - rect.top) / scale - drag.current.dy)
    const next = { ...component, x, y }
    setPending((items) => items.map((item) => (item.id === next.id ? next : item)))
    upsert(next)
  }

  const onPointerUp = () => {
    drag.current = null
  }

  return (
    <div className="space-y-4 pb-52">
      <Onboarding id="design" steps={DESIGN_STEPS} />

      <p className="text-xs font-semibold uppercase tracking-[0.25em] text-white/40">Какой экран рисуешь</p>
      <div className="flex gap-2 overflow-x-auto">
        {project.states.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setStateId(item.id)}
            className={[
              'shrink-0 rounded-2xl px-3 py-2 text-sm font-bold',
              item.id === currentId ? 'bg-cyan text-ink' : 'bg-white/10',
            ].join(' ')}
          >
            {item.name}
          </button>
        ))}
      </div>
      {currentState && (
        <p className="text-sm text-white/55">
          {SCREEN_LABELS[currentState.screenKey]} · {presetHint(currentState.id)}
        </p>
      )}

      <div className="relative z-0 flex justify-center">
        <div
          ref={frameRef}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
        >
          <PhoneFrame scale={scale}>
            <div className="relative h-full w-full bg-[#07070c] touch-none">
              {components.map((component) => (
                <ComponentView
                  key={component.id}
                  component={component}
                  selected={component.id === selectedId}
                  scale={scale}
                  onPointerDown={(event) => onPointerDown(event, component)}
                />
              ))}
              {components.length === 0 && (
                <div className="flex h-full flex-col items-center justify-center px-8 text-center text-white/45">
                  <p className="text-lg font-semibold">Пустой экран</p>
                  <p className="mt-2 text-sm leading-snug">
                    {EMPTY_HINTS[currentState?.screenKey ?? 'VIDEO']}
                  </p>
                </div>
              )}
            </div>
          </PhoneFrame>
        </div>
      </div>

      {selected && !readOnly && (
        <section className="relative z-10 rounded-3xl border border-line bg-panel p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="font-display text-xl">
                {COMPONENT_ICONS[selected.type]} {COMPONENT_LABELS[selected.type]}
              </p>
              <p className="mt-1 text-sm text-white/55">{COMPONENT_HINTS[selected.type]}</p>
            </div>
          </div>
          <button
            type="button"
            onPointerDown={(event) => event.stopPropagation()}
            onClick={() => removeComponent(selected.id)}
            className="mt-3 w-full rounded-2xl bg-mag/20 py-3 font-bold text-mag"
          >
            Удалить с макета
          </button>
          <div className="mt-3 grid grid-cols-3 gap-2">
            {SIZE_PRESETS.map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => upsert({ ...selected, ...SIZE_PRESET_BOX[preset] })}
                className="rounded-2xl bg-white/10 py-3 font-bold"
              >
                {preset}
              </button>
            ))}
          </div>
          {(selected.type === 'TEXT' ||
            selected.type === 'BUTTON' ||
            selected.type === 'VIDEO' ||
            selected.type === 'CHAT_ROW' ||
            selected.type === 'BUBBLE' ||
            selected.type === 'CAMERA') && (
            <input
              value={selected.props.text ?? ''}
              onChange={(event) =>
                upsert({ ...selected, props: { ...selected.props, text: event.target.value } })
              }
              placeholder={selected.type === 'CHAT_ROW' ? 'Имя' : 'Текст'}
              className="mt-3 w-full rounded-2xl border border-line bg-ink px-3 py-3"
            />
          )}
          {(selected.type === 'INPUT' || selected.type === 'SEARCH' || selected.type === 'CHAT_ROW') && (
            <input
              value={selected.props.placeholder ?? ''}
              onChange={(event) =>
                upsert({ ...selected, props: { ...selected.props, placeholder: event.target.value } })
              }
              placeholder={selected.type === 'CHAT_ROW' ? 'Последнее сообщение' : 'Подсказка в поле'}
              className="mt-3 w-full rounded-2xl border border-line bg-ink px-3 py-3"
            />
          )}
          {selected.type === 'LIKE' && (
            <button
              type="button"
              onClick={() =>
                upsert({
                  ...selected,
                  props: { ...selected.props, active: !selected.props.active },
                })
              }
              className="mt-3 w-full rounded-2xl bg-mag/20 py-3 font-bold text-mag"
            >
              {selected.props.active ? 'Лайк активен' : 'Лайк выключен'}
            </button>
          )}
          {selected.type === 'BUBBLE' && (
            <button
              type="button"
              onClick={() =>
                upsert({
                  ...selected,
                  props: { ...selected.props, active: !selected.props.active },
                })
              }
              className="mt-3 w-full rounded-2xl bg-cyan/20 py-3 font-bold text-cyan"
            >
              {selected.props.active ? 'Моё сообщение' : 'Входящее сообщение'}
            </button>
          )}
        </section>
      )}

      {flash && (
        <div className="pointer-events-none fixed inset-x-0 bottom-44 z-[60] flex justify-center px-4">
          <p className="max-w-sm rounded-2xl bg-cyan px-4 py-2 text-center text-sm font-bold text-ink">{flash}</p>
        </div>
      )}

      {!readOnly && (
        <div className="fixed inset-x-0 bottom-0 z-50 border-t border-line bg-[#07070c]/95 px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur-md">
          <p className="mb-1 text-sm font-bold">
            Детали для «{currentState ? currentState.name : 'экрана'}»
          </p>
          <p className="mb-3 text-xs text-white/45">Набор меняется вместе с экраном сверху</p>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {(currentState ? SCREEN_COMPONENTS[currentState.screenKey] : []).map((type) => (
              <button
                key={type}
                type="button"
                onPointerDown={(event) => event.stopPropagation()}
                onClick={() => addComponent(type)}
                className="w-[7.5rem] shrink-0 rounded-2xl bg-cyan/15 px-3 py-3 text-left"
              >
                <p className="text-xl leading-none">{COMPONENT_ICONS[type]}</p>
                <p className="mt-2 text-sm font-bold text-cyan">{COMPONENT_LABELS[type]}</p>
                <p className="mt-1 text-[11px] leading-snug text-white/55">{COMPONENT_HINTS[type]}</p>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

const DESIGN_STEPS = [
  {
    title: 'Экраны уже есть',
    body: 'Не нужно придумывать стейты. Сверху экраны: Клип, Съёмка, Чаты, Сообщение — рисуй каждый макет.',
  },
  {
    title: 'Два вида одного клипа',
    body: '«Клип» — обычное видео. «Клип с лайком» — то же самое, но сердечко красное. Development потом свяжет их переходом.',
  },
  {
    title: 'Двигайте пальцем',
    body: 'Тапни деталь на макете, перетащи, размер — S / M / L. Внизу только детали текущего экрана: у Съёмки — камера, у Чатов — строки переписок.',
  },
]

function defaultProps(
  type: ComponentType,
  screenKey?: ClientGameState['project']['states'][number]['screenKey'],
): DesignComponent['props'] {
  switch (type) {
    case 'LIKE':
      return { active: false }
    case 'TEXT':
      return { text: 'Текст' }
    case 'BUTTON':
      if (screenKey === 'CREATE') {
        return { text: 'Эффекты' }
      }
      if (screenKey === 'INBOX') {
        return { text: 'Написать' }
      }
      if (screenKey === 'COMPOSE') {
        return { text: 'Назад' }
      }
      if (screenKey === 'PROFILE') {
        return { text: 'Подписаться' }
      }
      return { text: 'Кнопка' }
    case 'VIDEO':
      return { text: 'Клип' }
    case 'INPUT':
      return { placeholder: screenKey === 'COMPOSE' ? 'Сообщение' : 'Комментарий' }
    case 'CAMERA':
      return { text: 'Камера' }
    case 'RECORD':
      return { text: 'Снять' }
    case 'CHAT_ROW':
      return { text: 'Маша', placeholder: 'Привет!' }
    case 'BUBBLE':
      return { text: 'Привет!', active: false }
    case 'SEND':
      return { text: 'Отправить' }
    case 'SEARCH':
      return { placeholder: 'Найти чат' }
    default:
      return {}
  }
}

const EMPTY_HINTS: Record<string, string> = {
  VIDEO: 'Добавь Видео и Лайк — как в ТикТоке',
  FEED: 'Добавь превью роликов и меню',
  COMMENTS: 'Добавь аватар, текст комментария и поле ввода',
  PROFILE: 'Добавь аватар, имя и кнопку «Подписаться»',
  SHARE: 'Добавь кнопки «куда отправить»',
  CREATE: 'Добавь Камеру и кнопку Снять',
  INBOX: 'Добавь Поиск и строки чатов',
  COMPOSE: 'Добавь пузыри сообщений, поле ввода и Отправить',
}
