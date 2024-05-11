import { Address, toNano } from "@ton/core"
import { NftCollection } from "../wrappers/NftCollection"
import { NetworkProvider } from "@ton/blueprint"

export async function run(provider: NetworkProvider, args: string[]) {
  const ui = provider.ui()
  const address = Address.parse(args.length > 0 ? args[0] : await ui.input("Адрес коллекции"))

  if (!(await provider.isContractDeployed(address))) {
    ui.write(`Ошибка: Контракт коллекции ${address} не развернут!`)
    return
  }
  const nftCollection = provider.open(NftCollection.createFromAddress(address))

  await nftCollection.sendMintNft(provider.sender(), {
    queryId: 0,
    itemOwnerAddress: provider.sender().address as Address,
    itemIndex: 0,
    amount: toNano(0.05),
    commonContentUrl: "https://zavx0z.github.io/bun-ton/meta/nft.json",
  })
  ui.write("Nft успешно развернут")
}
