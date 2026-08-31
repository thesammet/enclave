import { boardTools } from './board-tools'
import { cardTools } from './card-tools'
import { dataTools } from './data-tools'
import type { ToolDef } from './registry'

export const allTools: ToolDef[] = [...dataTools, ...cardTools, ...boardTools]
export { runTool } from './registry'
export type { ToolContext, ToolDef } from './registry'
