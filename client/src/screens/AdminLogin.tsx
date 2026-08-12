import { useState } from 'react'
import { CLIENT_EVENTS } from '@brainrot/shared'
import { emitAck } from '../socket'

const STORAGE_KEY = 'brainrot.adminCode'

type Props = {
  onAuthed: (code: string) => void
}

export function AdminLogin({ onAuthed }: Props) {
  const [code, setCode] = useState(() => sessionStorage.getItem(STORAGE_KEY) ?? '')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const submit = async () => {
    setBusy(true)
    const ack = await emitAck(CLIENT_EVENTS.adminAuth, { code })
    setBusy(false)
    if (!ack.ok) {
      setError(ack.error)
      return
    }
    sessionStorage.setItem(STORAGE_KEY, code)
    onAuthed(code)
  }

  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col justify-center px-6">
      <p className="text-xs font-semibold uppercase tracking-[0.35em] text-cyan/70">Admin</p>
      <h1 className="mt-3 font-display text-5xl">Управление игрой</h1>
      <label className="mt-10 text-sm uppercase tracking-[0.2em] text-white/50">Секретный код</label>
      <input
        type="password"
        value={code}
        onChange={(event) => setCode(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === 'Enter') {
            void submit()
          }
        }}
        className="mt-3 rounded-2xl border border-line bg-panel px-5 py-4 text-xl outline-none focus:ring-2 focus:ring-cyan/40"
      />
      {error && <p className="mt-3 text-mag">{error}</p>}
      <button
        type="button"
        disabled={!code || busy}
        onClick={() => void submit()}
        className="mt-6 rounded-2xl bg-cyan py-4 text-xl font-bold text-ink disabled:opacity-40"
      >
        Войти
      </button>
    </div>
  )
}

