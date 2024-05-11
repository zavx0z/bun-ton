import { Address, toNano } from "@ton/core"
import { NftCollection } from "../wrappers/NftCollection"
import { compile, NetworkProvider } from "@ton/blueprint"

export async function run(provider: NetworkProvider) {
  const nftCollection = provider.open(
    NftCollection.createFromConfig(
      {
        ownerAddress: provider.sender().address as Address,
        nextItemIndex: 0,
        collectionContentUrl: "https://zavx0z.github.io/bun-ton/meta/collection.json",
        commonContentUrl: "https://zavx0z.github.io/bun-ton/meta/",
        nftItemCode: await compile("NftItem"),
        royaltyParams: {
          royaltyFactor: 15,
          royaltyBase: 100,
          royaltyAddress: provider.sender().address as Address,
        },
      },
      await compile("NftCollection")
    )
  )
  await nftCollection.sendDeploy(provider.sender(), toNano(0.05))
  await provider.waitForDeploy(nftCollection.address)
}
