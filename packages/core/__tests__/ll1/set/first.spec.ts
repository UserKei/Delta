import { describe, it, expect } from 'bun:test'
import { computeFirst, computeSequenceFirst } from '@/ll1/set/first'
import { EPSILON, Grammar } from '@repo/shared-types'

describe('First Set Computation', () => {
  it('should compute first sets for simple grammar', () => {
    const grammar: Grammar = {
      startSymbol: 'E',
      nonTerminals: ['E', 'T'],
      terminals: ['id', '+'],
      productions: [
        { left: 'E', right: ['T', '+', 'id'] },
        { left: 'T', right: ['id'] },
        { left: 'T', right: [EPSILON] },
      ],
    }

    const first = computeFirst(grammar)

    expect(first['T']).toContain('id')
    expect(first['T']).toContain(EPSILON)

    expect(first['E']).toContain('id')
    expect(first['E']).toContain('+')
  })

  it('should compute sequence first', () => {
    const firstSets = {
      A: ['a', EPSILON],
      B: ['b'],
    }
    const terminals = ['a', 'b', 'c']

    const seq1 = computeSequenceFirst(['A', 'B'], firstSets, terminals)
    expect(seq1).toContain('a')
    expect(seq1).toContain('b')
    expect(seq1).not.toContain(EPSILON)

    const seq2 = computeSequenceFirst(['A', 'c'], firstSets, terminals)
    expect(seq2).toContain('a')
    expect(seq2).toContain('c')

    const firstSetsWithEpsilon = {
      A: ['a', EPSILON],
      B: ['b', EPSILON],
    }
    const seq3 = computeSequenceFirst(['A', 'B'], firstSetsWithEpsilon, terminals)
    expect(seq3).toContain('a')
    expect(seq3).toContain('b')
    expect(seq3).toContain(EPSILON)
  })

  it('should compute first sets correctly when RHS derives epsilon', () => {
    const grammar: Grammar = {
      startSymbol: 'S',
      nonTerminals: ['S', 'A', 'B'],
      terminals: ['a', 'b'],
      productions: [
        { left: 'S', right: ['A', 'B'] },
        { left: 'A', right: ['a'] },
        { left: 'A', right: [EPSILON] },
        { left: 'B', right: ['b'] },
        { left: 'B', right: [EPSILON] },
      ],
    }

    const first = computeFirst(grammar)
    expect(first['S']).toContain('a')
    expect(first['S']).toContain('b')
    expect(first['S']).toContain(EPSILON)
  })
})
