import { describe, it, expect } from 'bun:test'
import { insertExplicitConcat, toPostfix } from '@/fa/regex/parser'

describe('Regex Parser', () => {
  describe('insertExplicitConcat', () => {
    it('should insert concat between operands', () => {
      expect(insertExplicitConcat('ab')).toBe('a.b')
    })

    it('should insert concat between closure and operand', () => {
      expect(insertExplicitConcat('a*b')).toBe('a*.b')
    })

    it('should insert concat between right paren and operand', () => {
      expect(insertExplicitConcat('(a)b')).toBe('(a).b')
    })

    it('should insert concat between right paren and left paren', () => {
      expect(insertExplicitConcat('(a)(b)')).toBe('(a).(b)')
    })

    it('should not insert concat around |', () => {
      expect(insertExplicitConcat('a|b')).toBe('a|b')
    })

    it('should handle complex expressions', () => {
      expect(insertExplicitConcat('a(bc)*d')).toBe('a.(b.c)*.d')
    })
  })

  describe('toPostfix', () => {
    it('should convert simple concat', () => {
      expect(toPostfix('ab')).toBe('ab.')
    })

    it('should convert simple union', () => {
      expect(toPostfix('a|b')).toBe('ab|')
    })

    it('should convert simple closure', () => {
      expect(toPostfix('a*')).toBe('a*')
    })

    it('should handle operator precedence', () => {
      expect(toPostfix('a|bc')).toBe('abc.|')
      expect(toPostfix('ab|c')).toBe('ab.c|')
      expect(toPostfix('a*b')).toBe('a*b.')
    })

    it('should handle parentheses', () => {
      expect(toPostfix('a(b|c)')).toBe('abc|.')
      expect(toPostfix('(a|b)*c')).toBe('ab|*c.')
    })

    it('should handle complex expressions', () => {
      expect(toPostfix('a(bc)*d')).toBe('abc.*.d.')
    })
  })
})
