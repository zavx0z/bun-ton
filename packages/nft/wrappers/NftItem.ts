import { Contract, ContractProvider, Sender, Address, beginCell, Cell, contractAddress, SendMode } from "@ton/core"

export type NftItemConfig = {
  queryId: number // Идентификатор запроса
  itemOwnerAddress: Address // Адрес, который будет установлен в качестве владельца элемента
  itemIndex: number // Индекс элемента в коллекции
  amount: bigint // Количество TON, которое будет отправлено в NFT при развертывании.
  commonContentUrl: string // Полная ссылка на URL-адрес элемента может отображаться как «commonContentUrl» коллекции + этот commonContentUrl.
}

export function nftItemConfigToCell(config: NftItemConfig): Cell {
  return beginCell()
    .storeUint(1, 32) // opcode
    .storeUint(config.queryId || 0, 64) // query_id
    .storeUint(config.itemIndex, 64) // item_index
    .storeCoins(config.amount) // amount
    .storeRef(
      beginCell()
        .storeAddress(config.itemOwnerAddress)
        .storeRef(beginCell().storeBuffer(Buffer.from(config.commonContentUrl)).endCell())
        .endCell()
    ) // common_content_url
    .endCell()
}

export class NftItem implements Contract {
  constructor(readonly address: Address, readonly init?: { code: Cell; data: Cell }) {}

  static createFromAddress(address: Address) {
    return new NftItem(address)
  }

  static createFromConfig(config: NftItemConfig, code: Cell, workchain = 0) {
    const data = nftItemConfigToCell(config)
    const init = { code, data }
    return new NftItem(contractAddress(workchain, init), init)
  }

  async sendDeploy(provider: ContractProvider, via: Sender, value: bigint) {
    await provider.internal(via, {
      value,
      sendMode: SendMode.PAY_GAS_SEPARATELY,
      body: beginCell().endCell(),
    })
  }

  async sendTransfer(
    provider: ContractProvider,
    via: Sender,
    opts: {
      queryId: number
      value: bigint
      newOwner: Address
      responseAddress?: Address
      fwdAmount?: bigint
    }
  ) {
    await provider.internal(via, {
      value: opts.value,
      sendMode: SendMode.PAY_GAS_SEPARATELY,
      body: beginCell()
        .storeUint(0x5fcc3d14, 32)
        .storeUint(opts.queryId, 64)
        .storeAddress(opts.newOwner)
        .storeAddress(opts.responseAddress || null)
        .storeBit(false) // no custom payload
        .storeCoins(opts.fwdAmount || 0)
        .storeBit(false) // no forward payload
        .endCell(),
    })
  }
}
