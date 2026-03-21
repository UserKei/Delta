import { describe, it, expect } from 'bun:test'
import { createNode, createEdge, createGraph } from '@/fa/graph'
import { AutomatonType } from '@repo/shared-types'

describe('FA Graph', () => {
  it('should create a node with default properties', () => {
    const node = createNode()
    expect(node.id).toBeDefined()
    expect(node.label).toBe(node.id)
    expect(node.isStart).toBe(false)
    expect(node.isEnd).toBe(false)
  })

  it('should create a node with specific properties', () => {
    const node = createNode({ id: 'q0', label: 'State 0', isStart: true, isEnd: true })
    expect(node.id).toBe('q0')
    expect(node.label).toBe('State 0')
    expect(node.isStart).toBe(true)
    expect(node.isEnd).toBe(true)
  })

  it('should create an edge with a specific id', () => {
    const edge = createEdge('q0', 'q1', 'a', 'e1')
    expect(edge.id).toBe('e1')
    expect(edge.source).toBe('q0')
    expect(edge.target).toBe('q1')
    expect(edge.label).toBe('a')
  })

  it('should create a graph with default type NFA', () => {
    const graph = createGraph()
    expect(graph.type).toBe(AutomatonType.NFA)
    expect(graph.nodes).toEqual([])
    expect(graph.edges).toEqual([])
    expect(graph.alphabet).toEqual([])
  })

  it('should create a graph with specific type', () => {
    const graph = createGraph(AutomatonType.DFA)
    expect(graph.type).toBe(AutomatonType.DFA)
  })

  it('should create a graph with initial data', () => {
    const nodes = [createNode({ id: 'q0' })]
    const edges = [createEdge('q0', 'q0', 'a')]
    const graph = createGraph(AutomatonType.DFA, { nodes, edges, alphabet: ['a'] })
    expect(graph.nodes).toHaveLength(1)
    expect(graph.edges).toHaveLength(1)
    expect(graph.alphabet).toEqual(['a'])
  })
})
