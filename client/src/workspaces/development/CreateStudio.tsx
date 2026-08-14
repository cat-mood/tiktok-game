import { useState } from 'react'
import { ActionList, BugStrip, MissionHints, useScreenLogic, type StudioProps } from './shared'

export function CreateStudio({ state, onError, readOnly }: StudioProps) {
  const logic = useScreenLogic(state, onError, 'create')
  const [recorded, setRecorded] = useState(false)

  return (
    <div className="space-y-4">
      <BugStrip state={state} screenName="Создание" />
      <MissionHints stateId="create" />
      <section className="dev-create overflow-hidden rounded-[2rem] border border-line p-4">
        <p className="text-xs font-bold uppercase tracking-[0.22em] text-white/45">Камера</p>
        <h2 className="mt-1 font-display text-3xl leading-none">Снять и выложить</h2>
        <p className="mt-2 text-sm text-white/55">
          Сначала запись — это шутка на этом экране. Потом решаешь, куда улетает готовый ролик.
        </p>
        <div className="relative mx-auto mt-4 h-[320px] w-[210px] overflow-hidden rounded-[1.8rem] bg-black shadow-[0_0_0_3px_#3a3a46]">
          <div className="absolute inset-0 bg-gradient-to-b from-[#2a1030] via-[#0b1f1c] to-black" />
          <div className="absolute inset-x-8 top-16 h-40 rounded-full border border-white/15" />
          {!recorded ? (
            <button
              type="button"
              onClick={() => setRecorded(true)}
              className="rec-pulse absolute bottom-8 left-1/2 h-16 w-16 -translate-x-1/2 rounded-full border-4 border-white bg-mag"
            />
          ) : (
            <div className="absolute inset-x-6 bottom-8 space-y-2 text-center">
              <p className="stamp-in font-display text-3xl text-gold">снято!</p>
              <p className="text-sm text-white/70">Теперь выбери, куда публикуем</p>
            </div>
          )}
          <button
            type="button"
            onClick={() => setRecorded(false)}
            className="absolute left-3 top-3 rounded-full bg-black/40 px-3 py-1 text-xs font-bold"
          >
            ← отмена
          </button>
        </div>
      </section>
      <ActionList
        stateId="create"
        states={logic.states}
        byEvent={logic.byEvent}
        readOnly={readOnly}
        accent="#ff2d6a"
        onChange={logic.setAction}
        onLock={logic.setLocked}
      />
    </div>
  )
}
