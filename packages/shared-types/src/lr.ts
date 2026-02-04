// LR 项目定义
export interface LRItem {
  lhs: string;            // 产生式左部
  rhs: string[];          // 产生式右部
  dotPosition: number;    // 点号位置 (0 代表点在最左, rhs.length 代表点在最右)
}

// LR 状态 (项目集)
export interface LRState {
  id: string;             // 状态 ID (如 "I0")
  items: LRItem[];        // 该状态包含的 LR 项目集合 (闭包结果)
  isAccepting?: boolean;  // 是否包含接受项目 (S' -> S .)
}

// LR 项目集规范族 (本质是 DFA)
export interface LRAutomaton {
  states: LRState[];      // 状态集合
  transitions: {          // 状态间的跳转关系
    source: string;       // 源状态 ID
    target: string;       // 目标状态 ID
    label: string;        // 跳转符号
  }[];
}

// 分析表动作类型
export enum ActionType {
  SHIFT = 's',            // 移进
  REDUCE = 'r',           // 规约
  ACCEPT = 'acc',         // 接受
  ERROR = 'err'           // 报错
}

// 分析表单元格动作
export interface LRAction {
  type: ActionType;       // 动作类型
  value?: number | string;// 目标状态 ID (Shift) 或 产生式序号 (Reduce)
}

// LR 分析表 (包含 ACTION 和 GOTO)
export interface LRTable {
  terminals: string[];    // ACTION 表列头
  nonTerminals: string[]; // GOTO 表列头
  action: Record<string, Record<string, LRAction>>; // ACTION 表
  goto: Record<string, Record<string, string>>;     // GOTO 表
}

// LR 分析过程追踪 (用于动画)
export interface LRParserStep {
  stepIndex: number;      // 当前步骤序号
  stateStack: string[];   // 状态栈, e.g., ["0", "2", "5"]
  symbolStack: string[];  // 符号栈, e.g., ["$", "E", "+"]
  inputString: string;    // 剩余输入串, e.g., "id * id $"
  action: string;         // 执行动作描述 (如 "Shift 5")
  // 动画指令
  popCount: number;       // 规约时弹出的元素个数 (弹出 2 * popCount 个)
  pushSymbol?: string;    // 规约后压入的新符号
  pushState?: string;     // 压入的新状态 ID
}