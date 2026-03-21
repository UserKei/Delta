import type { Grammar, GrammarSet } from './grammar.js'

export const EOF = '$'

export interface SymbolSet {
  hasEpsilon: boolean
  symbols: Set<string>
}

export enum LL1TaskType {
  GRAMMAR_VALIDITY = 'GRAMMAR_VALIDITY',
  SET_EQUALITY = 'SET_EQUALITY',
  TABLE_CELL_MATCH = 'TABLE_CELL_MATCH',
  TRACE_MATCH = 'TRACE_MATCH',
}

// LL(1) 预测分析表
export interface LL1Table {
  terminals: string[] // 表头: 终结符列
  nonTerminals: string[] // 表头: 非终结符行
  // 核心跳转表: table[NonTerm][Term] = 产生式字符串 (如 "E -> T E'")
  table: Record<string, Record<string, string>>
}

// LL(1) 分析过程追踪 (用于动画)
export interface LL1ParserStep {
  stepIndex: number // 当前步骤序号
  stack: string[] // 变化后的栈快照序列
  inputString: string // 当前剩余的输入串
  action: string // 执行动作的文字描述
  // 动画指令
  popSymbol?: string // 这一步弹出的栈顶符号
  pushSymbols?: string[] // 这一步压入的符号序列 (产生式右部反序)
}

export interface LL1SetEqualityAnswer {
  grammar: Grammar
  first: GrammarSet
  follow: GrammarSet
}

export interface LL1TableCellMatchAnswer {
  grammar: Grammar
  first: GrammarSet
  follow: GrammarSet
  table: LL1Table
}

export interface LL1TraceMatchAnswer {
  grammar: Grammar
  input: string
  table: LL1Table
  trace: LL1ParserStep[]
}

export interface LL1JudgeAnswerMap {
  [LL1TaskType.GRAMMAR_VALIDITY]: Grammar
  [LL1TaskType.SET_EQUALITY]: LL1SetEqualityAnswer
  [LL1TaskType.TABLE_CELL_MATCH]: LL1TableCellMatchAnswer
  [LL1TaskType.TRACE_MATCH]: LL1TraceMatchAnswer
}

export type LL1JudgeRequest<T extends LL1TaskType = LL1TaskType> = {
  [K in T]: {
    taskType: K
    answer: LL1JudgeAnswerMap[K]
  }
}[T]

export interface LL1JudgeResult {
  pass: boolean
  reasonCode: string
  message: string
  diagnostics?: Record<string, unknown>
}
