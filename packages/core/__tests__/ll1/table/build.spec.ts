import { describe, it, expect } from 'bun:test'
import { buildLL1Table } from '@/ll1/table/build'
import { computeFirst } from '@/ll1/set/first'
import { computeFollow } from '@/ll1/set/follow'
import { Grammar } from '@repo/shared-types'
import { EPSILON, EOF } from '@/ll1/types'

describe('LL(1) Table Construction', () => {
  it('should build table for valid LL(1) grammar', () => {
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

    const first = computeFirst(grammar)
    const follow = computeFollow(grammar, first)
    const table = buildLL1Table(grammar, first, follow)

    expect(table.terminals).toContain('a')
    expect(table.terminals).toContain('b')
    expect(table.terminals).toContain(EOF)

    expect(table.table['S']['a']).toBeDefined()
    expect(JSON.parse(table.table['S']['a']).right).toEqual(['a', 'A'])

    expect(table.table['A']['b']).toBeDefined()
    expect(JSON.parse(table.table['A']['b']).right).toEqual(['b'])

    expect(table.table['A'][EOF]).toBeDefined()
    expect(JSON.parse(table.table['A'][EOF]).right).toEqual([EPSILON])
  })

  it('should throw on LL(1) conflict', () => {
    const grammar: Grammar = {
      startSymbol: 'S',
      nonTerminals: ['S'],
      terminals: ['a'],
      productions: [
        { left: 'S', right: ['a'] },
        { left: 'S', right: ['a', 'S'] },
      ],
    }

    const first = computeFirst(grammar)
    const follow = computeFollow(grammar, first)

    expect(() => buildLL1Table(grammar, first, follow)).toThrow('LL(1) Conflict on [S, a]')
  })
})
