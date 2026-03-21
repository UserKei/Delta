import { describe, it, expect } from 'bun:test'
import { Grammar, LRItem } from '@repo/shared-types'
import { closure } from '../../../src/lr/engine/closure'
import { getItemKey } from '../../../src/lr/utils'

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

describe('LR Engine > closure', () => {
  it('should compute closure for a single item', () => {
    const initItems: LRItem[] = [{ lhs: 'S', rhs: ['A'], dotPosition: 0 }]
    const result = closure(initItems, grammar)

    expect(result).toHaveLength(3)
    const keys = result.map(getItemKey)
    expect(keys).toContain('S|A|0')
    expect(keys).toContain('A|a,A|0')
    expect(keys).toContain('A|b|0')
  })

  it('should return same items if no non-terminal after dot', () => {
    const initItems: LRItem[] = [{ lhs: 'A', rhs: ['b'], dotPosition: 1 }]
    const result = closure(initItems, grammar)
    expect(result).toHaveLength(1)
    expect(getItemKey(result[0])).toBe('A|b|1')
  })

  it('should handle left-recursive grammar in closure', () => {
    const lrGrammar: Grammar = {
      startSymbol: 'S',
      nonTerminals: ['S', 'A'],
      terminals: ['a', 'b'],
      productions: [
        { left: 'S', right: ['A'] },
        { left: 'A', right: ['A', 'a'] },
        { left: 'A', right: ['b'] },
      ],
    }
    const initItems: LRItem[] = [{ lhs: 'S', rhs: ['A'], dotPosition: 0 }]
    const result = closure(initItems, lrGrammar)
    expect(result).toHaveLength(3)
  })
})
