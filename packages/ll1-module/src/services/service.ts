import axios, { type AxiosInstance } from 'axios'
import { evaluateLL1Task } from '@repo/ll1-service'
import {
  type Grammar,
  type GrammarSet,
  type LL1JudgeRequest,
  type LL1JudgeResult,
  LL1TaskType,
  type LL1ParserStep,
  type LL1Table,
} from '@repo/shared-types'

export interface LL1JudgeService {
  submitGrammarValidity(grammar: Grammar): Promise<LL1JudgeResult>
  submitSetEquality(
    grammar: Grammar,
    first: GrammarSet,
    follow: GrammarSet,
  ): Promise<LL1JudgeResult>
  submitTableCellMatch(
    grammar: Grammar,
    first: GrammarSet,
    follow: GrammarSet,
    table: LL1Table,
  ): Promise<LL1JudgeResult>
  submitTraceMatch(
    grammar: Grammar,
    input: string,
    table: LL1Table,
    trace: LL1ParserStep[],
  ): Promise<LL1JudgeResult>
}

export function createLocalLL1JudgeService(): LL1JudgeService {
  return {
    async submitGrammarValidity(grammar) {
      return evaluateLL1Task({
        taskType: LL1TaskType.GRAMMAR_VALIDITY,
        answer: grammar,
      } satisfies LL1JudgeRequest<LL1TaskType.GRAMMAR_VALIDITY>)
    },
    async submitSetEquality(grammar, first, follow) {
      return evaluateLL1Task({
        taskType: LL1TaskType.SET_EQUALITY,
        answer: { grammar, first, follow },
      } satisfies LL1JudgeRequest<LL1TaskType.SET_EQUALITY>)
    },
    async submitTableCellMatch(grammar, first, follow, table) {
      return evaluateLL1Task({
        taskType: LL1TaskType.TABLE_CELL_MATCH,
        answer: { grammar, first, follow, table },
      } satisfies LL1JudgeRequest<LL1TaskType.TABLE_CELL_MATCH>)
    },
    async submitTraceMatch(grammar, input, table, trace) {
      return evaluateLL1Task({
        taskType: LL1TaskType.TRACE_MATCH,
        answer: { grammar, input, table, trace },
      } satisfies LL1JudgeRequest<LL1TaskType.TRACE_MATCH>)
    },
  }
}

export function createHttpLL1JudgeService(
  baseURL: string,
  client: AxiosInstance = axios.create({ baseURL }),
): LL1JudgeService {
  return {
    async submitGrammarValidity(grammar) {
      const { data } = await client.post<LL1JudgeResult>('/ll1/judge', {
        taskType: LL1TaskType.GRAMMAR_VALIDITY,
        answer: grammar,
      } satisfies LL1JudgeRequest<LL1TaskType.GRAMMAR_VALIDITY>)
      return data
    },
    async submitSetEquality(grammar, first, follow) {
      const { data } = await client.post<LL1JudgeResult>('/ll1/judge', {
        taskType: LL1TaskType.SET_EQUALITY,
        answer: { grammar, first, follow },
      } satisfies LL1JudgeRequest<LL1TaskType.SET_EQUALITY>)
      return data
    },
    async submitTableCellMatch(grammar, first, follow, table) {
      const { data } = await client.post<LL1JudgeResult>('/ll1/judge', {
        taskType: LL1TaskType.TABLE_CELL_MATCH,
        answer: { grammar, first, follow, table },
      } satisfies LL1JudgeRequest<LL1TaskType.TABLE_CELL_MATCH>)
      return data
    },
    async submitTraceMatch(grammar, input, table, trace) {
      const { data } = await client.post<LL1JudgeResult>('/ll1/judge', {
        taskType: LL1TaskType.TRACE_MATCH,
        answer: { grammar, input, table, trace },
      } satisfies LL1JudgeRequest<LL1TaskType.TRACE_MATCH>)
      return data
    },
  }
}

export const ll1JudgeService = createLocalLL1JudgeService()
