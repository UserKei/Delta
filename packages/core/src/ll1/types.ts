export const EPSILON = 'ε'
export const EOF = '$'

export interface SymbolSet {
  hasEpsilon: boolean
  symbols: Set<string>
}
