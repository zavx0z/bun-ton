import { expect, describe, beforeAll, beforeEach } from "bun:test"
import { Blockchain, SandboxContract } from "@ton/sandbox"
import { Address, Cell, toNano } from "@ton/core"
import { NftItem } from "../wrappers/NftItem"
import "@ton/test-utils"
import { compile } from "@ton/blueprint"

describe("NftItem", () => {
  let code: Cell

  beforeAll(async () => {
    code = await compile("NftItem")
  })

  let blockchain: Blockchain
  let nftItem: SandboxContract<NftItem>

  beforeEach(async () => {
    blockchain = await Blockchain.create()
    const deployer = await blockchain.treasury("deployer")

    nftItem = blockchain.openContract(
      NftItem.createFromConfig(
        {
          queryId: 0,
          itemOwnerAddress: deployer.getSender().address as Address,
          itemIndex: 0,
          amount: toNano(0.05),
          commonContentUrl: "https://zavx0z.github.io/bun-ton/meta/test.png",
        },
        code
      )
    )

    const deployResult = await nftItem.sendDeploy(deployer.getSender(), toNano(0.05))
    //@ts-ignore
    expect(deployResult.transactions).toHaveTransaction({
      from: deployer.address,
      to: nftItem.address,
      deploy: true,
      success: true,
    })
  })

  // it("should deploy", async () => {
  // the check is done inside beforeEach
  // blockchain and nftItem are ready to use
  // })
})
