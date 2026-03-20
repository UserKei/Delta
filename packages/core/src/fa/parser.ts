import { FiniteAutomata, AutomatonType, EPSILON } from '@repo/shared-types'
import { createNode, createEdge } from './graph'

/**
 * Parses an Edge List text to generate a Finite Automaton object.
 *
 * Supported text formats:
 * - `S <id>` or `start <id>`: Defines the start state
 * - `E <id>` or `end <id>`: Defines an accepting/final state
 * - `<source> <target> <label>`: Defines a state transition edge (use `@` for ε edges)
 * - Lines starting with `#` are comments
 *
 * @param input - The text string containing the automaton definition
 * @returns The generated Non-deterministic Finite Automaton (NFA) object
 */
export function parseEdgeList(input: string): FiniteAutomata {
  const lines = input.split('\n')
  const nodesMap = new Map<string, any>()
  const edges: any[] = []
  const startNodes = new Set<string>()
  const endNodes = new Set<string>()
  const alphabet = new Set<string>()

  for (const line of lines) {
    // 忽略注释和空行
    const parts = line.trim().split(/\s+/)
    if (parts.length === 0 || line.trim().startsWith('#')) continue

    // 解析 S <id> 和 E <id>
    if ((parts[0] === 'S' || parts[0] === 'start') && parts[1]) {
      startNodes.add(parts[1])
      if (!nodesMap.has(parts[1])) nodesMap.set(parts[1], { id: parts[1] })
    } else if ((parts[0] === 'E' || parts[0] === 'end') && parts[1]) {
      endNodes.add(parts[1])
      if (!nodesMap.has(parts[1])) nodesMap.set(parts[1], { id: parts[1] })
    }
    // 解析边: <src> <tgt> <label>
    else if (parts.length >= 3) {
      const [s, t, label] = parts
      const finalLabel = label === '@' ? EPSILON : label

      // 自动注册节点
      ;[s, t].forEach(id => {
        if (!nodesMap.has(id)) nodesMap.set(id, { id })
      })

      edges.push(createEdge(s, t, finalLabel))
      if (finalLabel !== EPSILON) alphabet.add(finalLabel)
    }
  }

  const nodes = Array.from(nodesMap.keys()).map(id =>
    createNode({ id, label: id, isStart: startNodes.has(id), isEnd: endNodes.has(id) }),
  )

  return {
    type: AutomatonType.NFA,
    nodes,
    edges,
    alphabet: Array.from(alphabet).sort(),
  }
}
