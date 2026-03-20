import { EPSILON, FAEdge, FANode, FiniteAutomata, AutomatonType } from '@repo/shared-types'
import { createNode, createEdge } from '../graph'

/**
 * Calculates the ε-closure (Epsilon Closure) of a given set of states.
 *
 * Finds all states reachable from the initial set of states by following only ε-edges.
 *
 * @param nfa - The Non-deterministic Finite Automaton (NFA) object
 * @param stateIds - The initial set of state IDs
 * @returns A new set of states containing the original set and all ε-reachable states
 */
export function epsilonClosure(nfa: FiniteAutomata, stateIds: string[]): Set<string> {
  const stack = [...stateIds]
  const closure = new Set(stateIds)

  while (stack.length > 0) {
    const u = stack.pop()!
    // 找所有 u 出发的 ε 边
    const targets = nfa.edges.filter(e => e.source === u && e.label === EPSILON).map(e => e.target)

    for (const v of targets) {
      if (!closure.has(v)) {
        closure.add(v)
        stack.push(v)
      }
    }
  }
  return closure
}

/**
 * Calculates the set of states reachable from a given set of states on a specific input symbol.
 *
 * @param nfa - The Non-deterministic Finite Automaton (NFA) object
 * @param stateIds - The current set of state IDs
 * @param symbol - The input transition symbol
 * @returns The set of target states reached after one transition on the given symbol
 */
export function move(nfa: FiniteAutomata, stateIds: string[], symbol: string): Set<string> {
  const result = new Set<string>()
  for (const u of stateIds) {
    const targets = nfa.edges.filter(e => e.source === u && e.label === symbol).map(e => e.target)

    targets.forEach(t => result.add(t))
  }
  return result
}

/**
 * Helper function: Converts a set of state IDs into a unique string key for comparison.
 *
 * @param set - The set of state IDs
 * @returns A sorted and joined string key
 */
function getKey(set: Set<string>): string {
  return Array.from(set).sort().join(',')
}

/**
 * Subset Construction algorithm.
 *
 * Converts a Non-deterministic Finite Automaton (NFA) into an equivalent Deterministic Finite Automaton (DFA).
 * The algorithm builds DFA states by tracking the power set of NFA states.
 *
 * @param nfa - The NFA object to be converted
 * @returns The equivalent DFA object
 */
export function subsetConstruction(nfa: FiniteAutomata): FiniteAutomata {
  const startNode = nfa.nodes.find(n => n.isStart)
  if (!startNode) throw new Error('NFA has no start node')

  // 1. 初始状态 closure(start)
  const q0 = epsilonClosure(nfa, [startNode.id])

  const dfaNodes: FANode[] = []
  const dfaEdges: FAEdge[] = []

  // 工作队列
  const workList: Set<string>[] = [q0]
  // 记录已生成的 DFA 状态: Key -> ID
  const dfaStateMap = new Map<string, string>()

  // 创建 DFA 初态
  const q0Id = '0'
  dfaStateMap.set(getKey(q0), q0Id)

  // 检查初态是否包含 NFA 终态
  const nfaEndIds = new Set(nfa.nodes.filter(n => n.isEnd).map(n => n.id))
  const isEnd = (set: Set<string>) => Array.from(set).some(id => nfaEndIds.has(id))

  dfaNodes.push(createNode({ id: q0Id, label: `{${getKey(q0)}}`, isStart: true, isEnd: isEnd(q0) }))

  let nextId = 1

  while (workList.length > 0) {
    const q = workList.shift()!
    const qKey = getKey(q)
    const u = dfaStateMap.get(qKey)!

    for (const char of nfa.alphabet) {
      // T = epsilonClosure(move(q, char))

      const targetMove = move(nfa, Array.from(q), char)
      const T = epsilonClosure(nfa, Array.from(targetMove))

      if (T.size === 0) continue // 死状态通常省略

      const tKey = getKey(T)
      let v = dfaStateMap.get(tKey)

      // 如果是新状态
      if (!v) {
        v = (nextId++).toString()
        dfaStateMap.set(tKey, v)
        workList.push(T)
        dfaNodes.push(createNode({ id: v, label: `{${tKey}}`, isStart: false, isEnd: isEnd(T) }))
      }

      // 加边 u -> v
      dfaEdges.push(createEdge(u, v, char))
    }
  }

  return {
    type: AutomatonType.DFA,
    nodes: dfaNodes,
    edges: dfaEdges,
    alphabet: nfa.alphabet,
  }
}
