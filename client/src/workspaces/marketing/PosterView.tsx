import { POSTER_HEIGHT, POSTER_WIDTH, type Poster, type PosterLayer } from '@brainrot/shared'

export function PosterView({
  poster,
  selectedId,
  scale = 1,
  className = '',
}: {
  poster: Poster
  selectedId?: string | null
  scale?: number
  className?: string
}) {
  return (
    <div
      className={`relative overflow-hidden ${className}`}
      style={{
        width: POSTER_WIDTH * scale,
        height: POSTER_HEIGHT * scale,
        background: poster.background,
      }}
    >
      <div
        className="absolute left-0 top-0 origin-top-left"
        style={{ width: POSTER_WIDTH, height: POSTER_HEIGHT, transform: `scale(${scale})` }}
      >
        {poster.layers.map((layer) => (
          <PosterLayerView key={layer.id} layer={layer} selected={layer.id === selectedId} />
        ))}
      </div>
    </div>
  )
}

export function PosterLayerView({
  layer,
  selected,
}: {
  layer: PosterLayer
  selected?: boolean
}) {
  const opacity = layer.opacity ?? 1
  const rotation = layer.rotation ?? 0
  const box = layerBox(layer)

  if (layer.kind === 'draw' && layer.path) {
    return (
      <svg className="pointer-events-none absolute inset-0 h-full w-full" viewBox={`0 0 ${POSTER_WIDTH} ${POSTER_HEIGHT}`}>
        <path
          d={layer.path}
          fill="none"
          stroke={layer.color ?? '#fff'}
          strokeWidth={layer.strokeWidth ?? 6}
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity={opacity}
        />
      </svg>
    )
  }

  return (
    <div
      className="absolute"
      style={{
        left: layer.x,
        top: layer.y,
        width: box.w,
        height: box.h,
        opacity,
        transform: `rotate(${rotation}deg)`,
        outline: selected ? '2px solid #00f0ff' : undefined,
        outlineOffset: 3,
      }}
    >
      {layer.kind === 'image' && layer.src && (
        <img src={layer.src} alt="" className="h-full w-full object-cover" draggable={false} />
      )}
      {layer.kind === 'text' && (
        <div
          className="font-display font-bold leading-none"
          style={{ fontSize: layer.fontSize ?? 32, color: layer.color ?? '#fff' }}
        >
          {layer.text}
        </div>
      )}
      {layer.kind === 'sticker' && (
        <div className="flex h-full w-full items-center justify-center" style={{ fontSize: layer.fontSize ?? 48 }}>
          {layer.text}
        </div>
      )}
      {layer.kind === 'shape' && <Shape layer={layer} />}
    </div>
  )
}

function Shape({ layer }: { layer: PosterLayer }) {
  const fill = layer.fill ?? layer.color ?? '#ff2d6a'
  const w = layer.w ?? 120
  const h = layer.h ?? 80
  if (layer.shape === 'circle') {
    return <div className="h-full w-full rounded-full" style={{ background: fill }} />
  }
  if (layer.shape === 'star') {
    return (
      <svg viewBox="0 0 100 100" className="h-full w-full">
        <polygon
          fill={fill}
          points="50,4 61,38 98,38 68,59 79,94 50,73 21,94 32,59 2,38 39,38"
        />
      </svg>
    )
  }
  if (layer.shape === 'banner') {
    return (
      <svg viewBox={`0 0 ${w} ${h}`} className="h-full w-full">
        <path d={`M0 0 H${w} L${w - 16} ${h / 2} L${w} ${h} H0 L16 ${h / 2} Z`} fill={fill} />
      </svg>
    )
  }
  return <div className="h-full w-full rounded-xl" style={{ background: fill }} />
}

export function layerBox(layer: PosterLayer): { w: number; h: number } {
  if (layer.kind === 'text') {
    const size = layer.fontSize ?? 32
    return {
      w: layer.w ?? Math.max(48, (layer.text?.length ?? 1) * size * 0.62),
      h: layer.h ?? size * 1.2,
    }
  }
  if (layer.kind === 'sticker') {
    const size = layer.fontSize ?? 48
    return { w: layer.w ?? size, h: layer.h ?? size }
  }
  return { w: layer.w ?? 120, h: layer.h ?? 80 }
}

export function hitLayer(layers: PosterLayer[], x: number, y: number): PosterLayer | undefined {
  for (let index = layers.length - 1; index >= 0; index -= 1) {
    const layer = layers[index]
    if (layer.kind === 'draw') {
      continue
    }
    const box = layerBox(layer)
    if (x >= layer.x && y >= layer.y && x <= layer.x + box.w && y <= layer.y + box.h) {
      return layer
    }
  }
  return undefined
}
