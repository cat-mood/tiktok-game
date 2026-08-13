import type { ReactNode } from 'react'
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
        'relative z-0 overflow-hidden rounded-[2rem] border border-white/20 bg-black shadow-glow',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      style={{
        width: CANVAS_WIDTH * scale,
        height: CANVAS_HEIGHT * scale,
        clipPath: 'inset(0)',
        isolation: 'isolate',
      }}
    >
      <div
        className="touch-none"
        style={{
          width: CANVAS_WIDTH,
          height: CANVAS_HEIGHT,
          zoom: scale,
          transformOrigin: 'top left',
        }}
      >
        {children}
      </div>
    </div>
  )
}

export function ComponentView({
  component,
  selected,
  interactive,
  onAction,
}: {
  component: DesignComponent
  selected?: boolean
  interactive?: boolean
  onAction?: (event: LogicEvent) => void
}) {
  const event = COMPONENT_EVENT_MAP[component.type]
  const clickable = Boolean(interactive && event && onAction)

  return (
    <div
      data-component-id={component.id}
      className={[
        'absolute flex items-center justify-center overflow-hidden rounded-2xl text-center',
        selected ? 'ring-2 ring-cyan' : '',
        clickable ? 'cursor-pointer' : '',
      ].join(' ')}
      style={{
        left: component.x,
        top: component.y,
        width: component.w,
        height: component.h,
        color: component.props.color || '#fff',
        background: backgroundFor(component),
      }}
      onClick={
        clickable
          ? (eventClick) => {
              eventClick.stopPropagation()
              onAction?.(event!)
            }
          : undefined
      }
    >
      {innerContent(component)}
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
    default:
      return 'transparent'
  }
}

function innerContent(component: DesignComponent) {
  switch (component.type) {
    case 'VIDEO':
      return (
        <div className="flex h-full w-full flex-col justify-end p-4 text-left">
          <div className="text-5xl">▶</div>
          <p className="mt-2 text-lg font-semibold">{component.props.text || 'Видео'}</p>
        </div>
      )
    case 'LIKE':
      return <span className="text-3xl">{component.props.active ? '❤️' : '🤍'}</span>
    case 'COMMENT':
      return <span className="text-3xl">💬</span>
    case 'SHARE':
      return <span className="text-3xl">📤</span>
    case 'AVATAR':
      return (
        <div className="flex h-full w-full items-center justify-center rounded-full bg-mag/40 text-xl">
          {component.props.text?.[0] || '🙂'}
        </div>
      )
    case 'NAVIGATION':
      return (
        <div className="flex w-full justify-around text-xs uppercase tracking-widest text-white/70">
          <span>Home</span>
          <span>Video</span>
          <span>Me</span>
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
        <span className="text-white/40">IMAGE</span>
      )
    case 'MODAL':
      return <p className="px-3 text-lg">{component.props.text || 'Модальное окно'}</p>
    case 'BUTTON':
      return <span className="text-lg font-bold">{component.props.text || 'Кнопка'}</span>
    case 'TEXT':
      return <span className="px-1 text-lg font-medium">{component.props.text || 'Текст'}</span>
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
      <div className="absolute inset-0 bg-[#07070c]">
        {layout.components.map((component) => (
          <ComponentView
            key={component.id}
            component={component}
            interactive={interactive}
            onAction={onAction}
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
    <div className="flex h-full flex-col items-center justify-center bg-[#12080c] px-8 text-center">
      <p className="text-4xl">⚠</p>
      <p className="mt-4 font-display text-2xl text-gold">UI STATE NOT FOUND</p>
      <p className="mt-3 text-white/70">{message}</p>
    </div>
  )
}
