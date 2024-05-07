import { Address, toNano } from "@ton/core"
import { NftCollection } from "../wrappers/NftCollection"
import { NetworkProvider, sleep } from "@ton/blueprint"

export async function run(provider: NetworkProvider, args: string[]) {
  const ui = provider.ui()
  const address = Address.parse(args.length > 0 ? args[0] : await ui.input("Адрес коллекции"))

  if (!(await provider.isContractDeployed(address))) {
    ui.write(`Ошибка: Контракт коллекции ${address} не развернут!`)
    return
  }
  const nftCollection = provider.open(NftCollection.createFromAddress(address))

  await nftCollection.sendMintNft(provider.sender(), {
    value: toNano(0.05),
    amount: toNano(0.05),
    itemIndex: 0,
    itemOwnerAddress: provider.sender().address as Address,
    itemContent: "MetaFor test NFT",
    queryId: Date.now(),
  })
  ui.write("Nft успешно развернут")
}
