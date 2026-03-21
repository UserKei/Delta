import { describe, it, expect } from 'bun:test'
import { computeFollow } from '@/ll1/set/follow'
import { computeFirst } from '@/ll1/set/first'
import { EOF, EPSILON, Grammar } from '@repo/shared-types'

describe('Follow Set Computation', () => {
  it('should compute follow sets correctly', () => {
    const grammar: Grammar = {
      startSymbol: 'E',
      nonTerminals: ['E', "E'", 'T', "T'", 'F'],
      terminals: ['+', '*', '(', ')', 'id'],
      productions: [
        { left: 'E', right: ['T', "E'"] },
        { left: "E'", right: ['+', 'T', "E'"] },
        { left: "E'", right: [EPSILON] },
        { left: 'T', right: ['F', "T'"] },
        { left: "T'", right: ['*', 'F', "T'"] },
        { left: "T'", right: [EPSILON] },
        { left: 'F', right: ['(', 'E', ')'] },
        { left: 'F', right: ['id'] },
      ],
    }

    const first = computeFirst(grammar)
    const follow = computeFollow(grammar, first)

    expect(follow['E']).toContain(EOF)
    expect(follow['E']).toContain(')')

    expect(follow["E'"]).toContain(EOF)
    expect(follow["E'"]).toContain(')')

    expect(follow['T']).toContain('+')
    expect(follow['T']).toContain(EOF)
    expect(follow['T']).toContain(')')
  })
})
