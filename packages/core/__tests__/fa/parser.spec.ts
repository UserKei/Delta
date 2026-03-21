import { describe, it, expect } from 'bun:test'
import { parseEdgeList } from '@/fa/parser'
import { AutomatonType, EPSILON } from '@repo/shared-types'

describe('Edge List Parser', () => {
  it('should parse simple state-edge lists', () => {
    const input = `
      start q0
      end q1
      q0 q1 a
    `
    const nfa = parseEdgeList(input)

    expect(nfa.type).toBe(AutomatonType.NFA)
    expect(nfa.nodes).toHaveLength(2)
    expect(nfa.edges).toHaveLength(1)
    expect(nfa.alphabet).toEqual(['a'])

    const q0 = nfa.nodes.find(n => n.id === 'q0')
    const q1 = nfa.nodes.find(n => n.id === 'q1')
    expect(q0?.isStart).toBe(true)
    expect(q1?.isEnd).toBe(true)
  })

  it('should handle epsilon symbols (@)', () => {
    const input = `
      q0 q1 @
    `
    const nfa = parseEdgeList(input)
    expect(nfa.edges[0].label).toBe(EPSILON)
    expect(nfa.alphabet).toHaveLength(0)
  })

  it('should support multiple start and end states', () => {
    const input = `
      S q0
      S q1
      E q2
      q0 q2 a
      q1 q2 b
    `
    const nfa = parseEdgeList(input)
    const starts = nfa.nodes.filter(n => n.isStart)
    const ends = nfa.nodes.filter(n => n.isEnd)
    expect(starts).toHaveLength(2)
    expect(ends).toHaveLength(1)
  })

  it('should ignore comments and extra whitespace', () => {
    const input = `
      # This is a comment
      q0 q1 a    
      
      q1 q0 b # inline comment
    `
    const nfa = parseEdgeList(input)
    expect(nfa.nodes).toHaveLength(2)
    expect(nfa.edges).toHaveLength(2)
  })

  it('should handle purely empty or whitespace lines', () => {
    const input = `
      
      \t
      
    `
    const nfa = parseEdgeList(input)
    expect(nfa.nodes).toHaveLength(0)
    expect(nfa.edges).toHaveLength(0)
  })

  it('should automatically register nodes from edges before S/E declarations', () => {
    const input = `
      q0 q1 a
      start q0
      end q1
    `
    const nfa = parseEdgeList(input)
    expect(nfa.nodes).toHaveLength(2)
    expect(nfa.nodes.find(n => n.id === 'q0')?.isStart).toBe(true)
    expect(nfa.nodes.find(n => n.id === 'q1')?.isEnd).toBe(true)
  })
})
