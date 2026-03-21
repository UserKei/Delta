import { describe, expect, it } from 'bun:test'
import { LL1TaskType, type Grammar } from '@repo/shared-types'
import { evaluateLL1Task } from '../src/task'

const grammar: Grammar = {
  startSymbol: 'S',
  nonTerminals: ['S', 'A'],
  terminals: ['a', 'b'],
  productions: [
    { left: 'S', right: ['a', 'A'] },
    { left: 'A', right: ['b'] },
  ],
}

describe('LL1 Task Judge', () => {
  it('passes grammar validity checks for a well-formed grammar', () => {
    const result = evaluateLL1Task({
      taskType: LL1TaskType.GRAMMAR_VALIDITY,
      answer: grammar,
    })

    expect(result.pass).toBe(true)
  })

  it('passes set equality checks for correct First/Follow sets', () => {
    const first = {
      S: ['a'],
      A: ['b'],
    }
    const follow = {
      S: ['$'],
      A: ['$'],
    }
    const result = evaluateLL1Task({
      taskType: LL1TaskType.SET_EQUALITY,
      answer: { grammar, first, follow },
    })

    expect(result.pass).toBe(true)
  })

  it('passes table cell match checks for a correct LL(1) table', () => {
    const first = {
      S: ['a'],
      A: ['b'],
    }
    const follow = {
      S: ['$'],
      A: ['$'],
    }
    const table = {
      terminals: ['a', 'b', '$'],
      nonTerminals: ['S', 'A'],
      table: {
        S: {
          a: JSON.stringify(grammar.productions[0]),
          b: '',
          $: '',
        },
        A: {
          a: '',
          b: JSON.stringify(grammar.productions[1]),
          $: '',
        },
      },
    }
    const result = evaluateLL1Task({
      taskType: LL1TaskType.TABLE_CELL_MATCH,
      answer: { grammar, first, follow, table },
    })

    expect(result.pass).toBe(true)
  })

  it('passes trace match checks for a correct LL(1) trace', () => {
    const table = {
      terminals: ['a', 'b', '$'],
      nonTerminals: ['S', 'A'],
      table: {
        S: {
          a: JSON.stringify(grammar.productions[0]),
          b: '',
          $: '',
        },
        A: {
          a: '',
          b: JSON.stringify(grammar.productions[1]),
          $: '',
        },
      },
    }
    const trace = [
      {
        stepIndex: 0,
        stack: ['$', 'S'],
        inputString: 'a b $',
        action: 'Output S -> a A',
        popSymbol: 'S',
        pushSymbols: ['a', 'A'],
      },
      {
        stepIndex: 1,
        stack: ['$', 'A', 'a'],
        inputString: 'a b $',
        action: 'Match a',
        popSymbol: 'a',
      },
      {
        stepIndex: 2,
        stack: ['$', 'A'],
        inputString: 'b $',
        action: 'Output A -> b',
        popSymbol: 'A',
        pushSymbols: ['b'],
      },
      {
        stepIndex: 3,
        stack: ['$', 'b'],
        inputString: 'b $',
        action: 'Match b',
        popSymbol: 'b',
      },
      {
        stepIndex: 4,
        stack: ['$'],
        inputString: '$',
        action: 'Accept',
      },
    ]
    const result = evaluateLL1Task({
      taskType: LL1TaskType.TRACE_MATCH,
      answer: { grammar, table, input: 'a b', trace },
    })

    expect(result.pass).toBe(true)
  })

  it('fails set equality checks for wrong Follow sets', () => {
    const first = {
      S: ['a'],
      A: ['b'],
    }
    const follow = {
      S: ['$'],
      A: ['$'],
    }
    const result = evaluateLL1Task({
      taskType: LL1TaskType.SET_EQUALITY,
      answer: { grammar, first, follow: { ...follow, A: [] } },
    })

    expect(result.pass).toBe(false)
    expect(result.reasonCode).toBe('FOLLOW_MISMATCH')
  })
})
