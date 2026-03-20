import { describe, it, expect } from 'bun:test'
import { createNode, createEdge, createGraph } from '@/fa/graph'
import { minimizeDFA } from '@/fa/dfa/hopcroft'
import { AutomatonType } from '@repo/shared-types'

describe('DFA Minimization (Hopcroft Algorithm)', () => {
  it('should minimize a redundant DFA', () => {
    // Create a DFA with redundant states: q1 and q2 are equivalent
    // q0 (start) -(a)-> q1 (end)
    // q0 (start) -(b)-> q2 (end)
    // q1 -(a)-> q1, q1 -(b)-> q1
    // q2 -(a)-> q2, q2 -(b)-> q2

    const q0 = createNode({ id: 'q0', label: 'q0', isStart: true, isEnd: false })
    const q1 = createNode({ id: 'q1', label: 'q1', isStart: false, isEnd: true })
    const q2 = createNode({ id: 'q2', label: 'q2', isStart: false, isEnd: true })

    const edges = [
      createEdge('q0', 'q1', 'a'),
      createEdge('q0', 'q2', 'b'),
      createEdge('q1', 'q1', 'a'),
      createEdge('q1', 'q1', 'b'),
      createEdge('q2', 'q2', 'a'),
      createEdge('q2', 'q2', 'b'),
    ]

    const dfa = createGraph(AutomatonType.DFA, {
      nodes: [q0, q1, q2],
      edges,
      alphabet: ['a', 'b'],
    })

    const minDFA = minimizeDFA(dfa)

    expect(minDFA.type).toBe(AutomatonType.MIN_DFA)
    expect(minDFA.alphabet).toEqual(['a', 'b'])

    // q1 and q2 should be merged
    // Expected nodes: {q0} and {q1,q2}
    expect(minDFA.nodes.length).toBe(2)
  })

  it('should not change an already minimal DFA', () => {
    // a single 'a' transition DFA is already minimal
    // q0 -(a)-> q1(end)
    const q0 = createNode({ id: 'q0', label: 'q0', isStart: true, isEnd: false })
    const q1 = createNode({ id: 'q1', label: 'q1', isStart: false, isEnd: true })
    const edges = [createEdge('q0', 'q1', 'a')]

    const dfa = createGraph(AutomatonType.DFA, {
      nodes: [q0, q1],
      edges,
      alphabet: ['a'],
    })

    const minDFA = minimizeDFA(dfa)
    expect(minDFA.nodes.length).toBe(2)
  })

  it('should handle dead states in DFA', () => {
    // q0 -a-> q1(end)
    // q0 -b-> q2 (dead state)
    const q0 = createNode({ id: 'q0', label: 'q0', isStart: true, isEnd: false })
    const q1 = createNode({ id: 'q1', label: 'q1', isStart: false, isEnd: true })
    const q2 = createNode({ id: 'q2', label: 'q2', isStart: false, isEnd: false })

    const edges = [
      createEdge('q0', 'q1', 'a'),
      createEdge('q0', 'q2', 'b'),
      // q1 and q2 have no transitions out, making q2 a dead state
    ]

    const dfa = createGraph(AutomatonType.DFA, {
      nodes: [q0, q1, q2],
      edges,
      alphabet: ['a', 'b'],
    })

    const minDFA = minimizeDFA(dfa)

    // Expected partition: {q1} (end), {q0, q2} (non-end but not necessarily merged)
    // Wait, q0 and q2 are not equivalent because q0 -a-> q1 and q2 -a-> nothing.
    // So the partitions should be {q1}, {q0}, {q2}.
    expect(minDFA.nodes.length).toBe(3)
  })
})
