import { EOF, EPSILON, Grammar, GrammarSet, LL1Table } from '@repo/shared-types'
import { computeSequenceFirst } from '../set/first'

/**
 * Builds the LL(1) parsing table using the grammar and its First/Follow sets.
 *
 * @param grammar The context-free grammar.
 * @param first The First sets for the grammar.
 * @param follow The Follow sets for the grammar.
 * @returns The constructed LL(1) parsing table, throwing an error if a conflict exists.
 */
export function buildLL1Table(grammar: Grammar, first: GrammarSet, follow: GrammarSet): LL1Table {
  const table: LL1Table['table'] = {}

  // 初始化
  grammar.nonTerminals.forEach(nt => (table[nt] = {}))

  for (const prod of grammar.productions) {
    const A = prod.left
    const alpha = prod.right

    // 1. 对 First(α) 中的每个终结符 a，把 A -> α 加入 M[A, a]
    const firstAlpha = computeSequenceFirst(alpha, first, grammar.terminals)

    for (const a of firstAlpha) {
      if (a !== EPSILON) {
        if (table[A][a]) throw new Error(`LL(1) Conflict on [${A}, ${a}]`)
        table[A][a] = JSON.stringify(prod) // 这里可以改进为存对象
      }
    }

    // 2. 如果 @ 在 First(α) 中，对 Follow(A) 中的每个 b，把 A -> α 加入 M[A, b]
    if (firstAlpha.includes(EPSILON)) {
      for (const b of follow[A]) {
        if (table[A][b]) throw new Error(`LL(1) Conflict on [${A}, ${b}]`)
        table[A][b] = JSON.stringify(prod)
      }
    }
  }

  return {
    terminals: [...grammar.terminals, EOF],
    nonTerminals: grammar.nonTerminals,
    table,
  }
}
