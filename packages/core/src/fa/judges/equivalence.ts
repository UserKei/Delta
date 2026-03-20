import { FiniteAutomata } from '@repo/shared-types'
import { epsilonClosure, move } from '../dfa/subset'

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

  const initS1 = epsilonClosure(fa1, [start1])
  const initS2 = epsilonClosure(fa2, [start2])

  queue.push({ s1: initS1, s2: initS2, path: '' })
  visited.add(`${getKey(initS1)}|${getKey(initS2)}`)

  // 获取 NFA 终态集
  const ends1 = new Set(fa1.nodes.filter(n => n.isEnd).map(n => n.id))
  const ends2 = new Set(fa2.nodes.filter(n => n.isEnd).map(n => n.id))

  const isAccepting = (set: Set<string>, ends: Set<string>) =>
    Array.from(set).some(id => ends.has(id))

  while (queue.length > 0) {
    const { s1, s2, path } = queue.shift()!

    // 判决核心：异或 (XOR)
    // 如果一个接受而另一个不接受，说明不等价，当前 path 就是反例
    const acc1 = isAccepting(s1, ends1)
    const acc2 = isAccepting(s2, ends2)

    if (acc1 !== acc2) {
      return { equal: false, counterExample: path || 'ε' }
    }

    // 限制搜索深度，防止死循环 (理论上 DFA 等价性是可判定的，但防止 NFA 状态爆炸)
    if (path.length > 100) return { equal: false, counterExample: 'Too long' }

    for (const char of alphabet) {
      // 计算下一个状态集 (Product Move)
      const nextS1 = epsilonClosure(fa1, Array.from(move(fa1, Array.from(s1), char)))
      const nextS2 = epsilonClosure(fa2, Array.from(move(fa2, Array.from(s2), char)))

      const key = `${getKey(nextS1)}|${getKey(nextS2)}`
      if (!visited.has(key)) {
        visited.add(key)
        queue.push({ s1: nextS1, s2: nextS2, path: path + char })
      }
    }
  }

  return { equal: true, counterExample: null }
}

function getKey(set: Set<string>): string {
  return Array.from(set).sort().join(',')
}
