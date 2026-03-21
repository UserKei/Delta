import {
  EPSILON,
  FAEdge,
  FANode,
  FAPartitionAnswer,
  FASubsetTableAnswer,
  FASubsetTableRow,
  FiniteAutomata,
} from '@repo/shared-types'

interface IndexedFA {
  outgoing: Map<string, FAEdge[]>
  incoming: Map<string, FAEdge[]>
  edgeCountByPair: Map<string, number>
}

export function validateRegex(regex: string): { valid: boolean; message?: string } {
  if (typeof regex !== 'string' || regex.length === 0) {
    return { valid: false, message: 'Regex must be a non-empty string' }
  }

  let balance = 0
  let prev: 'start' | 'operand' | 'operator' | 'leftParen' | 'rightParen' | 'star' = 'start'

  for (const char of regex) {
    if (/\s/.test(char)) return { valid: false, message: 'Regex cannot contain whitespace' }

    if (char === '(') {
      if (!['start', 'operator', 'leftParen'].includes(prev)) {
        return { valid: false, message: 'Invalid "(" placement' }
      }
      balance++
      prev = 'leftParen'
      continue
    }

    if (char === ')') {
      if (balance === 0 || !['operand', 'rightParen', 'star'].includes(prev)) {
        return { valid: false, message: 'Invalid ")" placement' }
      }
      balance--
      prev = 'rightParen'
      continue
    }

    if (char === '|' || char === '.') {
      if (!['operand', 'rightParen', 'star'].includes(prev)) {
        return { valid: false, message: `Operator "${char}" is missing a left operand` }
      }
      prev = 'operator'
      continue
    }

    if (char === '*') {
      if (!['operand', 'rightParen', 'star'].includes(prev)) {
        return { valid: false, message: 'Operator "*" is missing an operand' }
      }
      prev = 'star'
      continue
    }

    prev = 'operand'
  }

  if (balance !== 0) return { valid: false, message: 'Unbalanced parentheses' }
  if (['operator', 'leftParen'].includes(prev)) {
    return { valid: false, message: 'Regex cannot end with an operator' }
  }

  return { valid: true }
}

export function normalizeStateSet(stateIds: string[]): string[] {
  return Array.from(new Set(stateIds)).sort()
}

export function getStateSetKey(stateIds: string[]): string {
  return normalizeStateSet(stateIds).join(',')
}

export function areAutomataIsomorphic(left: FiniteAutomata, right: FiniteAutomata): boolean {
  if (left.nodes.length !== right.nodes.length || left.edges.length !== right.edges.length) {
    return false
  }
  if (getAlphabetKey(left) !== getAlphabetKey(right)) return false

  const leftStarts = left.nodes.filter(node => node.isStart)
  const rightStarts = right.nodes.filter(node => node.isStart)
  if (leftStarts.length !== rightStarts.length) return false

  const leftIndex = indexFA(left)
  const rightIndex = indexFA(right)
  const leftById = new Map(left.nodes.map(node => [node.id, node] as const))
  const rightById = new Map(right.nodes.map(node => [node.id, node] as const))
  const leftSignatures = new Map(
    left.nodes.map(node => [node.id, getNodeSignature(node, leftIndex)] as const),
  )
  const rightSignatures = new Map(
    right.nodes.map(node => [node.id, getNodeSignature(node, rightIndex)] as const),
  )

  const nodesBySignature = new Map<string, FANode[]>()
  for (const node of right.nodes) {
    const signature = rightSignatures.get(node.id)!
    const existing = nodesBySignature.get(signature) ?? []
    existing.push(node)
    nodesBySignature.set(signature, existing)
  }

  const mapping = new Map<string, string>()
  const usedRightIds = new Set<string>()

  if (leftStarts.length === 1) {
    const leftStart = leftStarts[0]
    const signature = leftSignatures.get(leftStart.id)!
    const candidates = nodesBySignature.get(signature) ?? []
    if (candidates.length !== 1 || !candidates[0].isStart) return false
    mapping.set(leftStart.id, candidates[0].id)
    usedRightIds.add(candidates[0].id)
  }

  return backtrackIsomorphism(
    left.nodes,
    mapping,
    usedRightIds,
    leftById,
    rightById,
    leftIndex,
    rightIndex,
    leftSignatures,
    rightSignatures,
    nodesBySignature,
  )
}

export function buildSubsetAnswerIndex(answer: FASubsetTableAnswer) {
  const rowMap = new Map<string, FASubsetTableRow>()

  for (const row of answer.rows) {
    const key = getStateSetKey(row.state)
    if (rowMap.has(key)) {
      throw new Error(`Duplicate subset row for state set "${key || '∅'}"`)
    }
    rowMap.set(key, {
      ...row,
      state: normalizeStateSet(row.state),
      transitions: normalizeTransitionMap(row.transitions),
    })
  }

  return rowMap
}

export function normalizePartitions(answer: FAPartitionAnswer): string[] {
  const groups = answer.partitions.map(group => getStateSetKey(group))
  return groups.sort()
}

export function validatePartitionCoverage(dfa: FiniteAutomata, partitions: string[][]): boolean {
  const seen = new Set<string>()
  for (const group of partitions) {
    for (const nodeId of group) {
      if (seen.has(nodeId)) return false
      seen.add(nodeId)
    }
  }
  return dfa.nodes.every(node => seen.has(node.id)) && seen.size === dfa.nodes.length
}

export function buildExpectedSubsetRows(dfa: FiniteAutomata): Map<string, FASubsetTableRow> {
  const rows = new Map<string, FASubsetTableRow>()

  for (const node of dfa.nodes) {
    const state = getStateIdsFromSubsetLabel(node.label)
    const transitions: Record<string, string[]> = {}

    for (const symbol of dfa.alphabet) {
      const edge = dfa.edges.find(item => item.source === node.id && item.label === symbol)
      if (!edge) {
        transitions[symbol] = []
        continue
      }

      const target = dfa.nodes.find(item => item.id === edge.target)
      transitions[symbol] = target ? getStateIdsFromSubsetLabel(target.label) : []
    }

    rows.set(getStateSetKey(state), {
      state,
      isStart: node.isStart,
      isEnd: node.isEnd,
      transitions: normalizeTransitionMap(transitions),
    })
  }

  return rows
}

function getAlphabetKey(fa: FiniteAutomata): string {
  return Array.from(new Set(fa.alphabet)).sort().join(',')
}

function normalizeTransitionMap(transitions: Record<string, string[]>): Record<string, string[]> {
  return Object.fromEntries(
    Object.entries(transitions)
      .map(([symbol, stateIds]) => [symbol, normalizeStateSet(stateIds)] as const)
      .sort(([left], [right]) => left.localeCompare(right)),
  )
}

function getStateIdsFromSubsetLabel(label: string): string[] {
  if (!label.startsWith('{') || !label.endsWith('}')) return []
  const content = label.slice(1, -1)
  if (!content) return []
  return normalizeStateSet(content.split(',').filter(Boolean))
}

function indexFA(fa: FiniteAutomata): IndexedFA {
  const outgoing = new Map<string, FAEdge[]>()
  const incoming = new Map<string, FAEdge[]>()
  const edgeCountByPair = new Map<string, number>()

  for (const node of fa.nodes) {
    outgoing.set(node.id, [])
    incoming.set(node.id, [])
  }

  for (const edge of fa.edges) {
    outgoing.get(edge.source)?.push(edge)
    incoming.get(edge.target)?.push(edge)
    const pairKey = `${edge.source}|${edge.target}|${edge.label}`
    edgeCountByPair.set(pairKey, (edgeCountByPair.get(pairKey) ?? 0) + 1)
  }

  return { outgoing, incoming, edgeCountByPair }
}

function getNodeSignature(node: FANode, indexed: IndexedFA): string {
  const outKey = getEdgeHistogramKey(indexed.outgoing.get(node.id) ?? [])
  const inKey = getEdgeHistogramKey(indexed.incoming.get(node.id) ?? [])
  return [
    node.isStart ? 'S' : 'N',
    node.isEnd ? 'E' : 'M',
    outKey,
    inKey,
    (indexed.outgoing.get(node.id) ?? []).length,
    (indexed.incoming.get(node.id) ?? []).length,
  ].join('|')
}

function getEdgeHistogramKey(edges: FAEdge[]): string {
  const histogram = new Map<string, number>()
  for (const edge of edges) {
    const key = edge.label
    histogram.set(key, (histogram.get(key) ?? 0) + 1)
  }

  if (histogram.size === 0) return '[]'
  return Array.from(histogram.entries())
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, count]) => `${key}x${count}`)
    .join(',')
}

function backtrackIsomorphism(
  leftNodes: FANode[],
  mapping: Map<string, string>,
  usedRightIds: Set<string>,
  leftById: Map<string, FANode>,
  rightById: Map<string, FANode>,
  leftIndex: IndexedFA,
  rightIndex: IndexedFA,
  leftSignatures: Map<string, string>,
  rightSignatures: Map<string, string>,
  nodesBySignature: Map<string, FANode[]>,
): boolean {
  if (mapping.size === leftNodes.length) {
    return edgeCountsMatch(mapping, leftIndex, rightIndex)
  }

  const nextLeftNode = pickNextLeftNode(
    leftNodes,
    mapping,
    leftSignatures,
    nodesBySignature,
    usedRightIds,
  )
  if (!nextLeftNode) return false

  const signature = leftSignatures.get(nextLeftNode.id)!
  const candidates = (nodesBySignature.get(signature) ?? []).filter(
    node => !usedRightIds.has(node.id),
  )

  for (const candidate of candidates) {
    if (!nodeFlagsMatch(nextLeftNode, candidate)) continue

    mapping.set(nextLeftNode.id, candidate.id)
    usedRightIds.add(candidate.id)

    if (
      isPartialMappingConsistent(
        mapping,
        leftById,
        rightById,
        leftIndex,
        rightIndex,
        leftSignatures,
        rightSignatures,
      ) &&
      backtrackIsomorphism(
        leftNodes,
        mapping,
        usedRightIds,
        leftById,
        rightById,
        leftIndex,
        rightIndex,
        leftSignatures,
        rightSignatures,
        nodesBySignature,
      )
    ) {
      return true
    }

    mapping.delete(nextLeftNode.id)
    usedRightIds.delete(candidate.id)
  }

  return false
}

function pickNextLeftNode(
  leftNodes: FANode[],
  mapping: Map<string, string>,
  leftSignatures: Map<string, string>,
  nodesBySignature: Map<string, FANode[]>,
  usedRightIds: Set<string>,
): FANode | null {
  let best: FANode | null = null
  let bestCandidateCount = Number.POSITIVE_INFINITY

  for (const node of leftNodes) {
    if (mapping.has(node.id)) continue
    const signature = leftSignatures.get(node.id)!
    const candidateCount = (nodesBySignature.get(signature) ?? []).filter(
      candidate => !usedRightIds.has(candidate.id),
    ).length

    if (candidateCount < bestCandidateCount) {
      best = node
      bestCandidateCount = candidateCount
    }
  }

  return best
}

function nodeFlagsMatch(left: FANode, right: FANode): boolean {
  return left.isStart === right.isStart && left.isEnd === right.isEnd
}

function isPartialMappingConsistent(
  mapping: Map<string, string>,
  leftById: Map<string, FANode>,
  rightById: Map<string, FANode>,
  leftIndex: IndexedFA,
  rightIndex: IndexedFA,
  leftSignatures: Map<string, string>,
  rightSignatures: Map<string, string>,
): boolean {
  for (const [leftId, rightId] of mapping) {
    const leftNode = leftById.get(leftId)
    const rightNode = rightById.get(rightId)
    if (!leftNode || !rightNode) return false
    if (leftSignatures.get(leftId) !== rightSignatures.get(rightId)) return false

    for (const edge of leftIndex.outgoing.get(leftId) ?? []) {
      const mappedTarget = mapping.get(edge.target)
      if (!mappedTarget) continue

      const pairKey = `${rightId}|${mappedTarget}|${edge.label}`
      const leftCount =
        leftIndex.edgeCountByPair.get(`${edge.source}|${edge.target}|${edge.label}`) ?? 0
      const rightCount = rightIndex.edgeCountByPair.get(pairKey) ?? 0
      if (leftCount !== rightCount) return false
    }

    for (const edge of leftIndex.incoming.get(leftId) ?? []) {
      const mappedSource = mapping.get(edge.source)
      if (!mappedSource) continue

      const pairKey = `${mappedSource}|${rightId}|${edge.label}`
      const leftCount =
        leftIndex.edgeCountByPair.get(`${edge.source}|${edge.target}|${edge.label}`) ?? 0
      const rightCount = rightIndex.edgeCountByPair.get(pairKey) ?? 0
      if (leftCount !== rightCount) return false
    }
  }

  return true
}

function edgeCountsMatch(
  mapping: Map<string, string>,
  leftIndex: IndexedFA,
  rightIndex: IndexedFA,
): boolean {
  for (const [pairKey, count] of leftIndex.edgeCountByPair) {
    const [source, target, label] = pairKey.split('|')
    const mappedSource = mapping.get(source)
    const mappedTarget = mapping.get(target)
    if (!mappedSource || !mappedTarget) return false
    if (
      (rightIndex.edgeCountByPair.get(`${mappedSource}|${mappedTarget}|${label}`) ?? 0) !== count
    ) {
      return false
    }
  }
  return true
}

export function isFiniteAutomataLike(value: unknown): value is FiniteAutomata {
  if (!value || typeof value !== 'object') return false
  const candidate = value as Partial<FiniteAutomata>

  return (
    Array.isArray(candidate.nodes) &&
    Array.isArray(candidate.edges) &&
    Array.isArray(candidate.alphabet) &&
    candidate.nodes.every(
      node =>
        node &&
        typeof node.id === 'string' &&
        typeof node.label === 'string' &&
        typeof node.isStart === 'boolean' &&
        typeof node.isEnd === 'boolean',
    ) &&
    candidate.edges.every(
      edge =>
        edge &&
        typeof edge.id === 'string' &&
        typeof edge.source === 'string' &&
        typeof edge.target === 'string' &&
        typeof edge.label === 'string',
    )
  )
}

export function isSubsetTableAnswerLike(value: unknown): value is FASubsetTableAnswer {
  if (!value || typeof value !== 'object') return false
  const candidate = value as Partial<FASubsetTableAnswer>

  return (
    isFiniteAutomataLike(candidate.nfa) &&
    Array.isArray(candidate.rows) &&
    candidate.rows.every(
      row =>
        row &&
        Array.isArray(row.state) &&
        row.state.every(item => typeof item === 'string') &&
        typeof row.isStart === 'boolean' &&
        typeof row.isEnd === 'boolean' &&
        row.transitions &&
        typeof row.transitions === 'object' &&
        Object.values(row.transitions).every(
          stateIds => Array.isArray(stateIds) && stateIds.every(item => typeof item === 'string'),
        ),
    )
  )
}

export function isPartitionAnswerLike(value: unknown): value is FAPartitionAnswer {
  if (!value || typeof value !== 'object') return false
  const candidate = value as Partial<FAPartitionAnswer>

  return (
    isFiniteAutomataLike(candidate.dfa) &&
    Array.isArray(candidate.partitions) &&
    candidate.partitions.every(
      group => Array.isArray(group) && group.every(item => typeof item === 'string'),
    )
  )
}

export function hasSingleStartNode(fa: FiniteAutomata): boolean {
  return fa.nodes.filter(node => node.isStart).length === 1
}

export function usesKnownAlphabet(fa: FiniteAutomata): boolean {
  const alphabet = new Set(fa.alphabet)
  return fa.edges.every(edge => edge.label === EPSILON || alphabet.has(edge.label))
}
