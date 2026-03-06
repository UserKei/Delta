/**
 * 生成 8 位唯一ID
 */
export function uuid(): string {
  return crypto.randomUUID().slice(0, 8)
}
