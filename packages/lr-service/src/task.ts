import {
  augmentGrammar,
  buildCanonicalCollection,
  buildTable,
  computeFirst,
  computeFollow,
  simulateLR,
} from '@repo/core'
import {
  ActionType,
  type Grammar,
  LRMode,
  type LRJudgeRequest,
  type LRJudgeResult,
  type LRItem,
  type LRParserStep,
  LRTaskType,
  type LRTable,
  type LRAutomaton,
} from '@repo/shared-types'

export function evaluateLRTask(request: LRJudgeRequest): LRJudgeResult {
  switch (request.taskType) {
    case LRTaskType.GRAMMAR_CHECK:
      return checkGrammarAugmentation(request.answer)
    case LRTaskType.LR_DFA_ISOMORPHISM:
      return checkLrDfaIsomorphism(request.answer)
    case LRTaskType.TABLE_CELL_MATCH:
    case LRTaskType.SLR1_TABLE_CHECK:
      return checkTable(request.answer, request.taskType)
    case LRTaskType.TRACE_MATCH:
      return checkTrace(request.answer)
  }
}

export function checkGrammarAugmentation(
  answer: LRJudgeRequest<LRTaskType.GRAMMAR_CHECK>['answer'],
): LRJudgeResult {
  const issue = validateGrammar(answer.grammar)
  if (issue) {
    return fail('INVALID_GRAMMAR', issue)
  }

  const expected = normalizeGrammar(augmentGrammar(answer.grammar))
  const actual = normalizeGrammar(answer.augmentedGrammar)

  if (JSON.stringify(expected) !== JSON.stringify(actual)) {
    return fail(
      'AUGMENTATION_MISMATCH',
      "Augmented grammar does not match the expected S' -> S form",
      {
        expected,
        actual,
      },
    )
  }

  return pass('Augmented grammar is correct')
}

export function checkLrDfaIsomorphism(
  answer: LRJudgeRequest<LRTaskType.LR_DFA_ISOMORPHISM>['answer'],
): LRJudgeResult {
  const grammarCheck = validateGrammar(answer.grammar)
  if (grammarCheck) {
    return fail('INVALID_GRAMMAR', grammarCheck)
  }

  const reference = buildCanonicalCollection(answer.grammar).dfa
  const expected = normalizeAutomaton(reference)
  const actual = normalizeAutomaton(answer.automaton)

  if (JSON.stringify(expected) !== JSON.stringify(actual)) {
    return fail('LR_DFA_MISMATCH', 'Submitted LR DFA does not match the canonical collection', {
      expectedStateCount: reference.states.length,
      actualStateCount: answer.automaton.states.length,
      expectedTransitionCount: reference.transitions.length,
      actualTransitionCount: answer.automaton.transitions.length,
    })
  }

  return pass('LR DFA matches the canonical collection')
}

export function checkTable(
  answer: LRJudgeRequest<LRTaskType.TABLE_CELL_MATCH>['answer'],
  taskType: LRTaskType.TABLE_CELL_MATCH | LRTaskType.SLR1_TABLE_CHECK,
): LRJudgeResult {
  const grammarCheck = validateGrammar(answer.grammar)
  if (grammarCheck) {
    return fail('INVALID_GRAMMAR', grammarCheck)
  }

  const mode = taskType === LRTaskType.SLR1_TABLE_CHECK ? LRMode.SLR1 : answer.mode
  const expected = normalizeTable(buildReferenceTable(answer.grammar, mode))
  const actual = normalizeTable(answer.table)

  if (JSON.stringify(expected) !== JSON.stringify(actual)) {
    return fail('TABLE_MISMATCH', `${mode} parsing table does not match the reference table`, {
      expected,
      actual,
    })
  }

  return pass(`${mode} parsing table is correct`)
}

export function checkTrace(
  answer: LRJudgeRequest<LRTaskType.TRACE_MATCH>['answer'],
): LRJudgeResult {
  const grammarCheck = validateGrammar(answer.grammar)
  if (grammarCheck) {
    return fail('INVALID_GRAMMAR', grammarCheck)
  }

  const augmentedGrammar = buildCanonicalCollection(answer.grammar).augmentedGrammar
  const table = buildReferenceTable(answer.grammar, answer.mode)
  const expected = normalizeTrace(simulateLR(table, augmentedGrammar, answer.input))
  const actual = normalizeTrace(answer.trace)

  if (expected.length !== actual.length) {
    return fail('TRACE_LENGTH_MISMATCH', 'Trace length does not match the reference simulation', {
      expected: expected.length,
      actual: actual.length,
    })
  }

  for (let index = 0; index < expected.length; index += 1) {
    if (JSON.stringify(expected[index]) !== JSON.stringify(actual[index])) {
      return fail('TRACE_MISMATCH', `Trace step ${index} does not match the reference simulation`, {
        expected: expected[index],
        actual: actual[index],
      })
    }
  }

  return pass('LR trace is correct')
}

function buildReferenceTable(grammar: Grammar, mode: LRMode): LRTable {
  const { dfa, augmentedGrammar } = buildCanonicalCollection(grammar)
  if (mode === LRMode.LR0) {
    return buildTable(dfa, augmentedGrammar, 'LR0')
  }

  const first = computeFirst(augmentedGrammar)
  const follow = computeFollow(augmentedGrammar, first)
  return buildTable(dfa, augmentedGrammar, 'SLR1', follow)
}

function validateGrammar(grammar: Grammar): string | null {
  if (!grammar.startSymbol.trim()) return 'Start symbol is required.'
  if (!grammar.nonTerminals.length) return 'At least one non-terminal is required.'
  if (!grammar.terminals.length) return 'At least one terminal is required.'
  if (!grammar.productions.length) return 'At least one production is required.'
  if (!grammar.nonTerminals.includes(grammar.startSymbol)) {
    return 'Start symbol must be listed in non-terminals.'
  }

  const nonTerminalSet = new Set(grammar.nonTerminals)
  const terminalSet = new Set(grammar.terminals)
  for (const symbol of grammar.nonTerminals) {
    if (terminalSet.has(symbol)) {
      return `Symbol "${symbol}" cannot be both terminal and non-terminal.`
    }
  }

  for (const production of grammar.productions) {
    if (!nonTerminalSet.has(production.left)) {
      return `Production left side "${production.left}" must be a known non-terminal.`
    }
    if (!production.right.length) {
      return `Production ${production.left} must have a non-empty right side.`
    }

    for (const symbol of production.right) {
      if (!nonTerminalSet.has(symbol) && !terminalSet.has(symbol) && symbol !== '@') {
        return `Symbol "${symbol}" in production ${production.left} is undefined.`
      }
    }
  }

  return null
}

function normalizeGrammar(grammar: Grammar): Grammar {
  return {
    startSymbol: grammar.startSymbol,
    nonTerminals: Array.from(new Set(grammar.nonTerminals)).sort(),
    terminals: Array.from(new Set(grammar.terminals)).sort(),
    productions: grammar.productions
      .map(production => ({
        left: production.left,
        right: [...production.right],
      }))
      .sort((left, right) => stringifyProduction(left).localeCompare(stringifyProduction(right))),
  }
}

function normalizeAutomaton(automaton: LRAutomaton) {
  const stateKeyById = new Map(
    automaton.states.map(state => [state.id, normalizeItems(state.items).join(' || ')]),
  )

  return {
    states: automaton.states
      .map(state => ({
        key: stateKeyById.get(state.id) ?? state.id,
        accepting: Boolean(state.isAccepting),
      }))
      .sort((left, right) => left.key.localeCompare(right.key)),
    transitions: automaton.transitions
      .map(transition => ({
        source: stateKeyById.get(transition.source) ?? transition.source,
        target: stateKeyById.get(transition.target) ?? transition.target,
        label: transition.label,
      }))
      .sort((left, right) =>
        `${left.source}|${left.label}|${left.target}`.localeCompare(
          `${right.source}|${right.label}|${right.target}`,
        ),
      ),
  }
}

function normalizeItems(items: LRItem[]): string[] {
  return items.map(stringifyItem).sort()
}

function stringifyItem(item: LRItem): string {
  const rhs = [...item.rhs]
  rhs.splice(item.dotPosition, 0, '•')
  return `${item.lhs} -> ${rhs.join(' ')}`
}

function stringifyProduction(production: Grammar['productions'][number]): string {
  return `${production.left} -> ${production.right.join(' ')}`
}

function normalizeTable(table: LRTable) {
  const terminals = Array.from(new Set(table.terminals)).sort()
  const nonTerminals = Array.from(new Set(table.nonTerminals)).sort()
  const stateIds = Array.from(
    new Set([...Object.keys(table.action), ...Object.keys(table.goto)]),
  ).sort((left, right) => Number(left) - Number(right))

  return {
    terminals,
    nonTerminals,
    action: Object.fromEntries(
      stateIds.map(stateId => [
        stateId,
        Object.fromEntries(
          terminals.map(terminal => [terminal, stringifyAction(table.action[stateId]?.[terminal])]),
        ),
      ]),
    ),
    goto: Object.fromEntries(
      stateIds.map(stateId => [
        stateId,
        Object.fromEntries(
          nonTerminals.map(nonTerminal => [nonTerminal, table.goto[stateId]?.[nonTerminal] ?? '']),
        ),
      ]),
    ),
  }
}

function stringifyAction(action?: LRTable['action'][string][string]): string {
  if (!action) return ''
  if (action.type === ActionType.ACCEPT) return 'acc'
  return `${action.type}${action.value ?? ''}`
}

function normalizeTrace(trace: LRParserStep[]) {
  return trace.map(step => ({
    stepIndex: step.stepIndex,
    stateStack: [...step.stateStack],
    symbolStack: [...step.symbolStack],
    inputString: step.inputString.trim(),
    action: step.action.trim(),
    popCount: step.popCount,
    pushSymbol: step.pushSymbol ?? null,
    pushState: step.pushState ?? null,
  }))
}

function pass(message: string, diagnostics?: Record<string, unknown>): LRJudgeResult {
  return { pass: true, reasonCode: 'PASS', message, diagnostics }
}

function fail(
  reasonCode: string,
  message: string,
  diagnostics?: Record<string, unknown>,
): LRJudgeResult {
  return { pass: false, reasonCode, message, diagnostics }
}
