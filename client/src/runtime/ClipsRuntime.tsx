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
  type RuntimeFlags,
} from '@brainrot/shared'

type PhoneFrameProps = {
  scale: number
  children: ReactNode
  className?: string
}

export function PhoneFrame({ scale, children, className }: PhoneFrameProps) {
  const chrome = Math.max(9, 11 * scale)
  return (
    <div
      className={['relative overflow-hidden rounded-[2.35rem] bg-black', className].filter(Boolean).join(' ')}
      style={{
        width: CANVAS_WIDTH * scale,
        height: CANVAS_HEIGHT * scale,
        boxShadow: '0 0 0 3px #3a3a46, 0 0 40px rgba(0, 240, 255, 0.18)',
      }}
    >
      <div
        className="pointer-events-none absolute inset-x-0 top-0 z-20 flex items-center justify-between px-[7%] pt-[3.4%] font-semibold text-white"
        style={{ fontSize: chrome }}
      >
        <span>9:41</span>
        <span className="absolute left-1/2 top-[18%] h-[22%] w-[34%] -translate-x-1/2 rounded-full bg-black" />
        <span className="flex items-center gap-1 text-white/90">
          <span>▮▮▮</span>
          <span>🔋</span>
        </span>
      </div>
      {children}
      <div className="pointer-events-none absolute bottom-[1.1%] left-1/2 z-20 h-[1.35%] w-[34%] -translate-x-1/2 rounded-full bg-white/40" />
    </div>
  )
}

const FILL_TYPES = new Set<DesignComponent['type']>([
  'VIDEO',
  'MODAL',
  'CAMERA',
  'IMAGE',
  'NAVIGATION',
  'CHAT_ROW',
  'INPUT',
  'SEARCH',
])

export function ComponentView({
  component,
  selected,
  interactive,
  onAction,
  onPointerDown,
  liked,
  scale = 1,
}: {
  component: DesignComponent
  selected?: boolean
  interactive?: boolean
  onAction?: (event: LogicEvent) => void
  onPointerDown?: (event: PointerEvent<HTMLDivElement>) => void
  liked?: boolean
  scale?: number
}) {
  const event = COMPONENT_EVENT_MAP[component.type]
  const clickable = Boolean(interactive && event && onAction)
  const fill = FILL_TYPES.has(component.type)

  return (
    <div
      data-component-id={component.id}
      className={[
        'absolute overflow-hidden',
        fill ? 'flex flex-col' : 'flex items-center justify-center text-center',
        radiusFor(component.type),
        selected ? 'ring-2 ring-cyan' : '',
        clickable ? 'cursor-pointer' : '',
        component.type === 'MODAL' ? 'shadow-[0_18px_50px_rgba(0,0,0,0.45)]' : '',
      ].join(' ')}
      style={{
        left: component.x * scale,
        top: component.y * scale,
        width: component.w * scale,
        height: component.h * scale,
        color: colorFor(component),
        background: backgroundFor(component, liked),
        fontSize: `${Math.max(10, 16 * scale)}px`,
        zIndex:
          component.type === 'MODAL'
            ? 8
            : component.type === 'VIDEO' || component.type === 'CAMERA' || component.type === 'IMAGE'
              ? 0
              : 2,
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
      {innerContent(component, scale, liked)}
    </div>
  )
}

function radiusFor(type: DesignComponent['type']) {
  if (
    type === 'RECORD' ||
    type === 'SEND' ||
    type === 'AVATAR' ||
    type === 'LIKE' ||
    type === 'COMMENT' ||
    type === 'SHARE'
  ) {
    return 'rounded-full'
  }
  if (type === 'VIDEO' || type === 'CAMERA' || type === 'IMAGE') {
    return 'rounded-none'
  }
  if (type === 'MODAL') {
    return 'rounded-[1.4rem]'
  }
  if (type === 'NAVIGATION') {
    return 'rounded-none'
  }
  return 'rounded-2xl'
}

function likeActive(component: DesignComponent, liked?: boolean) {
  return liked ?? Boolean(component.props.active)
}

function colorFor(component: DesignComponent) {
  if (component.props.color) {
    return component.props.color
  }
  if (component.type === 'MODAL') {
    return '#1c1c22'
  }
  return '#fff'
}

function backgroundFor(component: DesignComponent, liked?: boolean): string {
  if (component.props.background) {
    return component.props.background
  }
  switch (component.type) {
    case 'VIDEO':
    case 'CAMERA':
    case 'IMAGE':
    case 'MODAL':
      return 'transparent'
    case 'LIKE':
      return likeActive(component, liked) ? '#ff2d6a' : 'rgba(12,12,16,0.45)'
    case 'COMMENT':
    case 'SHARE':
      return 'rgba(12,12,16,0.45)'
    case 'BUTTON':
      return 'rgba(255,255,255,0.14)'
    case 'NAVIGATION':
      return 'rgba(10,10,14,0.92)'
    case 'INPUT':
    case 'SEARCH':
      return 'rgba(255,255,255,0.1)'
    case 'RECORD':
      return '#ff2d6a'
    case 'CHAT_ROW':
      return 'rgba(255,255,255,0.05)'
    case 'BUBBLE':
      return component.props.active ? '#00f0ff' : 'rgba(255,255,255,0.12)'
    case 'SEND':
      return '#00f0ff'
    default:
      return 'transparent'
  }
}

function innerContent(component: DesignComponent, scale: number, liked?: boolean) {
  switch (component.type) {
    case 'VIDEO':
      return <ClipScene caption={component.props.text} uid={component.id} />
    case 'LIKE':
      return (
        <span className="flex flex-col items-center leading-none">
          <span style={{ fontSize: `${28 * scale}px` }}>{likeActive(component, liked) ? '❤️' : '🤍'}</span>
          <span className="mt-1 text-[0.65em] text-white/80">128</span>
        </span>
      )
    case 'COMMENT':
      return (
        <span className="flex flex-col items-center leading-none">
          <span style={{ fontSize: `${28 * scale}px` }}>💬</span>
          <span className="mt-1 text-[0.65em] text-white/80">42</span>
        </span>
      )
    case 'SHARE':
      return (
        <span className="flex flex-col items-center leading-none">
          <span style={{ fontSize: `${28 * scale}px` }}>📤</span>
          <span className="mt-1 text-[0.65em] text-white/80">9</span>
        </span>
      )
    case 'AVATAR':
      return (
        <div className="flex h-full w-full items-center justify-center rounded-full bg-gradient-to-br from-mag to-gold text-xl shadow-[inset_0_-6px_12px_rgba(0,0,0,0.25)]">
          {component.props.text?.[0] || '🙂'}
        </div>
      )
    case 'NAVIGATION':
      return (
        <div className="flex h-full w-full items-center justify-around border-t border-white/10 px-1 text-[10px] text-white/75">
          <span>⌂</span>
          <span className="text-white">▶</span>
          <span className="flex h-7 w-7 items-center justify-center rounded-lg border-2 border-white text-sm font-bold">
            +
          </span>
          <span>💬</span>
          <span>👤</span>
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
        <PhotoScene />
      )
    case 'MODAL':
      return <OverlaySheet title={component.props.text} />
    case 'BUTTON':
      return <span className="text-lg font-bold">{component.props.text || 'Кнопка'}</span>
    case 'TEXT':
      return (
        <span className="px-1 text-left text-lg font-semibold leading-snug [text-shadow:0_1px_8px_rgba(0,0,0,0.65)]">
          {component.props.text || 'Текст'}
        </span>
      )
    case 'CAMERA':
      return <CameraScene label={component.props.text} uid={component.id} />
    case 'RECORD':
      return (
        <span className="flex h-[62%] w-[62%] items-center justify-center rounded-full border-[3px] border-white bg-mag" />
      )
    case 'CHAT_ROW':
      return (
        <div className="flex h-full w-full items-center gap-3 px-3 text-left">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-mag/80 to-cyan/40">
            {component.props.text?.[0] || '🙂'}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate font-semibold">{component.props.text || 'Маша'}</p>
            <p className="truncate text-white/45">{component.props.placeholder || 'Привет!'}</p>
          </div>
          <span className="text-[0.65em] text-white/35">2м</span>
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

function ClipScene({ caption, uid }: { caption?: string; uid: string }) {
  return (
    <div className="clip-scene relative h-full w-full overflow-hidden">
      <svg className="absolute inset-0 h-full w-full" viewBox="0 0 390 700" preserveAspectRatio="xMidYMid slice">
        <defs>
          <linearGradient id={`g-${uid}-sky`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#1b1238" />
            <stop offset="42%" stopColor="#c23b4a" />
            <stop offset="72%" stopColor="#f4a261" />
            <stop offset="100%" stopColor="#2a1810" />
          </linearGradient>
          <linearGradient id={`g-${uid}-skin`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#f3c7a8" />
            <stop offset="100%" stopColor="#d99573" />
          </linearGradient>
        </defs>
        <rect width="390" height="700" fill={`url(#g-${uid}-sky)`} />
        <circle className="clip-sun" cx="196" cy="250" r="54" fill="#ffd166" opacity="0.92" />
        <rect x="0" y="430" width="390" height="270" fill="#141018" />
        <rect x="18" y="360" width="70" height="180" fill="#1c1428" />
        <rect x="98" y="300" width="86" height="240" fill="#24182e" />
        <rect x="198" y="340" width="64" height="200" fill="#1a1224" />
        <rect x="278" y="270" width="96" height="270" fill="#201428" />
        <rect x="112" y="328" width="28" height="40" fill="#ffd166" opacity="0.55" />
        <rect x="302" y="300" width="22" height="32" fill="#00f0ff" opacity="0.45" />
        <rect x="328" y="300" width="22" height="32" fill="#ff2d6a" opacity="0.4" />
        <ellipse cx="196" cy="690" rx="120" ry="28" fill="#000" opacity="0.35" />
        <rect x="154" y="430" width="84" height="150" rx="28" fill="#1a1a28" />
        <rect x="168" y="448" width="56" height="70" fill="#2c2c3a" />
        <circle cx="196" cy="392" r="28" fill={`url(#g-${uid}-skin)`} />
        <path d="M168 392 q28 -38 56 0" fill="#1a1220" />
        <rect x="214" y="470" width="18" height="42" rx="6" fill={`url(#g-${uid}-skin)`} />
        <rect x="226" y="492" width="22" height="34" rx="5" fill="#111" />
        <rect x="230" y="496" width="14" height="22" rx="2" fill="#00f0ff" opacity="0.7" />
      </svg>
      <div className="clip-grain pointer-events-none absolute inset-0" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/35 to-transparent px-[7%] pb-[9%] pt-[22%] text-left text-white">
        <p className="text-[0.78em] font-extrabold">@brainrot_live</p>
        <p className="mt-[0.15em] line-clamp-2 text-[0.7em] leading-snug text-white/90">
          {caption && caption !== 'Клип' ? caption : 'закат, который нельзя пролистать'}
        </p>
        <p className="clip-music mt-[0.4em] text-[0.62em] text-white/80">♪ original sound — brainrot mix</p>
      </div>
      <div className="absolute bottom-0 left-0 h-[3px] w-full bg-white/20">
        <div className="clip-progress h-full bg-white" />
      </div>
    </div>
  )
}

function CameraScene({ label, uid }: { label?: string; uid: string }) {
  return (
    <div className="relative h-full w-full overflow-hidden bg-[#101820]">
      <svg className="absolute inset-0 h-full w-full" viewBox="0 0 390 640" preserveAspectRatio="xMidYMid slice">
        <defs>
          <linearGradient id={`g-${uid}-cam`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#243044" />
            <stop offset="100%" stopColor="#0d1218" />
          </linearGradient>
        </defs>
        <rect width="390" height="640" fill={`url(#g-${uid}-cam)`} />
        <circle cx="195" cy="250" r="78" fill="#e8b89a" />
        <rect x="130" y="320" width="130" height="220" rx="40" fill="#2a3344" />
      </svg>
      <div className="pointer-events-none absolute inset-[12%] rounded-xl border border-white/35" />
      <div className="pointer-events-none absolute inset-0 opacity-30 [background-image:linear-gradient(rgba(255,255,255,0.2)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.2)_1px,transparent_1px)] [background-size:33.3%_33.3%]" />
      <div className="absolute left-[6%] top-[6%] flex items-center gap-2 rounded-full bg-black/45 px-2 py-1 text-[0.62em] font-bold text-white">
        <span className="h-2 w-2 rounded-full bg-mag" />
        REC
      </div>
      <p className="absolute bottom-[8%] left-0 right-0 text-center text-[0.8em] font-semibold text-white/80">
        {label || 'Камера'}
      </p>
    </div>
  )
}

function PhotoScene() {
  return (
    <div className="relative h-full w-full overflow-hidden bg-[#d9c7b0]">
      <svg className="h-full w-full" viewBox="0 0 342 220" preserveAspectRatio="xMidYMid slice">
        <rect width="342" height="220" fill="#8ecae6" />
        <circle cx="270" cy="54" r="28" fill="#ffd166" />
        <path d="M0 150 L80 90 L150 140 L230 70 L342 150 V220 H0 Z" fill="#2a9d8f" />
        <path d="M0 180 L120 130 L220 170 L342 120 V220 H0 Z" fill="#1d3557" opacity="0.85" />
      </svg>
    </div>
  )
}

function OverlaySheet({ title }: { title?: string }) {
  const label = title || 'Окно'
  const share = /подел|share|репост/i.test(label)
  const rows = share
    ? [
        { icon: '✈️', name: 'Telegram', meta: 'Отправить в чат' },
        { icon: '💬', name: 'WhatsApp', meta: 'Поделиться' },
        { icon: '🔗', name: 'Скопировать', meta: 'Ссылка на клип' },
      ]
    : [
        { icon: '🦊', name: 'Лена', meta: 'это надо в избранное' },
        { icon: '🐸', name: 'Никита', meta: 'саунд трек огонь' },
        { icon: '🐻', name: 'Катя', meta: 'где снимали??' },
      ]

  return (
    <div className="flex h-full w-full flex-col bg-[#eef0f5] text-[#1c1c22]">
      <div className="flex justify-center pt-2">
        <div className="h-1 w-11 rounded-full bg-black/20" />
      </div>
      <div className="flex items-center justify-between px-4 pb-1 pt-2">
        <p className="font-extrabold leading-none">{label}</p>
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-black/10 text-[0.8em] text-black/45">
          ✕
        </span>
      </div>
      <div className="min-h-0 flex-1 space-y-2 overflow-hidden px-3 pb-3 pt-1">
        {rows.map((row) => (
          <div key={row.name} className="flex items-center gap-2 rounded-2xl bg-white px-2.5 py-2 shadow-[0_1px_0_rgba(0,0,0,0.04)]">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#eceff4] text-[1.05em]">
              {row.icon}
            </div>
            <div className="min-w-0 text-left">
              <p className="truncate text-[0.78em] font-bold">{row.name}</p>
              <p className="truncate text-[0.66em] text-black/45">{row.meta}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export function ClipsRuntime({
  project,
  stateId,
  interactive,
  onAction,
  activeEvent,
  flags,
  scale = 0.72,
}: {
  project: Project
  stateId: string | null
  interactive?: boolean
  onAction?: (event: LogicEvent) => void
  activeEvent?: LogicEvent | null
  flags?: RuntimeFlags
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
      <div className="relative h-full w-full bg-[#0b0b12]">
        {layout.components.map((component) => (
          <ComponentView
            key={component.id}
            component={component}
            selected={Boolean(activeEvent && COMPONENT_EVENT_MAP[component.type] === activeEvent)}
            interactive={interactive}
            onAction={onAction}
            liked={flags ? flags['video.isLiked'] : undefined}
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
