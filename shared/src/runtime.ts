import type { LogicEvent, Project, RuntimeFlags, TestCase, TestRun } from './project.js'
import { defaultFlags, layoutForState, stateById } from './project.js'

export function flagsForState(
  project: Project,
  stateId: string,
  fallback: RuntimeFlags = defaultFlags(),
): RuntimeFlags {
  const state = stateById(project, stateId)
  return state ? { ...state.flags } : fallback
}

export function applyAction(
  project: Project,
  currentStateId: string,
  event: LogicEvent,
  flags: RuntimeFlags = defaultFlags(),
): { stateId: string; flags: RuntimeFlags } {
  const match = project.logic.transitions.find(
    (item) => item.fromStateId === currentStateId && item.event === event,
  )
  if (!match) {
    return { stateId: currentStateId, flags: applyFlagEffects(event, flags) }
  }

  let nextId = match.toStateId
  if (match.condition) {
    const actual = flags[match.condition.property]
    const passed =
      match.condition.operator === 'eq' ? actual === match.condition.value : actual !== match.condition.value
    nextId = passed ? match.toStateId : match.elseStateId ?? currentStateId
  }

  return {
    stateId: nextId,
    flags:
      nextId === currentStateId
        ? applyFlagEffects(event, flags)
        : flagsForState(project, nextId, flags),
  }
}

function applyFlagEffects(event: LogicEvent, flags: RuntimeFlags): RuntimeFlags {
  if (event !== 'CLICK_LIKE') {
    return flags
  }
  return { ...flags, 'video.isLiked': !flags['video.isLiked'] }
}

export function runTest(project: Project, test: TestCase, ranAt: string = new Date().toISOString()): TestRun {
  let stateId = test.startStateId
  let flags = flagsForState(project, stateId, defaultFlags())
  for (const step of test.steps) {
    const next = applyAction(project, stateId, step.event, flags)
    stateId = next.stateId
    flags = next.flags
  }
  return {
    testId: test.id,
    passed: stateId === test.expectedStateId,
    expectedStateId: test.expectedStateId,
    actualStateId: stateId,
    ranAt,
  }
}

export function runAllTests(project: Project, ranAt: string = new Date().toISOString()): TestRun[] {
  return project.qa.testCases.map((test) => runTest(project, test, ranAt))
}

export function hasDesignLayout(project: Project, stateId: string): boolean {
  const layout = layoutForState(project.design, stateId)
  return Boolean(layout)
}

export function initialRuntimeStateId(project: Project): string | null {
  if (project.logic.initialStateId && stateById(project, project.logic.initialStateId)) {
    return project.logic.initialStateId
  }
  return project.states[0]?.id ?? null
}
