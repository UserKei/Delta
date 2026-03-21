import { LRTable, LRParserStep, Grammar, ActionType } from '@repo/shared-types'

/**
 * Simulates the LR parsing process for a given input string using an LR parsing table.
 * Generates a step-by-step trace of the parsing process including stack states and actions.
 *
 * @param table - The LR parsing table (ACTION and GOTO).
 * @param grammar - The augmented grammar used to look up reduction productions.
 * @param input - The input string to parse, separated by whitespace (e.g., "id + id").
 * @returns An array of LRParserStep representing each step of the simulation trace.
 */
export function simulateLR(table: LRTable, grammar: Grammar, input: string): LRParserStep[] {
  const stateStack = ['0']
  const symbolStack = ['$']
  const inputBuffer = input.split(/\s+/).concat('$')
  let ptr = 0

  const steps: LRParserStep[] = []
  let stepIndex = 0

  while (true) {
    const currentState = stateStack[stateStack.length - 1]
    const currentInput = inputBuffer[ptr]

    // 记录快照
    const step: LRParserStep = {
      stepIndex: stepIndex++,
      stateStack: [...stateStack],
      symbolStack: [...symbolStack],
      inputString: inputBuffer.slice(ptr).join(' '),
      action: '',
      popCount: 0,
    }

    const action = table.action[currentState]?.[currentInput]

    if (!action) {
      step.action = 'Error'
      steps.push(step)
      break
    }

    if (action.type === ActionType.SHIFT) {
      const nextState = action.value as string
      step.action = `Shift ${nextState}`

      // 动画: 压入
      step.pushSymbol = currentInput
      step.pushState = nextState

      stateStack.push(nextState)
      symbolStack.push(currentInput)
      ptr++
      steps.push(step)
    } else if (action.type === ActionType.REDUCE) {
      const prodIndex = action.value as number
      const prod = grammar.productions[prodIndex]
      step.action = `Reduce ${prod.left} -> ${prod.right.join(' ')}`

      // 1. 弹出
      const count = prod.right.length // 如果是 ε 产生式，length=1? 需注意处理
      // 修正: 如果右部是 ε，长度应视为 0，不弹栈
      const popLen = prod.right.length === 1 && prod.right[0] === '@' ? 0 : prod.right.length

      step.popCount = popLen // 动画: 弹出 2*popLen 个

      for (let i = 0; i < popLen; i++) {
        stateStack.pop()
        symbolStack.pop()
      }

      // 2. GOTO
      const topState = stateStack[stateStack.length - 1]
      const nextState = table.goto[topState]?.[prod.left]

      if (!nextState) {
        step.action += ' (Goto Error)'
        steps.push(step)
        break
      }

      // 动画: 压入非终结符
      step.pushSymbol = prod.left
      step.pushState = nextState

      stateStack.push(nextState)
      symbolStack.push(prod.left)
      steps.push(step)
    } else if (action.type === ActionType.ACCEPT) {
      step.action = 'Accept'
      steps.push(step)
      break
    }
  }

  return steps
}
