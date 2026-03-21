import axios, { type AxiosInstance } from 'axios'
import { evaluateFATask } from '@repo/fa-service'
import {
  FATaskType,
  type FAPartitionAnswer,
  type FAJudgeRequest,
  type FAJudgeResult,
  type FASubsetTableAnswer,
  type FiniteAutomata,
} from '@repo/shared-types'

export interface FAJudgeService {
  submitStringEquivalence(targetRegex: string, regex: string): Promise<FAJudgeResult>
  submitGraphStructure(targetRegex: string, automaton: FiniteAutomata): Promise<FAJudgeResult>
  submitSubsetMatrix(targetRegex: string, answer: FASubsetTableAnswer): Promise<FAJudgeResult>
  submitDfaIsomorphism(targetRegex: string, automaton: FiniteAutomata): Promise<FAJudgeResult>
  submitPartitionCheck(targetRegex: string, answer: FAPartitionAnswer): Promise<FAJudgeResult>
  submitCanonicalMinDfa(targetRegex: string, automaton: FiniteAutomata): Promise<FAJudgeResult>
}

export function createLocalFAJudgeService(): FAJudgeService {
  return {
    async submitStringEquivalence(targetRegex, regex) {
      return evaluateFATask({
        taskType: FATaskType.STRING_EQUIVALENCE,
        targetRegex,
        answer: { regex },
      } satisfies FAJudgeRequest<FATaskType.STRING_EQUIVALENCE>)
    },
    async submitGraphStructure(targetRegex, automaton) {
      return evaluateFATask({
        taskType: FATaskType.GRAPH_STRUCTURE,
        targetRegex,
        answer: automaton,
      } satisfies FAJudgeRequest<FATaskType.GRAPH_STRUCTURE>)
    },
    async submitSubsetMatrix(targetRegex, answer) {
      return evaluateFATask({
        taskType: FATaskType.MATRIX_CONTENT,
        targetRegex,
        answer,
      } satisfies FAJudgeRequest<FATaskType.MATRIX_CONTENT>)
    },
    async submitDfaIsomorphism(targetRegex, automaton) {
      return evaluateFATask({
        taskType: FATaskType.GRAPH_ISOMORPHISM,
        targetRegex,
        answer: automaton,
      } satisfies FAJudgeRequest<FATaskType.GRAPH_ISOMORPHISM>)
    },
    async submitPartitionCheck(targetRegex, answer) {
      return evaluateFATask({
        taskType: FATaskType.PARTITION_CHECK,
        targetRegex,
        answer,
      } satisfies FAJudgeRequest<FATaskType.PARTITION_CHECK>)
    },
    async submitCanonicalMinDfa(targetRegex, automaton) {
      return evaluateFATask({
        taskType: FATaskType.CANONICAL_ISOMORPHISM,
        targetRegex,
        answer: automaton,
      } satisfies FAJudgeRequest<FATaskType.CANONICAL_ISOMORPHISM>)
    },
  }
}

export function createHttpFAJudgeService(
  baseURL: string,
  client: AxiosInstance = axios.create({ baseURL }),
): FAJudgeService {
  return {
    async submitStringEquivalence(targetRegex, regex) {
      const { data } = await client.post<FAJudgeResult>('/fa/judge', {
        taskType: FATaskType.STRING_EQUIVALENCE,
        targetRegex,
        answer: { regex },
      } satisfies FAJudgeRequest<FATaskType.STRING_EQUIVALENCE>)
      return data
    },
    async submitGraphStructure(targetRegex, automaton) {
      const { data } = await client.post<FAJudgeResult>('/fa/judge', {
        taskType: FATaskType.GRAPH_STRUCTURE,
        targetRegex,
        answer: automaton,
      } satisfies FAJudgeRequest<FATaskType.GRAPH_STRUCTURE>)
      return data
    },
    async submitSubsetMatrix(targetRegex, answer) {
      const { data } = await client.post<FAJudgeResult>('/fa/judge', {
        taskType: FATaskType.MATRIX_CONTENT,
        targetRegex,
        answer,
      } satisfies FAJudgeRequest<FATaskType.MATRIX_CONTENT>)
      return data
    },
    async submitDfaIsomorphism(targetRegex, automaton) {
      const { data } = await client.post<FAJudgeResult>('/fa/judge', {
        taskType: FATaskType.GRAPH_ISOMORPHISM,
        targetRegex,
        answer: automaton,
      } satisfies FAJudgeRequest<FATaskType.GRAPH_ISOMORPHISM>)
      return data
    },
    async submitPartitionCheck(targetRegex, answer) {
      const { data } = await client.post<FAJudgeResult>('/fa/judge', {
        taskType: FATaskType.PARTITION_CHECK,
        targetRegex,
        answer,
      } satisfies FAJudgeRequest<FATaskType.PARTITION_CHECK>)
      return data
    },
    async submitCanonicalMinDfa(targetRegex, automaton) {
      const { data } = await client.post<FAJudgeResult>('/fa/judge', {
        taskType: FATaskType.CANONICAL_ISOMORPHISM,
        targetRegex,
        answer: automaton,
      } satisfies FAJudgeRequest<FATaskType.CANONICAL_ISOMORPHISM>)
      return data
    },
  }
}

export const faJudgeService = createLocalFAJudgeService()
