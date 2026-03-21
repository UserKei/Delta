import { describe, it, expect } from 'bun:test'
import { thompson } from '@/fa/nfa/thompson'
import { subsetConstruction } from '@/fa/dfa/subset'
import { checkEquivalence } from '@/fa/judges/equivalence'

describe('FA Equivalence Judge', () => {
  it('should return true for identical NFAs', () => {
    const nfa1 = thompson('a*b')
    const nfa2 = thompson('a*b')
    const result = checkEquivalence(nfa1, nfa2)
    expect(result.equal).toBe(true)
  })

  it('should return true for NFA and its converted DFA', () => {
    const nfa = thompson('(a|b)*abb')
    const dfa = subsetConstruction(nfa)
    const result = checkEquivalence(nfa, dfa)
    expect(result.equal).toBe(true)
  })

  it('should return false for different regexes', () => {
    const nfa1 = thompson('a')
    const nfa2 = thompson('a*')
    const result = checkEquivalence(nfa1, nfa2)

    expect(result.equal).toBe(false)
    // a* accepts empty string, a does not
    expect(result.counterExample).toBe('ε')
  })

  it('should provide a counter-example for unequal FAs', () => {
    const nfa1 = thompson('ab')
    const nfa2 = thompson('ac')
    const result = checkEquivalence(nfa1, nfa2)

    expect(result.equal).toBe(false)
    expect(result.counterExample).toBeDefined()
    // Either 'ab' or 'ac' could be a counter-example depending on BFS order
  })

  it('should handle complex equivalent expressions', () => {
    // (a|b)* is equivalent to (a*b*)*
    const nfa1 = thompson('(a|b)*')
    const nfa2 = thompson('(a*b*)*')
    const result = checkEquivalence(nfa1, nfa2)
    expect(result.equal).toBe(true)
  })

  it('should return "Too long" for very deep FAs to avoid infinite loops', () => {
    // Construct two identical NFAs with a very long path (> 100)
    // Both are just q0 -a-> q1 -a-> ... -a-> q105 (no end state or same end state)

    const nodes1 = []
    const edges1 = []
    for (let i = 0; i <= 105; i++) {
      nodes1.push({ id: `q${i}`, label: `q${i}`, isStart: i === 0, isEnd: false })
      if (i < 105) edges1.push({ id: `e${i}`, source: `q${i}`, target: `q${i + 1}`, label: 'a' })
    }

    const nodes2 = []
    const edges2 = []
    for (let i = 0; i <= 105; i++) {
      nodes2.push({ id: `p${i}`, label: `p${i}`, isStart: i === 0, isEnd: false })
      if (i < 105) edges2.push({ id: `f${i}`, source: `p${i}`, target: `p${i + 1}`, label: 'a' })
    }

    const nfa1 = { type: 1, nodes: nodes1, edges: edges1, alphabet: ['a'] } as any
    const nfa2 = { type: 1, nodes: nodes2, edges: edges2, alphabet: ['a'] } as any

    const result = checkEquivalence(nfa1, nfa2)
    expect(result.equal).toBe(false)
    expect(result.counterExample).toBe('Too long')
  })

  it('should handle automata with different alphabets', () => {
    // nfa1 accepts 'a'
    const nfa1 = thompson('a')
    // nfa2 accepts 'b'
    const nfa2 = thompson('b')

    const result = checkEquivalence(nfa1, nfa2)
    expect(result.equal).toBe(false)
    // alphabet will be ['a', 'b']. 'a' or 'b' will be counter-example
    expect(result.counterExample).toBeDefined()
  })
})
