import {
  Contract,
  ContractProvider,
  Sender,
  Address,
  beginCell,
  Cell,
  contractAddress,
  Dictionary,
  SendMode,
  TupleBuilder,
  toNano,
} from "@ton/core"
import { CollectionMint, MintValue } from "./helpers/collectionHelpers"
import { encodeOffChainContent, readContent } from "@libs/ton"
import { NftItemConfig, nftItemConfigToCell } from "./NftItem"

export type RoyaltyParams = {
  royaltyFactor: number
  royaltyBase: number
  royaltyAddress: Address
}

export type NftCollectionConfig = {
  ownerAddress: Address // Адрес, который будет установлен в качестве владельца нашей коллекции. Только владелец сможет создать новый NFT.
  nextItemIndex: number // Индекс, который должен иметь следующий элемент NFT.
  collectionContentUrl: string // URL-адрес метаданных коллекции.
  commonContentUrl: string // Базовый URL-адрес метаданных элементов NFT
  nftItemCode: Cell // Код NFT.
  royaltyParams: RoyaltyParams // Процент от каждой суммы продажи, который будет отправлен на указанный адрес.
}

export function nftCollectionConfigToCell(config: NftCollectionConfig) {
  const contentCell = beginCell()
  const collectionContent = encodeOffChainContent(config.collectionContentUrl)
  const commonContent = beginCell()
  commonContent.storeBuffer(Buffer.from(config.commonContentUrl))
  contentCell.storeRef(collectionContent)
  contentCell.storeRef(commonContent.asCell())

  return beginCell()
    .storeAddress(config.ownerAddress) // Адрес владельца коллекции
    .storeUint(config.nextItemIndex, 64) // Индекс следующего элемента NFT
    .storeRef(contentCell) // URL-адрес метаданных коллекции
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
  async sendMintNft(provider: ContractProvider, via: Sender, opts: NftItemConfig) {
    await provider.internal(via, {
      value: toNano(0.05),
      sendMode: SendMode.PAY_GAS_SEPARATELY,
      body: nftItemConfigToCell(opts),
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
      collectionContent: await readContent(stack),
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
