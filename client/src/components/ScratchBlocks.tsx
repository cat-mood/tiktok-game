import {
  BLOCK_CONDITION_LABELS,
  BLOCK_EVENT_LABELS,
  CONDITION_PROPERTIES,
  LOGIC_EVENTS,
  PRODUCT_NAME,
  type AppState,
  type ConditionProperty,
  type LogicEvent,
  type LogicTransition,
} from '@brainrot/shared'

type ScriptProps = {
  transition: LogicTransition
  states: AppState[]
  readOnly?: boolean
  selected?: boolean
  onSelect: () => void
  onChange: (next: LogicTransition) => void
  onDelete: () => void
}

export function WhenAppOpensScript({
  stateId,
  states,
  readOnly,
  onChange,
}: {
  stateId: string
  states: AppState[]
  readOnly?: boolean
  onChange: (stateId: string) => void
}) {
  return (
    <article className="sb-script">
      <div className="sb-hat is-looks">
        <span>когда открыли {PRODUCT_NAME}</span>
        <span className="sb-bump" />
      </div>
      <div className="sb-stack is-looks">
        <span>начать с</span>
        <StateSlot states={states} value={stateId} disabled={readOnly} onChange={onChange} />
      </div>
    </article>
  )
}

export function WhenGoToScript({
  transition,
  states,
  readOnly,
  selected,
  onSelect,
  onChange,
  onDelete,
}: ScriptProps) {
  return (
    <article
      className={['sb-script', selected ? 'is-selected' : ''].filter(Boolean).join(' ')}
      onClick={onSelect}
    >
      {!readOnly && (
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation()
            onDelete()
          }}
          className="absolute -right-1 -top-2 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-ink text-lg text-white/70"
          aria-label="Удалить скрипт"
        >
          ×
        </button>
      )}
      <div className="sb-hat">
        <span>когда</span>
        <EventSlot
          value={transition.event}
          disabled={readOnly}
          onChange={(event) => onChange({ ...transition, event })}
        />
        <span className="sb-bump" />
      </div>
      {transition.condition ? (
        <IfGoTo
          transition={transition}
          states={states}
          readOnly={readOnly}
          onChange={onChange}
        />
      ) : (
        <GoToBlock
          states={states}
          value={transition.toStateId}
          disabled={readOnly}
          onChange={(toStateId) => onChange({ ...transition, toStateId })}
        />
      )}
    </article>
  )
}

function IfGoTo({
  transition,
  states,
  readOnly,
  onChange,
}: {
  transition: LogicTransition
  states: AppState[]
  readOnly?: boolean
  onChange: (next: LogicTransition) => void
}) {
  const condition = transition.condition
  if (!condition) {
    return null
  }
  return (
    <div className="sb-c">
      <div className="sb-c-head">
        <span>если</span>
        <ConditionSlot
          value={condition.property}
          disabled={readOnly}
          onChange={(property) => onChange({ ...transition, condition: { ...condition, property } })}
        />
        <span className="mx-1">=</span>
        <BoolSlot
          value={condition.value}
          disabled={readOnly}
          onChange={(value) => onChange({ ...transition, condition: { ...condition, value } })}
        />
        <span className="sb-bump" />
      </div>
      <div className="sb-c-mouth">
        <div className="sb-c-rail" />
        <div className="sb-c-inner">
          <GoToBlock
            states={states}
            value={transition.toStateId}
            disabled={readOnly}
            onChange={(toStateId) => onChange({ ...transition, toStateId })}
          />
        </div>
      </div>
      <div className="sb-c-mid">
        иначе
        <span className="sb-bump" />
      </div>
      <div className="sb-c-mouth">
        <div className="sb-c-rail" />
        <div className="sb-c-inner">
          <GoToBlock
            states={states}
            value={transition.elseStateId ?? ''}
            allowStay
            disabled={readOnly}
            onChange={(elseStateId) =>
              onChange({ ...transition, elseStateId: elseStateId || null })
            }
          />
        </div>
      </div>
      <div className="sb-c-foot">
        <span className="sb-bump" />
      </div>
    </div>
  )
}

function GoToBlock({
  states,
  value,
  allowStay,
  disabled,
  onChange,
}: {
  states: AppState[]
  value: string
  allowStay?: boolean
  disabled?: boolean
  onChange: (value: string) => void
}) {
  return (
    <div className="sb-stack">
      <span>открыть</span>
      <StateSlot
        states={states}
        value={value}
        allowStay={allowStay}
        disabled={disabled}
        onChange={onChange}
      />
    </div>
  )
}

function EventSlot({
  value,
  disabled,
  onChange,
}: {
  value: LogicEvent
  disabled?: boolean
  onChange: (value: LogicEvent) => void
}) {
  return (
    <select
      className="sb-slot"
      value={value}
      disabled={disabled}
      onClick={(event) => event.stopPropagation()}
      onChange={(event) => onChange(event.target.value as LogicEvent)}
    >
      {LOGIC_EVENTS.map((item) => (
        <option key={item} value={item}>
          {BLOCK_EVENT_LABELS[item]}
        </option>
      ))}
    </select>
  )
}

function StateSlot({
  states,
  value,
  allowStay,
  disabled,
  onChange,
}: {
  states: AppState[]
  value: string
  allowStay?: boolean
  disabled?: boolean
  onChange: (value: string) => void
}) {
  return (
    <select
      className="sb-slot"
      value={value}
      disabled={disabled}
      onClick={(event) => event.stopPropagation()}
      onChange={(event) => onChange(event.target.value)}
    >
      {allowStay && <option value="">остаться здесь</option>}
      {states.map((item) => (
        <option key={item.id} value={item.id}>
          {item.name}
        </option>
      ))}
    </select>
  )
}

function ConditionSlot({
  value,
  disabled,
  onChange,
}: {
  value: ConditionProperty
  disabled?: boolean
  onChange: (value: ConditionProperty) => void
}) {
  return (
    <select
      className="sb-slot"
      value={value}
      disabled={disabled}
      onClick={(event) => event.stopPropagation()}
      onChange={(event) => onChange(event.target.value as ConditionProperty)}
    >
      {CONDITION_PROPERTIES.map((item) => (
        <option key={item} value={item}>
          {BLOCK_CONDITION_LABELS[item]}
        </option>
      ))}
    </select>
  )
}

function BoolSlot({
  value,
  disabled,
  onChange,
}: {
  value: boolean
  disabled?: boolean
  onChange: (value: boolean) => void
}) {
  return (
    <select
      className="sb-slot"
      value={value ? 'yes' : 'no'}
      disabled={disabled}
      onClick={(event) => event.stopPropagation()}
      onChange={(event) => onChange(event.target.value === 'yes')}
    >
      <option value="yes">да</option>
      <option value="no">нет</option>
    </select>
  )
}
