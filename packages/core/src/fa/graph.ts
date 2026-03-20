import { uuid } from '../shared/utils'
import { AutomatonType, FAEdge, FANode, FiniteAutomata } from '@repo/shared-types'

/**
 * Creates a Finite Automaton node.
 *
 * @param options - Configuration options for the node, including id, label, isStart, isEnd, etc.
 * @returns The constructed FANode object
 */
export function createNode(options: Partial<FANode> = {}): FANode {
  const id = options.id ?? uuid()
  return {
    id,
    label: options.label ?? id,
    isStart: options.isStart ?? false,
    isEnd: options.isEnd ?? false,
    ...options,
  }
}

/**
 * Creates a Finite Automaton transition edge.
 *
 * @param source - Source node ID
 * @param target - Target node ID
 * @param label - Transition symbol (supports single characters or ε)
 * @param id - Optional unique identifier for the edge
 * @returns The constructed FAEdge object
 */
export function createEdge(source: string, target: string, label: string, id?: string): FAEdge {
  return { id: id ?? uuid(), source, target, label }
}

/**
 * Creates an empty Finite Automaton graph object.
 *
 * @param type - The type of automaton (defaults to NFA)
 * @param initialData - Optional initial data for the graph
 * @returns The constructed FiniteAutomata object
 */
export function createGraph(
  type: AutomatonType = AutomatonType.NFA,
  initialData?: Partial<FiniteAutomata>,
): FiniteAutomata {
  return {
    type,
    nodes: initialData?.nodes ?? [],
    edges: initialData?.edges ?? [],
    alphabet: initialData?.alphabet ?? [],
  }
}
