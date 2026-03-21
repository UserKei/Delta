import { describe, it, expect } from 'bun:test'
import { Grammar, LRItem } from '@repo/shared-types'
import { goto } from '../../../src/lr/engine/goto'
import { getItemKey } from '../../../src/lr/types'

const grammar: Grammar = {
  startSymbol: 'S',
  nonTerminals: ['S', 'A'],
  terminals: ['a', 'b'],
  productions: [
    { left: 'S', right: ['A'] },
    { left: 'A', right: ['a', 'A'] },
    { left: 'A', right: ['b'] },
  ],
}

describe('LR Engine > goto', () => {
  it('should compute goto correctly and compute its closure', () => {
    const I0: LRItem[] = [
      { lhs: 'S', rhs: ['A'], dotPosition: 0 },
      { lhs: 'A', rhs: ['a', 'A'], dotPosition: 0 },
      { lhs: 'A', rhs: ['b'], dotPosition: 0 },
    ]

    // goto(I0, 'a')
    const result = goto(I0, 'a', grammar)

    // Moved item: A -> a . A
    // Closure should add:
    // A -> . a A
    // A -> . b
    expect(result).toHaveLength(3)
    const keys = result.map(getItemKey)
    expect(keys).toContain('A|a,A|1')
    expect(keys).toContain('A|a,A|0')
    expect(keys).toContain('A|b|0')
  })

  it('should return empty array if no transitions', () => {
    const I0: LRItem[] = [{ lhs: 'S', rhs: ['A'], dotPosition: 0 }]
    const result = goto(I0, 'b', grammar)
    expect(result).toHaveLength(0)
  })
})
