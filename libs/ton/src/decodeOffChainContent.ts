import { bitsToPaddedBuffer } from "@ton/core/dist/boc/utils/paddedBits"
import { Cell } from "@ton/ton"

const OFF_CHAIN_CONTENT_PREFIX = 0x01

export function flattenSnakeCell(cell: Cell) {
  let c: Cell | null = cell
  let res = Buffer.alloc(0)
  while (c) {
    let cs = c.beginParse()
    let data = bitsToPaddedBuffer(cs.loadBits(cs.remainingBits))
    res = Buffer.concat([res, data])
    c = c.refs[0]
  }
  return res
}
export function decodeOffChainContent(content: Cell) {
  let data = flattenSnakeCell(content)
  let prefix = data[0]
  if (prefix !== OFF_CHAIN_CONTENT_PREFIX) throw new Error(`Unknown content prefix: ${prefix.toString(16)}`)
  return data.slice(1).toString()
}
