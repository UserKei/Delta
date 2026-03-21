import { describe, it, expect } from 'bun:test'
import { Grammar } from '@repo/shared-types'
import { buildCanonicalCollection } from '../../../src/lr/generator/collection'
import { buildTable } from '../../../src/lr/table/build'
import { simulateLR } from '../../../src/lr/parser/simulator'

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

describe('LR Parser Simulator', () => {
  it('should simulate parsing a valid string', () => {
    const { dfa, augmentedGrammar } = buildCanonicalCollection(grammar)
    const table = buildTable(dfa, augmentedGrammar, 'LR0')

    const steps = simulateLR(table, augmentedGrammar, 'a a b')

    expect(steps.length).toBeGreaterThan(0)
    const lastStep = steps[steps.length - 1]
    expect(lastStep.action).toBe('Accept')
  })

  it('should report error for invalid string', () => {
    const { dfa, augmentedGrammar } = buildCanonicalCollection(grammar)
    const table = buildTable(dfa, augmentedGrammar, 'LR0')

    const steps = simulateLR(table, augmentedGrammar, 'b a')

    expect(steps.length).toBeGreaterThan(0)
    const lastStep = steps[steps.length - 1]
    expect(lastStep.action).toBe('Error')
  })

  it('should handle epsilon productions correctly in popCount', () => {
    const epsGrammar: Grammar = {
      startSymbol: 'S',
      nonTerminals: ['S', 'A'],
      terminals: ['b'],
      productions: [
        { left: 'S', right: ['A', 'b'] },
        { left: 'A', right: [] },
      ],
    }
    const { dfa, augmentedGrammar } = buildCanonicalCollection(epsGrammar)
    const followSets = {
      "S'": ['$'],
      S: ['b', '$'],
      A: ['b'],
    }
    const table = buildTable(dfa, augmentedGrammar, 'SLR1', followSets)
    const steps = simulateLR(table, augmentedGrammar, 'b')

    const lastStep = steps[steps.length - 1]
    expect(lastStep.action).toBe('Accept')

    const reduceEpsStep = steps.find(s => s.action.includes('Reduce A ->'))
    expect(reduceEpsStep).toBeDefined()
    expect(reduceEpsStep!.popCount).toBe(0)
  })

  it('should handle epsilon productions represented by "@"', () => {
    const epsGrammar: Grammar = {
      startSymbol: 'S',
      nonTerminals: ['S', 'A'],
      terminals: ['b'],
      productions: [
        { left: 'S', right: ['A', 'b'] },
        { left: 'A', right: [] },
      ],
    }
    const { dfa, augmentedGrammar } = buildCanonicalCollection(epsGrammar)
    const followSets = {
      "S'": ['$'],
      S: ['b', '$'],
      A: ['b'],
    }
    const table = buildTable(dfa, augmentedGrammar, 'SLR1', followSets)

    // Mutate the augmented grammar to use '@' for epsilon before simulation
    const aEpsProd = augmentedGrammar.productions.find(p => p.left === 'A' && p.right.length === 0)
    if (aEpsProd) {
      aEpsProd.right = ['@']
    }

    const steps = simulateLR(table, augmentedGrammar, 'b')

    const lastStep = steps[steps.length - 1]
    expect(lastStep.action).toBe('Accept')

    const reduceEpsStep = steps.find(s => s.action.includes('Reduce A -> @'))
    expect(reduceEpsStep).toBeDefined()
    expect(reduceEpsStep!.popCount).toBe(0)
  })

  it('should report Goto Error if next state is missing', () => {
    const { dfa, augmentedGrammar } = buildCanonicalCollection(grammar)
    const table = buildTable(dfa, augmentedGrammar, 'LR0')

    // Find state 0 goto for S and delete it to trigger Goto Error
    table.goto['0']['S'] = undefined as any

    const steps = simulateLR(table, augmentedGrammar, 'a a b')
    const lastStep = steps[steps.length - 1]
    expect(lastStep.action).toContain('Goto Error')
  })
})
