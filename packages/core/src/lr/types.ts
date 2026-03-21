import { LRItem } from '@repo/shared-types'

export const DOT = '•' // 点号标记 (仅用于调试打印，实际逻辑用 dotPosition)

/**
 * Generates a unique string key for an LR item, used for deduplication in Sets.
 *
 * @param item - The LR item containing lhs, rhs, and dot position.
 * @returns A unique string representation of the item.
 */
export function getItemKey(item: LRItem): string {
  return `${item.lhs}|${item.rhs.join(',')}|${item.dotPosition}`
}
