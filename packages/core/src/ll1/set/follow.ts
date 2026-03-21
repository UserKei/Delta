import { Grammar, GrammarSet } from '@repo/shared-types'
import { EPSILON, EOF } from '../types'
import { computeSequenceFirst } from './first'

/**
 * Computes the Follow sets for all non-terminals in a given grammar.
 *
 * @param grammar The context-free grammar.
 * @param first The computed First sets for the grammar's non-terminals.
 * @returns A mapping of non-terminals to their computed Follow sets.
 */
export function computeFollow(grammar: Grammar, first: GrammarSet): GrammarSet {
  const follow: GrammarSet = {}
  grammar.nonTerminals.forEach(nt => (follow[nt] = []))
  follow[grammar.startSymbol].push(EOF) // Start 符号放入 $

  let changed = true
  while (changed) {
    changed = false
    for (const prod of grammar.productions) {
      const A = prod.left
      const rhs = prod.right

      for (let i = 0; i < rhs.length; i++) {
        const B = rhs[i]
        if (grammar.terminals.includes(B) || B === EPSILON) continue

        // 规则 2: A -> α B β, First(β)-{ε} 加入 Follow(B)
        const beta = rhs.slice(i + 1)
        const firstBeta = computeSequenceFirst(beta, first, grammar.terminals)

        for (const f of firstBeta) {
          if (f !== EPSILON && !follow[B].includes(f)) {
            follow[B].push(f)
            changed = true
          }
        }

        // 规则 3: A -> α B 或 A -> α B β 且 First(β) 含 ε
        // Follow(A) 加入 Follow(B)
        if (beta.length === 0 || firstBeta.includes(EPSILON)) {
          for (const f of follow[A]) {
            if (!follow[B].includes(f)) {
              follow[B].push(f)
              changed = true
            }
          }
        }
      }
    }
  }
  return follow
}
