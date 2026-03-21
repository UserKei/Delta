import { LRItem } from '@repo/shared-types'

/**
 * Generates a unique string key for an LR item, used for deduplication in Sets.
 *
 * @param item - The LR item containing lhs, rhs, and dot position.
 * @returns A unique string representation of the item.
 */
export function getItemKey(item: LRItem): string {
  return `${item.lhs}|${item.rhs.join(',')}|${item.dotPosition}`
}
