import { Address, toNano } from "@ton/core"
import { NetworkProvider } from "@ton/blueprint"
import { randomAddress } from "@ton/test-utils"
import { NftItem } from "../wrappers/NftItem"

export async function run(provider: NetworkProvider, args: string[]) {
  const ui = provider.ui()

  const address = Address.parse(args.length > 0 ? args[0] : await ui.input("Nft адрес"))

  const nftItem = provider.open(NftItem.createFromAddress(address))

  await nftItem.sendTransfer(provider.sender(), {
    value: toNano(1),
    fwdAmount: toNano(0.02),
    queryId: Date.now(),
    newOwner: randomAddress(),
    responseAddress: randomAddress(),
  })

  ui.write("Передача завершена!")
}
