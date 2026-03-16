import { FiniteAutomata } from '@repo/shared-types'
import {} from '../dfa/subset'

/**
 * 检查两个 NFA/DFA 是否等价
 * 返回: { equal: boolean, counterExample: string | null }
 */
export function checkEquivalence(fa1: FiniteAutomata, fa2: FiniteAutomata) {
  // 1. 提取所有符号
  const alphabet = Array.from(new Set([...fa1.alphabet, ...fa2.alphabet])) // wft

  const start1 = fa1.nodes.find(n => n.isStart)!.id
  const start2 = fa2.nodes.find(n => n.isStart)!.id

  // BFS 状态: Pair(Set1, Set2) - 因为可能是 NFA，所以是集合对
  // 记录路径用于反推反例
  const queue: { s1: Set<string>; s2: Set<string>; path: string }[] = []
  const visited = new Set<string>()
}

function getKey(set: Set<string>): string {
  return Array.from(set).sort().join(',')
}
