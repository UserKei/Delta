import { describe, it, expect } from 'bun:test'
import { eliminateLeftRecursion } from '@/ll1/transformer/left-recursion'
import { Grammar } from '@repo/shared-types'
import { EPSILON } from '@/ll1/types'

describe('Left Recursion Elimination', () => {
  it('should eliminate direct left recursion', () => {
    const grammar: Grammar = {
      startSymbol: 'E',
      nonTerminals: ['E', 'T'],
      terminals: ['+', 'id'],
      productions: [
        { left: 'E', right: ['E', '+', 'T'] },
        { left: 'E', right: ['T'] },
      ],
    }

    const result = eliminateLeftRecursion(grammar)

    expect(result.nonTerminals).toContain("E'")
    const eProds = result.productions.filter(p => p.left === 'E')
    const ePrimeProds = result.productions.filter(p => p.left === "E'")

    expect(eProds).toHaveLength(1)
    expect(eProds[0].right).toEqual(['T', "E'"])

    expect(ePrimeProds).toHaveLength(2)
    expect(ePrimeProds).toContainEqual({ left: "E'", right: ['+', 'T', "E'"] })
    expect(ePrimeProds).toContainEqual({ left: "E'", right: [EPSILON] })
  })

  it('should eliminate indirect left recursion', () => {
    const grammar: Grammar = {
      startSymbol: 'S',
      nonTerminals: ['S', 'A'],
      terminals: ['a', 'b', 'c'],
      productions: [
        { left: 'S', right: ['A', 'a'] },
        { left: 'S', right: ['b'] },
        { left: 'A', right: ['S', 'b'] },
        { left: 'A', right: ['c'] },
      ],
    }
    const result = eliminateLeftRecursion(grammar)

    // A -> Sb | c => A -> Aab | bb | c
    // Expect A_prime to handle direct recursion on A
    expect(result.nonTerminals).toContain("A'")
    const aProds = result.productions.filter(p => p.left === 'A')
    expect(aProds).toContainEqual({ left: 'A', right: ['b', 'b', "A'"] })
    expect(aProds).toContainEqual({ left: 'A', right: ['c', "A'"] })
  })

  it('should handle non-terminal with only direct left recursion', () => {
    const grammar: Grammar = {
      startSymbol: 'S',
      nonTerminals: ['S'],
      terminals: ['a'],
      productions: [{ left: 'S', right: ['S', 'a'] }],
    }
    const result = eliminateLeftRecursion(grammar)

    expect(result.nonTerminals).toContain("S'")
    const sProds = result.productions.filter(p => p.left === 'S')
    const sPrimeProds = result.productions.filter(p => p.left === "S'")

    expect(sProds).toHaveLength(1)
    expect(sProds[0].right).toEqual(["S'"])

    expect(sPrimeProds).toHaveLength(2)
    expect(sPrimeProds).toContainEqual({ left: "S'", right: ['a', "S'"] })
    expect(sPrimeProds).toContainEqual({ left: "S'", right: [EPSILON] })
  })
})
