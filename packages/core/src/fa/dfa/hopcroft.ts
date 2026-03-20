import { FiniteAutomata, AutomatonType } from '@repo/shared-types'
import { createNode, createEdge } from '../graph'
import { groupBy, values } from 'lodash-es'

/**
 * Minimizes a Deterministic Finite Automaton (DFA) using Hopcroft's algorithm.
 *
 * It partitions the set of DFA states into disjoint subsets of equivalent states,
 * merging them to produce an equivalent DFA with the minimum number of states.
 *
 * @param dfa - The DFA object to be minimized
 * @returns The minimized equivalent DFA object
 */
export function minimizeDFA(dfa: FiniteAutomata): FiniteAutomata {
  // 1. 初始划分: 终态集 vs 非终态集
  // P = { {F}, {Q-F} }
  let partitions: string[][] = [
    dfa.nodes.filter(n => n.isEnd).map(n => n.id),
    dfa.nodes.filter(n => !n.isEnd).map(n => n.id),
  ].filter(p => p.length > 0) // 过滤空集

  let changed = true
  while (changed) {
    changed = false
    const newPartitions: string[][] = []

    // 对当前的每个分组进行尝试切分
    for (const group of partitions) {
      if (group.length <= 1) {
        newPartitions.push(group)
        continue
      }

      // 核心: 如果两个状态对所有输入符号都跳转到同一个分区，则它们等价
      const subdivided = values(
        groupBy(group, nodeId => {
          // 生成指纹: "PartIdx_of_Target(a)|PartIdx_of_Target(b)..."
          return dfa.alphabet
            .map(char => {
              const edge = dfa.edges.find(e => e.source === nodeId && e.label === char)
              if (!edge) return -1 // 死状态
              return partitions.findIndex(p => p.includes(edge.target))
            })
            .join('|')
        }),
      )

      if (subdivided.length > 1) changed = true
      newPartitions.push(...subdivided)
    }
    partitions = newPartitions
  }

  // 2. 重建最小化 DFA
  // 每个 Partition 成为一个新节点
  const minNodes: any[] = []
  const minEdges: any[] = []
  const partitionMap = new Map<string, string>() // OldID -> NewID

  partitions.forEach((group, index) => {
    const newId = index.toString()
    group.forEach(oldId => partitionMap.set(oldId, newId))

    // 继承属性 (只要组内有一个是 Start/End，新节点就是)
    const isStart = group.some(id => dfa.nodes.find(n => n.id === id)?.isStart)
    const isEnd = group.some(id => dfa.nodes.find(n => n.id === id)?.isEnd)

    // Label 显示合并前的状态 "{q0,q1}"
    const label = `{${group.sort().join(',')}}`
    minNodes.push(createNode({ id: newId, label, isStart, isEnd }))
  })

  // 生成边 (只需看每组的第一个代表元素)
  partitions.forEach((group, index) => {
    const representative = group[0]
    const sourceNewId = index.toString()

    for (const char of dfa.alphabet) {
      const edge = dfa.edges.find(e => e.source === representative && e.label === char)
      if (edge) {
        const targetNewId = partitionMap.get(edge.target)!
        minEdges.push(createEdge(sourceNewId, targetNewId, char))
      }
    }
  })

  return {
    type: AutomatonType.MIN_DFA,
    nodes: minNodes,
    edges: minEdges,
    alphabet: dfa.alphabet,
  }
}
