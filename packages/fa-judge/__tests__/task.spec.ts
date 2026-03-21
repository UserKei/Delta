import { describe, expect, it } from 'bun:test'
import { AutomatonType, FATaskType } from '@repo/shared-types'
import { buildHopcroftPartitions, minimizeDFA, subsetConstruction, thompson } from '@repo/core'
import { evaluateFATask } from '@/task'
import { buildExpectedSubsetRows } from '@/task-utils'

describe('FA Task Judge', () => {
  it('passes graph structure checks for a Thompson NFA', () => {
    const nfa = thompson('a|b')
    const result = evaluateFATask({
      taskType: FATaskType.GRAPH_STRUCTURE,
      targetRegex: 'a|b',
      answer: nfa,
    })

    expect(result.pass).toBe(true)
  })

  it('fails graph structure checks for a malformed NFA', () => {
    const nfa = thompson('a|b')
    const broken = {
      ...nfa,
      edges: nfa.edges.slice(1),
    }

    const result = evaluateFATask({
      taskType: FATaskType.GRAPH_STRUCTURE,
      targetRegex: 'a|b',
      answer: broken,
    })

    expect(result.pass).toBe(false)
    expect(result.reasonCode).toBe('GRAPH_MISMATCH')
  })

  it('passes subset matrix checks for a correct table', () => {
    const nfa = thompson('a*')
    const rows = Array.from(buildExpectedSubsetRows(subsetConstruction(nfa)).values())
    const result = evaluateFATask({
      taskType: FATaskType.MATRIX_CONTENT,
      targetRegex: 'a*',
      answer: {
        nfa,
        rows,
      },
    })

    expect(result.pass).toBe(true)
  })

  it('fails subset matrix checks for a wrong transition', () => {
    const nfa = thompson('ab')
    const rows = Array.from(buildExpectedSubsetRows(subsetConstruction(nfa)).values())
    rows[0] = {
      ...rows[0],
      transitions: {
        ...rows[0].transitions,
        a: [],
      },
    }

    const result = evaluateFATask({
      taskType: FATaskType.MATRIX_CONTENT,
      targetRegex: 'ab',
      answer: {
        nfa,
        rows,
      },
    })

    expect(result.pass).toBe(false)
    expect(result.reasonCode).toBe('TRANSITION_MISMATCH')
  })

  it('passes DFA isomorphism checks for a correct DFA', () => {
    const dfa = subsetConstruction(thompson('(a|b)*c'))
    const result = evaluateFATask({
      taskType: FATaskType.GRAPH_ISOMORPHISM,
      targetRegex: '(a|b)*c',
      answer: dfa,
    })

    expect(result.pass).toBe(true)
  })

  it('passes partition checks for a correct Hopcroft partition', () => {
    const dfa = subsetConstruction(thompson('a*'))
    const result = evaluateFATask({
      taskType: FATaskType.PARTITION_CHECK,
      targetRegex: 'a*',
      answer: {
        dfa,
        partitions: buildHopcroftPartitions(dfa),
      },
    })

    expect(result.pass).toBe(true)
  })

  it('fails partition checks for an incorrect partition', () => {
    const dfa = subsetConstruction(thompson('ab'))
    const result = evaluateFATask({
      taskType: FATaskType.PARTITION_CHECK,
      targetRegex: 'ab',
      answer: {
        dfa,
        partitions: [dfa.nodes.map(node => node.id)],
      },
    })

    expect(result.pass).toBe(false)
    expect(result.reasonCode).toBe('PARTITION_MISMATCH')
  })

  it('passes canonical minimal DFA checks for a correct minimal DFA', () => {
    const minDfa = minimizeDFA(subsetConstruction(thompson('(a|b)*c')))
    const result = evaluateFATask({
      taskType: FATaskType.CANONICAL_ISOMORPHISM,
      targetRegex: '(a|b)*c',
      answer: minDfa,
    })

    expect(result.pass).toBe(true)
  })

  it('fails canonical minimal DFA checks for a non-minimal DFA', () => {
    const minDfa = minimizeDFA(subsetConstruction(thompson('a')))
    const nonMinimal = {
      ...minDfa,
      nodes: [
        ...minDfa.nodes,
        {
          id: 'dead',
          label: '{dead}',
          isStart: false,
          isEnd: false,
        },
      ],
      edges: [...minDfa.edges],
      alphabet: [...minDfa.alphabet],
    }
    const result = evaluateFATask({
      taskType: FATaskType.CANONICAL_ISOMORPHISM,
      targetRegex: 'a',
      answer: {
        ...nonMinimal,
        type: AutomatonType.MIN_DFA,
      },
    })

    expect(result.pass).toBe(false)
    expect(result.reasonCode).toBe('NOT_MINIMAL')
  })

  it('fails invalid regex before dispatching to a checker', () => {
    const result = evaluateFATask({
      taskType: FATaskType.GRAPH_STRUCTURE,
      targetRegex: '(ab',
      answer: thompson('ab'),
    })

    expect(result.pass).toBe(false)
    expect(result.reasonCode).toBe('INVALID_REGEX')
  })
})
