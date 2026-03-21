import { buildLL1Table, computeFirst, computeFollow, simulateLL1 } from '@repo/core'
import {
  EOF,
  EPSILON,
  type Grammar,
  type GrammarSet,
  type LL1JudgeRequest,
  type LL1JudgeResult,
  LL1TaskType,
  type LL1Table,
  type LL1ParserStep,
} from '@repo/shared-types'

export function evaluateLL1Task(request: LL1JudgeRequest): LL1JudgeResult {
  switch (request.taskType) {
    case LL1TaskType.GRAMMAR_VALIDITY:
      return checkGrammarValidity(request.answer)
    case LL1TaskType.SET_EQUALITY:
      return checkSetEquality(request.answer)
    case LL1TaskType.TABLE_CELL_MATCH:
      return checkTableCellMatch(request.answer)
    case LL1TaskType.TRACE_MATCH:
      return checkTraceMatch(request.answer)
  }
}

export function checkGrammarValidity(grammar: Grammar): LL1JudgeResult {
  const issue = validateGrammar(grammar)
  if (issue) {
    return fail('INVALID_GRAMMAR', issue)
  }

  return pass('Grammar definition is valid')
}

export function checkSetEquality(
  answer: LL1JudgeRequest<LL1TaskType.SET_EQUALITY>['answer'],
): LL1JudgeResult {
  const grammarCheck = checkGrammarValidity(answer.grammar)
  if (!grammarCheck.pass) {
    return grammarCheck
  }

  const expectedFirst = normalizeGrammarSet(computeFirst(answer.grammar))
  const expectedFollow = normalizeGrammarSet(
    computeFollow(answer.grammar, computeFirst(answer.grammar)),
  )
  const actualFirst = normalizeGrammarSet(answer.first)
  const actualFollow = normalizeGrammarSet(answer.follow)

  if (!areGrammarSetsEqual(expectedFirst, actualFirst)) {
    return fail('FIRST_MISMATCH', 'Submitted First sets do not match the reference result', {
      expected: expectedFirst,
      actual: actualFirst,
    })
  }

  if (!areGrammarSetsEqual(expectedFollow, actualFollow)) {
    return fail('FOLLOW_MISMATCH', 'Submitted Follow sets do not match the reference result', {
      expected: expectedFollow,
      actual: actualFollow,
    })
  }

  return pass('First and Follow sets are correct')
}

export function checkTableCellMatch(
  answer: LL1JudgeRequest<LL1TaskType.TABLE_CELL_MATCH>['answer'],
): LL1JudgeResult {
  const setCheck = checkSetEquality({
    grammar: answer.grammar,
    first: answer.first,
    follow: answer.follow,
  })
  if (!setCheck.pass) {
    return fail('INVALID_SETS', 'Parsing table references incorrect First/Follow sets', {
      sourceFailure: setCheck.reasonCode,
    })
  }

  let expectedTable: LL1Table
  try {
    expectedTable = buildLL1Table(
      answer.grammar,
      computeFirst(answer.grammar),
      computeFollow(answer.grammar, computeFirst(answer.grammar)),
    )
  } catch (error) {
    return fail(
      'TABLE_CONFLICT',
      error instanceof Error ? error.message : 'Reference LL(1) table has conflicts',
    )
  }

  const actualTable = normalizeLL1Table(answer.table)
  const normalizedExpected = normalizeLL1Table(expectedTable)

  if (normalizedExpected.terminals.join(',') !== actualTable.terminals.join(',')) {
    return fail(
      'TABLE_HEADER_MISMATCH',
      'Table terminal columns do not match the reference table',
      {
        expected: normalizedExpected.terminals,
        actual: actualTable.terminals,
      },
    )
  }

  if (normalizedExpected.nonTerminals.join(',') !== actualTable.nonTerminals.join(',')) {
    return fail('TABLE_ROW_MISMATCH', 'Table non-terminal rows do not match the reference table', {
      expected: normalizedExpected.nonTerminals,
      actual: actualTable.nonTerminals,
    })
  }

  for (const nonTerminal of normalizedExpected.nonTerminals) {
    for (const terminal of normalizedExpected.terminals) {
      const expectedCell = normalizedExpected.table[nonTerminal]?.[terminal] ?? ''
      const actualCell = actualTable.table[nonTerminal]?.[terminal] ?? ''
      if (expectedCell !== actualCell) {
        return fail(
          'CELL_MISMATCH',
          `Cell [${nonTerminal}, ${terminal}] does not match the reference table`,
          {
            nonTerminal,
            terminal,
            expected: expectedCell,
            actual: actualCell,
          },
        )
      }
    }
  }

  return pass('LL(1) parsing table is correct')
}

export function checkTraceMatch(
  answer: LL1JudgeRequest<LL1TaskType.TRACE_MATCH>['answer'],
): LL1JudgeResult {
  const tableCheck = checkTableCellMatch({
    grammar: answer.grammar,
    first: computeFirst(answer.grammar),
    follow: computeFollow(answer.grammar, computeFirst(answer.grammar)),
    table: answer.table,
  })
  if (!tableCheck.pass) {
    return fail('INVALID_TABLE', 'Trace references an invalid LL(1) table', {
      sourceFailure: tableCheck.reasonCode,
    })
  }

  const expected = normalizeTrace(
    simulateLL1(answer.table, answer.grammar.startSymbol, answer.input),
  )
  const actual = normalizeTrace(answer.trace)

  if (expected.length !== actual.length) {
    return fail('TRACE_LENGTH_MISMATCH', 'Trace length does not match the reference simulation', {
      expected: expected.length,
      actual: actual.length,
    })
  }

  for (let index = 0; index < expected.length; index += 1) {
    const expectedStep = expected[index]
    const actualStep = actual[index]
    if (JSON.stringify(expectedStep) !== JSON.stringify(actualStep)) {
      return fail('TRACE_MISMATCH', `Trace step ${index} does not match the reference simulation`, {
        expected: expectedStep,
        actual: actualStep,
      })
    }
  }

  return pass('LL(1) trace is correct')
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
      if (symbol === EPSILON) continue
      if (!nonTerminalSet.has(symbol) && !terminalSet.has(symbol)) {
        return `Symbol "${symbol}" in production ${production.left} is undefined.`
      }
    }
  }

  return null
}

function normalizeGrammarSet(source: GrammarSet): Record<string, string[]> {
  return Object.fromEntries(
    Object.entries(source)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, value]) => [key, Array.from(new Set<string>(value)).sort()]),
  )
}

function areGrammarSetsEqual(
  left: Record<string, string[]>,
  right: Record<string, string[]>,
): boolean {
  return JSON.stringify(left) === JSON.stringify(right)
}

function normalizeLL1Table(table: LL1Table): LL1Table {
  const normalizedTerminals = Array.from(new Set<string>(table.terminals)).sort((left, right) => {
    if (left === EOF) return 1
    if (right === EOF) return -1
    return left.localeCompare(right)
  })
  const normalizedNonTerminals = Array.from(new Set<string>(table.nonTerminals)).sort()
  const normalizedRows = Object.fromEntries(
    normalizedNonTerminals.map(nonTerminal => [
      nonTerminal,
      Object.fromEntries(
        normalizedTerminals.map(terminal => [
          terminal,
          normalizeCell(table.table[nonTerminal]?.[terminal] ?? ''),
        ]),
      ),
    ]),
  )

  return {
    terminals: normalizedTerminals,
    nonTerminals: normalizedNonTerminals,
    table: normalizedRows,
  }
}

function normalizeCell(value: string): string {
  if (!value.trim()) return ''

  try {
    const production = JSON.parse(value) as Grammar['productions'][number]
    return stringifyProduction(production.left, production.right)
  } catch {
    return value.trim().replace(/\s+/g, ' ')
  }
}

function stringifyProduction(left: string, right: string[]): string {
  return `${left} -> ${right.join(' ')}`
}

function normalizeTrace(trace: LL1ParserStep[]): Array<Record<string, unknown>> {
  return trace.map(step => ({
    stepIndex: step.stepIndex,
    stack: [...step.stack],
    inputString: step.inputString.trim(),
    action: step.action.trim(),
    popSymbol: step.popSymbol ?? null,
    pushSymbols: step.pushSymbols ? [...step.pushSymbols] : null,
  }))
}

function pass(message: string, diagnostics?: Record<string, unknown>): LL1JudgeResult {
  return { pass: true, reasonCode: 'PASS', message, diagnostics }
}

function fail(
  reasonCode: string,
  message: string,
  diagnostics?: Record<string, unknown>,
): LL1JudgeResult {
  return { pass: false, reasonCode, message, diagnostics }
}
