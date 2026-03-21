import { Grammar, GrammarSet } from '@repo/shared-types'
import { EPSILON } from '../types'

/**
 * Computes the First sets for all non-terminals in a given grammar.
 *
 * @param grammar The context-free grammar.
 * @returns A mapping of non-terminals to their computed First sets.
 */
export function computeFirst(grammar: Grammar): GrammarSet {
  const first: GrammarSet = {}
  grammar.nonTerminals.forEach(nt => (first[nt] = []))

  let changed = true
  while (changed) {
    changed = false
    for (const prod of grammar.productions) {
      const X = prod.left
      const rhs = prod.right

      // 计算 RHS 的 First 集
      const rhsFirst = computeSequenceFirst(rhs, first, grammar.terminals)

      // 合并到 First(X)
      for (const symbol of rhsFirst) {
        if (!first[X].includes(symbol)) {
          first[X].push(symbol)
          changed = true
        }
      }
    }
  }
  return first
}

/**
 * Computes the First set for a sequence of symbols (terminals and non-terminals).
 *
 * @param seq The sequence of symbols.
 * @param firstSets The previously computed First sets for non-terminals.
 * @param terminals The array of valid terminal symbols.
 * @returns An array representing the First set of the sequence.
 */
export function computeSequenceFirst(
  seq: string[],
  firstSets: GrammarSet,
  terminals: string[],
): string[] {
  const result = new Set<string>()
  let allHaveEpsilon = true

  for (const symbol of seq) {
    if (symbol === EPSILON) {
      result.add(EPSILON)
      continue
    }

    if (terminals.includes(symbol)) {
      result.add(symbol)
      allHaveEpsilon = false
      break
    }

    // 非终结符
    const f = firstSets[symbol] || []
    let hasEpsilon = false
    for (const s of f) {
      if (s === EPSILON) hasEpsilon = true
      else result.add(s)
    }

    if (!hasEpsilon) {
      allHaveEpsilon = false
      break
    }
  }

  if (allHaveEpsilon) result.add(EPSILON)
  return Array.from(result)
}
