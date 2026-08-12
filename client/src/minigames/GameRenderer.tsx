import type { MiniGamePrompt } from '@brainrot/shared'
import { DecryptMessage } from './games/DecryptMessage'
import { BuildAlgorithm } from './games/BuildAlgorithm'
import { SequenceGame } from './games/SequenceGame'
import { SpeedTyping } from './games/SpeedTyping'

type Props = {
  prompt: MiniGamePrompt
  answer: unknown
  onAnswerChange: (answer: unknown) => void
  onComplete?: (answer: unknown) => void
}

export function GameRenderer({ prompt, answer, onAnswerChange, onComplete }: Props) {
  switch (prompt.kind) {
    case 'DECRYPT_MESSAGE':
      return (
        <DecryptMessage
          prompt={prompt}
          value={typeof answer === 'string' ? answer : ''}
          onChange={onAnswerChange}
        />
      )
    case 'BUILD_ALGORITHM':
      return (
        <BuildAlgorithm
          prompt={prompt}
          value={Array.isArray(answer) ? (answer as string[]) : []}
          onChange={onAnswerChange}
        />
      )
    case 'SEQUENCE':
      return (
        <SequenceGame
          prompt={prompt}
          value={typeof answer === 'string' ? answer : ''}
          onChange={onAnswerChange}
        />
      )
    case 'SPEED_TYPING':
      return (
        <SpeedTyping
          prompt={prompt}
          value={typeof answer === 'string' ? answer : ''}
          onChange={onAnswerChange}
          onComplete={onComplete ? (value) => onComplete(value) : undefined}
        />
      )
    default:
      return <p className="text-center text-white/50">Неизвестная мини-игра.</p>
  }
}
