import { NetworkProvider, compile } from "@ton/blueprint"
import { toNano } from "@ton/core"
import { NftItem } from "../wrappers/NftItem"

export async function run(provider: NetworkProvider) {
  const nftItem = provider.open(NftItem.createFromConfig({}, await compile("nftItem")))
  await nftItem.sendDeploy(provider.sender(), toNano(0.05))
  await provider.waitForDeploy(nftItem.address)
}
