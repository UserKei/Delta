import { describe, it, expect } from 'bun:test'
import { computeFirst, computeSequenceFirst } from '@/ll1/set/first'
import { Grammar } from '@repo/shared-types'
import { EPSILON } from '@/ll1/types'

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
  })
})
