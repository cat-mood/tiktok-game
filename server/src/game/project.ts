import { randomUUID } from 'node:crypto'
import {
  PRODUCT_NAME,
  defaultFlags,
  emptyDesign,
  emptyLogic,
  emptyMarketing,
  emptyQa,
  type AppState,
  type Project,
} from '@brainrot/shared'

export function createEmptyProject(): Project {
  const defaultState: AppState = {
    id: randomUUID(),
    name: 'DEFAULT',
    screenKey: 'VIDEO',
    flags: defaultFlags(),
  }
  return {
    name: PRODUCT_NAME,
    revision: 0,
    states: [defaultState],
    design: {
      ...emptyDesign(),
      layouts: [{ stateId: defaultState.id, components: [] }],
    },
    logic: {
      ...emptyLogic(),
      initialStateId: defaultState.id,
    },
    marketing: emptyMarketing(),
    qa: emptyQa(),
  }
}
