import { Grammar, Production } from '@repo/shared-types'
import { cloneDeep } from 'lodash-es'
import { EPSILON } from '../types'

/**
 * Eliminates both direct and indirect left recursion from a given grammar using Paull's Algorithm.
 *
 * @param grammar The input grammar to process.
 * @returns A new Grammar object with left recursion eliminated.
 */
export function eliminateLeftRecursion(grammar: Grammar): Grammar {
  const G = cloneDeep(grammar)
  const nonTerminals = [...G.nonTerminals]

  // 1. 消除间接左递归
  for (let i = 0; i < nonTerminals.length; i++) {
    const Ai = nonTerminals[i]
    for (let j = 0; j < i; j++) {
      const Aj = nonTerminals[j]

      // 查找 Ai -> Aj γ
      const productionsAi = G.productions.filter(p => p.left === Ai)
      const newProductionsAi: Production[] = []

      for (const p of productionsAi) {
        if (p.right[0] === Aj) {
          // 替换: Aj -> δ1 | δ2 ...
          // Ai -> δ1 γ | δ2 γ ...
          const gamma = p.right.slice(1)
          const productionsAj = G.productions.filter(prod => prod.left === Aj)
          for (const pAj of productionsAj) {
            newProductionsAi.push({ left: Ai, right: [...pAj.right, ...gamma] })
          }
        } else {
          newProductionsAi.push(p)
        }
      }

      // 更新产生式列表
      G.productions = G.productions.filter(p => p.left !== Ai).concat(newProductionsAi)
    }
    // 2. 消除直接左递归
    eliminateDirectLeftRecursion(G, Ai)
  }

  return G
}

/**
 * Helper function to eliminate direct left recursion for a specific non-terminal.
 *
 * @param G The grammar being modified in place.
 * @param A The non-terminal to process for direct left recursion.
 */
function eliminateDirectLeftRecursion(G: Grammar, A: string) {
  const prods = G.productions.filter(p => p.left === A)
  const leftRecursive = prods.filter(p => p.right[0] === A)

  if (leftRecursive.length === 0) return

  const nonRecursive = prods.filter(p => p.right[0] !== A)
  const A_prime = `${A}'` // 新非终结符
  G.nonTerminals.push(A_prime)

  // 旧产生式: A -> β A'
  const newAProds = nonRecursive.map(p => ({
    left: A,
    right: [...p.right, A_prime],
  }))
  // 如果非递归部分为空，需添加 A -> A' (实际上通常不会发生)
  if (nonRecursive.length === 0) {
    newAProds.push({ left: A, right: [A_prime] })
  }

  // 新产生式: A' -> α A' | ε
  const newPrimeProds = leftRecursive.map(p => ({
    left: A_prime,
    right: [...p.right.slice(1), A_prime], // 去掉开头的 A
  }))
  newPrimeProds.push({ left: A_prime, right: [EPSILON] })

  // 更新 G
  G.productions = G.productions.filter(p => p.left !== A).concat(newAProds, newPrimeProds)
}
