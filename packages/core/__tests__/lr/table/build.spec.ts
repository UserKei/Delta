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
})
