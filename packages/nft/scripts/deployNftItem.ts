import { NetworkProvider, compile } from "@ton/blueprint"
import { Address, toNano } from "@ton/core"
import { NftItem } from "../wrappers/NftItem"

export async function run(provider: NetworkProvider) {
  const nftItem = provider.open(
    NftItem.createFromConfig(
      {
        queryId: 0,
        itemOwnerAddress: provider.sender().address as Address,
        itemIndex: 0,
        amount: toNano(0.05),
        commonContentUrl: "https://zavx0z.github.io/bun-ton/meta/test.png",
      },
      await compile("nftItem")
    )
  )
  await nftItem.sendDeploy(provider.sender(), toNano(0.05))
  await provider.waitForDeploy(nftItem.address)
}
