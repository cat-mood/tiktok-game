export const PRODUCT_NAME = 'SHORTS'

export const CANVAS_WIDTH = 390
export const CANVAS_HEIGHT = 844

export const SCREEN_KEYS = ['FEED', 'VIDEO', 'COMMENTS', 'PROFILE', 'SHARE'] as const
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
  }

export const SIZE_PRESET_BOX: Record<SizePreset, { w: number; h: number }> = {
  S: { w: 48, h: 48 },
  M: { w: 140, h: 48 },
  L: { w: 342, h: 80 },
}

export const SCREEN_LABELS: Record<ScreenKey, string> = {
  FEED: 'Feed',
  VIDEO: 'Video',
  COMMENTS: 'Comments',
  PROFILE: 'Profile',
  SHARE: 'Share',
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
  VIDEO: 'Video',
  TEXT: 'Text',
  BUTTON: 'Button',
  IMAGE: 'Image',
  AVATAR: 'Avatar',
  LIKE: 'Like',
  COMMENT: 'Comment',
  SHARE: 'Share',
  NAVIGATION: 'Nav',
  INPUT: 'Input',
  MODAL: 'Modal',
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

export function emptyDesign(): DesignDoc {
  return { screens: ['VIDEO'], layouts: [] }
}

export function emptyLogic(): LogicDoc {
  return { initialStateId: null, transitions: [] }
}

export function emptyMarketing(): MarketingDoc {
  return { slogan: '', videos: [], posters: [], ideas: [], merch: [] }
}

export function emptyQa(): QaDoc {
  return { testCases: [], bugs: [] }
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
