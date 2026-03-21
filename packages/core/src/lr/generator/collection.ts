import { Grammar, LRState, LRAutomaton, LRItem } from '@repo/shared-types'
import { cloneDeep } from 'lodash-es'
import { closure } from '../engine/closure'
import { goto } from '../engine/goto'
import { getItemKey } from '../utils'

/**
 * Augments the grammar by adding a new start symbol and a single production
 * from the new start symbol to the original start symbol (e.g., S' -> S).
 *
 * @param grammar - The original grammar to augment.
 * @returns A new augmented grammar.
 */
export function augmentGrammar(grammar: Grammar): Grammar {
  const g = cloneDeep(grammar)
  const oldStart = g.startSymbol
  const newStart = `${oldStart}'`

  // 1. 添加新非终结符到开头
  if (!g.nonTerminals.includes(newStart)) {
    g.nonTerminals.unshift(newStart)
  }

  // 2. 在产生式列表最前面插入 S' -> S
  g.productions.unshift({
    left: newStart,
    right: [oldStart],
  })

  // 3. 更新开始符号
  g.startSymbol = newStart
  return g
}

/**
 * Generates a unique string key for a set of LR items, representing a state.
 * Used for identifying and deduplicating states in the DFA.
 *
 * @param items - The set of LR items.
 * @returns A unique string identifier for the state.
 */
function getStateKey(items: LRItem[]): string {
  return items.map(getItemKey).sort().join(';')
}

/**
 * Builds the canonical collection of sets of LR(0) items (the DFA) for a given grammar.
 * Also returns the augmented grammar used during the build process.
 *
 * @param rawGrammar - The original grammar to build the collection for.
 * @returns An object containing the generated DFA (LRAutomaton) and the augmented grammar.
 */
export function buildCanonicalCollection(rawGrammar: Grammar): {
  dfa: LRAutomaton
  augmentedGrammar: Grammar
} {
  // 0. 自动拓广文法
  const grammar = augmentGrammar(rawGrammar)

  const startProd = grammar.productions[0]
  const startItem: LRItem = { lhs: startProd.left, rhs: startProd.right, dotPosition: 0 }

  const I0_items = closure([startItem], grammar)
  const I0: LRState = { id: '0', items: I0_items }

  const states: LRState[] = [I0]
  const transitions: { source: string; target: string; label: string }[] = []

  const stateMap = new Map<string, string>() // Key -> StateID
  stateMap.set(getStateKey(I0.items), '0')

  const workQueue = [I0]
  let nextId = 1
  const symbols = [...grammar.terminals, ...grammar.nonTerminals]

  while (workQueue.length > 0) {
    const currentState = workQueue.shift()!

    for (const symbol of symbols) {
      const nextItems = goto(currentState.items, symbol, grammar)
      if (nextItems.length === 0) continue

      const nextKey = getStateKey(nextItems)
      let targetStateId = stateMap.get(nextKey)

      if (!targetStateId) {
        targetStateId = (nextId++).toString()
        const newState: LRState = { id: targetStateId, items: nextItems }
        states.push(newState)
        stateMap.set(nextKey, targetStateId)
        workQueue.push(newState)
      }

      transitions.push({
        source: currentState.id,
        target: targetStateId!,
        label: symbol,
      })
    }
  }

  // 标记接受状态 (包含 S' -> S .)
  states.forEach(s => {
    s.isAccepting = s.items.some(
      item => item.lhs === grammar.startSymbol && item.dotPosition === item.rhs.length,
    )
  })

  return {
    dfa: { states, transitions },
    augmentedGrammar: grammar,
  }
}
