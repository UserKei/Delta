import { EPSILON, FAEdge, FANode, FiniteAutomata } from '@repo/shared-types'
import { createNode } from '../graph'

// 核心 1: ε-closure 计算
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

// 核心 2: Move 计算
export function move(nfa: FiniteAutomata, stateIds: string[], symbol: string): Set<string> {
  const result = new Set<string>()
  for (const u of stateIds) {
    const targets = nfa.edges.filter(e => e.source === u && e.label === symbol).map(e => e.target)

    targets.forEach(t => result.add(t))
  }
  return result
}

// 辅助：集合转字符串 key (用于判重)
function getKey(set: Set<string>): string {
  return Array.from(set).sort().join(',')
}

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

  dfaNodes.push(createNode(q0Id, `{${getKey(q0)}}`))
}
