import {
  AutomatonType,
  EPSILON,
  FATaskType,
  type FAEdge,
  type FANode,
  type FASubsetTableAnswer,
  type FASubsetTableRow,
  type FiniteAutomata,
} from '@repo/shared-types'

export interface EditableNode extends FANode {}

export interface EditableEdge extends FAEdge {}

export interface SubsetRowDraft {
  id: string
  stateInput: string
  isStart: boolean
  isEnd: boolean
  transitions: Record<string, string>
}

export interface PartitionGroupDraft {
  id: string
  stateInput: string
}

export type FAStepKey =
  | 'string-equivalence'
  | 'graph-structure'
  | 'matrix-content'
  | 'graph-isomorphism'
  | 'partition-check'
  | 'canonical-isomorphism'

export interface StepMeta {
  key: FAStepKey
  label: string
  task: FATaskType
  description: string
}

export const FA_STEP_META: StepMeta[] = [
  {
    key: 'string-equivalence',
    label: 'Step 1',
    task: FATaskType.STRING_EQUIVALENCE,
    description: 'Compare the submitted regex against the target language.',
  },
  {
    key: 'graph-structure',
    label: 'Step 2',
    task: FATaskType.GRAPH_STRUCTURE,
    description: 'Construct the Thompson NFA and validate graph structure.',
  },
  {
    key: 'matrix-content',
    label: 'Step 3',
    task: FATaskType.MATRIX_CONTENT,
    description: 'Fill the subset-construction table derived from the current NFA.',
  },
  {
    key: 'graph-isomorphism',
    label: 'Step 4',
    task: FATaskType.GRAPH_ISOMORPHISM,
    description: 'Build the DFA graph that matches the subset-construction result.',
  },
  {
    key: 'partition-check',
    label: 'Step 5',
    task: FATaskType.PARTITION_CHECK,
    description: 'Group DFA states into Hopcroft refinement partitions.',
  },
  {
    key: 'canonical-isomorphism',
    label: 'Step 6',
    task: FATaskType.CANONICAL_ISOMORPHISM,
    description: 'Construct the canonical minimal DFA.',
  },
]

export function createStarterAutomaton(type: AutomatonType): FiniteAutomata {
  return {
    type,
    alphabet: [],
    nodes: [
      { id: 'q0', label: 'q0', isStart: true, isEnd: false, x: 120, y: 140 },
      { id: 'q1', label: 'q1', isStart: false, isEnd: true, x: 340, y: 140 },
    ],
    edges: [{ id: 'e0', source: 'q0', target: 'q1', label: EPSILON }],
  }
}

export function createStarterSubsetRows(alphabet: string[]): SubsetRowDraft[] {
  return [
    {
      id: 'row-0',
      stateInput: '',
      isStart: false,
      isEnd: false,
      transitions: Object.fromEntries(alphabet.map(symbol => [symbol, ''])),
    },
  ]
}

export function createStarterPartitionGroups(): PartitionGroupDraft[] {
  return [{ id: 'group-0', stateInput: '' }]
}

export function nextNodeId(nodes: EditableNode[]): string {
  const max = nodes.reduce((current, node) => {
    const match = /^q(\d+)$/.exec(node.id)
    return match ? Math.max(current, Number(match[1])) : current
  }, -1)
  return `q${max + 1}`
}

export function nextEdgeId(edges: EditableEdge[]): string {
  const max = edges.reduce((current, edge) => {
    const match = /^e(\d+)$/.exec(edge.id)
    return match ? Math.max(current, Number(match[1])) : current
  }, -1)
  return `e${max + 1}`
}

export function nextSubsetRowId(rows: SubsetRowDraft[]): string {
  const max = rows.reduce((current, row) => {
    const match = /^row-(\d+)$/.exec(row.id)
    return match ? Math.max(current, Number(match[1])) : current
  }, -1)
  return `row-${max + 1}`
}

export function nextPartitionGroupId(groups: PartitionGroupDraft[]): string {
  const max = groups.reduce((current, group) => {
    const match = /^group-(\d+)$/.exec(group.id)
    return match ? Math.max(current, Number(match[1])) : current
  }, -1)
  return `group-${max + 1}`
}

export function normalizeCsvStateInput(input: string): string[] {
  return Array.from(
    new Set(
      input
        .split(',')
        .map(part => part.trim())
        .filter(Boolean),
    ),
  ).sort()
}

export function buildAutomatonFromGraph(
  nodes: EditableNode[],
  edges: EditableEdge[],
  type: AutomatonType,
): FiniteAutomata {
  const alphabet = Array.from(
    new Set(
      edges.map(edge => edge.label.trim()).filter(label => label.length > 0 && label !== EPSILON),
    ),
  ).sort()

  return {
    type,
    alphabet,
    nodes: nodes.map(node => ({
      ...node,
      label: node.label.trim() || node.id,
    })),
    edges: edges.map(edge => ({
      ...edge,
      label: edge.label.trim() || EPSILON,
    })),
  }
}

export function validateEditableAutomaton(automaton: FiniteAutomata): string | null {
  if (!automaton.nodes.length) return 'At least one node is required.'

  const startNodes = automaton.nodes.filter(node => node.isStart)
  if (startNodes.length !== 1) return 'Exactly one start node is required.'

  const nodeIds = new Set(automaton.nodes.map(node => node.id))
  for (const edge of automaton.edges) {
    if (!nodeIds.has(edge.source) || !nodeIds.has(edge.target)) {
      return 'Every edge must connect two existing nodes.'
    }
  }

  return null
}

export function syncSubsetDraftAlphabet(
  rows: SubsetRowDraft[],
  alphabet: string[],
): SubsetRowDraft[] {
  return rows.map(row => ({
    ...row,
    transitions: Object.fromEntries(
      alphabet.map(symbol => [symbol, row.transitions[symbol] ?? '']),
    ),
  }))
}

export function buildSubsetAnswerFromDraft(
  nfa: FiniteAutomata,
  rows: SubsetRowDraft[],
  alphabet: string[],
): FASubsetTableAnswer {
  const normalizedRows: FASubsetTableRow[] = rows.map(row => ({
    state: normalizeCsvStateInput(row.stateInput),
    isStart: row.isStart,
    isEnd: row.isEnd,
    transitions: Object.fromEntries(
      alphabet.map(symbol => [symbol, normalizeCsvStateInput(row.transitions[symbol] ?? '')]),
    ),
  }))

  return {
    nfa,
    rows: normalizedRows,
  }
}

export function buildPartitionGroupsFromDraft(groups: PartitionGroupDraft[]): string[][] {
  return groups.map(group => normalizeCsvStateInput(group.stateInput))
}
