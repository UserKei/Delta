import { describe, it, expect } from 'bun:test'
import { LR_DISPLAY_DOT } from '@repo/shared-types'
import { getItemKey } from '../../src/lr/utils'

describe('LR Types', () => {
  it('should provide LR display dot constant', () => {
    expect(LR_DISPLAY_DOT).toBe('•')
  })

  it('should format item key correctly', () => {
    expect(getItemKey({ lhs: 'S', rhs: ['A', 'B'], dotPosition: 1 })).toBe('S|A,B|1')
  })
})
