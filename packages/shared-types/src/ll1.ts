// LL(1) 预测分析表
export interface LL1Table {
  terminals: string[];    // 表头: 终结符列
  nonTerminals: string[]; // 表头: 非终结符行
  // 核心跳转表: table[NonTerm][Term] = 产生式字符串 (如 "E -> T E'")
  table: Record<string, Record<string, string>>;
}

// LL(1) 分析过程追踪 (用于动画)
export interface LL1ParserStep {
  stepIndex: number;      // 当前步骤序号
  stack: string[];        // 变化后的栈快照序列
  inputString: string;    // 当前剩余的输入串
  action: string;         // 执行动作的文字描述
  // 动画指令
  popSymbol?: string;     // 这一步弹出的栈顶符号
  pushSymbols?: string[]; // 这一步压入的符号序列 (产生式右部反序)
}