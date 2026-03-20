import { describe, it, expect } from 'bun:test'
import { thompson } from '@/fa/nfa/thompson'
import { AutomatonType, EPSILON } from '@repo/shared-types'

describe('Thompson Algorithm', () => {
  it('should create an NFA for a single character', () => {
    const nfa = thompson('a')
    expect(nfa.type).toBe(AutomatonType.NFA)
    expect(nfa.nodes).toHaveLength(2)
    expect(nfa.edges).toHaveLength(1)
    expect(nfa.edges[0].label).toBe('a')
    expect(nfa.alphabet).toEqual(['a'])

    const startNode = nfa.nodes.find(n => n.isStart)
    const endNode = nfa.nodes.find(n => n.isEnd)
    expect(startNode).toBeDefined()
    expect(endNode).toBeDefined()
    expect(startNode?.id).not.toBe(endNode?.id)
  })

  it('should create an NFA for epsilon', () => {
    const nfa = thompson('@')
    expect(nfa.edges[0].label).toBe(EPSILON)
    expect(nfa.alphabet).toEqual([])
  })

  it('should handle concatenation (ab)', () => {
    const nfa = thompson('ab')
    // a: 2 nodes, 1 edge
    // b: 2 nodes, 1 edge
    // concat: 1 epsilon edge between them
    // Total: 4 nodes, 3 edges (a, b, epsilon)
    expect(nfa.nodes).toHaveLength(4)
    expect(nfa.edges).toHaveLength(3)
    expect(nfa.alphabet).toEqual(['a', 'b'])

    const epsilonEdges = nfa.edges.filter(e => e.label === EPSILON)
    expect(epsilonEdges).toHaveLength(1)
  })

  it('should handle union (a|b)', () => {
    const nfa = thompson('a|b')
    // a: 2 nodes, 1 edge
    // b: 2 nodes, 1 edge
    // union: 2 new nodes (start, end) + 4 epsilon edges
    // Total: 2+2+2 = 6 nodes, 1+1+4 = 6 edges
    expect(nfa.nodes).toHaveLength(6)
    expect(nfa.edges).toHaveLength(6)
    expect(nfa.alphabet).toEqual(['a', 'b'])
  })

  it('should handle closure (a*)', () => {
    const nfa = thompson('a*')
    // a: 2 nodes, 1 edge
    // closure: 2 new nodes + 4 epsilon edges
    // Total: 2+2 = 4 nodes, 1+4 = 5 edges
    expect(nfa.nodes).toHaveLength(4)
    expect(nfa.edges).toHaveLength(5)
    expect(nfa.alphabet).toEqual(['a'])
  })

  it('should handle complex expressions (a|b)*c', () => {
    const nfa = thompson('(a|b)*c')
    expect(nfa.type).toBe(AutomatonType.NFA)
    expect(nfa.alphabet).toEqual(['a', 'b', 'c'])

    const startNodes = nfa.nodes.filter(n => n.isStart)
    const endNodes = nfa.nodes.filter(n => n.isEnd)
    expect(startNodes).toHaveLength(1)
    expect(endNodes).toHaveLength(1)
  })
})
