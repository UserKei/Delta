import { describe, it, expect } from 'bun:test'
import { DOT, getItemKey } from '../../src/lr/types'

describe('LR Types', () => {
  it('should provide DOT constant', () => {
    expect(DOT).toBe('•')
  })

  it('should format item key correctly', () => {
    expect(getItemKey({ lhs: 'S', rhs: ['A', 'B'], dotPosition: 1 })).toBe('S|A,B|1')
  })
})
