import { Grammar, LRItem } from '@repo/shared-types'
import { closure } from './closure'

/**
 * Computes the GOTO set of a state (set of items) for a given symbol.
 * Finds all items where the dot is before the given symbol, advances the dot,
 * and returns the closure of the resulting items.
 *
 * @param items - The set of LR items representing the current state.
 * @param symbol - The terminal or non-terminal symbol to transition on.
 * @param grammar - The grammar used for closure computation.
 * @returns The closure of the items after advancing the dot over the given symbol.
 */
export function goto(items: LRItem[], symbol: string, grammar: Grammar): LRItem[] {
  const movedItems: LRItem[] = []

  for (const item of items) {
    // 形式: A -> α . X β，如果 X == symbol
    if (item.dotPosition < item.rhs.length && item.rhs[item.dotPosition] === symbol) {
      movedItems.push({
        lhs: item.lhs,
        rhs: item.rhs,
        dotPosition: item.dotPosition + 1,
      })
    }
  }

  return closure(movedItems, grammar)
}
