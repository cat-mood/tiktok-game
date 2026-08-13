export const PRODUCT_NAME = 'SHORTS'

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

export const MERCH_KINDS = ['tshirt', 'sticker', 'cap', 'mug'] as const
export type MerchKind = (typeof MERCH_KINDS)[number]

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
  kind: 'text' | 'image'
  text?: string
  src?: string
  x: number
  y: number
  fontSize?: number
  color?: string
}

export type Poster = {
  id: string
  background: string
  layers: PosterLayer[]
}

export type CampaignIdea = {
  id: string
  text: string
}

export type MerchItem = {
  id: string
  kind: MerchKind
  text: string
  color: string
  logoSrc?: string
}

export type MarketingVideo = {
  id: string
  url: string
  name: string
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
    MODAL: { x: 24, y: 180, w: 342, h: 300 },
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
  sticker: 'Стикер',
  cap: 'Кепка',
  mug: 'Кружка',
}

export const POSTER_BACKGROUNDS = [
  '#07070c',
  '#ff2d6a',
  '#00f0ff',
  '#ffd166',
  '#1a1030',
  '#0b1f1c',
  'linear-gradient(180deg, #ff2d6a 0%, #07070c 100%)',
  'linear-gradient(180deg, #00f0ff 0%, #12121a 100%)',
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
    hint: 'Обычный ролик. Приложение стартует отсюда.',
    flags: defaultFlags(),
  },
  {
    id: 'video-liked',
    name: 'Клип с лайком',
    screenKey: 'VIDEO',
    hint: 'Тот же клип, но сердечко уже красное.',
    flags: { ...defaultFlags(), 'video.isLiked': true },
  },
  {
    id: 'comments',
    name: 'Комменты',
    screenKey: 'COMMENTS',
    hint: 'Экран комментариев. Открывается по иконке 💬',
    flags: { ...defaultFlags(), 'comments.isOpen': true },
  },
  {
    id: 'share',
    name: 'Репост',
    screenKey: 'SHARE',
    hint: 'Экран «поделиться». Открывается по иконке 📤',
    flags: { ...defaultFlags(), 'share.isOpen': true },
  },
  {
    id: 'feed',
    name: 'Лента',
    screenKey: 'FEED',
    hint: 'Лента роликов. Сюда свайпают из клипа.',
    flags: defaultFlags(),
  },
  {
    id: 'profile',
    name: 'Профиль',
    screenKey: 'PROFILE',
    hint: 'Страница автора.',
    flags: defaultFlags(),
  },
  {
    id: 'create',
    name: 'Создание видео',
    screenKey: 'CREATE',
    hint: 'Камера и кнопка «снять». Отсюда публикуют новый клип.',
    flags: defaultFlags(),
  },
  {
    id: 'inbox',
    name: 'Чаты',
    screenKey: 'INBOX',
    hint: 'Список переписок. Тап по чату открывает набор сообщения.',
    flags: defaultFlags(),
  },
  {
    id: 'compose',
    name: 'Сообщение',
    screenKey: 'COMPOSE',
    hint: 'Переписка: история сообщений и поле ввода.',
    flags: defaultFlags(),
  },
]

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
  const upper = state.name.toUpperCase()
  if (state.screenKey === 'VIDEO') {
    if (upper.includes('LIKE')) {
      return 'video-liked'
    }
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
