import type { PointerEvent, ReactNode } from 'react'
import {
  CANVAS_HEIGHT,
  CANVAS_WIDTH,
  COMPONENT_EVENT_MAP,
  layoutForState,
  stateById,
  type DesignComponent,
  type LogicEvent,
  type Project,
} from '@brainrot/shared'

type PhoneFrameProps = {
  scale: number
  children: ReactNode
  className?: string
}

export function PhoneFrame({ scale, children, className }: PhoneFrameProps) {
  return (
    <div
      className={[
        'relative overflow-hidden rounded-[2rem] border border-white/20 bg-black shadow-glow',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      style={{
        width: CANVAS_WIDTH * scale,
        height: CANVAS_HEIGHT * scale,
      }}
    >
      {children}
    </div>
  )
}

export function ComponentView({
  component,
  selected,
  interactive,
  onAction,
  onPointerDown,
  scale = 1,
}: {
  component: DesignComponent
  selected?: boolean
  interactive?: boolean
  onAction?: (event: LogicEvent) => void
  onPointerDown?: (event: PointerEvent<HTMLDivElement>) => void
  scale?: number
}) {
  const event = COMPONENT_EVENT_MAP[component.type]
  const clickable = Boolean(interactive && event && onAction)

  return (
    <div
      data-component-id={component.id}
      className={[
        'absolute flex items-center justify-center overflow-hidden text-center',
        component.type === 'RECORD' || component.type === 'SEND' ? 'rounded-full' : 'rounded-2xl',
        selected ? 'ring-2 ring-cyan' : '',
        clickable ? 'cursor-pointer' : '',
      ].join(' ')}
      style={{
        left: component.x * scale,
        top: component.y * scale,
        width: component.w * scale,
        height: component.h * scale,
        color: component.props.color || '#fff',
        background: backgroundFor(component),
        fontSize: `${Math.max(10, 16 * scale)}px`,
      }}
      onPointerDown={onPointerDown}
      onClick={
        clickable
          ? (eventClick) => {
              eventClick.stopPropagation()
              onAction?.(event!)
            }
          : undefined
      }
    >
      {innerContent(component, scale)}
    </div>
  )
}

function backgroundFor(component: DesignComponent): string {
  if (component.props.background) {
    return component.props.background
  }
  switch (component.type) {
    case 'VIDEO':
      return 'linear-gradient(180deg, #1a1030 0%, #07070c 100%)'
    case 'LIKE':
      return component.props.active ? '#ff2d6a' : 'rgba(255,255,255,0.12)'
    case 'COMMENT':
    case 'SHARE':
    case 'BUTTON':
      return 'rgba(255,255,255,0.12)'
    case 'NAVIGATION':
      return '#12121a'
    case 'MODAL':
      return 'rgba(18,18,26,0.96)'
    case 'INPUT':
      return 'rgba(255,255,255,0.08)'
    case 'CAMERA':
      return 'linear-gradient(180deg, #1a2230 0%, #07070c 100%)'
    case 'RECORD':
      return '#ff2d6a'
    case 'CHAT_ROW':
      return 'rgba(255,255,255,0.06)'
    case 'BUBBLE':
      return component.props.active ? '#00f0ff' : 'rgba(255,255,255,0.12)'
    case 'SEND':
      return '#00f0ff'
    case 'SEARCH':
      return 'rgba(255,255,255,0.08)'
    default:
      return 'transparent'
  }
}

function innerContent(component: DesignComponent, scale: number) {
  switch (component.type) {
    case 'VIDEO':
      return (
        <div className="flex h-full w-full flex-col justify-center p-4 text-left">
          <div style={{ fontSize: `${48 * scale}px` }}>▶</div>
          <p className="mt-2 font-semibold">{component.props.text || 'Видео'}</p>
        </div>
      )
    case 'LIKE':
      return <span style={{ fontSize: `${28 * scale}px` }}>{component.props.active ? '❤️' : '🤍'}</span>
    case 'COMMENT':
      return <span style={{ fontSize: `${28 * scale}px` }}>💬</span>
    case 'SHARE':
      return <span style={{ fontSize: `${28 * scale}px` }}>📤</span>
    case 'AVATAR':
      return (
        <div className="flex h-full w-full items-center justify-center rounded-full bg-mag/40 text-xl">
          {component.props.text?.[0] || '🙂'}
        </div>
      )
    case 'NAVIGATION':
      return (
        <div className="flex w-full justify-around text-[10px] uppercase tracking-widest text-white/70">
          <span>Лента</span>
          <span>Клип</span>
          <span>+</span>
          <span>Чаты</span>
          <span>Я</span>
        </div>
      )
    case 'INPUT':
      return (
        <span className="w-full px-3 text-left text-white/40">
          {component.props.placeholder || component.props.text || 'Ввод...'}
        </span>
      )
    case 'IMAGE':
      return component.props.src ? (
        <img src={component.props.src} alt="" className="h-full w-full object-cover" />
      ) : (
        <span className="text-white/40">Картинка</span>
      )
    case 'MODAL':
      return <p className="px-3 text-lg">{component.props.text || 'Модальное окно'}</p>
    case 'BUTTON':
      return <span className="text-lg font-bold">{component.props.text || 'Кнопка'}</span>
    case 'TEXT':
      return <span className="px-1 text-lg font-medium">{component.props.text || 'Текст'}</span>
    case 'CAMERA':
      return (
        <div className="flex h-full w-full flex-col items-center justify-center gap-3 text-white/70">
          <div style={{ fontSize: `${40 * scale}px` }}>📷</div>
          <p className="font-semibold text-white">{component.props.text || 'Камера'}</p>
        </div>
      )
    case 'RECORD':
      return <span style={{ fontSize: `${22 * scale}px` }}>⏺</span>
    case 'CHAT_ROW':
      return (
        <div className="flex h-full w-full items-center gap-3 px-3 text-left">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-mag/40">
            {component.props.text?.[0] || '🙂'}
          </div>
          <div className="min-w-0">
            <p className="truncate font-semibold">{component.props.text || 'Маша'}</p>
            <p className="truncate text-white/45">{component.props.placeholder || 'Привет!'}</p>
          </div>
        </div>
      )
    case 'BUBBLE':
      return (
        <span
          className="px-3 text-left font-medium"
          style={{ color: component.props.active ? '#07070c' : '#fff' }}
        >
          {component.props.text || 'Привет!'}
        </span>
      )
    case 'SEND':
      return <span style={{ fontSize: `${18 * scale}px`, color: '#07070c' }}>➤</span>
    case 'SEARCH':
      return (
        <span className="w-full px-3 text-left text-white/40">
          🔍 {component.props.placeholder || component.props.text || 'Найти чат'}
        </span>
      )
    default:
      return null
  }
}

export function ShortsRuntime({
  project,
  stateId,
  interactive,
  onAction,
  scale = 0.72,
}: {
  project: Project
  stateId: string | null
  interactive?: boolean
  onAction?: (event: LogicEvent) => void
  scale?: number
}) {
  if (!stateId) {
    return (
      <PhoneFrame scale={scale}>
        <MissingState message="Нет начального состояния. Development не выбрал initial state." />
      </PhoneFrame>
    )
  }
  const appState = stateById(project, stateId)
  const layout = layoutForState(project.design, stateId)
  if (!appState || !layout) {
    return (
      <PhoneFrame scale={scale}>
        <MissingState
          message={`Для состояния ${appState?.name ?? stateId} команда Design не подготовила макет.`}
        />
      </PhoneFrame>
    )
  }

  return (
    <PhoneFrame scale={scale}>
      <div className="relative h-full w-full bg-[#07070c]">
        {layout.components.map((component) => (
          <ComponentView
            key={component.id}
            component={component}
            interactive={interactive}
            onAction={onAction}
            scale={scale}
          />
        ))}
        {layout.components.length === 0 && (
          <div className="flex h-full items-center justify-center px-8 text-center text-white/40">
            Пустой экран: {appState.screenKey} / {appState.name}
          </div>
        )}
      </div>
    </PhoneFrame>
  )
}

function MissingState({ message }: { message: string }) {
  return (
    <div className="flex h-full flex-col items-center justify-center bg-[#12080c] px-6 text-center">
      <p className="text-3xl">⚠</p>
      <p className="mt-3 font-display text-xl text-gold">UI STATE NOT FOUND</p>
      <p className="mt-2 text-sm text-white/70">{message}</p>
    </div>
  )
}
