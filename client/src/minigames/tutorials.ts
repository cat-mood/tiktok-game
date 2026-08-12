import { GAME_TYPE_META, type GameType } from '@brainrot/shared'

export type TutorialContent = {
  title: string
  body: string
  exampleTitle: string
  example: string[]
}

export const TUTORIALS: Record<GameType, TutorialContent> = {
  DECRYPT_MESSAGE: {
    title: GAME_TYPE_META.DECRYPT_MESSAGE.title,
    body: 'Сообщение спрятано за числами. Каждое число — это буква. Найди буквы по ключу и собери слово.',
    exampleTitle: 'Пример',
    example: ['1 → А', '2 → Б', '3 → В', 'Сообщение: 1 2 3', 'Ответ: АБВ'],
  },
  BUILD_ALGORITHM: {
    title: GAME_TYPE_META.BUILD_ALGORITHM.title,
    body: 'Алгоритм — это последовательность действий для решения задачи. Расставь карточки в правильном порядке. Лишние карточки в ответ класть нельзя.',
    exampleTitle: 'Пример',
    example: ['1. Встать', '2. Взять телефон', '3. Открыть TikTok', '→ правильно'],
  },
  SEQUENCE: {
    title: GAME_TYPE_META.SEQUENCE.title,
    body: 'Найди правило ряда и скажи, что будет дальше. Это головоломка, а не контрольная.',
    exampleTitle: 'Пример',
    example: ['2  4  6  8  ?', 'Ответ: 10'],
  },
  SPEED_TYPING: {
    title: GAME_TYPE_META.SPEED_TYPING.title,
    body: 'Напечатай фразу на экране. Заглавные буквы можно не повторять — главное набрать те же слова.',
    exampleTitle: 'Пример',
    example: ['На экране: СНИМИ ВИДЕО', 'Напечатай: сними видео'],
  },
}
