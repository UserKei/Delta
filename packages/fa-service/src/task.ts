import { FATaskType } from '@repo/shared-types'
import type { FAJudgeRequest, FAJudgeResult, FiniteAutomata } from '@repo/shared-types'
import {
  buildHopcroftPartitions,
  checkEquivalence,
  minimizeDFA,
  subsetConstruction,
  thompson,
} from '@repo/core'
import {
  areAutomataIsomorphic,
  buildExpectedSubsetRows,
  buildSubsetAnswerIndex,
  getStateSetKey,
  hasSingleStartNode,
  normalizePartitions,
  usesKnownAlphabet,
  validatePartitionCoverage,
  validateRegex,
} from './task-utils'

export function evaluateFATask(request: FAJudgeRequest): FAJudgeResult {
  const regexValidation = validateRegex(request.targetRegex)
  if (!regexValidation.valid) {
    return fail('INVALID_REGEX', regexValidation.message ?? 'Invalid regex')
  }

  switch (request.taskType) {
    case FATaskType.STRING_EQUIVALENCE:
      return checkStringEquivalence(request.targetRegex, request.answer.regex)
    case FATaskType.GRAPH_STRUCTURE:
      return checkGraphStructure(request.targetRegex, request.answer)
    case FATaskType.MATRIX_CONTENT:
      return checkSubsetMatrix(request.targetRegex, request.answer)
    case FATaskType.GRAPH_ISOMORPHISM:
      return checkDfaIsomorphism(request.targetRegex, request.answer)
    case FATaskType.PARTITION_CHECK:
      return checkPartition(request.targetRegex, request.answer)
    case FATaskType.CANONICAL_ISOMORPHISM:
      return checkCanonicalMinDfa(request.targetRegex, request.answer)
  }
}

export function checkStringEquivalence(targetRegex: string, answerRegex: string): FAJudgeResult {
  const answerValidation = validateRegex(answerRegex)
  if (!answerValidation.valid) {
    return fail('INVALID_ANSWER_REGEX', answerValidation.message ?? 'Invalid answer regex')
  }

  const targetAutomaton = subsetConstruction(thompson(targetRegex))
  const answerAutomaton = subsetConstruction(thompson(answerRegex))
  const equivalence = checkEquivalence(targetAutomaton, answerAutomaton)

  if (!equivalence.equal) {
    return fail('LANGUAGE_MISMATCH', 'Submitted regex is not equivalent to the target regex', {
      counterExample: equivalence.counterExample,
    })
  }

  return pass('Regex is language-equivalent to the target regex')
}

export function checkGraphStructure(targetRegex: string, answer: FiniteAutomata): FAJudgeResult {
  const reference = thompson(targetRegex)

  if (!hasSingleStartNode(answer) || !usesKnownAlphabet(answer)) {
    return fail('INVALID_NFA', 'Submitted NFA is malformed')
  }

  if (!areAutomataIsomorphic(answer, reference)) {
    return fail('GRAPH_MISMATCH', 'NFA structure does not match Thompson construction', {
      expectedNodeCount: reference.nodes.length,
      actualNodeCount: answer.nodes.length,
      expectedEdgeCount: reference.edges.length,
      actualEdgeCount: answer.edges.length,
    })
  }

  return pass('NFA structure matches Thompson construction')
}

export function checkSubsetMatrix(
  targetRegex: string,
  answer: FAJudgeRequest<FATaskType.MATRIX_CONTENT>['answer'],
): FAJudgeResult {
  const nfaCheck = checkGraphStructure(targetRegex, answer.nfa)
  if (!nfaCheck.pass) {
    return fail('INVALID_SOURCE_NFA', 'Subset table references an invalid NFA', {
      sourceFailure: nfaCheck.reasonCode,
    })
  }

  let actualRows
  try {
    actualRows = buildSubsetAnswerIndex(answer)
  } catch (error) {
    return fail('INVALID_TABLE', error instanceof Error ? error.message : 'Invalid subset table')
  }

  const expectedRows = buildExpectedSubsetRows(subsetConstruction(answer.nfa))

  if (actualRows.size !== expectedRows.size) {
    return fail('ROW_COUNT_MISMATCH', 'Subset table has an incorrect number of states', {
      expected: expectedRows.size,
      actual: actualRows.size,
    })
  }

  for (const [stateKey, expectedRow] of expectedRows) {
    const actualRow = actualRows.get(stateKey)
    if (!actualRow) {
      return fail('MISSING_STATE', `Missing subset state {${stateKey}}`, { missingState: stateKey })
    }

    if (actualRow.isStart !== expectedRow.isStart || actualRow.isEnd !== expectedRow.isEnd) {
      return fail(
        'STATE_FLAG_MISMATCH',
        `Incorrect start/end flag for subset state {${stateKey}}`,
        {
          state: stateKey,
        },
      )
    }

    const expectedSymbols = Object.keys(expectedRow.transitions).sort()
    const actualSymbols = Object.keys(actualRow.transitions).sort()
    if (expectedSymbols.join(',') !== actualSymbols.join(',')) {
      return fail('SYMBOL_MISMATCH', `Transition columns mismatch for subset state {${stateKey}}`, {
        state: stateKey,
      })
    }

    for (const symbol of expectedSymbols) {
      const expectedTarget = getStateSetKey(expectedRow.transitions[symbol] ?? [])
      const actualTarget = getStateSetKey(actualRow.transitions[symbol] ?? [])
      if (expectedTarget !== actualTarget) {
        return fail(
          'TRANSITION_MISMATCH',
          `Incorrect transition on "${symbol}" for subset state {${stateKey}}`,
          {
            state: stateKey,
            symbol,
            expected: expectedTarget,
            actual: actualTarget,
          },
        )
      }
    }
  }

  return pass('Subset construction table is correct')
}

export function checkDfaIsomorphism(
  targetRegex: string,
  answer: FAJudgeRequest<FATaskType.GRAPH_ISOMORPHISM>['answer'],
): FAJudgeResult {
  const reference = subsetConstruction(thompson(targetRegex))

  if (!hasSingleStartNode(answer) || !usesKnownAlphabet(answer)) {
    return fail('INVALID_DFA', 'Submitted DFA is malformed')
  }

  if (!areAutomataIsomorphic(answer, reference)) {
    return fail('DFA_MISMATCH', 'DFA graph does not match subset construction result', {
      expectedNodeCount: reference.nodes.length,
      actualNodeCount: answer.nodes.length,
    })
  }

  return pass('DFA graph matches subset construction result')
}

export function checkPartition(
  targetRegex: string,
  answer: FAJudgeRequest<FATaskType.PARTITION_CHECK>['answer'],
): FAJudgeResult {
  const dfaCheck = checkDfaIsomorphism(targetRegex, answer.dfa)
  if (!dfaCheck.pass) {
    return fail('INVALID_SOURCE_DFA', 'Partition answer references an invalid DFA', {
      sourceFailure: dfaCheck.reasonCode,
    })
  }

  if (!validatePartitionCoverage(answer.dfa, answer.partitions)) {
    return fail('INVALID_PARTITION', 'Partition must cover each DFA state exactly once')
  }

  const expectedPartitions = buildHopcroftPartitions(answer.dfa)
    .map(group => getStateSetKey(group))
    .sort()
  const actualPartitions = normalizePartitions(answer)

  if (expectedPartitions.join('|') !== actualPartitions.join('|')) {
    return fail('PARTITION_MISMATCH', 'Partition does not match Hopcroft refinement result', {
      expected: expectedPartitions,
      actual: actualPartitions,
    })
  }

  return pass('Partition matches Hopcroft refinement result')
}

export function checkCanonicalMinDfa(
  targetRegex: string,
  answer: FAJudgeRequest<FATaskType.CANONICAL_ISOMORPHISM>['answer'],
): FAJudgeResult {
  const reference = minimizeDFA(subsetConstruction(thompson(targetRegex)))
  const equivalence = checkEquivalence(answer, reference)

  if (!equivalence.equal) {
    return fail(
      'LANGUAGE_MISMATCH',
      'Submitted minimal DFA is not language-equivalent to the target regex',
      {
        counterExample: equivalence.counterExample,
      },
    )
  }

  if (answer.nodes.length !== reference.nodes.length) {
    return fail('NOT_MINIMAL', 'Submitted DFA is language-equivalent but not minimal', {
      expectedNodeCount: reference.nodes.length,
      actualNodeCount: answer.nodes.length,
    })
  }

  if (!areAutomataIsomorphic(answer, reference)) {
    return fail(
      'MIN_DFA_MISMATCH',
      'Submitted minimal DFA is not isomorphic to the canonical minimal DFA',
    )
  }

  return pass('Minimal DFA is correct')
}

function pass(message: string, diagnostics?: Record<string, unknown>): FAJudgeResult {
  return { pass: true, reasonCode: 'PASS', message, diagnostics }
}

function fail(
  reasonCode: string,
  message: string,
  diagnostics?: Record<string, unknown>,
): FAJudgeResult {
  return { pass: false, reasonCode, message, diagnostics }
}
