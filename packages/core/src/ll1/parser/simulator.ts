import { LL1Table, LL1ParserStep, Production } from '@repo/shared-types'
import { EOF, EPSILON } from '../types'

/**
 * Simulates LL(1) parsing for a given input string and generates a step-by-step trace.
 *
 * @param table The pre-built LL(1) parsing table.
 * @param startSymbol The start symbol of the grammar.
 * @param input The input string to parse (tokens separated by spaces).
 * @returns An array of parser steps recording stack states and actions for animation.
 */
export function simulateLL1(table: LL1Table, startSymbol: string, input: string): LL1ParserStep[] {
  const stack = [EOF, startSymbol]
  const inputBuffer = input.split(/\s+/).concat(EOF) // 假设空格分隔
  let ptr = 0
  const steps: LL1ParserStep[] = []
  let stepCount = 0

  while (stack.length > 0) {
    const top = stack[stack.length - 1]
    const currentInput = inputBuffer[ptr]

    const currentStep: LL1ParserStep = {
      stepIndex: stepCount++,
      stack: [...stack],
      inputString: inputBuffer.slice(ptr).join(' '),
      action: '',
    }

    // 1. 匹配终结符
    if (top === currentInput) {
      if (top === EOF) {
        currentStep.action = 'Accept'
        steps.push(currentStep)
        break
      }
      currentStep.action = `Match ${top}`
      currentStep.popSymbol = stack.pop()
      ptr++
    }
    // 2. 栈顶是终结符但不匹配
    else if (table.terminals.includes(top) || top === EOF) {
      currentStep.action = `Error: Expected ${top}, got ${currentInput}`
      steps.push(currentStep)
      break // 报错停止
    }
    // 3. 查表展开
    else {
      const prodStr = table.table[top]?.[currentInput]
      if (!prodStr) {
        currentStep.action = `Error: No rule for [${top}, ${currentInput}]`
        steps.push(currentStep)
        break
      }

      const prod: Production = JSON.parse(prodStr)
      currentStep.action = `Output ${prod.left} -> ${prod.right.join(' ')}`

      currentStep.popSymbol = stack.pop() // 弹出非终结符

      // 压入右部 (逆序), ε 不压栈
      if (prod.right[0] !== EPSILON) {
        const toPush = [...prod.right].reverse()
        stack.push(...toPush)
        currentStep.pushSymbols = prod.right // 记录正序以便动画展示
      } else {
        currentStep.pushSymbols = [EPSILON]
      }
    }

    steps.push(currentStep)
  }

  return steps
}
