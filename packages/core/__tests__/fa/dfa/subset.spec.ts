import { describe, it, expect } from 'bun:test'
import { thompson } from '@/fa/nfa/thompson'
import { subsetConstruction } from '@/fa/dfa/subset'
import { AutomatonType } from '@repo/shared-types'

describe('Subset Construction (NFA -> DFA)', () => {
  it('should convert a simple NFA to DFA', () => {
    const nfa = thompson('a')
    const dfa = subsetConstruction(nfa)

    expect(dfa.type).toBe(AutomatonType.DFA)
    expect(dfa.alphabet).toEqual(['a'])

    // a single 'a' results in 2 nodes in DFA (start, end)
    expect(dfa.nodes.length).toBeGreaterThanOrEqual(2)

    const startNode = dfa.nodes.find(n => n.isStart)
    const endNode = dfa.nodes.find(n => n.isEnd)
    expect(startNode).toBeDefined()
    expect(endNode).toBeDefined()
  })

  it('should handle epsilon closure correctly', () => {
    const nfa = thompson('a*') // includes many epsilon edges
    const dfa = subsetConstruction(nfa)

    expect(dfa.type).toBe(AutomatonType.DFA)
    expect(dfa.alphabet).toEqual(['a'])

    // For a*, DFA should have at least one node that is both start and end
    const startNode = dfa.nodes.find(n => n.isStart)
    expect(startNode?.isEnd).toBe(true)
  })

  it('should handle complex NFA (a|b)*', () => {
    const nfa = thompson('(a|b)*')
    const dfa = subsetConstruction(nfa)

    expect(dfa.type).toBe(AutomatonType.DFA)
    expect(dfa.alphabet).toEqual(['a', 'b'])

    const startNode = dfa.nodes.find(n => n.isStart)
    expect(startNode?.isEnd).toBe(true)

    // Check transitions from start node
    const edgesFromStart = dfa.edges.filter(e => e.source === startNode?.id)
    expect(edgesFromStart.some(e => e.label === 'a')).toBe(true)
    expect(edgesFromStart.some(e => e.label === 'b')).toBe(true)
  })

  it('should throw error if NFA has no start node', () => {
    const nfa = {
      type: AutomatonType.NFA,
      nodes: [],
      edges: [],
      alphabet: [],
    }
    expect(() => subsetConstruction(nfa)).toThrow('NFA has no start node')
  })
})
