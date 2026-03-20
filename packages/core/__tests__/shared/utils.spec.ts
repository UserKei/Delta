import { describe, it, expect } from 'bun:test'
import { uuid } from '@/shared/utils'

describe('Shared Utils', () => {
  it('should generate an 8-character uuid', () => {
    const id = uuid()
    expect(id).toHaveLength(8)
  })

  it('should generate unique ids', () => {
    const id1 = uuid()
    const id2 = uuid()
    expect(id1).not.toBe(id2)
  })
})
