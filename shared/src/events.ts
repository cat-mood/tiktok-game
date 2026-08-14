import type { DepartmentId } from './types.js'
import type {
  BugReport,
  BugSeverity,
  CampaignIdea,
  ComponentType,
  ConditionOperator,
  ConditionProperty,
  DesignComponent,
  LogicEvent,
  LogicTransition,
  MarketingVideo,
  MerchItem,
  Poster,
  ScreenKey,
  TestCase,
  TestStep,
  TransitionCondition,
} from './project.js'

export const CLIENT_EVENTS = {
  playerJoin: 'player:join',
  playerChangeDepartment: 'player:changeDepartment',
  playerReconnect: 'player:reconnect',
  designUpsertComponent: 'design:upsertComponent',
  designDeleteComponent: 'design:deleteComponent',
  logicUpsertTransition: 'logic:upsertTransition',
  logicDeleteTransition: 'logic:deleteTransition',
  logicSetInitialState: 'logic:setInitialState',
  qaUpsertTest: 'qa:upsertTest',
  qaDeleteTest: 'qa:deleteTest',
  qaRunTest: 'qa:runTest',
  qaUpsertBug: 'qa:upsertBug',
  qaDeleteBug: 'qa:deleteBug',
  marketingSetSlogan: 'marketing:setSlogan',
  marketingUpsertVideo: 'marketing:upsertVideo',
  marketingDeleteVideo: 'marketing:deleteVideo',
  marketingUpsertPoster: 'marketing:upsertPoster',
  marketingDeletePoster: 'marketing:deletePoster',
  marketingUpsertIdea: 'marketing:upsertIdea',
  marketingDeleteIdea: 'marketing:deleteIdea',
  marketingUpsertMerch: 'marketing:upsertMerch',
  marketingDeleteMerch: 'marketing:deleteMerch',
  runtimeDispatch: 'runtime:dispatch',
  adminAuth: 'admin:auth',
  adminSetTeamLead: 'admin:setTeamLead',
  adminMovePlayer: 'admin:movePlayer',
  adminRemovePlayer: 'admin:removePlayer',
  adminStartGame: 'admin:startGame',
  adminAddTime: 'admin:addTime',
  adminEndWork: 'admin:endWork',
  adminResumeWork: 'admin:resumeWork',
  adminRelease: 'admin:release',
  adminFinish: 'admin:finish',
  adminNewGame: 'admin:newGame',
  adminDismissRestore: 'admin:dismissRestore',
  adminSpawnPlayer: 'admin:spawnPlayer',
  adminFillLobby: 'admin:fillLobby',
  devOpenWorkspace: 'dev:openWorkspace',
} as const

export const SERVER_EVENTS = {
  gameState: 'game:state',
  gameError: 'game:error',
} as const

export type PlayerJoinPayload = {
  name: string
  departmentId: DepartmentId
}

export type PlayerChangeDepartmentPayload = {
  departmentId: DepartmentId
}

export type PlayerReconnectPayload = {
  playerId: string
  sessionId: string
}

export type AdminAuthPayload = {
  code: string
}

export type AdminPlayerPayload = {
  playerId: string
}

export type AdminMovePlayerPayload = {
  playerId: string
  departmentId: DepartmentId
}

export type AdminSpawnPlayerPayload = {
  departmentId: DepartmentId
}

export type AdminStartGamePayload = {
  workDurationMs?: number
}

export type AdminAddTimePayload = {
  extraMs: number
}

export type AdminResumeWorkPayload = {
  workDurationMs?: number
}

export type StateIdPayload = {
  stateId: string
}

export type UpsertComponentPayload = {
  stateId: string
  component: DesignComponent
}

export type DeleteComponentPayload = {
  stateId: string
  componentId: string
}

export type UpsertTransitionPayload = {
  transition: LogicTransition
}

export type TransitionIdPayload = {
  transitionId: string
}

export type UpsertTestPayload = {
  test: TestCase
}

export type TestIdPayload = {
  testId: string
}

export type UpsertBugPayload = {
  bug: BugReport
}

export type BugIdPayload = {
  bugId: string
}

export type SetSloganPayload = {
  slogan: string
}

export type UpsertVideoPayload = {
  video: MarketingVideo
}

export type VideoIdPayload = {
  videoId: string
}

export type UpsertPosterPayload = {
  poster: Poster
}

export type PosterIdPayload = {
  posterId: string
}

export type UpsertIdeaPayload = {
  idea: CampaignIdea
}

export type IdeaIdPayload = {
  ideaId: string
}

export type UpsertMerchPayload = {
  merch: MerchItem
}

export type MerchIdPayload = {
  merchId: string
}

export type RuntimeDispatchPayload = {
  event: LogicEvent
}

export type DevOpenWorkspacePayload = {
  departmentId: DepartmentId
}

export type {
  ComponentType,
  ConditionOperator,
  ConditionProperty,
  BugSeverity,
  LogicEvent,
  ScreenKey,
  TestStep,
  TransitionCondition,
}
