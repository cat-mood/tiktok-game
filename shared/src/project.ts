export const PRODUCT_NAME = 'брейнрот клипы'

export const CANVAS_WIDTH = 390
export const CANVAS_HEIGHT = 844

export const SCREEN_KEYS = ['FEED', 'VIDEO', 'COMMENTS', 'PROFILE', 'SHARE', 'CREATE', 'INBOX', 'COMPOSE'] as const
export type ScreenKey = (typeof SCREEN_KEYS)[number]

export const COMPONENT_TYPES = [
  'VIDEO',
  'TEXT',
  'BUTTON',
  'IMAGE',
  'AVATAR',
  'LIKE',
  'COMMENT',
  'SHARE',
  'NAVIGATION',
  'INPUT',
  'MODAL',
  'CAMERA',
  'RECORD',
  'CHAT_ROW',
  'BUBBLE',
  'SEND',
  'SEARCH',
] as const
export type ComponentType = (typeof COMPONENT_TYPES)[number]

export const LOGIC_EVENTS = [
  'CLICK',
  'CLICK_LIKE',
  'CLICK_COMMENT',
  'CLICK_SHARE',
  'SWIPE',
  'BACK',
  'SUBMIT',
  'CLOSE',
] as const
export type LogicEvent = (typeof LOGIC_EVENTS)[number]

export const COMPONENT_EVENT_MAP: Partial<Record<ComponentType, LogicEvent>> = {
  LIKE: 'CLICK_LIKE',
  COMMENT: 'CLICK_COMMENT',
  SHARE: 'CLICK_SHARE',
  BUTTON: 'CLICK',
  NAVIGATION: 'CLICK',
  INPUT: 'SUBMIT',
  MODAL: 'CLOSE',
  VIDEO: 'SWIPE',
  CAMERA: 'CLICK',
  RECORD: 'CLICK',
  CHAT_ROW: 'CLICK',
  SEND: 'SUBMIT',
  SEARCH: 'SUBMIT',
}

export const CONDITION_PROPERTIES = ['video.isLiked', 'comments.isOpen', 'share.isOpen'] as const
export type ConditionProperty = (typeof CONDITION_PROPERTIES)[number]

export const CONDITION_OPERATORS = ['eq', 'neq'] as const
export type ConditionOperator = (typeof CONDITION_OPERATORS)[number]

export const BUG_SEVERITIES = ['HIGH', 'MEDIUM', 'LOW'] as const
export type BugSeverity = (typeof BUG_SEVERITIES)[number]

export const MERCH_KINDS = ['tshirt', 'hoodie', 'sticker', 'cap', 'mug', 'tote'] as const
export type MerchKind = (typeof MERCH_KINDS)[number]

export const MERCH_PATTERNS = ['none', 'stripes', 'dots', 'grid', 'chevrons', 'stars', 'waves', 'camo', 'hearts'] as const
export type MerchPattern = (typeof MERCH_PATTERNS)[number]

export const MERCH_PRINT_KINDS = ['text', 'draw', 'pattern', 'sticker', 'image'] as const
export type MerchPrintKind = (typeof MERCH_PRINT_KINDS)[number]

export const IDEA_STICKER_COLORS = ['#ff2d6a', '#00f0ff', '#ffd166', '#ffffff', '#7cff6b', '#c084fc', '#ff8c1a', '#ff6b9d']

export const IDEA_CHANNELS = ['tiktok', 'reels', 'youtube', 'stories', 'offline', 'collab'] as const
export type IdeaChannel = (typeof IDEA_CHANNELS)[number]

export const IDEA_STATUSES = ['spark', 'draft', 'ready'] as const
export type IdeaStatus = (typeof IDEA_STATUSES)[number]

export const VIDEO_PLATFORMS = ['tiktok', 'reels', 'youtube', 'clips'] as const
export type VideoPlatform = (typeof VIDEO_PLATFORMS)[number]

export const POSTER_LAYER_KINDS = ['text', 'image', 'shape', 'sticker', 'draw'] as const
export type PosterLayerKind = (typeof POSTER_LAYER_KINDS)[number]

export const POSTER_SHAPES = ['rect', 'circle', 'star', 'banner'] as const
export type PosterShape = (typeof POSTER_SHAPES)[number]

export const POSTER_WIDTH = 360
export const POSTER_HEIGHT = 520

export const SIZE_PRESETS = ['S', 'M', 'L'] as const
export type SizePreset = (typeof SIZE_PRESETS)[number]

export type RuntimeFlags = Record<ConditionProperty, boolean>

export type AppState = {
  id: string
  name: string
  screenKey: ScreenKey
  flags: RuntimeFlags
}

export type ComponentProps = {
  text?: string
  color?: string
  background?: string
  active?: boolean
  src?: string
  placeholder?: string
}

export type DesignComponent = {
  id: string
  type: ComponentType
  x: number
  y: number
  w: number
  h: number
  props: ComponentProps
}

export type DesignLayout = {
  stateId: string
  components: DesignComponent[]
}

export type DesignDoc = {
  screens: ScreenKey[]
  layouts: DesignLayout[]
}

export type TransitionCondition = {
  property: ConditionProperty
  operator: ConditionOperator
  value: boolean
}

export type LogicTransition = {
  id: string
  fromStateId: string
  event: LogicEvent
  toStateId: string
  elseStateId: string | null
  condition: TransitionCondition | null
}

export type LogicDoc = {
  initialStateId: string | null
  transitions: LogicTransition[]
}

export type TestStep = {
  event: LogicEvent
}

export type TestRun = {
  testId: string
  passed: boolean
  expectedStateId: string
  actualStateId: string
  ranAt: string
}

export type TestCase = {
  id: string
  title: string
  startStateId: string
  steps: TestStep[]
  expectedStateId: string
  lastResult: TestRun | null
}

export type BugReport = {
  id: string
  title: string
  description: string
  steps: string
  expected: string
  actual: string
  severity: BugSeverity
  createdBy: string
}

export type QaDoc = {
  testCases: TestCase[]
  bugs: BugReport[]
}

export type PosterLayer = {
  id: string
  kind: PosterLayerKind
  text?: string
  src?: string
  x: number
  y: number
  w?: number
  h?: number
  rotation?: number
  fontSize?: number
  color?: string
  fill?: string
  opacity?: number
  shape?: PosterShape
  path?: string
  strokeWidth?: number
}

export type Poster = {
  id: string
  title?: string
  background: string
  layers: PosterLayer[]
}

export type CampaignIdea = {
  id: string
  title?: string
  text: string
  hook?: string
  channel?: IdeaChannel
  audience?: string
  cta?: string
  status?: IdeaStatus
  color?: string
}

export type MerchPrintLayer = {
  id: string
  kind: MerchPrintKind
  text?: string
  src?: string
  path?: string
  pattern?: MerchPattern
  x: number
  y: number
  w?: number
  h?: number
  fontSize?: number
  color?: string
  strokeWidth?: number
  rotation?: number
  opacity?: number
}

export type MerchItem = {
  id: string
  kind: MerchKind
  name?: string
  text: string
  color: string
  accent?: string
  textColor?: string
  logoSrc?: string
  printX?: number
  printY?: number
  printScale?: number
  pattern?: MerchPattern
  layers?: MerchPrintLayer[]
}

export type MarketingVideo = {
  id: string
  url: string
  name: string
  title?: string
  hook?: string
  script?: string
  platform?: VideoPlatform
  notes?: string
}

export type MarketingDoc = {
  slogan: string
  videos: MarketingVideo[]
  posters: Poster[]
  ideas: CampaignIdea[]
  merch: MerchItem[]
}

export type Project = {
  name: string
  revision: number
  states: AppState[]
  design: DesignDoc
  logic: LogicDoc
  marketing: MarketingDoc
  qa: QaDoc
}

export type ReleaseState = {
  frozenAt: string
  launchedAt: string | null
  snapshot: Project
  testResults: TestRun[]
  runtimeStateId: string | null
  runtimeFlags: RuntimeFlags
}

export const DEFAULT_COMPONENT_BOX: Record<ComponentType, { w: number; h: number; x: number; y: number }> =
  {
    VIDEO: { x: 0, y: 0, w: CANVAS_WIDTH, h: 700 },
    TEXT: { x: 16, y: 620, w: 280, h: 48 },
    BUTTON: { x: 24, y: 720, w: 342, h: 48 },
    IMAGE: { x: 24, y: 180, w: 342, h: 220 },
    AVATAR: { x: 16, y: 16, w: 48, h: 48 },
    LIKE: { x: 322, y: 480, w: 52, h: 52 },
    COMMENT: { x: 322, y: 548, w: 52, h: 52 },
    SHARE: { x: 322, y: 616, w: 52, h: 52 },
    NAVIGATION: { x: 0, y: 780, w: CANVAS_WIDTH, h: 64 },
    INPUT: { x: 16, y: 760, w: 358, h: 44 },
    MODAL: { x: 10, y: 240, w: 370, h: 520 },
    CAMERA: { x: 0, y: 0, w: CANVAS_WIDTH, h: 640 },
    RECORD: { x: 155, y: 670, w: 80, h: 80 },
    CHAT_ROW: { x: 0, y: 88, w: CANVAS_WIDTH, h: 72 },
    BUBBLE: { x: 16, y: 120, w: 260, h: 64 },
    SEND: { x: 326, y: 760, w: 48, h: 44 },
    SEARCH: { x: 16, y: 16, w: 358, h: 44 },
  }

export const SCREEN_COMPONENTS: Record<ScreenKey, ComponentType[]> = {
  VIDEO: ['VIDEO', 'LIKE', 'COMMENT', 'SHARE', 'AVATAR', 'TEXT', 'NAVIGATION'],
  FEED: ['IMAGE', 'VIDEO', 'TEXT', 'AVATAR', 'LIKE', 'NAVIGATION'],
  COMMENTS: ['AVATAR', 'TEXT', 'INPUT', 'BUTTON', 'COMMENT', 'MODAL'],
  PROFILE: ['AVATAR', 'TEXT', 'BUTTON', 'IMAGE', 'NAVIGATION'],
  SHARE: ['SHARE', 'BUTTON', 'TEXT', 'IMAGE', 'MODAL'],
  CREATE: ['CAMERA', 'RECORD', 'BUTTON', 'TEXT', 'IMAGE', 'AVATAR', 'NAVIGATION'],
  INBOX: ['CHAT_ROW', 'SEARCH', 'AVATAR', 'TEXT', 'BUTTON', 'NAVIGATION'],
  COMPOSE: ['BUBBLE', 'INPUT', 'SEND', 'AVATAR', 'TEXT', 'BUTTON'],
}

export const SIZE_PRESET_BOX: Record<SizePreset, { w: number; h: number }> = {
  S: { w: 48, h: 48 },
  M: { w: 140, h: 48 },
  L: { w: 342, h: 80 },
}

export const SCREEN_LABELS: Record<ScreenKey, string> = {
  FEED: 'Лента',
  VIDEO: 'Клип',
  COMMENTS: 'Комменты',
  PROFILE: 'Профиль',
  SHARE: 'Репост',
  CREATE: 'Съёмка',
  INBOX: 'Чаты',
  COMPOSE: 'Сообщение',
}

export const EVENT_LABELS: Record<LogicEvent, string> = {
  CLICK: 'CLICK',
  CLICK_LIKE: 'CLICK LIKE',
  CLICK_COMMENT: 'CLICK COMMENT',
  CLICK_SHARE: 'CLICK SHARE',
  SWIPE: 'SWIPE',
  BACK: 'BACK',
  SUBMIT: 'SUBMIT',
  CLOSE: 'CLOSE',
}

export const BLOCK_EVENT_LABELS: Record<LogicEvent, string> = {
  CLICK: 'нажали',
  CLICK_LIKE: 'нажали лайк',
  CLICK_COMMENT: 'нажали коммент',
  CLICK_SHARE: 'нажали репост',
  SWIPE: 'свайпнули',
  BACK: 'назад',
  SUBMIT: 'отправили',
  CLOSE: 'закрыли',
}

export const BLOCK_EVENT_SHORT: Record<LogicEvent, string> = {
  CLICK: 'Тап',
  CLICK_LIKE: 'Лайк',
  CLICK_COMMENT: 'Коммент',
  CLICK_SHARE: 'Репост',
  SWIPE: 'Свайп',
  BACK: 'Назад',
  SUBMIT: 'Отправить',
  CLOSE: 'Закрыть',
}

export const BLOCK_CONDITION_LABELS: Record<ConditionProperty, string> = {
  'video.isLiked': 'лайк стоит',
  'comments.isOpen': 'комменты открыты',
  'share.isOpen': 'репост открыт',
}

export const COMPONENT_LABELS: Record<ComponentType, string> = {
  VIDEO: 'Видео',
  TEXT: 'Текст',
  BUTTON: 'Кнопка',
  IMAGE: 'Картинка',
  AVATAR: 'Аватар',
  LIKE: 'Лайк',
  COMMENT: 'Коммент',
  SHARE: 'Репост',
  NAVIGATION: 'Меню',
  INPUT: 'Ввод',
  MODAL: 'Окно',
  CAMERA: 'Камера',
  RECORD: 'Снять',
  CHAT_ROW: 'Чат',
  BUBBLE: 'Пузырь',
  SEND: 'Отправить',
  SEARCH: 'Поиск',
}

export const COMPONENT_ICONS: Record<ComponentType, string> = {
  VIDEO: '▶',
  TEXT: 'Aa',
  BUTTON: '⬤',
  IMAGE: '🖼',
  AVATAR: '🙂',
  LIKE: '🤍',
  COMMENT: '💬',
  SHARE: '📤',
  NAVIGATION: '⌂',
  INPUT: '✏️',
  MODAL: '▢',
  CAMERA: '📷',
  RECORD: '⏺',
  CHAT_ROW: '💬',
  BUBBLE: '💭',
  SEND: '➤',
  SEARCH: '🔍',
}

export const COMPONENT_HINTS: Record<ComponentType, string> = {
  VIDEO: 'Сам клип на экране — то, что смотрят',
  TEXT: 'Подпись, ник или заголовок',
  BUTTON: 'Большая кнопка: подписаться, закрыть, далее',
  IMAGE: 'Обложка, превью или баннер',
  AVATAR: 'Кружок автора в углу',
  LIKE: 'Сердечко справа. По нему ставят лайк',
  COMMENT: 'Иконка комментариев',
  SHARE: 'Иконка «поделиться»',
  NAVIGATION: 'Нижнее меню: лента, клип, съёмка, чаты',
  INPUT: 'Поле ввода: комментарий или сообщение',
  MODAL: 'Окно поверх экрана',
  CAMERA: 'Видоискатель. То, что снимает камера',
  RECORD: 'Большая кнопка записи клипа',
  CHAT_ROW: 'Строка в списке чатов: кто и о чём писал',
  BUBBLE: 'Пузырь сообщения. Своё или чужое',
  SEND: 'Кнопка отправить в переписке',
  SEARCH: 'Поиск по чатам или людям',
}

export const MERCH_LABELS: Record<MerchKind, string> = {
  tshirt: 'Футболка',
  hoodie: 'Худи',
  sticker: 'Стикер',
  cap: 'Кепка',
  mug: 'Кружка',
  tote: 'Шоппер',
}

export const MERCH_PATTERN_LABELS: Record<MerchPattern, string> = {
  none: 'Чистый',
  stripes: 'Полоски',
  dots: 'Горох',
  grid: 'Сетка',
  chevrons: 'Шеврон',
  stars: 'Звёзды',
  waves: 'Волны',
  camo: 'Камо',
  hearts: 'Сердца',
}

export const IDEA_CHANNEL_LABELS: Record<IdeaChannel, string> = {
  tiktok: 'TikTok',
  reels: 'Reels',
  youtube: 'YouTube',
  stories: 'Stories',
  offline: 'Офлайн',
  collab: 'Коллаб',
}

export const IDEA_STATUS_LABELS: Record<IdeaStatus, string> = {
  spark: 'Искра',
  draft: 'Черновик',
  ready: 'Готово',
}

export const VIDEO_PLATFORM_LABELS: Record<VideoPlatform, string> = {
  tiktok: 'TikTok',
  reels: 'Reels',
  youtube: 'YouTube',
  clips: 'Клипы',
}

export const POSTER_SHAPE_LABELS: Record<PosterShape, string> = {
  rect: 'Прямоугольник',
  circle: 'Круг',
  star: 'Звезда',
  banner: 'Баннер',
}

export const POSTER_STICKERS = ['🔥', '💥', '✨', '🎬', '❤️', '👑', '🚀', '🎵', '👀', '💯', '⚡', '🌈']

export const IDEA_TEMPLATES: ReadonlyArray<{
  title: string
  hook: string
  text: string
  channel: IdeaChannel
  cta: string
  color: string
}> = [
  {
    title: 'Челлендж недели',
    hook: 'Сними клип за 15 секунд',
    text: `Запускаем челлендж: пользователи повторяют хук из ${PRODUCT_NAME} и отмечают нас. Лучшие ролики залетают в подборку.`,
    channel: 'tiktok',
    cta: 'Сними свой клип',
    color: '#ff2d6a',
  },
  {
    title: 'UGC-коллаб',
    hook: 'Дадим голос комьюнити',
    text: `10 блогеров получают ранний доступ и снимают «первый день в ${PRODUCT_NAME}». Мы репостим лучшие нарезки.`,
    channel: 'collab',
    cta: 'Забери инвайт',
    color: '#00f0ff',
  },
  {
    title: 'Тизер-запуск',
    hook: 'Смотри. Снимай. Делись.',
    text: 'Три тизера: силуэт интерфейса, слоган, потом живой клип. Каждый ролик заканчивается датой запуска.',
    channel: 'reels',
    cta: 'Жди премьеру',
    color: '#ffd166',
  },
  {
    title: 'Уличный дроп',
    hook: 'Мерч ловят в городе',
    text: `Стикеры и шопперы в местах, где снимают. QR ведёт на ленту ${PRODUCT_NAME} и промо-ролик.`,
    channel: 'offline',
    cta: 'Найди дроп',
    color: '#9966ff',
  },
]

export const POSTER_BACKGROUNDS = [
  '#07070c',
  '#ff2d6a',
  '#00f0ff',
  '#ffd166',
  '#1a1030',
  '#0b1f1c',
  '#191428',
  '#2a1030',
  'linear-gradient(180deg, #ff2d6a 0%, #07070c 100%)',
  'linear-gradient(180deg, #00f0ff 0%, #12121a 100%)',
  'linear-gradient(135deg, #ffd166 0%, #ff2d6a 55%, #1a1030 100%)',
  'linear-gradient(180deg, #191428 0%, #00f0ff 160%)',
]

export function defaultFlags(): RuntimeFlags {
  return {
    'video.isLiked': false,
    'comments.isOpen': false,
    'share.isOpen': false,
  }
}

export const INITIAL_STATE_ID = 'video'

export const PRESET_STATES: ReadonlyArray<{
  id: string
  name: string
  screenKey: ScreenKey
  hint: string
  flags: RuntimeFlags
}> = [
  {
    id: 'video',
    name: 'Клип',
    screenKey: 'VIDEO',
    hint: 'Вертикальный ролик: лайк, комменты, репост и свайп.',
    flags: defaultFlags(),
  },
  {
    id: 'comments',
    name: 'Комменты',
    screenKey: 'COMMENTS',
    hint: 'Шторка с комментариями поверх клипа.',
    flags: { ...defaultFlags(), 'comments.isOpen': true },
  },
  {
    id: 'share',
    name: 'Репост',
    screenKey: 'SHARE',
    hint: 'Куда отправить ролик: в чат, ссылкой или закрыть.',
    flags: { ...defaultFlags(), 'share.isOpen': true },
  },
  {
    id: 'feed',
    name: 'Лента',
    screenKey: 'FEED',
    hint: 'Стопка роликов. Свайп — следующий, тап — открыть.',
    flags: defaultFlags(),
  },
  {
    id: 'profile',
    name: 'Профиль',
    screenKey: 'PROFILE',
    hint: 'Страница автора: аватар, подписка и сетка клипов.',
    flags: defaultFlags(),
  },
  {
    id: 'create',
    name: 'Создание видео',
    screenKey: 'CREATE',
    hint: 'Камера: снять ролик и опубликовать.',
    flags: defaultFlags(),
  },
  {
    id: 'inbox',
    name: 'Чаты',
    screenKey: 'INBOX',
    hint: 'Список переписок. Тап по чату открывает сообщения.',
    flags: defaultFlags(),
  },
  {
    id: 'compose',
    name: 'Сообщение',
    screenKey: 'COMPOSE',
    hint: 'Переписка: пузыри, поле ввода и кнопка назад.',
    flags: defaultFlags(),
  },
]

export type ScreenLogicKind = 'goto' | 'stay' | 'toggle'

export type ScreenLogicAction = {
  event: LogicEvent
  emoji: string
  title: string
  hint: string
  suggestedToId: string | null
  kind: ScreenLogicKind
  lock?: {
    property: ConditionProperty
    label: string
  }
}

export type ScreenLogic = {
  emoji: string
  accent: string
  tagline: string
  actions: readonly ScreenLogicAction[]
}

export const SCREEN_LOGIC: Record<string, ScreenLogic> = {
  video: {
    emoji: '🎬',
    accent: '#ff2d6a',
    tagline: 'Сердце, комменты, репост и свайп',
    actions: [
      {
        event: 'CLICK_LIKE',
        emoji: '❤️',
        title: 'Лайк',
        hint: 'Сердечко загорается на этом же экране — никуда не уходим.',
        suggestedToId: 'video',
        kind: 'toggle',
      },
      {
        event: 'CLICK_COMMENT',
        emoji: '💬',
        title: 'Комменты',
        hint: 'Иконка комментариев справа.',
        suggestedToId: 'comments',
        kind: 'goto',
        lock: { property: 'video.isLiked', label: 'только после лайка' },
      },
      {
        event: 'CLICK_SHARE',
        emoji: '📤',
        title: 'Репост',
        hint: 'Иконка «поделиться».',
        suggestedToId: 'share',
        kind: 'goto',
      },
      {
        event: 'SWIPE',
        emoji: '👆',
        title: 'Свайп вверх',
        hint: 'Следующий ролик в ленте.',
        suggestedToId: 'feed',
        kind: 'goto',
      },
      {
        event: 'CLICK',
        emoji: '🙂',
        title: 'Автор',
        hint: 'Тап по аватарке открывает профиль.',
        suggestedToId: 'profile',
        kind: 'goto',
      },
    ],
  },
  comments: {
    emoji: '💬',
    accent: '#ffffff',
    tagline: 'Шторка: закрыть или отправить',
    actions: [
      {
        event: 'CLOSE',
        emoji: '✕',
        title: 'Закрыть',
        hint: 'Крестик или свайп вниз — шторка уезжает.',
        suggestedToId: 'video',
        kind: 'goto',
      },
      {
        event: 'SUBMIT',
        emoji: '➤',
        title: 'Отправить',
        hint: 'Комментарий улетает, экран можно оставить.',
        suggestedToId: 'comments',
        kind: 'stay',
      },
      {
        event: 'BACK',
        emoji: '←',
        title: 'Назад',
        hint: 'Вернуться к клипу.',
        suggestedToId: 'video',
        kind: 'goto',
      },
    ],
  },
  share: {
    emoji: '📤',
    accent: '#00f0ff',
    tagline: 'Куда отправить ролик',
    actions: [
      {
        event: 'CLOSE',
        emoji: '✕',
        title: 'Закрыть',
        hint: 'Свернуть шаринг и вернуться.',
        suggestedToId: 'video',
        kind: 'goto',
      },
      {
        event: 'CLICK',
        emoji: '💬',
        title: 'В чаты',
        hint: 'Отправить ролик другу в переписку.',
        suggestedToId: 'inbox',
        kind: 'goto',
      },
      {
        event: 'CLICK_SHARE',
        emoji: '🔗',
        title: 'Скопировать',
        hint: 'Ссылка копируется, остаёмся здесь.',
        suggestedToId: 'share',
        kind: 'stay',
      },
    ],
  },
  feed: {
    emoji: '📱',
    accent: '#ffd166',
    tagline: 'Стопка роликов',
    actions: [
      {
        event: 'CLICK',
        emoji: '▶',
        title: 'Открыть клип',
        hint: 'Тап по карточке — полноэкранный ролик.',
        suggestedToId: 'video',
        kind: 'goto',
      },
      {
        event: 'SWIPE',
        emoji: '👆',
        title: 'Следующий',
        hint: 'Свайп вверх. Лента одна — можно остаться.',
        suggestedToId: 'feed',
        kind: 'stay',
      },
      {
        event: 'CLICK_COMMENT',
        emoji: '🙂',
        title: 'Профиль автора',
        hint: 'С карточки в ленте тоже можно зайти к автору.',
        suggestedToId: 'profile',
        kind: 'goto',
      },
    ],
  },
  profile: {
    emoji: '👤',
    accent: '#c084fc',
    tagline: 'Аватар, подписка, сетка клипов',
    actions: [
      {
        event: 'CLICK',
        emoji: '▶',
        title: 'Клип автора',
        hint: 'Тап по превью в сетке.',
        suggestedToId: 'video',
        kind: 'goto',
      },
      {
        event: 'BACK',
        emoji: '←',
        title: 'Назад',
        hint: 'Вернуться к ролику.',
        suggestedToId: 'video',
        kind: 'goto',
      },
      {
        event: 'SUBMIT',
        emoji: '➕',
        title: 'Подписка',
        hint: 'Кнопка «подписаться» остаётся на профиле.',
        suggestedToId: 'profile',
        kind: 'stay',
      },
    ],
  },
  create: {
    emoji: '📷',
    accent: '#ff2d6a',
    tagline: 'Камера: снять и выложить',
    actions: [
      {
        event: 'CLICK',
        emoji: '⏺',
        title: 'Опубликовать',
        hint: 'После записи ролик улетает в ленту или в клип.',
        suggestedToId: 'feed',
        kind: 'goto',
      },
      {
        event: 'BACK',
        emoji: '←',
        title: 'Отмена',
        hint: 'Не снимаем — назад в ленту.',
        suggestedToId: 'feed',
        kind: 'goto',
      },
    ],
  },
  inbox: {
    emoji: '💌',
    accent: '#7cff6b',
    tagline: 'Список переписок',
    actions: [
      {
        event: 'CLICK',
        emoji: '💬',
        title: 'Открыть чат',
        hint: 'Тап по строке — переписка.',
        suggestedToId: 'compose',
        kind: 'goto',
      },
      {
        event: 'SUBMIT',
        emoji: '🔍',
        title: 'Поиск',
        hint: 'Ищем чат, список остаётся.',
        suggestedToId: 'inbox',
        kind: 'stay',
      },
    ],
  },
  compose: {
    emoji: '✉️',
    accent: '#00f0ff',
    tagline: 'Пузыри и поле ввода',
    actions: [
      {
        event: 'BACK',
        emoji: '←',
        title: 'К чатам',
        hint: 'Стрелка назад в список.',
        suggestedToId: 'inbox',
        kind: 'goto',
      },
      {
        event: 'SUBMIT',
        emoji: '➤',
        title: 'Отправить',
        hint: 'Сообщение улетает, остаёмся в переписке.',
        suggestedToId: 'compose',
        kind: 'stay',
      },
    ],
  },
}

export function screenLogic(stateId: string): ScreenLogic | null {
  return SCREEN_LOGIC[stateId] ?? null
}

export function screenActions(stateId: string): readonly ScreenLogicAction[] {
  return SCREEN_LOGIC[stateId]?.actions ?? []
}

export type QaMission = {
  id: string
  emoji: string
  title: string
  startStateId: string
  event: LogicEvent
  expectedStateId: string
}

export const QA_MISSIONS: readonly QaMission[] = [
  { id: 'comment', emoji: '💬', title: 'Комменты', startStateId: 'video', event: 'CLICK_COMMENT', expectedStateId: 'comments' },
  { id: 'share', emoji: '📤', title: 'Репост', startStateId: 'video', event: 'CLICK_SHARE', expectedStateId: 'share' },
  { id: 'swipe', emoji: '👆', title: 'Свайп в ленту', startStateId: 'video', event: 'SWIPE', expectedStateId: 'feed' },
  { id: 'close-comments', emoji: '✕', title: 'Закрыть комменты', startStateId: 'comments', event: 'CLOSE', expectedStateId: 'video' },
  { id: 'close-share', emoji: '✕', title: 'Закрыть репост', startStateId: 'share', event: 'CLOSE', expectedStateId: 'video' },
  { id: 'open-chat', emoji: '💬', title: 'Открыть чат', startStateId: 'inbox', event: 'CLICK', expectedStateId: 'compose' },
  { id: 'back-chat', emoji: '←', title: 'Назад из чата', startStateId: 'compose', event: 'BACK', expectedStateId: 'inbox' },
]

export function expectedFlow(startStateId: string, event: LogicEvent) {
  return QA_MISSIONS.find((item) => item.startStateId === startStateId && item.event === event) ?? null
}

export function missionTestId(missionId: string) {
  return `mission:${missionId}`
}

export function missionBugId(missionId: string) {
  return `bug:${missionId}`
}

export function isPresetStateId(value: string): boolean {
  return PRESET_STATES.some((item) => item.id === value)
}

export function presetHint(stateId: string): string {
  return PRESET_STATES.find((item) => item.id === stateId)?.hint ?? ''
}

export function presetAppStates(): AppState[] {
  return PRESET_STATES.map((item) => ({
    id: item.id,
    name: item.name,
    screenKey: item.screenKey,
    flags: { ...item.flags },
  }))
}

export function createPresetProject(): Project {
  const states = presetAppStates()
  return {
    name: PRODUCT_NAME,
    revision: 0,
    states,
    design: {
      screens: [...SCREEN_KEYS],
      layouts: states.map((state) => ({ stateId: state.id, components: [] })),
    },
    logic: {
      initialStateId: INITIAL_STATE_ID,
      transitions: [],
    },
    marketing: emptyMarketing(),
    qa: emptyQa(),
  }
}

export function emptyDesign(): DesignDoc {
  return { screens: [...SCREEN_KEYS], layouts: [] }
}

export function emptyLogic(): LogicDoc {
  return { initialStateId: INITIAL_STATE_ID, transitions: [] }
}

export function emptyMarketing(): MarketingDoc {
  return { slogan: '', videos: [], posters: [], ideas: [], merch: [] }
}

export function createEmptyIdea(id: string): CampaignIdea {
  return {
    id,
    text: PRODUCT_NAME,
    color: IDEA_STICKER_COLORS[0],
  }
}

export function createEmptyVideo(id: string): MarketingVideo {
  return {
    id,
    url: '',
    name: 'Ролик',
    title: 'Промо',
    hook: '',
    script: '',
    platform: 'tiktok',
    notes: '',
  }
}

export function createEmptyPoster(id: string): Poster {
  return {
    id,
    title: 'Постер',
    background: POSTER_BACKGROUNDS[0],
    layers: [
      {
        id: `${id}-title`,
        kind: 'text',
        text: PRODUCT_NAME,
        x: 28,
        y: 80,
        fontSize: 56,
        color: '#ffffff',
      },
    ],
  }
}

export function createEmptyMerch(id: string): MerchItem {
  return {
    id,
    kind: 'tshirt',
    name: 'Футболка',
    text: PRODUCT_NAME,
    color: '#e8e4dc',
    accent: '#2a2a32',
    textColor: '#111111',
    printX: 50,
    printY: 42,
    printScale: 1,
    pattern: 'none',
    layers: [
      {
        id: `${id}-text`,
        kind: 'text',
        text: PRODUCT_NAME,
        x: 50,
        y: 42,
        fontSize: 18,
        color: '#111111',
      },
    ],
  }
}

export function emptyQa(): QaDoc {
  return { testCases: [], bugs: [] }
}

export function ensurePresetProject(project: Project): Project {
  const idMap = mapLegacyStateIds(project.states)
  const remap = (id: string | null | undefined): string => {
    if (!id) {
      return INITIAL_STATE_ID
    }
    const next = idMap.get(id) ?? (isPresetStateId(id) ? id : INITIAL_STATE_ID)
    return isPresetStateId(next) ? next : INITIAL_STATE_ID
  }
  const layoutsByPreset = new Map<string, DesignComponent[]>()
  for (const layout of project.design.layouts) {
    const presetId = remap(layout.stateId)
    const existing = layoutsByPreset.get(presetId)
    if (!existing || layout.components.length > existing.length) {
      layoutsByPreset.set(presetId, layout.components)
    }
  }
  const states = presetAppStates()
  return {
    ...project,
    states,
    design: {
      screens: [...SCREEN_KEYS],
      layouts: states.map((state) => ({
        stateId: state.id,
        components: layoutsByPreset.get(state.id) ?? [],
      })),
    },
    logic: {
      initialStateId: remap(project.logic.initialStateId),
      transitions: project.logic.transitions.map((item) => ({
        ...item,
        fromStateId: remap(item.fromStateId),
        toStateId: remap(item.toStateId),
        elseStateId: item.elseStateId ? remap(item.elseStateId) : null,
      })),
    },
    qa: {
      ...project.qa,
      testCases: project.qa.testCases.map((test) => ({
        ...test,
        startStateId: remap(test.startStateId),
        expectedStateId: remap(test.expectedStateId),
        lastResult: test.lastResult
          ? {
              ...test.lastResult,
              expectedStateId: remap(test.lastResult.expectedStateId),
              actualStateId: remap(test.lastResult.actualStateId),
            }
          : null,
      })),
    },
  }
}

function mapLegacyStateIds(states: AppState[]): Map<string, string> {
  const idMap = new Map<string, string>()
  const taken = new Set<string>()
  for (const state of states) {
    const mapped = suggestPresetId(state)
    if (!mapped || taken.has(mapped)) {
      continue
    }
    idMap.set(state.id, mapped)
    taken.add(mapped)
  }
  return idMap
}

function suggestPresetId(state: AppState): string | null {
  if (isPresetStateId(state.id)) {
    return state.id
  }
  const exact = PRESET_STATES.find((item) => item.screenKey === state.screenKey && item.name === state.name)
  if (exact) {
    return exact.id
  }
  if (state.screenKey === 'VIDEO') {
    return 'video'
  }
  const unique = PRESET_STATES.filter((item) => item.screenKey === state.screenKey)
  return unique.length === 1 ? unique[0].id : null
}

export function layoutForState(design: DesignDoc, stateId: string): DesignLayout | undefined {
  return design.layouts.find((layout) => layout.stateId === stateId)
}

export function stateById(project: Project, stateId: string): AppState | undefined {
  return project.states.find((state) => state.id === stateId)
}

export function isScreenKey(value: string): value is ScreenKey {
  return (SCREEN_KEYS as readonly string[]).includes(value)
}

export function isComponentType(value: string): value is ComponentType {
  return (COMPONENT_TYPES as readonly string[]).includes(value)
}

export function isLogicEvent(value: string): value is LogicEvent {
  return (LOGIC_EVENTS as readonly string[]).includes(value)
}

export function isConditionProperty(value: string): value is ConditionProperty {
  return (CONDITION_PROPERTIES as readonly string[]).includes(value)
}

export function isBugSeverity(value: string): value is BugSeverity {
  return (BUG_SEVERITIES as readonly string[]).includes(value)
}

export function isMerchKind(value: string): value is MerchKind {
  return (MERCH_KINDS as readonly string[]).includes(value)
}

export function isMerchPattern(value: string): value is MerchPattern {
  return (MERCH_PATTERNS as readonly string[]).includes(value)
}

export function isMerchPrintKind(value: string): value is MerchPrintKind {
  return (MERCH_PRINT_KINDS as readonly string[]).includes(value)
}

export function merchPrintLayers(item: MerchItem): MerchPrintLayer[] {
  if (item.layers?.length) {
    return item.layers
  }
  if (!item.text && !item.logoSrc) {
    return []
  }
  return [
    {
      id: `${item.id}-legacy`,
      kind: 'text',
      text: item.text,
      x: item.printX ?? 50,
      y: item.printY ?? 42,
      fontSize: 18,
      color: item.textColor ?? '#111111',
    },
  ]
}

export function isIdeaChannel(value: string): value is IdeaChannel {
  return (IDEA_CHANNELS as readonly string[]).includes(value)
}

export function isIdeaStatus(value: string): value is IdeaStatus {
  return (IDEA_STATUSES as readonly string[]).includes(value)
}

export function isVideoPlatform(value: string): value is VideoPlatform {
  return (VIDEO_PLATFORMS as readonly string[]).includes(value)
}

export function isPosterLayerKind(value: string): value is PosterLayerKind {
  return (POSTER_LAYER_KINDS as readonly string[]).includes(value)
}

export function isPosterShape(value: string): value is PosterShape {
  return (POSTER_SHAPES as readonly string[]).includes(value)
}

export function projectStats(project: Project) {
  const components = project.design.layouts.reduce((sum, layout) => sum + layout.components.length, 0)
  const passed = project.qa.testCases.filter((test) => test.lastResult?.passed).length
  const failed = project.qa.testCases.filter((test) => test.lastResult && !test.lastResult.passed).length
  return {
    screens: project.design.screens.length,
    states: project.states.length,
    components,
    transitions: project.logic.transitions.length,
    conditions: project.logic.transitions.filter((item) => item.condition).length,
    tests: project.qa.testCases.length,
    passed,
    failed,
    bugs: project.qa.bugs.length,
    highBugs: project.qa.bugs.filter((bug) => bug.severity === 'HIGH').length,
    mediumBugs: project.qa.bugs.filter((bug) => bug.severity === 'MEDIUM').length,
    lowBugs: project.qa.bugs.filter((bug) => bug.severity === 'LOW').length,
    hasVideo: project.marketing.videos.length > 0,
    hasPoster: project.marketing.posters.length > 0,
    hasMerch: project.marketing.merch.length > 0,
    slogan: project.marketing.slogan,
  }
}
