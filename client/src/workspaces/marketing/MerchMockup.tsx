import {
  merchPrintLayers,
  type MerchItem,
  type MerchKind,
  type MerchPattern,
  type MerchPrintLayer,
} from '@brainrot/shared'

export const PRINT_ZONES: Record<MerchKind, { x: number; y: number; w: number; h: number }> = {
  tshirt: { x: 32, y: 32, w: 36, h: 34 },
  hoodie: { x: 33, y: 34, w: 34, h: 28 },
  mug: { x: 18, y: 28, w: 42, h: 40 },
  cap: { x: 30, y: 16, w: 40, h: 30 },
  tote: { x: 28, y: 38, w: 44, h: 34 },
  sticker: { x: 18, y: 18, w: 64, h: 64 },
}

export function MerchMockup({
  item,
  size = 'md',
  selectedLayerId,
  livePath,
  liveColor,
  liveWidth,
  interactive,
  onPrintPointerDown,
  onPrintPointerMove,
  onPrintPointerUp,
}: {
  item: MerchItem
  size?: 'sm' | 'md' | 'lg'
  selectedLayerId?: string | null
  livePath?: string | null
  liveColor?: string
  liveWidth?: number
  interactive?: boolean
  onPrintPointerDown?: (x: number, y: number) => void
  onPrintPointerMove?: (x: number, y: number) => void
  onPrintPointerUp?: () => void
}) {
  const zone = PRINT_ZONES[item.kind]
  const layers = merchPrintLayers(item)
  const uid = `${item.id}-${size}`

  return (
    <div
      className={[
        'merch-stage relative mx-auto aspect-square w-full max-w-full overflow-hidden rounded-[1.6rem]',
        size === 'sm' ? 'max-w-[7.5rem]' : '',
        size === 'md' ? 'max-w-[17rem]' : '',
        size === 'lg' ? 'max-w-[22rem]' : '',
      ].join(' ')}
    >
      <ProductArt item={item} uid={uid} />
      <div
        className={[
          'absolute overflow-hidden',
          interactive ? 'cursor-grab touch-none outline outline-1 outline-dashed outline-cyan/50 active:cursor-grabbing' : 'pointer-events-none',
        ].join(' ')}
        style={{
          left: `${zone.x}%`,
          top: `${zone.y}%`,
          width: `${zone.w}%`,
          height: `${zone.h}%`,
        }}
        onPointerDown={(event) => {
          if (!interactive || !onPrintPointerDown) {
            return
          }
          event.preventDefault()
          event.currentTarget.setPointerCapture(event.pointerId)
          const rect = event.currentTarget.getBoundingClientRect()
          onPrintPointerDown(
            ((event.clientX - rect.left) / rect.width) * 100,
            ((event.clientY - rect.top) / rect.height) * 100,
          )
        }}
        onPointerMove={(event) => {
          if (!interactive || !onPrintPointerMove) {
            return
          }
          const rect = event.currentTarget.getBoundingClientRect()
          onPrintPointerMove(
            ((event.clientX - rect.left) / rect.width) * 100,
            ((event.clientY - rect.top) / rect.height) * 100,
          )
        }}
        onPointerUp={onPrintPointerUp}
        onPointerCancel={onPrintPointerUp}
      >
        <svg viewBox="0 0 100 100" className="h-full w-full" preserveAspectRatio="none">
          {item.logoSrc && (
            <image href={item.logoSrc} x="30" y="8" width="40" height="22" preserveAspectRatio="xMidYMid meet" />
          )}
          {layers.map((layer) => (
            <PrintLayerSvg key={layer.id} layer={layer} selected={layer.id === selectedLayerId} uid={uid} />
          ))}
          {livePath && (
            <path
              d={livePath}
              fill="none"
              stroke={liveColor ?? '#111'}
              strokeWidth={liveWidth ?? 3}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}
        </svg>
      </div>
    </div>
  )
}

function PrintLayerSvg({
  layer,
  selected,
  uid,
}: {
  layer: MerchPrintLayer
  selected?: boolean
  uid: string
}) {
  const opacity = layer.opacity ?? 1
  if (layer.kind === 'draw' && layer.path) {
    return (
      <path
        d={layer.path}
        fill="none"
        stroke={layer.color ?? '#111'}
        strokeWidth={layer.strokeWidth ?? 3}
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity={opacity}
      />
    )
  }
  if (layer.kind === 'pattern') {
    const pid = `${uid}-${layer.id}-pat`
    return (
      <g opacity={opacity}>
        <PatternDefs id={pid} pattern={layer.pattern ?? 'stars'} color={layer.color ?? '#111'} />
        <rect
          x={layer.x}
          y={layer.y}
          width={layer.w ?? 100}
          height={layer.h ?? 100}
          fill={`url(#${pid})`}
          stroke={selected ? '#00f0ff' : 'none'}
          strokeWidth={selected ? 1.2 : 0}
        />
      </g>
    )
  }
  const size = layer.fontSize ?? 16
  const width = Math.max(22, (layer.text?.length ?? 1) * size * 0.62)
  const height = Math.max(18, size * 1.4)
  return (
    <g transform={`rotate(${layer.rotation ?? 0} ${layer.x} ${layer.y})`} opacity={opacity}>
      {selected && (
        <rect
          x={layer.x - width / 2 - 2}
          y={layer.y - height / 2 - 2}
          width={width + 4}
          height={height + 4}
          fill="rgba(0,240,255,0.12)"
          stroke="#00f0ff"
          strokeWidth="1.2"
          rx="2"
        />
      )}
      <text
        x={layer.x}
        y={layer.y}
        textAnchor="middle"
        dominantBaseline="middle"
        fill={layer.color ?? '#111'}
        fontSize={size}
        fontFamily="Syne, sans-serif"
        fontWeight={800}
      >
        {layer.text}
      </text>
    </g>
  )
}

function ProductArt({ item, uid }: { item: MerchItem; uid: string }) {
  const fabric = item.color
  const accent = item.accent ?? shade(fabric, -0.35)
  const pattern = item.pattern ?? 'none'
  if (item.kind === 'hoodie') {
    return <HoodieSvg uid={uid} fabric={fabric} accent={accent} pattern={pattern} />
  }
  if (item.kind === 'mug') {
    return <MugSvg uid={uid} fabric={fabric} accent={accent} pattern={pattern} />
  }
  if (item.kind === 'cap') {
    return <CapSvg uid={uid} fabric={fabric} accent={accent} pattern={pattern} />
  }
  if (item.kind === 'tote') {
    return <ToteSvg uid={uid} fabric={fabric} accent={accent} pattern={pattern} />
  }
  if (item.kind === 'sticker') {
    return <StickerSvg uid={uid} fabric={fabric} accent={accent} pattern={pattern} />
  }
  return <TeeSvg uid={uid} fabric={fabric} accent={accent} pattern={pattern} />
}

function TeeSvg({
  uid,
  fabric,
  accent,
  pattern,
}: {
  uid: string
  fabric: string
  accent: string
  pattern: MerchPattern
}) {
  const fill = fillFor(uid, fabric, pattern)
  return (
    <svg viewBox="0 0 300 360" className="h-full w-full">
      <FabricDefs uid={uid} fabric={fabric} pattern={pattern} />
      <ellipse cx="150" cy="332" rx="78" ry="10" fill="rgba(0,0,0,0.38)" />
      <path d="M52 92 18 128c8 10 22 18 34 16l16-12v168c0 10 8 16 18 16h128c10 0 18-6 18-16V132l16 12c12 2 26-6 34-16L248 92l-28-22-18-8c-8-22-28-36-52-36s-44 14-52 36l-18 8z" fill={fill} />
      <path d="M52 92 18 128c8 10 22 18 34 16l16-12z" fill={shade(fabric, -0.12)} />
      <path d="M248 92 282 128c-8 10-22 18-34 16l-16-12z" fill={shade(fabric, -0.18)} />
      <path d="M118 58c8-16 56-16 64 0 2 10-8 18-32 18s-34-8-32-18z" fill={shade(fabric, -0.22)} />
      <path d="M126 62c6-8 48-8 54 0 1 6-8 10-27 10s-28-4-27-10z" fill={shade(fabric, 0.08)} />
      <path d="M86 300h128" stroke={accent} strokeWidth="5" strokeLinecap="round" opacity="0.55" />
      <path d="M104 78c10 38 82 38 92 0" fill="none" stroke={shade(fabric, -0.28)} strokeWidth="3" opacity="0.35" />
      <path d="M92 150c40 18 76 18 116 0" fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="8" />
      <path d="M70 120c8 90 8 150 6 168" fill="none" stroke="rgba(0,0,0,0.12)" strokeWidth="4" />
      <path d="M230 120c-8 90-8 150-6 168" fill="none" stroke="rgba(0,0,0,0.16)" strokeWidth="4" />
    </svg>
  )
}

function HoodieSvg({
  uid,
  fabric,
  accent,
  pattern,
}: {
  uid: string
  fabric: string
  accent: string
  pattern: MerchPattern
}) {
  const fill = fillFor(uid, fabric, pattern)
  return (
    <svg viewBox="0 0 300 360" className="h-full w-full">
      <FabricDefs uid={uid} fabric={fabric} pattern={pattern} />
      <ellipse cx="150" cy="334" rx="82" ry="10" fill="rgba(0,0,0,0.4)" />
      <path d="M96 70c10-28 88-28 108 0 8 8 10 18 8 28-18 6-80 6-116 0-2-10 0-20 0-28z" fill={shade(fabric, -0.2)} />
      <path d="M48 96 14 132c10 12 26 20 40 16l14-12v170c0 10 8 18 20 18h124c12 0 20-8 20-18V136l14 12c14 4 30-4 40-16L252 96l-24-20-16-8c-10-26-36-42-62-42s-52 16-62 42l-16 8z" fill={fill} />
      <path d="M118 78c10-14 54-14 64 0 6 16-10 28-32 28s-38-12-32-28z" fill={accent} />
      <path d="M130 92v46M170 92v46" stroke={accent} strokeWidth="3" />
      <circle cx="130" cy="142" r="3.5" fill={shade(accent, 0.2)} />
      <circle cx="170" cy="142" r="3.5" fill={shade(accent, 0.2)} />
      <path d="M96 188h108v58c0 8-8 14-16 14H112c-8 0-16-6-16-14z" fill={shade(fabric, -0.16)} />
      <path d="M150 188v72" stroke={shade(fabric, -0.28)} strokeWidth="3" />
      <path d="M78 300h144" stroke={accent} strokeWidth="10" strokeLinecap="round" />
      <path d="M48 128 28 148" stroke={accent} strokeWidth="10" strokeLinecap="round" />
      <path d="M252 128 272 148" stroke={accent} strokeWidth="10" strokeLinecap="round" />
      <path d="M92 140c36 14 80 14 116 0" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="8" />
    </svg>
  )
}

function MugSvg({
  uid,
  fabric,
  accent,
  pattern,
}: {
  uid: string
  fabric: string
  accent: string
  pattern: MerchPattern
}) {
  const fill = fillFor(uid, fabric, pattern)
  return (
    <svg viewBox="0 0 300 360" className="h-full w-full">
      <FabricDefs uid={uid} fabric={fabric} pattern={pattern} />
      <ellipse cx="138" cy="318" rx="70" ry="12" fill="rgba(0,0,0,0.4)" />
      <path d="M214 128c28 0 48 22 48 50s-20 50-48 50" fill="none" stroke={accent} strokeWidth="18" />
      <path d="M214 136c20 0 34 16 34 42s-14 42-34 42" fill="none" stroke={shade(accent, 0.2)} strokeWidth="6" />
      <path d="M70 96h136c12 0 18 10 18 20v148c0 22-20 36-40 36H92c-20 0-40-14-40-36V116c0-10 6-20 18-20z" fill={fill} />
      <ellipse cx="138" cy="96" rx="68" ry="18" fill={shade(fabric, 0.12)} />
      <ellipse cx="138" cy="96" rx="52" ry="12" fill={shade(accent, -0.35)} />
      <path d="M88 120c20 8 80 8 100 0" fill="none" stroke="rgba(255,255,255,0.28)" strokeWidth="6" />
      <path d="M86 280h104" stroke={accent} strokeWidth="6" opacity="0.4" />
    </svg>
  )
}

function CapSvg({
  uid,
  fabric,
  accent,
  pattern,
}: {
  uid: string
  fabric: string
  accent: string
  pattern: MerchPattern
}) {
  const fill = fillFor(uid, fabric, pattern)
  return (
    <svg viewBox="0 0 300 360" className="h-full w-full">
      <FabricDefs uid={uid} fabric={fabric} pattern={pattern} />
      <ellipse cx="150" cy="300" rx="86" ry="12" fill="rgba(0,0,0,0.35)" />
      <path d="M46 176c14-78 70-112 104-112s90 34 104 112c-28 16-64 24-104 24S74 192 46 176z" fill={fill} />
      <path d="M150 64c8 0 14 6 14 14s-6 12-14 12-14-4-14-12 6-14 14-14z" fill={accent} />
      <path d="M150 78v70" stroke={shade(fabric, -0.25)} strokeWidth="3" />
      <path d="M86 120 150 148 214 120" fill="none" stroke={shade(fabric, -0.2)} strokeWidth="3" />
      <path d="M40 180c40 28 180 28 220 0 8 8 10 20 2 28-46 16-178 16-224 0-8-8-6-20 2-28z" fill={accent} />
      <path d="M48 188c40 16 164 16 204 0" fill="none" stroke={shade(accent, 0.2)} strokeWidth="4" />
      <circle cx="92" cy="118" r="4" fill={shade(fabric, 0.25)} />
      <circle cx="208" cy="118" r="4" fill={shade(fabric, 0.25)} />
    </svg>
  )
}

function ToteSvg({
  uid,
  fabric,
  accent,
  pattern,
}: {
  uid: string
  fabric: string
  accent: string
  pattern: MerchPattern
}) {
  const fill = fillFor(uid, fabric, pattern)
  return (
    <svg viewBox="0 0 300 360" className="h-full w-full">
      <FabricDefs uid={uid} fabric={fabric} pattern={pattern} />
      <ellipse cx="150" cy="328" rx="74" ry="10" fill="rgba(0,0,0,0.36)" />
      <path d="M96 118c0-46 22-74 54-74s54 28 54 74" fill="none" stroke={accent} strokeWidth="14" />
      <path d="M58 118h184l-16 196H74z" fill={fill} />
      <path d="M74 150h152" stroke={shade(fabric, -0.2)} strokeWidth="6" />
      <path d="M80 314h140" stroke={accent} strokeWidth="8" />
      <path d="M70 180c40 16 120 16 160 0" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="10" />
    </svg>
  )
}

function StickerSvg({
  uid,
  fabric,
  accent,
  pattern,
}: {
  uid: string
  fabric: string
  accent: string
  pattern: MerchPattern
}) {
  const fill = fillFor(uid, fabric, pattern)
  return (
    <svg viewBox="0 0 300 360" className="h-full w-full">
      <FabricDefs uid={uid} fabric={fabric} pattern={pattern} />
      <ellipse cx="150" cy="300" rx="70" ry="12" fill="rgba(0,0,0,0.28)" />
      <circle cx="150" cy="176" r="108" fill="#fff" />
      <circle cx="150" cy="176" r="96" fill={fill} stroke={accent} strokeWidth="6" />
      <circle cx="150" cy="176" r="84" fill="none" stroke="rgba(255,255,255,0.28)" strokeDasharray="7 9" />
    </svg>
  )
}

function FabricDefs({ uid, fabric, pattern }: { uid: string; fabric: string; pattern: MerchPattern }) {
  return (
    <>
      <defs>
        <linearGradient id={`${uid}-lit`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={shade(fabric, 0.18)} />
          <stop offset="45%" stopColor={fabric} />
          <stop offset="100%" stopColor={shade(fabric, -0.22)} />
        </linearGradient>
      </defs>
      <PatternDefs id={`${uid}-fab`} pattern={pattern} color={shade(fabric, -0.35)} background={fabric} />
    </>
  )
}

function PatternDefs({
  id,
  pattern,
  color,
  background,
}: {
  id: string
  pattern: MerchPattern
  color: string
  background?: string
}) {
  if (pattern === 'none') {
    return null
  }
  return (
    <defs>
      <pattern id={id} width="12" height="12" patternUnits="userSpaceOnUse">
        {background && <rect width="12" height="12" fill={background} />}
        {pattern === 'stripes' && <path d="M0 12 12 0" stroke={color} strokeWidth="3" />}
        {pattern === 'dots' && <circle cx="3" cy="3" r="1.6" fill={color} />}
        {pattern === 'grid' && (
          <>
            <path d="M0 0h12" stroke={color} strokeWidth="1" />
            <path d="M0 0v12" stroke={color} strokeWidth="1" />
          </>
        )}
        {pattern === 'chevrons' && <path d="M0 8 6 2 12 8" fill="none" stroke={color} strokeWidth="2" />}
        {pattern === 'stars' && <polygon fill={color} points="6,1 7,4.5 11,4.5 8,6.8 9,10.5 6,8.4 3,10.5 4,6.8 1,4.5 5,4.5" />}
        {pattern === 'waves' && <path d="M0 6c3 4 3-4 6 0s3-4 6 0" fill="none" stroke={color} strokeWidth="2" />}
        {pattern === 'camo' && (
          <>
            <circle cx="3" cy="4" r="3" fill={color} opacity="0.7" />
            <circle cx="9" cy="8" r="2.4" fill={color} />
          </>
        )}
        {pattern === 'hearts' && <path d="M6 10 2 6a2 2 0 1 1 4-2 2 2 0 1 1 4 2z" fill={color} />}
      </pattern>
    </defs>
  )
}

function fillFor(uid: string, _fabric: string, pattern: MerchPattern): string {
  if (pattern === 'none') {
    return `url(#${uid}-lit)`
  }
  return `url(#${uid}-fab)`
}

function shade(hex: string, amount: number): string {
  const raw = hex.replace('#', '')
  if (raw.length < 6) {
    return hex
  }
  const n = (start: number) => {
    const value = Number.parseInt(raw.slice(start, start + 2), 16)
    return Math.max(0, Math.min(255, Math.round(value + amount * 255)))
  }
  return `#${[n(0), n(2), n(4)].map((value) => value.toString(16).padStart(2, '0')).join('')}`
}
