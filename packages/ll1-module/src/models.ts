import {
  EOF,
  type Grammar,
  type GrammarSet,
  LL1TaskType,
  type LL1ParserStep,
  type LL1Table,
  type Production,
} from '@repo/shared-types'

export interface ProductionDraft {
  id: string
  left: string
  right: string
}

export interface LL1SetDraft {
  [nonTerminal: string]: string
}

export interface LL1TraceDraftRow {
  id: string
  stack: string
  input: string
  action: string
}

export type LL1StepKey = 'grammar-validity' | 'set-equality' | 'table-cell-match' | 'trace-match'

export const LL1_STEP_META: Array<{
  key: LL1StepKey
  label: string
  task: LL1TaskType
  description: string
}> = [
  {
    key: 'grammar-validity',
    label: 'Step 1',
    task: LL1TaskType.GRAMMAR_VALIDITY,
    description: 'Define the grammar and validate the symbol declarations.',
  },
  {
    key: 'set-equality',
    label: 'Step 2',
    task: LL1TaskType.SET_EQUALITY,
    description: 'Fill the First and Follow sets for each non-terminal.',
  },
  {
    key: 'table-cell-match',
    label: 'Step 3',
    task: LL1TaskType.TABLE_CELL_MATCH,
    description: 'Construct the LL(1) predictive parsing table cell by cell.',
  },
  {
    key: 'trace-match',
    label: 'Step 4',
    task: LL1TaskType.TRACE_MATCH,
    description: 'Simulate the parser and match the stack and action trace.',
  },
]

export interface GrammarDraft {
  startSymbol: string
  nonTerminals: string
  terminals: string
  productions: ProductionDraft[]
}

export function createStarterGrammarDraft(): GrammarDraft {
  return {
    startSymbol: 'S',
    nonTerminals: 'S,A',
    terminals: 'a,b',
    productions: [
      { id: 'prod-0', left: 'S', right: 'a A' },
      { id: 'prod-1', left: 'A', right: 'b' },
    ],
  }
}

export function createEmptySetDraft(nonTerminals: string[]): LL1SetDraft {
  return Object.fromEntries(nonTerminals.map(nonTerminal => [nonTerminal, '']))
}

export function createEmptyLL1Table(grammar: Grammar): LL1Table {
  const terminals = [...grammar.terminals, EOF]
  return {
    terminals,
    nonTerminals: grammar.nonTerminals,
    table: Object.fromEntries(
      grammar.nonTerminals.map(nonTerminal => [
        nonTerminal,
        Object.fromEntries(terminals.map(terminal => [terminal, ''])),
      ]),
    ),
  }
}

export function createStarterTraceDraft(): { input: string; rows: LL1TraceDraftRow[] } {
  return {
    input: 'a b',
    rows: [{ id: 'trace-0', stack: '$ S', input: 'a b $', action: '' }],
  }
}

export function nextProductionId(productions: ProductionDraft[]): string {
  const max = productions.reduce((current, production) => {
    const match = /^prod-(\d+)$/.exec(production.id)
    return match ? Math.max(current, Number(match[1])) : current
  }, -1)
  return `prod-${max + 1}`
}

export function nextTraceId(rows: LL1TraceDraftRow[]): string {
  const max = rows.reduce((current, row) => {
    const match = /^trace-(\d+)$/.exec(row.id)
    return match ? Math.max(current, Number(match[1])) : current
  }, -1)
  return `trace-${max + 1}`
}

export function parseGrammarDraft(draft: GrammarDraft): Grammar {
  return {
    startSymbol: draft.startSymbol.trim(),
    nonTerminals: parseCsvSymbols(draft.nonTerminals),
    terminals: parseCsvSymbols(draft.terminals),
    productions: draft.productions.map(parseProductionDraft),
  }
}

export function buildSetDraftFromGrammarSet(
  nonTerminals: string[],
  source?: GrammarSet,
): LL1SetDraft {
  return Object.fromEntries(
    nonTerminals.map(nonTerminal => [nonTerminal, source?.[nonTerminal]?.join(', ') ?? '']),
  )
}

export function parseSetDraft(draft: LL1SetDraft, nonTerminals: string[]): GrammarSet {
  return Object.fromEntries(
    nonTerminals.map(nonTerminal => [nonTerminal, parseCsvSymbols(draft[nonTerminal] ?? '')]),
  )
}

export function stringifyProduction(production: Production): string {
  return `${production.left} -> ${production.right.join(' ')}`
}

export function normalizeTableCellInput(value: string): string {
  return value.trim().replace(/\s+/g, ' ')
}

export function parseTraceDraftRows(rows: LL1TraceDraftRow[]): LL1ParserStep[] {
  return rows.map((row, index) => ({
    stepIndex: index,
    stack: row.stack.split(/\s+/).filter(Boolean),
    inputString: row.input.trim(),
    action: row.action.trim(),
  }))
}

function parseCsvSymbols(source: string): string[] {
  return Array.from(
    new Set(
      source
        .split(',')
        .map(symbol => symbol.trim())
        .filter(Boolean),
    ),
  )
}

function parseProductionDraft(draft: ProductionDraft): Production {
  const right = draft.right.trim().split(/\s+/).filter(Boolean)

  return {
    left: draft.left.trim(),
    right,
  }
}
