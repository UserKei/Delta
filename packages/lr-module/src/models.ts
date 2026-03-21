import {
  ActionType,
  LRMode,
  type Grammar,
  type LRItem,
  type LRParserStep,
  type LRTable,
  type LRAutomaton,
  LRTaskType,
} from '@repo/shared-types'

export interface ProductionDraft {
  id: string
  left: string
  right: string
}

export interface GrammarDraft {
  startSymbol: string
  nonTerminals: string
  terminals: string
  productions: ProductionDraft[]
}

export interface LRStateDraft {
  id: string
  itemsText: string
  isAccepting: boolean
}

export interface LRTransitionDraft {
  id: string
  source: string
  target: string
  label: string
}

export interface LRTraceDraftRow {
  id: string
  stateStack: string
  symbolStack: string
  input: string
  action: string
  popCount: string
  pushSymbol: string
  pushState: string
}

export type LRStepKey = 'grammar-check' | 'dfa-isomorphism' | 'table-check' | 'trace-match'

export const LR_STEP_META: Array<{
  key: LRStepKey
  label: string
  task: LRTaskType | 'MODE_AWARE_TABLE'
  description: string
}> = [
  {
    key: 'grammar-check',
    label: 'Step 1',
    task: LRTaskType.GRAMMAR_CHECK,
    description: 'Augment the grammar with the synthetic start production.',
  },
  {
    key: 'dfa-isomorphism',
    label: 'Step 2',
    task: LRTaskType.LR_DFA_ISOMORPHISM,
    description: 'Construct the canonical collection DFA and item closures.',
  },
  {
    key: 'table-check',
    label: 'Step 3',
    task: 'MODE_AWARE_TABLE',
    description: 'Fill the ACTION/GOTO table for LR(0) or SLR(1).',
  },
  {
    key: 'trace-match',
    label: 'Step 4',
    task: LRTaskType.TRACE_MATCH,
    description: 'Simulate shift/reduce parsing against the standard table.',
  },
]

export function createStarterGrammarDraft(): GrammarDraft {
  return {
    startSymbol: 'S',
    nonTerminals: 'S',
    terminals: 'a',
    productions: [{ id: 'prod-0', left: 'S', right: 'a' }],
  }
}

export function createStarterAugmentedGrammarDraft(): GrammarDraft {
  return {
    startSymbol: "S'",
    nonTerminals: "S',S",
    terminals: 'a',
    productions: [
      { id: 'prod-0', left: "S'", right: 'S' },
      { id: 'prod-1', left: 'S', right: 'a' },
    ],
  }
}

export function createStarterAutomatonDraft() {
  return {
    states: [
      { id: 'state-0', itemsText: "S' -> • S\nS -> • a", isAccepting: false },
      { id: 'state-1', itemsText: 'S -> a •', isAccepting: false },
      { id: 'state-2', itemsText: "S' -> S •", isAccepting: true },
    ] satisfies LRStateDraft[],
    transitions: [
      { id: 'tr-0', source: '0', target: '1', label: 'a' },
      { id: 'tr-1', source: '0', target: '2', label: 'S' },
    ] satisfies LRTransitionDraft[],
  }
}

export function createStarterTableDraft(): LRTable {
  return {
    terminals: ['a', '$'],
    nonTerminals: ['S'],
    action: {
      '0': { a: { type: ActionType.SHIFT, value: '1' } },
      '1': { $: { type: ActionType.REDUCE, value: 1 }, a: { type: ActionType.REDUCE, value: 1 } },
      '2': { $: { type: ActionType.ACCEPT } },
    },
    goto: {
      '0': { S: '2' },
      '1': {},
      '2': {},
    },
  }
}

export function createStarterTraceDraft() {
  return {
    input: 'a',
    rows: [
      {
        id: 'trace-0',
        stateStack: '0',
        symbolStack: '$',
        input: 'a $',
        action: 'Shift 1',
        popCount: '0',
        pushSymbol: 'a',
        pushState: '1',
      },
      {
        id: 'trace-1',
        stateStack: '0 1',
        symbolStack: '$ a',
        input: '$',
        action: 'Reduce S -> a',
        popCount: '1',
        pushSymbol: 'S',
        pushState: '2',
      },
      {
        id: 'trace-2',
        stateStack: '0 2',
        symbolStack: '$ S',
        input: '$',
        action: 'Accept',
        popCount: '0',
        pushSymbol: '',
        pushState: '',
      },
    ] satisfies LRTraceDraftRow[],
  }
}

export function nextProductionId(productions: ProductionDraft[]): string {
  return `prod-${productions.length}`
}

export function nextStateDraftId(states: LRStateDraft[]): string {
  return `state-${states.length}`
}

export function nextTransitionDraftId(transitions: LRTransitionDraft[]): string {
  return `tr-${transitions.length}`
}

export function nextTraceDraftId(rows: LRTraceDraftRow[]): string {
  return `trace-${rows.length}`
}

export function parseGrammarDraft(draft: GrammarDraft): Grammar {
  return {
    startSymbol: draft.startSymbol.trim(),
    nonTerminals: parseCsv(draft.nonTerminals),
    terminals: parseCsv(draft.terminals),
    productions: draft.productions.map(production => ({
      left: production.left.trim(),
      right: production.right.trim().split(/\s+/).filter(Boolean),
    })),
  }
}

export function buildGrammarDraft(grammar: Grammar): GrammarDraft {
  return {
    startSymbol: grammar.startSymbol,
    nonTerminals: grammar.nonTerminals.join(','),
    terminals: grammar.terminals.join(','),
    productions: grammar.productions.map((production, index) => ({
      id: `prod-${index}`,
      left: production.left,
      right: production.right.join(' '),
    })),
  }
}

export function parseAutomatonDraft(
  states: LRStateDraft[],
  transitions: LRTransitionDraft[],
): LRAutomaton {
  return {
    states: states.map(state => ({
      id: parseStateId(state.id),
      items: parseItemsText(state.itemsText),
      isAccepting: state.isAccepting,
    })),
    transitions: transitions.map(transition => ({
      source: transition.source.trim(),
      target: transition.target.trim(),
      label: transition.label.trim(),
    })),
  }
}

export function buildAutomatonDraft(automaton: LRAutomaton) {
  return {
    states: automaton.states.map((state, index) => ({
      id: `state-${index}`,
      itemsText: state.items.map(stringifyItem).join('\n'),
      isAccepting: Boolean(state.isAccepting),
    })),
    transitions: automaton.transitions.map((transition, index) => ({
      id: `tr-${index}`,
      source: transition.source,
      target: transition.target,
      label: transition.label,
    })),
  }
}

export function createEmptyTableDraft(): LRTable {
  return {
    terminals: [],
    nonTerminals: [],
    action: {},
    goto: {},
  }
}

export function parseTraceDraftRows(rows: LRTraceDraftRow[]): LRParserStep[] {
  return rows.map((row, index) => ({
    stepIndex: index,
    stateStack: row.stateStack.split(/\s+/).filter(Boolean),
    symbolStack: row.symbolStack.split(/\s+/).filter(Boolean),
    inputString: row.input.trim(),
    action: row.action.trim(),
    popCount: Number(row.popCount || '0'),
    pushSymbol: row.pushSymbol.trim() || undefined,
    pushState: row.pushState.trim() || undefined,
  }))
}

export function tableTaskForMode(mode: LRMode): LRTaskType {
  return mode === LRMode.SLR1 ? LRTaskType.SLR1_TABLE_CHECK : LRTaskType.TABLE_CELL_MATCH
}

function parseCsv(value: string): string[] {
  return Array.from(
    new Set(
      value
        .split(',')
        .map(part => part.trim())
        .filter(Boolean),
    ),
  )
}

function parseStateId(id: string): string {
  return id.replace(/^state-/, '').trim()
}

function parseItemsText(source: string): LRItem[] {
  return source
    .split('\n')
    .map(line => line.trim())
    .filter(Boolean)
    .map(parseItemLine)
}

function parseItemLine(line: string): LRItem {
  const [leftPart = '', rightPart = ''] = line.split('->').map(part => part.trim())
  const tokens = rightPart.split(/\s+/).filter(Boolean)
  const dotIndex = tokens.findIndex(token => token === '•')
  const rhs = tokens.filter(token => token !== '•')

  return {
    lhs: leftPart,
    rhs,
    dotPosition: dotIndex < 0 ? rhs.length : dotIndex,
  }
}

function stringifyItem(item: LRItem): string {
  const rhs = [...item.rhs]
  rhs.splice(item.dotPosition, 0, '•')
  return `${item.lhs} -> ${rhs.join(' ')}`
}
