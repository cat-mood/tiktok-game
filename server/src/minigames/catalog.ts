import {
  TIME_LIMIT_MS_BY_DIFFICULTY,
  type GameType,
  type MiniGamePrompt,
} from '@brainrot/shared'
import type { TaskDifficulty } from '@brainrot/shared'

export type PuzzleAnswer = string | string[]

export type Puzzle = {
  id: string
  gameType: GameType
  difficulty: TaskDifficulty
  timeLimitMs: number
  prompt: MiniGamePrompt
  answer: PuzzleAnswer
}

const RU = 'АБВГДЕЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЫЬЭЮЯ'

function numberKey(): Array<{ from: string; to: string }> {
  return [...RU].map((letter, index) => ({
    from: String(index + 1),
    to: letter,
  }))
}

function encodeNumbers(text: string): string {
  return [...text]
    .map((char) => {
      if (char === ' ') {
        return '/'
      }
      const index = RU.indexOf(char)
      if (index < 0) {
        throw new Error(`Cannot encode character: ${char}`)
      }
      return String(index + 1)
    })
    .join(' ')
}

function reversePhrase(text: string): string {
  return [...text].reverse().join('')
}

const NUMBER_KEY = numberKey()

export const PUZZLES: Puzzle[] = [
  {
    id: 'decrypt-easy-video',
    gameType: 'DECRYPT_MESSAGE',
    difficulty: 'EASY',
    timeLimitMs: TIME_LIMIT_MS_BY_DIFFICULTY.EASY,
    prompt: {
      kind: 'DECRYPT_MESSAGE',
      title: 'Расшифруй сообщение',
      instruction: 'Каждое число — это буква. Собери слово.',
      key: NUMBER_KEY,
      encryptedText: encodeNumbers('ВИДЕО'),
    },
    answer: 'ВИДЕО',
  },
  {
    id: 'decrypt-easy-like',
    gameType: 'DECRYPT_MESSAGE',
    difficulty: 'EASY',
    timeLimitMs: TIME_LIMIT_MS_BY_DIFFICULTY.EASY,
    prompt: {
      kind: 'DECRYPT_MESSAGE',
      title: 'Расшифруй сообщение',
      instruction: 'Каждое число — это буква. Собери слово.',
      key: NUMBER_KEY,
      encryptedText: encodeNumbers('ЛАЙК'),
    },
    answer: 'ЛАЙК',
  },
  {
    id: 'decrypt-easy-clip',
    gameType: 'DECRYPT_MESSAGE',
    difficulty: 'EASY',
    timeLimitMs: TIME_LIMIT_MS_BY_DIFFICULTY.EASY,
    prompt: {
      kind: 'DECRYPT_MESSAGE',
      title: 'Расшифруй сообщение',
      instruction: 'Каждое число — это буква. Собери слово.',
      key: NUMBER_KEY,
      encryptedText: encodeNumbers('КЛИП'),
    },
    answer: 'КЛИП',
  },
  {
    id: 'decrypt-medium-shoot',
    gameType: 'DECRYPT_MESSAGE',
    difficulty: 'MEDIUM',
    timeLimitMs: TIME_LIMIT_MS_BY_DIFFICULTY.MEDIUM,
    prompt: {
      kind: 'DECRYPT_MESSAGE',
      title: 'Расшифруй сообщение',
      instruction: 'Числа — это буквы. Знак / — это пробел между словами.',
      key: NUMBER_KEY,
      encryptedText: encodeNumbers('СНИМИ ВИДЕО'),
    },
    answer: 'СНИМИ ВИДЕО',
  },
  {
    id: 'decrypt-medium-upload',
    gameType: 'DECRYPT_MESSAGE',
    difficulty: 'MEDIUM',
    timeLimitMs: TIME_LIMIT_MS_BY_DIFFICULTY.MEDIUM,
    prompt: {
      kind: 'DECRYPT_MESSAGE',
      title: 'Расшифруй сообщение',
      instruction: 'Числа — это буквы. Знак / — это пробел между словами.',
      key: NUMBER_KEY,
      encryptedText: encodeNumbers('ЗАГРУЗИ РОЛИК'),
    },
    answer: 'ЗАГРУЗИ РОЛИК',
  },
  {
    id: 'decrypt-medium-tiktok',
    gameType: 'DECRYPT_MESSAGE',
    difficulty: 'MEDIUM',
    timeLimitMs: TIME_LIMIT_MS_BY_DIFFICULTY.MEDIUM,
    prompt: {
      kind: 'DECRYPT_MESSAGE',
      title: 'Расшифруй сообщение',
      instruction: 'Числа — это буквы. Знак / — это пробел между словами.',
      key: NUMBER_KEY,
      encryptedText: encodeNumbers('НОВЫЙ ТИКТОК'),
    },
    answer: 'НОВЫЙ ТИКТОК',
  },
  {
    id: 'decrypt-hard-your-clip',
    gameType: 'DECRYPT_MESSAGE',
    difficulty: 'HARD',
    timeLimitMs: TIME_LIMIT_MS_BY_DIFFICULTY.HARD,
    prompt: {
      kind: 'DECRYPT_MESSAGE',
      title: 'Расшифруй сообщение',
      instruction:
        'Сначала замени числа на буквы. Знак / — пробел. Потом прочитай всё сообщение справа налево.',
      key: NUMBER_KEY,
      encryptedText: encodeNumbers(reversePhrase('ТВОЙ РОЛИК')),
    },
    answer: 'ТВОЙ РОЛИК',
  },
  {
    id: 'decrypt-hard-shoot-video',
    gameType: 'DECRYPT_MESSAGE',
    difficulty: 'HARD',
    timeLimitMs: TIME_LIMIT_MS_BY_DIFFICULTY.HARD,
    prompt: {
      kind: 'DECRYPT_MESSAGE',
      title: 'Расшифруй сообщение',
      instruction:
        'Сначала замени числа на буквы. Знак / — пробел. Потом прочитай всё сообщение справа налево.',
      key: NUMBER_KEY,
      encryptedText: encodeNumbers(reversePhrase('СНИМИ ВИДЕО')),
    },
    answer: 'СНИМИ ВИДЕО',
  },
  {
    id: 'decrypt-hard-new-hit',
    gameType: 'DECRYPT_MESSAGE',
    difficulty: 'HARD',
    timeLimitMs: TIME_LIMIT_MS_BY_DIFFICULTY.HARD,
    prompt: {
      kind: 'DECRYPT_MESSAGE',
      title: 'Расшифруй сообщение',
      instruction:
        'Сначала замени числа на буквы. Знак / — пробел. Потом прочитай всё сообщение справа налево.',
      key: NUMBER_KEY,
      encryptedText: encodeNumbers(reversePhrase('НОВЫЙ ХИТ')),
    },
    answer: 'НОВЫЙ ХИТ',
  },

  {
    id: 'algo-easy-upload',
    gameType: 'BUILD_ALGORITHM',
    difficulty: 'EASY',
    timeLimitMs: TIME_LIMIT_MS_BY_DIFFICULTY.EASY,
    prompt: {
      kind: 'BUILD_ALGORITHM',
      title: 'Собери алгоритм',
      instruction: 'Расставь действия в правильном порядке: как загрузить видео.',
      cards: [
        { id: 'b', text: 'Нажать «Загрузить»' },
        { id: 'd', text: 'Опубликовать видео' },
        { id: 'a', text: 'Выбрать видео' },
        { id: 'c', text: 'Добавить описание' },
      ],
    },
    answer: ['a', 'b', 'c', 'd'],
  },
  {
    id: 'algo-easy-open',
    gameType: 'BUILD_ALGORITHM',
    difficulty: 'EASY',
    timeLimitMs: TIME_LIMIT_MS_BY_DIFFICULTY.EASY,
    prompt: {
      kind: 'BUILD_ALGORITHM',
      title: 'Собери алгоритм',
      instruction: 'Расставь действия: как открыть TikTok.',
      cards: [
        { id: 'c', text: 'Найти TikTok' },
        { id: 'a', text: 'Взять телефон' },
        { id: 'd', text: 'Открыть TikTok' },
        { id: 'b', text: 'Разблокировать экран' },
      ],
    },
    answer: ['a', 'b', 'c', 'd'],
  },
  {
    id: 'algo-easy-like',
    gameType: 'BUILD_ALGORITHM',
    difficulty: 'EASY',
    timeLimitMs: TIME_LIMIT_MS_BY_DIFFICULTY.EASY,
    prompt: {
      kind: 'BUILD_ALGORITHM',
      title: 'Собери алгоритм',
      instruction: 'Расставь действия: как поставить лайк.',
      cards: [
        { id: 'd', text: 'Поставить лайк' },
        { id: 'b', text: 'Найти видео' },
        { id: 'a', text: 'Открыть TikTok' },
        { id: 'c', text: 'Посмотреть ролик' },
      ],
    },
    answer: ['a', 'b', 'c', 'd'],
  },
  {
    id: 'algo-medium-film',
    gameType: 'BUILD_ALGORITHM',
    difficulty: 'MEDIUM',
    timeLimitMs: TIME_LIMIT_MS_BY_DIFFICULTY.MEDIUM,
    prompt: {
      kind: 'BUILD_ALGORITHM',
      title: 'Собери алгоритм',
      instruction: 'Собери порядок: снять ролик и выложить его.',
      cards: [
        { id: 'e', text: 'Добавить описание' },
        { id: 'b', text: 'Снять видео' },
        { id: 'f', text: 'Опубликовать' },
        { id: 'a', text: 'Открыть камеру' },
        { id: 'd', text: 'Нажать «Загрузить»' },
        { id: 'c', text: 'Проверить ролик' },
      ],
    },
    answer: ['a', 'b', 'c', 'd', 'e', 'f'],
  },
  {
    id: 'algo-medium-comment',
    gameType: 'BUILD_ALGORITHM',
    difficulty: 'MEDIUM',
    timeLimitMs: TIME_LIMIT_MS_BY_DIFFICULTY.MEDIUM,
    prompt: {
      kind: 'BUILD_ALGORITHM',
      title: 'Собери алгоритм',
      instruction: 'Собери порядок: ответить на комментарий.',
      cards: [
        { id: 'c', text: 'Открыть комментарии' },
        { id: 'f', text: 'Отправить ответ' },
        { id: 'a', text: 'Открыть TikTok' },
        { id: 'e', text: 'Написать ответ' },
        { id: 'b', text: 'Найти своё видео' },
        { id: 'd', text: 'Прочитать сообщение' },
      ],
    },
    answer: ['a', 'b', 'c', 'd', 'e', 'f'],
  },
  {
    id: 'algo-medium-together',
    gameType: 'BUILD_ALGORITHM',
    difficulty: 'MEDIUM',
    timeLimitMs: TIME_LIMIT_MS_BY_DIFFICULTY.MEDIUM,
    prompt: {
      kind: 'BUILD_ALGORITHM',
      title: 'Собери алгоритм',
      instruction: 'Собери порядок: снять ролик вместе с другом.',
      cards: [
        { id: 'd', text: 'Проверить оба ролика' },
        { id: 'a', text: 'Найти видео друга' },
        { id: 'f', text: 'Опубликовать' },
        { id: 'c', text: 'Снять своё видео' },
        { id: 'b', text: 'Нажать «Снять рядом»' },
        { id: 'e', text: 'Добавить музыку' },
      ],
    },
    answer: ['a', 'b', 'c', 'd', 'e', 'f'],
  },
  {
    id: 'algo-hard-publish',
    gameType: 'BUILD_ALGORITHM',
    difficulty: 'HARD',
    timeLimitMs: TIME_LIMIT_MS_BY_DIFFICULTY.HARD,
    prompt: {
      kind: 'BUILD_ALGORITHM',
      title: 'Собери алгоритм',
      instruction:
        'Собери нужные действия в правильном порядке. Лишние карточки в ответ класть нельзя.',
      cards: [
        { id: 'x1', text: 'Открыть настройки телефона' },
        { id: 'c', text: 'Выбрать видео' },
        { id: 'a', text: 'Открыть TikTok' },
        { id: 'f', text: 'Опубликовать' },
        { id: 'x2', text: 'Удалить все приложения' },
        { id: 'd', text: 'Добавить описание' },
        { id: 'b', text: 'Нажать «Загрузить»' },
        { id: 'e', text: 'Проверить ролик' },
      ],
    },
    answer: ['a', 'b', 'c', 'd', 'e', 'f'],
  },
  {
    id: 'algo-hard-trend',
    gameType: 'BUILD_ALGORITHM',
    difficulty: 'HARD',
    timeLimitMs: TIME_LIMIT_MS_BY_DIFFICULTY.HARD,
    prompt: {
      kind: 'BUILD_ALGORITHM',
      title: 'Собери алгоритм',
      instruction:
        'Собери нужные действия в правильном порядке. Лишние карточки в ответ класть нельзя.',
      cards: [
        { id: 'e', text: 'Снять видео' },
        { id: 'a', text: 'Взять телефон' },
        { id: 'x1', text: 'Позвонить в техподдержку' },
        { id: 'g', text: 'Опубликовать' },
        { id: 'c', text: 'Открыть TikTok' },
        { id: 'b', text: 'Разблокировать экран' },
        { id: 'f', text: 'Проверить ролик' },
        { id: 'd', text: 'Найти тренд' },
      ],
    },
    answer: ['a', 'b', 'c', 'd', 'e', 'f', 'g'],
  },
  {
    id: 'algo-hard-message',
    gameType: 'BUILD_ALGORITHM',
    difficulty: 'HARD',
    timeLimitMs: TIME_LIMIT_MS_BY_DIFFICULTY.HARD,
    prompt: {
      kind: 'BUILD_ALGORITHM',
      title: 'Собери алгоритм',
      instruction:
        'Собери нужные действия в правильном порядке. Лишние карточки в ответ класть нельзя.',
      cards: [
        { id: 'x2', text: 'Выключить Wi-Fi' },
        { id: 'c', text: 'Посмотреть присланное видео' },
        { id: 'a', text: 'Открыть входящие' },
        { id: 'f', text: 'Отправить' },
        { id: 'x1', text: 'Сменить язык телефона' },
        { id: 'd', text: 'Написать ответ' },
        { id: 'b', text: 'Прочитать сообщение' },
        { id: 'e', text: 'Прикрепить свой ролик' },
      ],
    },
    answer: ['a', 'b', 'c', 'd', 'e', 'f'],
  },

  {
    id: 'seq-easy-even',
    gameType: 'SEQUENCE',
    difficulty: 'EASY',
    timeLimitMs: TIME_LIMIT_MS_BY_DIFFICULTY.EASY,
    prompt: {
      kind: 'SEQUENCE',
      title: 'Продолжи последовательность',
      instruction: 'Какое число следующее?',
      items: ['2', '4', '6', '8'],
    },
    answer: '10',
  },
  {
    id: 'seq-easy-count',
    gameType: 'SEQUENCE',
    difficulty: 'EASY',
    timeLimitMs: TIME_LIMIT_MS_BY_DIFFICULTY.EASY,
    prompt: {
      kind: 'SEQUENCE',
      title: 'Продолжи последовательность',
      instruction: 'Какое число следующее?',
      items: ['1', '2', '3', '4'],
    },
    answer: '5',
  },
  {
    id: 'seq-easy-down',
    gameType: 'SEQUENCE',
    difficulty: 'EASY',
    timeLimitMs: TIME_LIMIT_MS_BY_DIFFICULTY.EASY,
    prompt: {
      kind: 'SEQUENCE',
      title: 'Продолжи последовательность',
      instruction: 'Какое число следующее?',
      items: ['5', '4', '3', '2'],
    },
    answer: '1',
  },
  {
    id: 'seq-medium-double',
    gameType: 'SEQUENCE',
    difficulty: 'MEDIUM',
    timeLimitMs: TIME_LIMIT_MS_BY_DIFFICULTY.MEDIUM,
    prompt: {
      kind: 'SEQUENCE',
      title: 'Продолжи последовательность',
      instruction: 'Каждое число больше предыдущего по одному правилу. Что дальше?',
      items: ['3', '6', '12', '24'],
    },
    answer: '48',
  },
  {
    id: 'seq-medium-colors',
    gameType: 'SEQUENCE',
    difficulty: 'MEDIUM',
    timeLimitMs: TIME_LIMIT_MS_BY_DIFFICULTY.MEDIUM,
    prompt: {
      kind: 'SEQUENCE',
      title: 'Продолжи последовательность',
      instruction: 'Какой цвет следующий?',
      items: ['🔴', '🔵', '🔴', '🔵'],
      options: ['🔴', '🔵', '🟢', '🟡'],
    },
    answer: '🔴',
  },
  {
    id: 'seq-medium-odd',
    gameType: 'SEQUENCE',
    difficulty: 'MEDIUM',
    timeLimitMs: TIME_LIMIT_MS_BY_DIFFICULTY.MEDIUM,
    prompt: {
      kind: 'SEQUENCE',
      title: 'Продолжи последовательность',
      instruction: 'Какое число следующее?',
      items: ['1', '3', '5', '7'],
    },
    answer: '9',
  },
  {
    id: 'seq-hard-double-plus',
    gameType: 'SEQUENCE',
    difficulty: 'HARD',
    timeLimitMs: TIME_LIMIT_MS_BY_DIFFICULTY.HARD,
    prompt: {
      kind: 'SEQUENCE',
      title: 'Продолжи последовательность',
      instruction: 'Найди правило и продолжи ряд.',
      items: ['2', '5', '11', '23'],
    },
    answer: '47',
  },
  {
    id: 'seq-hard-arrows',
    gameType: 'SEQUENCE',
    difficulty: 'HARD',
    timeLimitMs: TIME_LIMIT_MS_BY_DIFFICULTY.HARD,
    prompt: {
      kind: 'SEQUENCE',
      title: 'Продолжи последовательность',
      instruction: 'Куда покажет следующая стрелка?',
      items: ['⬆️', '➡️', '⬇️', '⬅️'],
      options: ['⬆️', '➡️', '⬇️', '⬅️'],
    },
    answer: '⬆️',
  },
  {
    id: 'seq-hard-plus-n',
    gameType: 'SEQUENCE',
    difficulty: 'HARD',
    timeLimitMs: TIME_LIMIT_MS_BY_DIFFICULTY.HARD,
    prompt: {
      kind: 'SEQUENCE',
      title: 'Продолжи последовательность',
      instruction: 'Найди правило и продолжи ряд.',
      items: ['1', '2', '4', '7', '11'],
    },
    answer: '16',
  },

  {
    id: 'type-easy-shoot',
    gameType: 'SPEED_TYPING',
    difficulty: 'EASY',
    timeLimitMs: TIME_LIMIT_MS_BY_DIFFICULTY.EASY,
    prompt: {
      kind: 'SPEED_TYPING',
      title: 'Скоропечать',
      instruction: 'Напечатай фразу как можно быстрее.',
      text: 'СНИМИ ВИДЕО',
    },
    answer: 'СНИМИ ВИДЕО',
  },
  {
    id: 'type-easy-like',
    gameType: 'SPEED_TYPING',
    difficulty: 'EASY',
    timeLimitMs: TIME_LIMIT_MS_BY_DIFFICULTY.EASY,
    prompt: {
      kind: 'SPEED_TYPING',
      title: 'Скоропечать',
      instruction: 'Напечатай фразу как можно быстрее.',
      text: 'ПОСТАВЬ ЛАЙК',
    },
    answer: 'ПОСТАВЬ ЛАЙК',
  },
  {
    id: 'type-easy-open',
    gameType: 'SPEED_TYPING',
    difficulty: 'EASY',
    timeLimitMs: TIME_LIMIT_MS_BY_DIFFICULTY.EASY,
    prompt: {
      kind: 'SPEED_TYPING',
      title: 'Скоропечать',
      instruction: 'Напечатай фразу как можно быстрее.',
      text: 'ОТКРОЙ TIKTOK',
    },
    answer: 'ОТКРОЙ TIKTOK',
  },
  {
    id: 'type-medium-new',
    gameType: 'SPEED_TYPING',
    difficulty: 'MEDIUM',
    timeLimitMs: TIME_LIMIT_MS_BY_DIFFICULTY.MEDIUM,
    prompt: {
      kind: 'SPEED_TYPING',
      title: 'Скоропечать',
      instruction: 'Напечатай фразу как можно быстрее.',
      text: 'СНИМИ НОВОЕ ВИДЕО',
    },
    answer: 'СНИМИ НОВОЕ ВИДЕО',
  },
  {
    id: 'type-medium-upload',
    gameType: 'SPEED_TYPING',
    difficulty: 'MEDIUM',
    timeLimitMs: TIME_LIMIT_MS_BY_DIFFICULTY.MEDIUM,
    prompt: {
      kind: 'SPEED_TYPING',
      title: 'Скоропечать',
      instruction: 'Напечатай фразу как можно быстрее.',
      text: 'ЗАГРУЗИ ВИДЕО В ЛЕНТУ',
    },
    answer: 'ЗАГРУЗИ ВИДЕО В ЛЕНТУ',
  },
  {
    id: 'type-medium-check',
    gameType: 'SPEED_TYPING',
    difficulty: 'MEDIUM',
    timeLimitMs: TIME_LIMIT_MS_BY_DIFFICULTY.MEDIUM,
    prompt: {
      kind: 'SPEED_TYPING',
      title: 'Скоропечать',
      instruction: 'Напечатай фразу как можно быстрее.',
      text: 'ПРОВЕРЬ НОВЫЙ РОЛИК',
    },
    answer: 'ПРОВЕРЬ НОВЫЙ РОЛИК',
  },
  {
    id: 'type-hard-ready',
    gameType: 'SPEED_TYPING',
    difficulty: 'HARD',
    timeLimitMs: TIME_LIMIT_MS_BY_DIFFICULTY.HARD,
    prompt: {
      kind: 'SPEED_TYPING',
      title: 'Скоропечать',
      instruction: 'Напечатай фразу точно, вместе со знаками.',
      text: 'ТВОЙ TIKTOK ГОТОВ!',
    },
    answer: 'ТВОЙ TIKTOK ГОТОВ!',
  },
  {
    id: 'type-hard-three',
    gameType: 'SPEED_TYPING',
    difficulty: 'HARD',
    timeLimitMs: TIME_LIMIT_MS_BY_DIFFICULTY.HARD,
    prompt: {
      kind: 'SPEED_TYPING',
      title: 'Скоропечать',
      instruction: 'Напечатай фразу точно, вместе с цифрой.',
      text: 'СНИМИ 3 НОВЫХ РОЛИКА',
    },
    answer: 'СНИМИ 3 НОВЫХ РОЛИКА',
  },
  {
    id: 'type-hard-ok',
    gameType: 'SPEED_TYPING',
    difficulty: 'HARD',
    timeLimitMs: TIME_LIMIT_MS_BY_DIFFICULTY.HARD,
    prompt: {
      kind: 'SPEED_TYPING',
      title: 'Скоропечать',
      instruction: 'Напечатай фразу точно, вместе со знаками.',
      text: 'ПРОВЕРЬ РОЛИК №2 И ЖМИ «ОК»',
    },
    answer: 'ПРОВЕРЬ РОЛИК №2 И ЖМИ «ОК»',
  },
]

const puzzlesById = new Map(PUZZLES.map((puzzle) => [puzzle.id, puzzle]))

export function getPuzzle(id: string): Puzzle | undefined {
  return puzzlesById.get(id)
}

export function puzzlesFor(gameType: GameType, difficulty: TaskDifficulty): Puzzle[] {
  return PUZZLES.filter((puzzle) => puzzle.gameType === gameType && puzzle.difficulty === difficulty)
}

export function formatPuzzleAnswer(answer: PuzzleAnswer): string {
  return Array.isArray(answer) ? answer.join(' → ') : answer
}
