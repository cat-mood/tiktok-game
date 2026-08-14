import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { PRODUCT_NAME } from '@brainrot/shared'

const WIFI_SSID = 'brainrot'
const WIFI_PASSWORD = 'brainrot'

type LanResponse = {
  addresses: string[]
}

function escapeWifi(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/([,;:"])/g, '\\$1')
}

function wifiPayload(ssid: string, password: string): string {
  return `WIFI:T:WPA;S:${escapeWifi(ssid)};P:${escapeWifi(password)};;`
}

function isLoopback(host: string): boolean {
  return host === 'localhost' || host === '127.0.0.1' || host === '[::1]' || host === '::1'
}

function playerUrl(ip: string): string {
  const port = window.location.port
  const host = port ? `${ip}:${port}` : ip
  return `${window.location.protocol}//${host}/`
}

function fallbackAddresses(): string[] {
  const host = window.location.hostname
  return isLoopback(host) ? [] : [host]
}

export function QrScreen() {
  const [addresses, setAddresses] = useState<string[]>(fallbackAddresses)
  const [selected, setSelected] = useState(0)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    const load = async () => {
      try {
        const response = await fetch('/api/lan')
        if (!response.ok) {
          throw new Error('bad status')
        }
        const data = (await response.json()) as LanResponse
        if (cancelled) {
          return
        }
        const next = data.addresses.length > 0 ? data.addresses : fallbackAddresses()
        setAddresses(next)
        setSelected((current) => Math.min(current, Math.max(0, next.length - 1)))
        setError(next.length > 0 ? null : 'Не найден локальный IP. Проверь Wi‑Fi точку.')
      } catch {
        if (cancelled) {
          return
        }
        const next = fallbackAddresses()
        setAddresses(next)
        setError(next.length > 0 ? null : 'Не удалось получить локальный IP сервера.')
      }
    }

    void load()
    const timer = window.setInterval(() => void load(), 5000)
    return () => {
      cancelled = true
      window.clearInterval(timer)
    }
  }, [])

  const wifiValue = useMemo(() => wifiPayload(WIFI_SSID, WIFI_PASSWORD), [])
  const joinUrl = addresses[selected] ? playerUrl(addresses[selected]) : null

  return (
    <div className="grid-overlay min-h-dvh px-5 py-8">
      <div className="mx-auto max-w-5xl">
        <p className="text-xs font-semibold uppercase tracking-[0.35em] text-cyan/70">IT Challenge</p>
        <h1 className="mt-3 font-display text-5xl leading-none tracking-tight sm:text-6xl">Подключение</h1>
        <p className="mt-4 max-w-2xl text-lg text-white/60">
          Сначала Wi‑Fi, потом игра. Телефон отсканирует QR и подключится к {PRODUCT_NAME}.
        </p>

        <div className="mt-10 grid gap-5 lg:grid-cols-2">
          <QrCard
            step="1"
            accent="cyan"
            title="Wi‑Fi"
            hint="Точка доступа на этом компьютере"
            value={wifiValue}
          >
            <dl className="mt-5 grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-lg">
              <dt className="text-white/45">Имя</dt>
              <dd className="font-display text-2xl">{WIFI_SSID}</dd>
              <dt className="text-white/45">Пароль</dt>
              <dd className="font-display text-2xl">{WIFI_PASSWORD}</dd>
            </dl>
          </QrCard>

          <QrCard
            step="2"
            accent="gold"
            title="Игра"
            hint="Откроет экран присоединения"
            value={joinUrl}
          >
            {addresses.length > 1 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {addresses.map((ip, index) => (
                  <button
                    key={ip}
                    type="button"
                    onClick={() => setSelected(index)}
                    className={`rounded-full px-3 py-1.5 text-sm ${
                      selected === index ? 'bg-gold text-ink' : 'bg-white/10 text-white/70'
                    }`}
                  >
                    {ip}
                  </button>
                ))}
              </div>
            )}
            <p className="mt-5 break-all font-display text-2xl text-gold">{joinUrl ?? 'Ищем локальный IP…'}</p>
            {error && <p className="mt-3 text-mag">{error}</p>}
          </QrCard>
        </div>
      </div>
    </div>
  )
}

function QrCard({
  step,
  accent,
  title,
  hint,
  value,
  children,
}: {
  step: string
  accent: 'cyan' | 'gold'
  title: string
  hint: string
  value: string | null
  children: ReactNode
}) {
  const ring = accent === 'cyan' ? 'border-cyan/30 shadow-glow' : 'border-gold/30'
  const stepColor = accent === 'cyan' ? 'text-cyan' : 'text-gold'

  return (
    <section className={`rounded-[2rem] border bg-panel/80 px-6 py-6 ${ring}`}>
      <p className={`text-xs font-semibold uppercase tracking-[0.35em] ${stepColor}`}>Шаг {step}</p>
      <h2 className="mt-2 font-display text-4xl">{title}</h2>
      <p className="mt-1 text-white/45">{hint}</p>
      <div className="mt-6 flex justify-center">
        <div className="rounded-[1.75rem] bg-white p-4">
          {value ? (
            <QRCodeSVG value={value} size={260} level="M" marginSize={2} bgColor="#ffffff" fgColor="#07070c" />
          ) : (
            <div className="flex h-[260px] w-[260px] items-center justify-center text-center text-ink/50">
              Нет адреса
            </div>
          )}
        </div>
      </div>
      {children}
    </section>
  )
}
