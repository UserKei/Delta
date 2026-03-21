import { LRTable, LRAutomaton, Grammar, ActionType, GrammarSet } from '@repo/shared-types'

/**
 * Builds the LR parsing table (ACTION and GOTO) from an LR automaton and grammar.
 * Supports building both LR(0) and SLR(1) parsing tables.
 *
 * @param dfa - The canonical collection DFA (LRAutomaton).
 * @param grammar - The augmented grammar.
 * @param mode - The mode of parsing table to generate ('LR0' or 'SLR1').
 * @param followSets - The Follow sets of the grammar non-terminals, required for 'SLR1' mode.
 * @returns The constructed LRTable containing action and goto logic.
 */
export function buildTable(
  dfa: LRAutomaton,
  grammar: Grammar,
  mode: 'LR0' | 'SLR1',
  followSets?: GrammarSet, // SLR1 必须传
): LRTable {
  const table: LRTable = {
    terminals: [...grammar.terminals, '$'],
    nonTerminals: grammar.nonTerminals.filter(n => n !== grammar.startSymbol), // 排除 S'
    action: {},
    goto: {},
  }

  // 初始化
  dfa.states.forEach(s => {
    table.action[s.id] = {}
    table.goto[s.id] = {}
  })

  for (const state of dfa.states) {
    // 1. 处理 Shift (和 Goto)
    // 遍历出边
    const edges = dfa.transitions.filter(t => t.source === state.id)
    for (const edge of edges) {
      if (grammar.terminals.includes(edge.label)) {
        // Shift
        table.action[state.id][edge.label] = { type: ActionType.SHIFT, value: edge.target }
      } else {
        // Goto
        table.goto[state.id][edge.label] = edge.target
      }
    }

    // 2. 处理 Reduce
    for (const item of state.items) {
      if (item.dotPosition === item.rhs.length) {
        // 归约项 A -> α .
        if (item.lhs === grammar.startSymbol) {
          // Accept: S' -> S .
          table.action[state.id]['$'] = { type: ActionType.ACCEPT }
        } else {
          // Reduce: A -> α .
          // 找到产生式索引 (假设 production 有 index 或对比内容)
          const prodIndex = grammar.productions.findIndex(
            p =>
              p.left === item.lhs &&
              p.right.length === item.rhs.length &&
              p.right.every((v, i) => v === item.rhs[i]),
          )

          if (mode === 'LR0') {
            // LR(0): 对所有终结符归约
            for (const t of table.terminals) {
              setReduce(table, state.id, t, prodIndex)
            }
          } else {
            // SLR(1): 只对 Follow(A) 归约
            const followA = followSets![item.lhs] || []
            for (const t of followA) {
              setReduce(table, state.id, t, prodIndex)
            }
          }
        }
      }
    }
  }
  return table
}

/**
 * Helper function to safely insert a REDUCE action into the parsing table.
 * Resolves or warns about Shift-Reduce or Reduce-Reduce conflicts.
 *
 * @param table - The LR parsing table being constructed.
 * @param stateId - The state ID where the action occurs.
 * @param symbol - The lookahead terminal symbol triggering the reduction.
 * @param prodIndex - The index of the production to reduce by.
 */
function setReduce(table: LRTable, stateId: string, symbol: string, prodIndex: number) {
  // 检查冲突
  if (table.action[stateId][symbol]) {
    // 简单的冲突策略：移进优先
    const existing = table.action[stateId][symbol]
    if (existing.type === ActionType.SHIFT) {
      console.warn(`Shift-Reduce Conflict at ${stateId} on ${symbol}`)
      return
    }
    console.warn(`Reduce-Reduce Conflict at ${stateId} on ${symbol}`)
  }
  table.action[stateId][symbol] = { type: ActionType.REDUCE, value: prodIndex }
}
