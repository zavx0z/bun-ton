import { describe, beforeAll, expect, it } from "bun:test"
import { Blockchain, SandboxContract, TreasuryContract, SendMessageResult, EventAccountCreated } from "@ton/sandbox"
import { address, beginCell, toNano } from "@ton/core"
import { NftCollection } from "../wrappers/NftCollection"
import "@ton/test-utils"
import { compile } from "@ton/blueprint"

describe("NftCollection", () => {
  let nftCollection: SandboxContract<NftCollection>
  let deployer: SandboxContract<TreasuryContract>

  beforeAll(async () => {
    const code = await compile("NftCollection")
    const blockchain = await Blockchain.create()
    deployer = await blockchain.treasury("deployer")
    nftCollection = blockchain.openContract(
      NftCollection.createFromConfig(
        {
          ownerAddress: deployer.address,
          nextItemIndex: 0,
          collectionContent: beginCell().storeRef(beginCell().storeUint(4444, 256).endCell()).endCell(),
          nftItemCode: await compile("NftItem"),
          royaltyParams: {
            royaltyFactor: 15,
            royaltyBase: 100,
            royaltyAddress: address(process.env.ADDRESS!),
          },
        },
        code
      )
    )
    const deployResult = await nftCollection.sendDeploy(deployer.getSender(), toNano(0.05))
    //@ts-ignore
    expect(deployResult.transactions).toHaveTransaction({
      from: deployer.address,
      to: nftCollection.address,
      deploy: true,
      success: true,
    })
  })
  it("Параметры роялти", async () => {
    const royalty_params = await nftCollection.getRoyaltyParams()
    expect(royalty_params.int).toEqual(15)
    expect(royalty_params.int2).toEqual(100)
    expect(royalty_params.address.toString()).toEqual(process.env.ADDRESS!)
  })
  it("Данные о коллекции", async () => {
    const collectionData = await nftCollection.getCollectionData()
    expect(collectionData.ownerAddress.toString()).toEqual(deployer.address.toString())
    expect(collectionData.nextItemIndex).toEqual(0)
    expect(collectionData.collectionContent).toBeObject()
  })
  it("Адрес NFT Item по индексу", async () => {
    const mintResult = await nftCollection.sendMintNft(deployer.getSender(), {
      value: toNano(0.05),
      amount: toNano(0.05),
      itemIndex: 0,
      itemOwnerAddress: address(process.env.ADDRESS!),
      itemContent: "MetaFor test NFT",
      queryId: Date.now(),
    })
    // @ts-ignore
    expect(mintResult.transactions).toHaveTransaction({
      from: deployer.getSender().address,
      to: nftCollection.address,
      success: true,
    })
    const addressByIndex = await nftCollection.getNftAddressByIndex(0)
    const ev = mintResult.events.find((e) => e.type === "account_created") as EventAccountCreated
    expect(addressByIndex.toString()).toEqual(ev.account.toString())
  })
})
