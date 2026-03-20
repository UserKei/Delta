const PRECEDENCE: Record<string, number> = { '|': 1, '.': 2, '*': 3 }

/**
 * Determines if a character is a regular operand (i.e., not a regex control character).
 *
 * @param char - The character to check
 * @returns true if the character is not one of `(`, `)`, `*`, `|`, `.`
 */
function isOperand(char: string): boolean {
  return !['(', ')', '*', '|', '.'].includes(char)
}

/**
 * ### 1. 显式插入连接符 `.`
 * 在正则表达式的隐式连接位置（例如 `ab`）显式地插入点号运算符（`a.b`）。
 * * 这是为了方便后续通过调度场算法将其转换为后缀表达式 (RPN)。
 *
 * @example
 * ```ts
 * insertExplicitConcat("a(bc)*d") // 返回 "a.(b.c)*.d"
 * insertExplicitConcat("a|bc")    // 返回 "a|b.c"
 * ```
 *
 * @param regex 原始正则表达式字符串（例如 "ab|c"）
 * @returns 带有显式连接符 `.` 的字符串
 */
export function insertExplicitConcat(regex: string): string {
  let output = ''

  for (let i = 0; i < regex.length; i++) {
    const c1 = regex[i]
    output += c1
    if (i + 1 < regex.length) {
      const c2 = regex[i + 1]
      /**
       * rule：在什么情况下需要在两个字符间插入连接符 '.'？
       * * 当左侧字符 c1 是以下之一：
       * - 操作数 {'a', 'b, '1', ...}
       * - 闭包运算符 '*'
       * - 右括号 ')'
       * * 且右侧字符 c2 是以下之一：
       * - 操作数 {'a', 'b', '1', ...}
       * - 左括号 '('
       */
      if ((isOperand(c1) || c1 === '*' || c1 === ')') && (isOperand(c2) || c2 === '(')) {
        output += '.'
      }
    }
  }

  return output
}

/**
 * ### 2. 中缀转后缀 (调度场算法)
 * 将带有显式连接符的中缀正则表达式转换为后缀表达式。
 * 转换后，运算符将置于操作数之后，消除括号并明确优先级。
 *
 * @example
 * ```ts
 * toPostfix("a.b")     // 返回 "ab."
 * toPostfix("a.(b|c)") // 返回 "abc|."
 * ```
 *
 * @param regex 已处理过连接符的正则表达式
 * @returns 后缀表达式字符串
 */
export function toPostfix(regex: string): string {
  const explicit = insertExplicitConcat(regex)
  const output: string[] = []
  const stack: string[] = []

  for (const char of explicit) {
    if (isOperand(char)) {
      output.push(char)
    } else if (char === '(') {
      stack.push(char)
    } else if (char === ')') {
      while (stack.length && stack[stack.length - 1] !== '(') {
        output.push(stack.pop()!)
      }
      stack.pop()
    } else {
      // 其他操作符
      while (
        stack.length &&
        stack[stack.length - 1] !== '(' &&
        PRECEDENCE[stack[stack.length - 1]] >= PRECEDENCE[char]
      ) {
        output.push(stack.pop()!)
      }
      stack.push(char)
    }
  }

  while (stack.length) output.push(stack.pop()!)
  return output.join('')
}
