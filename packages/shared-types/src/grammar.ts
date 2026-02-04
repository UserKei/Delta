// 单条产生式规则
export interface Production {
  left: string;          // 左部非终结符 (如 "E")
  right: string[];       // 右部符号序列 (如 ["E", "+", "T"])
}

// 上下文无关文法定义
export interface Grammar {
  startSymbol: string;   // 文法开始符号
  nonTerminals: string[];// 非终结符集合
  terminals: string[];   // 终结符集合
  productions: Production[]; // 产生式规则列表
}

// 集合映射表 (用于 First/Follow 集)
export interface GrammarSet {
  // Key: 非终结符, Value: 对应的符号列表
  [nonTerminal: string]: string[]; 
}