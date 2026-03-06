import { uuid } from '../shared/utils'
import { AutomatonType, FAEdge, FANode, FiniteAutomata } from '@repo/shared-types'

export function createNode(
  id: string = uuid(),
  label: string = '',
  isStart = false,
  isEnd = false,
): FANode {
  return { id, label: label || id, isStart, isEnd }
}

export function createEdge(source: string, target: string, label: string): FAEdge {
  return { id: uuid(), source, target, label }
}

export function createGraph(type: AutomatonType = AutomatonType.NFA): FiniteAutomata {
  return { type, nodes: [], edges: [], alphabet: [] }
}
