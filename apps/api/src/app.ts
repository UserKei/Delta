import { Elysia } from 'elysia'
import {
  FAPartitionAnswer,
  FAJudgeRequest,
  FATaskType,
  FASubsetTableAnswer,
  FiniteAutomata,
} from '@repo/shared-types'
import {
  evaluateFATask,
  isFiniteAutomataLike,
  isPartitionAnswerLike,
  isSubsetTableAnswerLike,
  validateRegex,
} from '@repo/fa-service'

export const app = new Elysia()
  .get('/', () => 'FA judge API')
  .post('/fa/judge', ({ body, set }) => {
    if (!isFAJudgeRequestBody(body)) {
      set.status = 400
      return {
        pass: false,
        reasonCode: 'INVALID_REQUEST',
        message: 'Request body does not match the FA judge protocol',
      }
    }

    const regexValidation = validateRegex(body.targetRegex)
    if (!regexValidation.valid) {
      set.status = 400
      return {
        pass: false,
        reasonCode: 'INVALID_REGEX',
        message: regexValidation.message ?? 'Invalid regex',
      }
    }

    return evaluateFATask(body)
  })

function isFAJudgeRequestBody(value: unknown): value is FAJudgeRequest {
  if (!value || typeof value !== 'object') return false

  const candidate = value as Partial<FAJudgeRequest>
  if (!isTaskType(candidate.taskType) || typeof candidate.targetRegex !== 'string') return false

  switch (candidate.taskType) {
    case FATaskType.STRING_EQUIVALENCE:
      return (
        !!candidate.answer &&
        typeof candidate.answer === 'object' &&
        typeof (candidate.answer as { regex?: unknown }).regex === 'string'
      )
    case FATaskType.GRAPH_STRUCTURE:
    case FATaskType.GRAPH_ISOMORPHISM:
    case FATaskType.CANONICAL_ISOMORPHISM:
      return isFiniteAutomataLike(candidate.answer)
    case FATaskType.MATRIX_CONTENT:
      return isSubsetTableAnswerLike(candidate.answer)
    case FATaskType.PARTITION_CHECK:
      return isPartitionAnswerLike(candidate.answer)
  }
}

function isTaskType(value: unknown): value is FATaskType {
  return typeof value === 'string' && Object.values(FATaskType).includes(value as FATaskType)
}

export type { FAJudgeRequest, FiniteAutomata, FASubsetTableAnswer, FAPartitionAnswer }
