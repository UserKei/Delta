import { describe, it, expect } from 'bun:test'
import { Grammar } from '@repo/shared-types'
import { augmentGrammar, buildCanonicalCollection } from '../../../src/lr/generator/collection'

const rawGrammar: Grammar = {
  startSymbol: 'S',
  nonTerminals: ['S', 'A'],
  terminals: ['a', 'b'],
  productions: [
    { left: 'S', right: ['A'] },
    { left: 'A', right: ['a', 'A'] },
    { left: 'A', right: ['b'] },
  ],
}

describe('LR Generator > collection', () => {
  it('should augment grammar correctly', () => {
    const augmented = augmentGrammar(rawGrammar)
    expect(augmented.startSymbol).toBe("S'")
    expect(augmented.nonTerminals).toContain("S'")
    expect(augmented.productions[0]).toEqual({ left: "S'", right: ['S'] })
  })

  it('should build DFA correctly', () => {
    const { dfa, augmentedGrammar } = buildCanonicalCollection(rawGrammar)

    expect(dfa.states.length).toBeGreaterThan(0)
    expect(dfa.states[0].id).toBe('0')

    const i0Items = dfa.states[0].items
    expect(
      i0Items.some(i => i.lhs === "S'" && i.rhs.join(',') === 'S' && i.dotPosition === 0),
    ).toBe(true)

    const acceptState = dfa.states.find(s => s.isAccepting)
    expect(acceptState).toBeDefined()
    expect(
      acceptState?.items.some(
        i => i.lhs === "S'" && i.rhs.join(',') === 'S' && i.dotPosition === 1,
      ),
    ).toBe(true)

    expect(dfa.transitions.length).toBeGreaterThan(0)
  })

  it('should not add start symbol again if already present', () => {
    const grammarWithPrime: Grammar = {
      startSymbol: 'S',
      nonTerminals: ["S'", 'S'],
      terminals: ['a'],
      productions: [{ left: 'S', right: ['a'] }],
    }
    const augmented = augmentGrammar(grammarWithPrime)
    expect(augmented.nonTerminals.filter(n => n === "S'").length).toBe(1)
  })
})
