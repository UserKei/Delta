import { describe, it, expect } from 'bun:test'
import { Grammar, ActionType } from '@repo/shared-types'
import { buildCanonicalCollection } from '../../../src/lr/generator/collection'
import { buildTable } from '../../../src/lr/table/build'

const grammarLR0: Grammar = {
  startSymbol: 'S',
  nonTerminals: ['S', 'A'],
  terminals: ['a', 'b'],
  productions: [
    { left: 'S', right: ['A'] },
    { left: 'A', right: ['a', 'A'] },
    { left: 'A', right: ['b'] },
  ],
}

describe('LR Table Builder', () => {
  it('should build LR(0) table correctly', () => {
    const { dfa, augmentedGrammar } = buildCanonicalCollection(grammarLR0)
    const table = buildTable(dfa, augmentedGrammar, 'LR0')

    expect(table.terminals).toContain('$')
    expect(table.nonTerminals).not.toContain("S'")

    const bReduceState = dfa.states.find(s =>
      s.items.some(i => i.lhs === 'A' && i.rhs.join(',') === 'b' && i.dotPosition === 1),
    )
    expect(bReduceState).toBeDefined()

    const bStateId = bReduceState!.id
    expect(table.action[bStateId]['a'].type).toBe(ActionType.REDUCE)
    expect(table.action[bStateId]['b'].type).toBe(ActionType.REDUCE)
    expect(table.action[bStateId]['$'].type).toBe(ActionType.REDUCE)
  })

  it('should build SLR(1) table correctly', () => {
    const { dfa, augmentedGrammar } = buildCanonicalCollection(grammarLR0)

    const followSets = {
      "S'": ['$'],
      S: ['$'],
      A: ['$'],
    }

    const table = buildTable(dfa, augmentedGrammar, 'SLR1', followSets)

    const bReduceState = dfa.states.find(s =>
      s.items.some(i => i.lhs === 'A' && i.rhs.join(',') === 'b' && i.dotPosition === 1),
    )
    const bStateId = bReduceState!.id

    expect(table.action[bStateId]['$'].type).toBe(ActionType.REDUCE)
    expect(table.action[bStateId]['a']).toBeUndefined()
    expect(table.action[bStateId]['b']).toBeUndefined()
  })

  it('should handle missing follow set in SLR1', () => {
    const { dfa, augmentedGrammar } = buildCanonicalCollection(grammarLR0)
    // Omit A from followSets
    const followSets = {
      "S'": ['$'],
      S: ['$'],
    }
    const table = buildTable(dfa, augmentedGrammar, 'SLR1', followSets)

    const bReduceState = dfa.states.find(s =>
      s.items.some(i => i.lhs === 'A' && i.rhs.join(',') === 'b' && i.dotPosition === 1),
    )
    const bStateId = bReduceState!.id

    // Since A has no follow set provided, there should be no reduce actions
    expect(table.action[bStateId]['$']).toBeUndefined()
    expect(table.action[bStateId]['a']).toBeUndefined()
    expect(table.action[bStateId]['b']).toBeUndefined()
  })

  it('should handle shift-reduce conflict', () => {
    const conflictGrammar: Grammar = {
      startSymbol: 'S',
      nonTerminals: ['S', 'E'],
      terminals: ['+', 'a'],
      productions: [
        { left: 'S', right: ['E'] },
        { left: 'E', right: ['E', '+', 'E'] },
        { left: 'E', right: ['a'] },
      ],
    }
    const { dfa, augmentedGrammar } = buildCanonicalCollection(conflictGrammar)

    const originalWarn = console.warn
    let warnings: string[] = []
    console.warn = (msg: string) => warnings.push(msg)

    buildTable(dfa, augmentedGrammar, 'LR0')

    expect(warnings.some(w => w.includes('Shift-Reduce Conflict'))).toBe(true)

    console.warn = originalWarn
  })

  it('should handle reduce-reduce conflict', () => {
    const conflictGrammar: Grammar = {
      startSymbol: 'S',
      nonTerminals: ['S', 'A', 'B'],
      terminals: ['a', 'c'],
      productions: [
        { left: 'S', right: ['a', 'A'] },
        { left: 'S', right: ['a', 'B'] },
        { left: 'A', right: ['c'] },
        { left: 'B', right: ['c'] },
      ],
    }
    const { dfa, augmentedGrammar } = buildCanonicalCollection(conflictGrammar)

    const originalWarn = console.warn
    let warnings: string[] = []
    console.warn = (msg: string) => warnings.push(msg)

    buildTable(dfa, augmentedGrammar, 'LR0')

    expect(warnings.some(w => w.includes('Reduce-Reduce Conflict'))).toBe(true)

    console.warn = originalWarn
  })
})
