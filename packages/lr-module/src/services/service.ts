import axios, { type AxiosInstance } from 'axios'
import { evaluateLRTask } from '@repo/lr-service'
import {
  LRMode,
  type Grammar,
  type LRJudgeRequest,
  type LRJudgeResult,
  type LRParserStep,
  LRTaskType,
  type LRTable,
  type LRAutomaton,
} from '@repo/shared-types'

export interface LRJudgeService {
  submitGrammarCheck(grammar: Grammar, augmentedGrammar: Grammar): Promise<LRJudgeResult>
  submitDfaIsomorphism(grammar: Grammar, automaton: LRAutomaton): Promise<LRJudgeResult>
  submitTableCheck(grammar: Grammar, mode: LRMode, table: LRTable): Promise<LRJudgeResult>
  submitTraceMatch(
    grammar: Grammar,
    mode: LRMode,
    input: string,
    trace: LRParserStep[],
  ): Promise<LRJudgeResult>
}

export function createLocalLRJudgeService(): LRJudgeService {
  return {
    async submitGrammarCheck(grammar, augmentedGrammar) {
      return evaluateLRTask({
        taskType: LRTaskType.GRAMMAR_CHECK,
        answer: { grammar, augmentedGrammar },
      } satisfies LRJudgeRequest<LRTaskType.GRAMMAR_CHECK>)
    },
    async submitDfaIsomorphism(grammar, automaton) {
      return evaluateLRTask({
        taskType: LRTaskType.LR_DFA_ISOMORPHISM,
        answer: { grammar, automaton },
      } satisfies LRJudgeRequest<LRTaskType.LR_DFA_ISOMORPHISM>)
    },
    async submitTableCheck(grammar, mode, table) {
      const taskType =
        mode === LRMode.SLR1 ? LRTaskType.SLR1_TABLE_CHECK : LRTaskType.TABLE_CELL_MATCH
      return evaluateLRTask({
        taskType,
        answer: { grammar, mode, table },
      } satisfies LRJudgeRequest<typeof taskType>)
    },
    async submitTraceMatch(grammar, mode, input, trace) {
      return evaluateLRTask({
        taskType: LRTaskType.TRACE_MATCH,
        answer: { grammar, mode, input, trace },
      } satisfies LRJudgeRequest<LRTaskType.TRACE_MATCH>)
    },
  }
}

export function createHttpLRJudgeService(
  baseURL: string,
  client: AxiosInstance = axios.create({ baseURL }),
): LRJudgeService {
  return {
    async submitGrammarCheck(grammar, augmentedGrammar) {
      const { data } = await client.post<LRJudgeResult>('/lr/judge', {
        taskType: LRTaskType.GRAMMAR_CHECK,
        answer: { grammar, augmentedGrammar },
      } satisfies LRJudgeRequest<LRTaskType.GRAMMAR_CHECK>)
      return data
    },
    async submitDfaIsomorphism(grammar, automaton) {
      const { data } = await client.post<LRJudgeResult>('/lr/judge', {
        taskType: LRTaskType.LR_DFA_ISOMORPHISM,
        answer: { grammar, automaton },
      } satisfies LRJudgeRequest<LRTaskType.LR_DFA_ISOMORPHISM>)
      return data
    },
    async submitTableCheck(grammar, mode, table) {
      const taskType =
        mode === LRMode.SLR1 ? LRTaskType.SLR1_TABLE_CHECK : LRTaskType.TABLE_CELL_MATCH
      const { data } = await client.post<LRJudgeResult>('/lr/judge', {
        taskType,
        answer: { grammar, mode, table },
      } satisfies LRJudgeRequest<typeof taskType>)
      return data
    },
    async submitTraceMatch(grammar, mode, input, trace) {
      const { data } = await client.post<LRJudgeResult>('/lr/judge', {
        taskType: LRTaskType.TRACE_MATCH,
        answer: { grammar, mode, input, trace },
      } satisfies LRJudgeRequest<LRTaskType.TRACE_MATCH>)
      return data
    },
  }
}

export const lrJudgeService = createLocalLRJudgeService()
