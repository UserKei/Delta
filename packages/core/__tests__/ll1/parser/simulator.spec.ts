import { describe, it, expect } from 'bun:test'
import { simulateLL1 } from '@/ll1/parser/simulator'
import { buildLL1Table } from '@/ll1/table/build'
import { computeFirst } from '@/ll1/set/first'
import { computeFollow } from '@/ll1/set/follow'
import { Grammar } from '@repo/shared-types'
import { EPSILON } from '@/ll1/types'

describe('LL(1) Parser Simulator', () => {
  const grammar: Grammar = {
    startSymbol: 'S',
    nonTerminals: ['S', 'A'],
    terminals: ['a', 'b'],
    productions: [
      { left: 'S', right: ['a', 'A'] },
      { left: 'A', right: ['b'] },
      { left: 'A', right: [EPSILON] },
    ],
  }

  it('should simulate parsing a valid string', () => {
    const first = computeFirst(grammar)
    const follow = computeFollow(grammar, first)
    const table = buildLL1Table(grammar, first, follow)

    const steps = simulateLL1(table, grammar.startSymbol, 'a b')

    expect(steps.length).toBeGreaterThan(0)
    const lastStep = steps[steps.length - 1]
    expect(lastStep.action).toBe('Accept')
  })

  it('should report error for invalid string', () => {
    const first = computeFirst(grammar)
    const follow = computeFollow(grammar, first)
    const table = buildLL1Table(grammar, first, follow)

    const steps = simulateLL1(table, grammar.startSymbol, 'b a')

    const lastStep = steps[steps.length - 1]
    expect(lastStep.action).toContain('Error:')
  })

  it('should report error for terminal mismatch', () => {
    const customGrammar: Grammar = {
      startSymbol: 'S',
      nonTerminals: ['S'],
      terminals: ['a', 'b', 'c'],
      productions: [{ left: 'S', right: ['a', 'b'] }],
    }
    const first = computeFirst(customGrammar)
    const follow = computeFollow(customGrammar, first)
    const table = buildLL1Table(customGrammar, first, follow)

    const steps = simulateLL1(table, customGrammar.startSymbol, 'a c')
    const errorStep = steps.find(s => s.action.includes('Error:'))
    expect(errorStep).toBeDefined()
    expect(errorStep!.action).toBe('Error: Expected b, got c')
  })

  it('should handle epsilon productions correctly', () => {
    const first = computeFirst(grammar)
    const follow = computeFollow(grammar, first)
    const table = buildLL1Table(grammar, first, follow)

    // Using input 'a' to force the use of A -> ε (since Follow(A) contains EOF)
    const steps = simulateLL1(table, grammar.startSymbol, 'a')

    // Find the step where A -> ε is output
    const epsStep = steps.find(s => s.action === 'Output A -> ε')
    expect(epsStep).toBeDefined()
    expect(epsStep!.pushSymbols).toEqual([EPSILON])
  })
})
