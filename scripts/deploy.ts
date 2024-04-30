import { address, toNano } from "@ton/core"
import { MainContract } from "../wrappers/MainContract"
import { compile, NetworkProvider } from "@ton/blueprint"

export async function run(provider: NetworkProvider) {
  const codeCell = await compile("MainContract")
  const myContract = await MainContract.createFromConfig(
    {
      number: 0,
      address: address(process.env.ADDRESS!),
      owner_address: address(process.env.ADDRESS!),
    },
    codeCell
  )
  const openedContract = provider.open(myContract)
  openedContract.sendDeploy(provider.sender(), toNano(0.4444))
  await provider.waitForDeploy(myContract.address)
}
