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
})
