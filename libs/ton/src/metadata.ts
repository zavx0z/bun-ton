import { Address, Slice, TonClient, TupleReader } from "@ton/ton"
import { Sha256 } from "@aws-crypto/sha256-js"
import { parseDict } from "@ton/core/dist/dict/parseDict"
import { bitsToPaddedBuffer } from "@ton/core/dist/boc/utils/paddedBits"
import type {
  Content,
  JettonMetaDataKeys,
  JettonMetadata,
  JettonOffchainMetadata,
  JettonOnChainMetadataSpec,
  JettonOnchainMetadata,
  NftMetadata,
} from "./types"

const jettonOnChainMetadataSpec: JettonOnChainMetadataSpec = {
  name: "utf8",
  description: "utf8",
  image: "ascii",
  decimals: "utf8",
  symbol: "utf8",
  image_data: undefined,
}

const ONCHAIN_CONTENT_PREFIX = 0x00
const OFFCHAIN_CONTENT_PREFIX = 0x01
const SNAKE_PREFIX = 0x00

const sha256 = (str: string) => {
  const sha = new Sha256()
  sha.update(str)
  return Buffer.from(sha.digestSync())
}

export const readContent = async (stack: TupleReader): Content => {
  const contentCell = stack.readCell()
  const contentSlice = contentCell.beginParse()
  switch (contentSlice.loadUint(8)) {
    case ONCHAIN_CONTENT_PREFIX:
      return {
        persistenceType: "onchain",
        ...parseJettonOnchainMetadata(contentSlice),
      }
    case OFFCHAIN_CONTENT_PREFIX:
      const { metadata, isIpfs } = await parseJettonOffchainMetadata(contentSlice)
      return {
        persistenceType: isIpfs ? "offchain_ipfs" : "offchain_private_domain",
        metadata,
      }
    default:
      throw new Error("Unexpected jetton metadata content prefix")
  }
}

export const readJettonWalletMetadata = async (client: TonClient, address: string) => {
  const walletData = await client.runMethod(Address.parse(address), "get_wallet_data")
  walletData.stack.skip(2)
  return readJettonMetadata(client, walletData.stack.readAddress().toString())
}

export const readNftItemMetadata = async (client: TonClient, address: string) => {
  const nftItemAddress = Address.parse(address)
  const nftData = await client.runMethod(nftItemAddress, "get_nft_data")
  nftData.stack.skip(1)
  const index = nftData.stack.readBigNumber()
  const collection_address = nftData.stack.readAddress()
  nftData.stack.skip(1)
  const individual_item_content = nftData.stack.readCell()
  const nftCollectionContent = await client.runMethod(collection_address, "get_nft_content", [
    { type: "int", value: index },
    { type: "cell", cell: individual_item_content },
  ])
  let linkSlice = nftCollectionContent.stack.readCell().beginParse()
  const pathBase = bitsToPaddedBuffer(linkSlice.loadBits(linkSlice.remainingBits)).toString()
  linkSlice = individual_item_content.beginParse()
  return fetch(
    linkSlice.remainingBits == 0
      ? pathBase
      : pathBase + "/" + bitsToPaddedBuffer(linkSlice.loadBits(linkSlice.remainingBits)).toString()
  ).then((data) => data.json())
}

export const readNftMetadata = async (client: TonClient, address: string): NftMetadata => {
  const nftCollectionAddress = Address.parse(address)
  const res = await client.runMethod(nftCollectionAddress, "get_collection_data")
  res.stack.skip(1)
  return await readContent(res.stack)
}

export const readJettonMetadata = async (client: TonClient, address: string): JettonMetadata => {
  const jettonMinterAddress = Address.parse(address)
  const res = await client.runMethod(jettonMinterAddress, "get_jetton_data")
  res.stack.skip(3)
  return await readContent(res.stack)
}

const parseJettonOnchainMetadata = (contentSlice: Slice): JettonOnchainMetadata => {
  const toKey = (str: string) => BigInt(`0x${str}`)
  const KEYLEN = 256
  let isJettonDeployerFaultyOnChainData = false
  const dict = parseDict(contentSlice.loadRef().beginParse(), KEYLEN, (s) => {
    let buffer = Buffer.from("")
    const sliceToVal = (s: Slice, v: Buffer, isFirst: boolean) => {
      s.asCell().beginParse()
      if (isFirst && s.loadUint(8) !== SNAKE_PREFIX) throw new Error("Only snake format is supported")
      const bits = s.remainingBits
      const bytes = bitsToPaddedBuffer(s.loadBits(bits))
      v = Buffer.concat([v, bytes])
      if (s.remainingRefs === 1) v = sliceToVal(s.loadRef().beginParse(), v, false)
      return v
    }
    if (s.remainingRefs === 0) {
      isJettonDeployerFaultyOnChainData = true
      return sliceToVal(s, buffer, true)
    }
    return sliceToVal(s.loadRef().beginParse(), buffer, true)
  })
  const res: { [s in JettonMetaDataKeys]?: string } = {}
  Object.keys(jettonOnChainMetadataSpec).forEach((k) => {
    const val = dict.get(toKey(sha256(k).toString("hex")))?.toString(jettonOnChainMetadataSpec[k as JettonMetaDataKeys])
    if (val) res[k as JettonMetaDataKeys] = val
  })
  return { metadata: res, isJettonDeployerFaultyOnChainData }
}

const parseJettonOffchainMetadata = async (contentSlice: Slice): JettonOffchainMetadata => {
  const bits = contentSlice.remainingBits
  const bytes = bitsToPaddedBuffer(contentSlice.loadBits(bits))
  const jsonURI = bytes.toString("ascii").replace("ipfs://", "https://ipfs.io/ipfs/")
  return { metadata: await (await fetch(jsonURI)).json(), isIpfs: /(^|\/)ipfs[.:]/.test(jsonURI) }
}
