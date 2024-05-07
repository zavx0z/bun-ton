import { Address, beginCell, Cell, contractAddress, Dictionary, SendMode, TupleBuilder } from "@ton/core"
import { Contract, ContractProvider, Sender } from "@ton/core"
import { CollectionMint, MintValue } from "./helpers/collectionHelpers"

export type RoyaltyParams = {
  royaltyFactor: number
  royaltyBase: number
  royaltyAddress: Address
}

export type NftCollectionConfig = {
  ownerAddress: Address
  nextItemIndex: number
  collectionContent: Cell
  nftItemCode: Cell
  royaltyParams: RoyaltyParams
}

export function nftCollectionConfigToCell(config: NftCollectionConfig) {
  return beginCell()
    .storeAddress(config.ownerAddress)
    .storeUint(config.nextItemIndex, 64)
    .storeRef(config.collectionContent)
    .storeRef(config.nftItemCode)
    .storeRef(
      beginCell()
        .storeUint(config.royaltyParams.royaltyFactor, 16)
        .storeUint(config.royaltyParams.royaltyBase, 16)
        .storeAddress(config.royaltyParams.royaltyAddress)
    )
    .endCell()
}

export class NftCollection implements Contract {
  constructor(readonly address: Address, readonly init?: { code: Cell; data: Cell }) {}
  static createFromAddress(address: Address) {
    return new NftCollection(address)
  }
  static createFromConfig(config: NftCollectionConfig, code: Cell, workchain = 0) {
    const data = nftCollectionConfigToCell(config)
    const init = { code, data }
    return new NftCollection(contractAddress(workchain, init), init)
  }
  async sendDeploy(provider: ContractProvider, via: Sender, value: bigint) {
    await provider.internal(via, {
      value,
      sendMode: SendMode.PAY_GAS_SEPARATELY,
      body: beginCell().endCell(),
    })
  }
  async sendMintNft(
    provider: ContractProvider,
    via: Sender,
    opts: {
      value: bigint
      queryId: number
      itemIndex: number
      itemOwnerAddress: Address
      itemContent: string
      amount: bigint
    }
  ) {
    const nftContent = beginCell()
    nftContent.storeBuffer(Buffer.from(opts.itemContent))

    const nftMessage = beginCell()
    nftMessage.storeAddress(opts.itemOwnerAddress)
    nftMessage.storeRef(nftContent)

    await provider.internal(via, {
      value: opts.value,
      sendMode: SendMode.PAY_GAS_SEPARATELY,
      body: beginCell()
        .storeUint(1, 32) // opcode
        .storeUint(opts.queryId, 64)
        .storeUint(opts.itemIndex, 64)
        .storeCoins(opts.amount)
        .storeRef(nftMessage)
        .endCell(),
    })
  }
  async sendBatchMint(
    provider: ContractProvider,
    via: Sender,
    opts: {
      value: bigint
      queryId: number
      nfts: CollectionMint[]
    }
  ) {
    if (opts.nfts.length > 250) throw new Error("Больше 250 NFTs")

    const dict = Dictionary.empty(Dictionary.Keys.Uint(64), MintValue)
    for (const nft of opts.nfts) dict.set(nft.index, nft)
    await provider.internal(via, {
      value: opts.value,
      sendMode: SendMode.PAY_GAS_SEPARATELY,
      body: beginCell()
        .storeUint(2, 32) // opcode
        .storeUint(opts.queryId, 32)
        .storeDict(dict)
        .endCell(),
    })
  }
  async getCollectionData(provider: ContractProvider) {
    const { stack } = await provider.get("get_collection_data", [])
    return {
      nextItemIndex: stack.readNumber(),
      collectionContent: stack.readCell(),
      ownerAddress: stack.readAddress(),
    }
  }
  async getRoyaltyParams(provider: ContractProvider) {
    const { stack } = await provider.get("royalty_params", [])
    return {
      int: stack.readNumber(),
      int2: stack.readNumber(),
      address: stack.readAddress(),
    }
  }
  async getNftAddressByIndex(provider: ContractProvider, index: number) {
    let args = new TupleBuilder()
    args.writeNumber(index)
    const { stack } = await provider.get("get_nft_address_by_index", args.build())
    return stack.readAddress()
  }
  async getNftContent(provider: ContractProvider, index: number) {
    let args = new TupleBuilder()
    args.writeNumber(index)
    const { stack } = await provider.get("get_nft_content", args.build())
    return stack.readCell()
  }
}
