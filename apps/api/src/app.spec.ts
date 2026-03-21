import { describe, expect, it } from 'bun:test'
import { FATaskType } from '../../../packages/shared-types/src'
import { thompson } from '../../../packages/core/src/fa/nfa/thompson'
import { app } from './app'

describe('FA judge API', () => {
  it('handles a successful judge request', async () => {
    const response = await app.handle(
      new Request('http://localhost/fa/judge', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          taskType: FATaskType.GRAPH_STRUCTURE,
          targetRegex: 'a',
          answer: thompson('a'),
        }),
      }),
    )

    expect(response.status).toBe(200)
    expect(await response.json()).toMatchObject({ pass: true, reasonCode: 'PASS' })
  })

  it('rejects an invalid task type', async () => {
    const response = await app.handle(
      new Request('http://localhost/fa/judge', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          taskType: 'BAD_TASK',
          targetRegex: 'a',
          answer: thompson('a'),
        }),
      }),
    )

    expect(response.status).toBe(400)
    expect(await response.json()).toMatchObject({ pass: false, reasonCode: 'INVALID_REQUEST' })
  })

  it('rejects an invalid answer payload', async () => {
    const response = await app.handle(
      new Request('http://localhost/fa/judge', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          taskType: FATaskType.GRAPH_STRUCTURE,
          targetRegex: 'a',
          answer: { broken: true },
        }),
      }),
    )

    expect(response.status).toBe(400)
    expect(await response.json()).toMatchObject({ pass: false, reasonCode: 'INVALID_REQUEST' })
  })

  it('rejects an invalid regex', async () => {
    const response = await app.handle(
      new Request('http://localhost/fa/judge', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          taskType: FATaskType.GRAPH_STRUCTURE,
          targetRegex: '(a',
          answer: thompson('a'),
        }),
      }),
    )

    expect(response.status).toBe(400)
    expect(await response.json()).toMatchObject({ pass: false, reasonCode: 'INVALID_REGEX' })
  })
})
