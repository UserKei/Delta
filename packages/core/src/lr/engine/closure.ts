import { Grammar, LRItem } from '@repo/shared-types'
import { getItemKey } from '../utils'

/**
 * Computes the LR(0) closure of a set of items.
 * Expands items where the dot is immediately before a non-terminal by adding
 * all productions of that non-terminal with the dot at the beginning.
 *
 * @param items - The initial set of LR items.
 * @param grammar - The grammar containing productions and non-terminals.
 * @returns The computed closure set of LR items.
 */
export function closure(items: LRItem[], grammar: Grammar): LRItem[] {
  let closureSet = [...items]
  let changed = true

  while (changed) {
    changed = false

    for (const item of closureSet) {
      // 形式: A -> α . B β
      if (item.dotPosition < item.rhs.length) {
        const B = item.rhs[item.dotPosition]
        // 只有 B 是非终结符时才展开
        if (grammar.nonTerminals.includes(B)) {
          // 找所有 B -> γ
          const productionsB = grammar.productions.filter(p => p.left === B)

          for (const prod of productionsB) {
            const newItem: LRItem = { lhs: prod.left, rhs: prod.right, dotPosition: 0 }

            // 判重加入
            const exists = closureSet.some(existing => getItemKey(existing) === getItemKey(newItem))
            if (!exists) {
              closureSet.push(newItem)
              changed = true
            }
          }
        }
      }
    }
  }
  return closureSet
}
