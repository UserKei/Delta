import { describe, expect, it } from 'bun:test'
import { LRMode, LRTaskType, type Grammar } from '@repo/shared-types'
import { evaluateLRTask } from '../src/task'

const grammar: Grammar = {
  startSymbol: 'S',
  nonTerminals: ['S'],
  terminals: ['a'],
  productions: [{ left: 'S', right: ['a'] }],
}

const augmentedGrammar: Grammar = {
  startSymbol: "S'",
  nonTerminals: ["S'", 'S'],
  terminals: ['a'],
  productions: [
    { left: "S'", right: ['S'] },
    { left: 'S', right: ['a'] },
  ],
}

const automaton = {
  states: [
    {
      id: '0',
      items: [
        { lhs: "S'", rhs: ['S'], dotPosition: 0 },
        { lhs: 'S', rhs: ['a'], dotPosition: 0 },
      ],
      isAccepting: false,
    },
    {
      id: '1',
      items: [{ lhs: 'S', rhs: ['a'], dotPosition: 1 }],
      isAccepting: false,
    },
    {
      id: '2',
      items: [{ lhs: "S'", rhs: ['S'], dotPosition: 1 }],
      isAccepting: true,
    },
  ],
  transitions: [
    { source: '0', target: '1', label: 'a' },
    { source: '0', target: '2', label: 'S' },
  ],
}

const lr0Table = {
  terminals: ['a', '$'],
  nonTerminals: ['S'],
  action: {
    '0': { a: { type: 's', value: '1' } },
    '1': { a: { type: 'r', value: 1 }, $: { type: 'r', value: 1 } },
    '2': { $: { type: 'acc' } },
  },
  goto: {
    '0': { S: '2' },
    '1': {},
    '2': {},
  },
}

const slr1Table = {
  terminals: ['a', '$'],
  nonTerminals: ['S'],
  action: {
    '0': { a: { type: 's', value: '1' } },
    '1': { $: { type: 'r', value: 1 } },
    '2': { $: { type: 'acc' } },
  },
  goto: {
    '0': { S: '2' },
    '1': {},
    '2': {},
  },
}

const trace = [
  {
    stepIndex: 0,
    stateStack: ['0'],
    symbolStack: ['$'],
    inputString: 'a $',
    action: 'Shift 1',
    popCount: 0,
    pushSymbol: 'a',
    pushState: '1',
  },
  {
    stepIndex: 1,
    stateStack: ['0', '1'],
    symbolStack: ['$', 'a'],
    inputString: '$',
    action: 'Reduce S -> a',
    popCount: 1,
    pushSymbol: 'S',
    pushState: '2',
  },
  {
    stepIndex: 2,
    stateStack: ['0', '2'],
    symbolStack: ['$', 'S'],
    inputString: '$',
    action: 'Accept',
    popCount: 0,
  },
]

describe('LR Task Judge', () => {
  it('passes grammar augmentation checks', () => {
    const result = evaluateLRTask({
      taskType: LRTaskType.GRAMMAR_CHECK,
      answer: { grammar, augmentedGrammar },
    })
    expect(result.pass).toBe(true)
  })

  it('passes canonical collection checks', () => {
    const result = evaluateLRTask({
      taskType: LRTaskType.LR_DFA_ISOMORPHISM,
      answer: { grammar, automaton },
    })
    expect(result.pass).toBe(true)
  })

  it('passes LR(0) table checks', () => {
    const result = evaluateLRTask({
      taskType: LRTaskType.TABLE_CELL_MATCH,
      answer: { grammar, mode: LRMode.LR0, table: lr0Table },
    })
    expect(result.pass).toBe(true)
  })

  it('passes SLR(1) table checks', () => {
    const result = evaluateLRTask({
      taskType: LRTaskType.SLR1_TABLE_CHECK,
      answer: { grammar, mode: LRMode.SLR1, table: slr1Table },
    })
    expect(result.pass).toBe(true)
  })

  it('passes trace checks', () => {
    const result = evaluateLRTask({
      taskType: LRTaskType.TRACE_MATCH,
      answer: { grammar, mode: LRMode.LR0, input: 'a', trace },
    })
    expect(result.pass).toBe(true)
  })
})
