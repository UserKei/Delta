import { EPSILON, FAEdge, FANode, FiniteAutomata, AutomatonType } from '@repo/shared-types'
import { toPostfix } from '../regex/parser'
import { createEdge, createNode } from '../graph'

interface Fragment {
  start: FANode
  end: FANode
  nodes: FANode[]
  edges: FAEdge[]
}

export function thompson(regex: string): FiniteAutomata {
  const postfix = toPostfix(regex)
  const stack: Fragment[] = []

  for (const char of postfix) {
    if (char === '.') {
      const f2 = stack.pop()!
      const f1 = stack.pop()!
      // 连接: f1.end -> f2.start (ε)
      // 优化: 其实可以直接合并 f1.end 和 f2.start，但标准 Thompson 是加空边
      // 这里为了让判题更容易 (结构特征明显)，我们严格加边
      const link = createEdge(f1.end.id, f2.start.id, EPSILON)

      // f1.end 不再是终态，f2.start 不再是初态 (虽然 Fragment 里的标记是逻辑上的)
      f1.end.isEnd = false
      f2.start.isStart = false

      stack.push({
        start: f1.start,
        end: f2.end,
        nodes: [...f1.nodes, ...f2.nodes],
        edges: [...f1.edges, ...f2.edges, link],
      })
    } else if (char === '|') {
      const f2 = stack.pop()!
      const f1 = stack.pop()!
      // undefined 占位符号 id = uuid()
      const s = createNode(undefined, 'start', true, false)
      const e = createNode(undefined, 'end', false, true)

      // s -> f1.start, s -> f2.start
      // f1.end -> e, f2.end -> e
      const edges = [
        createEdge(s.id, f1.start.id, EPSILON),
        createEdge(s.id, f2.start.id, EPSILON),
        createEdge(f1.end.id, e.id, EPSILON),
        createEdge(f2.end.id, e.id, EPSILON),
      ]

      f1.start.isStart = false
      f1.end.isEnd = false
      f2.start.isStart = false
      f2.end.isEnd = false

      stack.push({
        start: s,
        end: e,
        nodes: [s, e, ...f1.nodes, ...f2.nodes],
        edges: [...f1.edges, ...f2.edges, ...edges],
      })
    } else if (char === '*') {
      const f = stack.pop()!
      const s = createNode(undefined, 'start', true, false)
      const e = createNode(undefined, 'end', false, true)

      // s -> f.start, f.end -> e (进入和离开)
      // f.end -> f.start (循环)
      // s -> e (跳过/0次)
      const edges = [
        createEdge(s.id, f.start.id, EPSILON),
        createEdge(f.end.id, e.id, EPSILON),
        createEdge(f.end.id, f.start.id, EPSILON),
        createEdge(s.id, e.id, EPSILON),
      ]

      f.start.isStart = false
      f.end.isEnd = false

      stack.push({
        start: s,
        end: e,
        nodes: [s, e, ...f.nodes],
        edges: [...f.edges, ...edges],
      })
    } else {
      // 基础字符 a
      const s = createNode(undefined, 's', true, false)
      const e = createNode(undefined, 'e', false, true)
      const edge = createEdge(s.id, e.id, char === '@' ? EPSILON : char)

      stack.push({
        start: s,
        end: e,
        nodes: [s, e],
        edges: [edge],
      })
    }
  }
  const finalFrag = stack.pop()!
  // 收集字母表 (去重，排除 ε)
  const alphabet = new Set<string>()
  finalFrag.edges.forEach(e => {
    if (e.label !== EPSILON) alphabet.add(e.label)
  })

  return {
    type: AutomatonType.NFA,
    nodes: finalFrag.nodes,
    edges: finalFrag.edges,
    alphabet: Array.from(alphabet).sort(),
  }
}
