import { useEffect, useRef, useState, type CSSProperties, type PointerEvent } from 'react'
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
import { ComponentView, PhoneFrame } from '../runtime/ClipsRuntime'
import { Onboarding } from '../components/Onboarding'
import { newId, patch } from '../lib/patch'

type Props = {
  state: ClientGameState
  onError: (message: string) => void
  readOnly?: boolean
}

type Handle = 'n' | 's' | 'e' | 'w' | 'ne' | 'nw' | 'se' | 'sw'

type Drag =
  | { mode: 'move'; id: string; stateId: string; dx: number; dy: number }
  | {
      mode: 'resize'
      id: string
      stateId: string
      handle: Handle
      startX: number
      startY: number
      startW: number
      startH: number
    }

type PendingItem = { stateId: string; component: DesignComponent }

const HANDLES: Handle[] = ['n', 's', 'e', 'w', 'ne', 'nw', 'se', 'sw']
const PRESET_TYPES = new Set<ComponentType>([
  'TEXT',
  'BUTTON',
  'LIKE',
  'COMMENT',
  'SHARE',
  'AVATAR',
  'INPUT',
  'SEARCH',
  'SEND',
  'RECORD',
])

export function DesignWorkspace({ state, onError, readOnly }: Props) {
  const project = state.project
  const [stateId, setStateId] = useState(project.logic.initialStateId ?? project.states[0]?.id ?? '')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [pending, setPending] = useState<PendingItem[]>([])
  const [flash, setFlash] = useState<string | null>(null)
  const drag = useRef<Drag | null>(null)
  const frameRef = useRef<HTMLDivElement>(null)

  const currentId = project.states.some((item) => item.id === stateId) ? stateId : project.states[0]?.id
  const currentState = project.states.find((item) => item.id === currentId)
  const layout = currentId ? layoutForState(project.design, currentId) : undefined
  const serverIds = new Set((layout?.components ?? []).map((item) => item.id))
  const components = mergeComponents(layout?.components ?? [], pending, currentId)
  const selected = components.find((item) => item.id === selectedId) ?? null
  const scale = Math.min(0.58, (typeof window === 'undefined' ? 320 : window.innerWidth - 40) / CANVAS_WIDTH)

  useEffect(() => {
    drag.current = null
    setSelectedId(null)
    setPending((items) => items.filter((item) => item.stateId === currentId))
  }, [currentId])

  const send = (event: (typeof CLIENT_EVENTS)[keyof typeof CLIENT_EVENTS], payload: unknown) =>
    patch(event, payload, onError)

  const commit = (component: DesignComponent, targetStateId = currentId, persist = true) => {
    if (!targetStateId || readOnly) {
      return
    }
    setPending((items) => {
      const next = { stateId: targetStateId, component }
      const index = items.findIndex((item) => item.component.id === component.id)
      if (index >= 0) {
        const copy = [...items]
        copy[index] = next
        return copy
      }
      return [...items, next]
    })
    if (persist) {
      void send(CLIENT_EVENTS.designUpsertComponent, { stateId: targetStateId, component })
    }
  }

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
    commit(component)
    setFlash(`${COMPONENT_ICONS[type]} ${COMPONENT_LABELS[type]}: ${COMPONENT_HINTS[type]}`)
    window.setTimeout(() => setFlash(null), 1400)
  }

  const removeComponent = (componentId: string) => {
    if (readOnly) {
      return
    }
    setPending((items) => items.filter((item) => item.component.id !== componentId))
    setSelectedId((id) => (id === componentId ? null : id))
    if (!currentId || !serverIds.has(componentId)) {
      return
    }
    void send(CLIENT_EVENTS.designDeleteComponent, { stateId: currentId, componentId })
  }

  const canvasPoint = (event: PointerEvent<HTMLElement>) => {
    const rect = frameRef.current?.getBoundingClientRect()
    if (!rect) {
      return null
    }
    return {
      x: (event.clientX - rect.left) / scale,
      y: (event.clientY - rect.top) / scale,
    }
  }

  const onMoveDown = (event: PointerEvent<HTMLDivElement>, component: DesignComponent) => {
    if (readOnly || !currentId) {
      return
    }
    event.preventDefault()
    event.currentTarget.setPointerCapture(event.pointerId)
    setSelectedId(component.id)
    const point = canvasPoint(event)
    if (!point) {
      return
    }
    drag.current = {
      mode: 'move',
      id: component.id,
      stateId: currentId,
      dx: point.x - component.x,
      dy: point.y - component.y,
    }
  }

  const onResizeDown = (event: PointerEvent<HTMLDivElement>, component: DesignComponent, handle: Handle) => {
    if (readOnly || !currentId) {
      return
    }
    event.preventDefault()
    event.stopPropagation()
    event.currentTarget.setPointerCapture(event.pointerId)
    setSelectedId(component.id)
    drag.current = {
      mode: 'resize',
      id: component.id,
      stateId: currentId,
      handle,
      startX: component.x,
      startY: component.y,
      startW: component.w,
      startH: component.h,
    }
  }

  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const active = drag.current
    if (!active) {
      return
    }
    const point = canvasPoint(event)
    const component = components.find((item) => item.id === active.id)
    if (!point || !component) {
      return
    }
    if (active.mode === 'move') {
      commit(
        {
          ...component,
          x: Math.round(point.x - active.dx),
          y: Math.round(point.y - active.dy),
        },
        active.stateId,
        false,
      )
      return
    }
    commit(
      {
        ...component,
        ...resizeBox(active, point.x, point.y),
      },
      active.stateId,
      false,
    )
  }

  const onPointerUp = () => {
    const active = drag.current
    drag.current = null
    if (!active) {
      return
    }
    const component = components.find((item) => item.id === active.id)
    if (component) {
      commit(component, active.stateId)
    }
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

      <div className="design-stage relative z-0 flex justify-center rounded-[2rem] py-5">
        <div
          ref={frameRef}
          className="relative touch-none"
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
        >
          <PhoneFrame scale={scale}>
            <div key={currentId} className="relative h-full w-full bg-[#0b0b12]">
              {components.map((component) => (
                <ComponentView
                  key={component.id}
                  component={component}
                  selected={false}
                  scale={scale}
                  onPointerDown={(event) => onMoveDown(event, component)}
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
          {selected && !readOnly && (
            <ResizeFrame
              component={selected}
              scale={scale}
              onResizeDown={onResizeDown}
            />
          )}
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
            <p className="shrink-0 rounded-full bg-white/10 px-3 py-1 text-xs text-white/55">
              {selected.w}×{selected.h}
            </p>
          </div>
          <button
            type="button"
            onPointerDown={(event) => event.stopPropagation()}
            onClick={() => removeComponent(selected.id)}
            className="mt-3 w-full rounded-2xl bg-mag/20 py-3 font-bold text-mag"
          >
            Удалить с макета
          </button>
          {PRESET_TYPES.has(selected.type) ? (
            <div className="mt-3 grid grid-cols-3 gap-2">
              {SIZE_PRESETS.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => commit({ ...selected, ...SIZE_PRESET_BOX[preset] })}
                  className="rounded-2xl bg-white/10 py-3 font-bold"
                >
                  {preset}
                </button>
              ))}
            </div>
          ) : (
            <p className="mt-3 rounded-2xl bg-white/5 px-3 py-3 text-sm text-white/55">
              Потяни любой край или угол на макете — размер свободный.
            </p>
          )}
          {(selected.type === 'TEXT' ||
            selected.type === 'BUTTON' ||
            selected.type === 'VIDEO' ||
            selected.type === 'CHAT_ROW' ||
            selected.type === 'BUBBLE' ||
            selected.type === 'CAMERA' ||
            selected.type === 'MODAL') && (
            <input
              value={selected.props.text ?? ''}
              onChange={(event) =>
                commit({ ...selected, props: { ...selected.props, text: event.target.value } })
              }
              placeholder={
                selected.type === 'CHAT_ROW' ? 'Имя' : selected.type === 'MODAL' ? 'Заголовок окна' : 'Текст'
              }
              className="mt-3 w-full rounded-2xl border border-line bg-ink px-3 py-3"
            />
          )}
          {(selected.type === 'INPUT' || selected.type === 'SEARCH' || selected.type === 'CHAT_ROW') && (
            <input
              value={selected.props.placeholder ?? ''}
              onChange={(event) =>
                commit({ ...selected, props: { ...selected.props, placeholder: event.target.value } })
              }
              placeholder={selected.type === 'CHAT_ROW' ? 'Последнее сообщение' : 'Подсказка в поле'}
              className="mt-3 w-full rounded-2xl border border-line bg-ink px-3 py-3"
            />
          )}
          {selected.type === 'LIKE' && (
            <button
              type="button"
              onClick={() =>
                commit({
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
                commit({
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

function ResizeFrame({
  component,
  scale,
  onResizeDown,
}: {
  component: DesignComponent
  scale: number
  onResizeDown: (event: PointerEvent<HTMLDivElement>, component: DesignComponent, handle: Handle) => void
}) {
  return (
    <div
      className="pointer-events-none absolute z-30"
      style={{
        left: component.x * scale,
        top: component.y * scale,
        width: component.w * scale,
        height: component.h * scale,
      }}
    >
      <div className="absolute inset-0 rounded-md ring-2 ring-cyan" />
      {HANDLES.map((handle) => (
        <div
          key={handle}
          className="pointer-events-auto absolute z-10 flex h-5 w-5 items-center justify-center touch-none"
          style={handleStyle(handle)}
          onPointerDown={(event) => onResizeDown(event, component, handle)}
        >
          <span className="h-2.5 w-2.5 rounded-[3px] border-2 border-cyan bg-white shadow" />
        </div>
      ))}
    </div>
  )
}

function handleStyle(handle: Handle): CSSProperties {
  const inset = { position: 'absolute' as const }
  const map: Record<Handle, CSSProperties> = {
    n: { ...inset, top: 0, left: '50%', transform: 'translate(-50%, -50%)', cursor: 'ns-resize' },
    s: { ...inset, bottom: 0, left: '50%', transform: 'translate(-50%, 50%)', cursor: 'ns-resize' },
    e: { ...inset, right: 0, top: '50%', transform: 'translate(50%, -50%)', cursor: 'ew-resize' },
    w: { ...inset, left: 0, top: '50%', transform: 'translate(-50%, -50%)', cursor: 'ew-resize' },
    ne: { ...inset, top: 0, right: 0, transform: 'translate(50%, -50%)', cursor: 'nesw-resize' },
    nw: { ...inset, top: 0, left: 0, transform: 'translate(-50%, -50%)', cursor: 'nwse-resize' },
    se: { ...inset, bottom: 0, right: 0, transform: 'translate(50%, 50%)', cursor: 'nwse-resize' },
    sw: { ...inset, bottom: 0, left: 0, transform: 'translate(-50%, 50%)', cursor: 'nesw-resize' },
  }
  return map[handle]
}

function mergeComponents(server: DesignComponent[], pending: PendingItem[], stateId?: string) {
  if (!stateId) {
    return server
  }
  const map = new Map(server.map((item) => [item.id, item]))
  for (const item of pending) {
    if (item.stateId === stateId) {
      map.set(item.component.id, item.component)
    }
  }
  return [...map.values()]
}

function resizeBox(drag: Extract<Drag, { mode: 'resize' }>, mx: number, my: number) {
  const maxX = drag.startX + drag.startW
  const maxY = drag.startY + drag.startH
  let x = drag.startX
  let y = drag.startY
  let w = drag.startW
  let h = drag.startH
  if (drag.handle.includes('e')) {
    w = clamp(mx - drag.startX, 24, CANVAS_WIDTH)
  }
  if (drag.handle.includes('s')) {
    h = clamp(my - drag.startY, 24, CANVAS_HEIGHT)
  }
  if (drag.handle.includes('w')) {
    x = clamp(mx, -40, maxX - 24)
    w = maxX - x
  }
  if (drag.handle.includes('n')) {
    y = clamp(my, -40, maxY - 24)
    h = maxY - y
  }
  return { x: Math.round(x), y: Math.round(y), w: Math.round(w), h: Math.round(h) }
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

const DESIGN_STEPS = [
  {
    title: 'Экраны уже есть',
    body: 'Не нужно придумывать стейты. Сверху экраны: Клип, Съёмка, Чаты, Сообщение — рисуй каждый макет.',
  },
  {
    title: 'Лайк на том же клипе',
    body: 'Сердечко живёт на экране «Клип». Красное или белое — переключатель у детали. Отдельный экран для лайка не нужен.',
  },
  {
    title: 'Двигайте пальцем',
    body: 'Тапни деталь на макете, перетащи, потяни угол. Окно поверх можно растянуть как угодно. Внизу только детали текущего экрана.',
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
      return { text: 'закат, который нельзя пролистать' }
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
    case 'MODAL':
      if (screenKey === 'SHARE') {
        return { text: 'Поделиться' }
      }
      if (screenKey === 'COMMENTS') {
        return { text: 'Комментарии' }
      }
      return { text: 'Окно' }
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
