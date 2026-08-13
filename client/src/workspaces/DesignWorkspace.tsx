import { useRef, useState, type PointerEvent } from 'react'
import {
  CANVAS_WIDTH,
  CLIENT_EVENTS,
  COMPONENT_LABELS,
  COMPONENT_TYPES,
  DEFAULT_COMPONENT_BOX,
  SCREEN_KEYS,
  SCREEN_LABELS,
  SIZE_PRESETS,
  SIZE_PRESET_BOX,
  layoutForState,
  type ClientGameState,
  type ComponentType,
  type DesignComponent,
  type ScreenKey,
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
  const [screenKey, setScreenKey] = useState<ScreenKey>(project.design.screens[0] ?? 'VIDEO')
  const [stateId, setStateId] = useState(project.states[0]?.id ?? '')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [newName, setNewName] = useState('')
  const drag = useRef<{ id: string; dx: number; dy: number } | null>(null)
  const frameRef = useRef<HTMLDivElement>(null)

  const states = project.states.filter((item) => item.screenKey === screenKey)
  const currentId = states.some((item) => item.id === stateId) ? stateId : states[0]?.id
  const layout = currentId ? layoutForState(project.design, currentId) : undefined
  const selected = layout?.components.find((item) => item.id === selectedId) ?? null
  const scale = Math.min(0.58, (typeof window === 'undefined' ? 320 : window.innerWidth - 40) / CANVAS_WIDTH)

  const send = (event: (typeof CLIENT_EVENTS)[keyof typeof CLIENT_EVENTS], payload: unknown) =>
    patch(event, payload, onError)

  const addComponent = (type: ComponentType) => {
    if (readOnly) {
      onError('Сейчас нельзя редактировать макет')
      return
    }
    if (!currentId) {
      onError('Сначала создай состояние: напиши DEFAULT или LIKED и нажми +')
      return
    }
    const box = DEFAULT_COMPONENT_BOX[type]
    const component: DesignComponent = {
      id: newId(),
      type,
      ...box,
      props: defaultProps(type),
    }
    setSelectedId(component.id)
    void send(CLIENT_EVENTS.designUpsertComponent, { stateId: currentId, component })
  }

  const upsert = (component: DesignComponent) => {
    if (!currentId || readOnly) {
      return
    }
    void send(CLIENT_EVENTS.designUpsertComponent, { stateId: currentId, component })
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
    if (!drag.current || !layout || !currentId) {
      return
    }
    const rect = frameRef.current?.getBoundingClientRect()
    if (!rect) {
      return
    }
    const component = layout.components.find((item) => item.id === drag.current?.id)
    if (!component) {
      return
    }
    const x = Math.round((event.clientX - rect.left) / scale - drag.current.dx)
    const y = Math.round((event.clientY - rect.top) / scale - drag.current.dy)
    upsert({ ...component, x, y })
  }

  const onPointerUp = () => {
    drag.current = null
  }

  return (
    <div className="space-y-4 pb-36">
      <Onboarding id="design" steps={DESIGN_STEPS} />

      <div className="flex gap-2 overflow-x-auto">
        {SCREEN_KEYS.map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => {
              setScreenKey(key)
              const first = project.states.find((item) => item.screenKey === key)
              if (first) {
                setStateId(first.id)
              }
              if (!project.design.screens.includes(key) && !readOnly) {
                void send(CLIENT_EVENTS.designSetScreens, {
                  screens: [...project.design.screens, key],
                })
              }
            }}
            className={[
              'rounded-full px-3 py-2 text-sm font-bold',
              screenKey === key ? 'bg-cyan text-ink' : 'bg-white/10',
            ].join(' ')}
          >
            {SCREEN_LABELS[key]}
          </button>
        ))}
      </div>

      <div className="flex gap-2 overflow-x-auto">
        {states.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setStateId(item.id)}
            className={[
              'rounded-2xl px-3 py-2 text-sm',
              item.id === currentId ? 'bg-gold text-ink' : 'bg-white/10',
            ].join(' ')}
          >
            {item.name}
          </button>
        ))}
      </div>

      {!readOnly && (
        <div className="flex gap-2">
          <input
            value={newName}
            onChange={(event) => setNewName(event.target.value)}
            placeholder="Название state, например LIKED"
            className="flex-1 rounded-2xl border border-line bg-panel px-3 py-3"
          />
          <button
            type="button"
            onClick={() => {
              if (!newName.trim()) {
                onError('Напиши название состояния')
                return
              }
              void send(CLIENT_EVENTS.projectCreateState, { name: newName.trim(), screenKey })
              setNewName('')
            }}
            className="rounded-2xl bg-white/10 px-4 font-bold"
          >
            +
          </button>
          {currentId && (
            <button
              type="button"
              onClick={() =>
                void send(CLIENT_EVENTS.designDuplicateState, {
                  stateId: currentId,
                  name: `${states.find((item) => item.id === currentId)?.name ?? 'STATE'}_LIKED`,
                })
              }
              className="rounded-2xl bg-white/10 px-3 text-sm"
            >
              Дубль
            </button>
          )}
        </div>
      )}

      <div className="relative z-0 flex justify-center">
        <div
          ref={frameRef}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
        >
          <PhoneFrame scale={scale}>
            <div className="absolute inset-0 bg-[#07070c]">
              {(layout?.components ?? []).map((component) => (
                <div
                  key={component.id}
                  onPointerDown={(event) => onPointerDown(event, component)}
                >
                  <ComponentView component={component} selected={component.id === selectedId} />
                </div>
              ))}
              {(layout?.components.length ?? 0) === 0 && (
                <div className="flex h-full items-center justify-center px-8 text-center text-white/35">
                  Нажми Video или Like в панели внизу экрана
                </div>
              )}
            </div>
          </PhoneFrame>
        </div>
      </div>

      {selected && !readOnly && (
        <section className="relative z-10 rounded-3xl border border-line bg-panel p-4">
          <div className="flex items-center justify-between">
            <p className="font-display text-xl">{COMPONENT_LABELS[selected.type]}</p>
            <button
              type="button"
              onClick={() =>
                currentId &&
                void send(CLIENT_EVENTS.designDeleteComponent, {
                  stateId: currentId,
                  componentId: selected.id,
                })
              }
              className="text-mag"
            >
              Удалить
            </button>
          </div>
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
          {(selected.type === 'TEXT' || selected.type === 'BUTTON' || selected.type === 'VIDEO') && (
            <input
              value={selected.props.text ?? ''}
              onChange={(event) =>
                upsert({ ...selected, props: { ...selected.props, text: event.target.value } })
              }
              placeholder="Текст"
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
        </section>
      )}

      {!readOnly && (
        <div className="fixed inset-x-0 bottom-0 z-50 border-t border-line bg-[#07070c]/95 px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur-md">
          <p className="mb-2 text-center text-[10px] font-semibold uppercase tracking-[0.25em] text-white/45">
            Добавить на макет
          </p>
          <div className="mx-auto grid max-w-xl grid-cols-4 gap-2">
            {COMPONENT_TYPES.map((type) => (
              <button
                key={type}
                type="button"
                onPointerDown={(event) => event.stopPropagation()}
                onClick={() => addComponent(type)}
                className="rounded-2xl bg-cyan/15 px-2 py-3 text-xs font-bold text-cyan"
              >
                {COMPONENT_LABELS[type]}
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
    title: 'Вы собираете экран SHORTS',
    body: 'Это не Figma. Внизу экрана — кнопки компонентов. Нажми Video, потом Like — они появятся на макете телефона.',
  },
  {
    title: 'Состояния важнее картинки',
    body: 'DEFAULT — обычное видео. Нажми «Дубль», назови LIKED и включи «Лайк активен». Финальное приложение переключает эти макеты.',
  },
  {
    title: 'Двигайте пальцем',
    body: 'Тапни компонент на макете, перетащи его, размер меняй кнопками S / M / L. Панель с Video и Like всегда внизу экрана.',
  },
]

function defaultProps(type: ComponentType): DesignComponent['props'] {
  switch (type) {
    case 'LIKE':
      return { active: false }
    case 'TEXT':
      return { text: 'Текст' }
    case 'BUTTON':
      return { text: 'Кнопка' }
    case 'VIDEO':
      return { text: 'Клип' }
    case 'INPUT':
      return { placeholder: 'Комментарий' }
    default:
      return {}
  }
}
