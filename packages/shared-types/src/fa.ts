// 统一使用的空边符号
export const EPSILON = '@'

// 自动机类型标识
export enum AutomatonType {
  NFA = 'NFA', // 非确定有限自动机
  DFA = 'DFA', // 确定有限自动机
  MIN_DFA = 'MIN_DFA', // 最小化 DFA
}

// 状态节点定义
export interface FANode {
  id: string // 内部唯一标识 (用于逻辑索引)
  label: string // UI 显示文本 (如 "q0" 或 "{0,1,2}")
  isStart: boolean // 是否为起始状态
  isEnd: boolean // 是否为终态/接受状态
  x?: number // 节点画布 X 坐标 (可选)
  y?: number // 节点画布 Y 坐标 (可选)
}

// 转移边定义
export interface FAEdge {
  id: string // 边唯一标识
  source: string // 源节点 ID
  target: string // 目标节点 ID
  label: string // 转移符号 (可以是字符或 EPSILON)
}

// Thompson 构造中使用的 NFA 片段
export interface Fragment {
  start: FANode
  end: FANode
  nodes: FANode[]
  edges: FAEdge[]
}

// 自动机完整对象
export interface FiniteAutomata {
  type: AutomatonType // 自动机类型
  nodes: FANode[] // 节点集合
  edges: FAEdge[] // 边集合
  alphabet: string[] // 字母表 (该自动机支持的所有输入符号)
}

export enum FATaskType {
  STRING_EQUIVALENCE = 'STRING_EQUIVALENCE',
  GRAPH_STRUCTURE = 'GRAPH_STRUCTURE',
  MATRIX_CONTENT = 'MATRIX_CONTENT',
  GRAPH_ISOMORPHISM = 'GRAPH_ISOMORPHISM',
  PARTITION_CHECK = 'PARTITION_CHECK',
  CANONICAL_ISOMORPHISM = 'CANONICAL_ISOMORPHISM',
}

export interface FAStringEquivalenceAnswer {
  regex: string
}

export interface FASubsetTableRow {
  state: string[]
  isStart: boolean
  isEnd: boolean
  transitions: Record<string, string[]>
}

export interface FASubsetTableAnswer {
  nfa: FiniteAutomata
  rows: FASubsetTableRow[]
}

export interface FAPartitionAnswer {
  dfa: FiniteAutomata
  partitions: string[][]
}

export interface FAJudgeAnswerMap {
  [FATaskType.STRING_EQUIVALENCE]: FAStringEquivalenceAnswer
  [FATaskType.GRAPH_STRUCTURE]: FiniteAutomata
  [FATaskType.MATRIX_CONTENT]: FASubsetTableAnswer
  [FATaskType.GRAPH_ISOMORPHISM]: FiniteAutomata
  [FATaskType.PARTITION_CHECK]: FAPartitionAnswer
  [FATaskType.CANONICAL_ISOMORPHISM]: FiniteAutomata
}

export interface FAJudgeRequestBase {
  targetRegex: string
}

export type FAJudgeRequest<T extends FATaskType = FATaskType> = {
  [K in T]: FAJudgeRequestBase & {
    taskType: K
    answer: FAJudgeAnswerMap[K]
  }
}[T]

export interface FAJudgeResult {
  pass: boolean
  reasonCode: string
  message: string
  diagnostics?: Record<string, unknown>
}
