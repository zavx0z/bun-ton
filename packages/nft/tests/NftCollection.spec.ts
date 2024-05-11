import { describe, beforeAll, expect, it } from "bun:test"
import { Blockchain, SandboxContract, TreasuryContract, EventAccountCreated } from "@ton/sandbox"
import { address, beginCell, toNano } from "@ton/core"
import { NftCollection } from "../wrappers/NftCollection"
import "@ton/test-utils"
import { compile } from "@ton/blueprint"

const collectionContentUrl = "https://zavx0z.github.io/bun-ton/meta/collection.json"
const commonContentUrl = "https://zavx0z.github.io/bun-ton/meta/"

describe("NftCollection", () => {
  let nftCollection: SandboxContract<NftCollection>
  let deployer: SandboxContract<TreasuryContract>
  let blockchain: Blockchain
  beforeAll(async () => {
    blockchain = await Blockchain.create()
    const code = await compile("NftCollection")
    deployer = await blockchain.treasury("deployer")
    nftCollection = blockchain.openContract(
      NftCollection.createFromConfig(
        {
          ownerAddress: deployer.address,
          nextItemIndex: 0,
          collectionContentUrl,
          commonContentUrl,
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
    expect(collectionData.collectionContent).toMatchSnapshot()
  })
  it("Адрес NFT Item по индексу", async () => {
    const mintResult = await nftCollection.sendMintNft(deployer.getSender(), {
      queryId: Date.now(),
      itemIndex: 0,
      amount: toNano(0.05),
      itemOwnerAddress: address(process.env.ADDRESS!),
      commonContentUrl: "nft.json",
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
  it("Данные NFT Item по индексу", async () => {
    const data = await nftCollection.getNftContent(0, beginCell().storeBuffer(Buffer.from("nft.json")).endCell())
    expect(data).toEqual(commonContentUrl + "nft.json")
  })
  it("Данные NFT Item", async () => {
    const nftItemAddress = await nftCollection.getNftAddressByIndex(0)
    const { stackReader } = await blockchain.runGetMethod(nftItemAddress, "get_nft_data")
    const init = stackReader.readNumber()
    expect(init).toEqual(-1)

    const index = stackReader.readNumber()
    expect(index).toEqual(0)

    const collection_address = stackReader.readAddress()
    expect(collection_address.toString()).toEqual(nftCollection.address.toString())

    const ownerAddress = stackReader.readAddress()
    expect(ownerAddress.toString()).toEqual(process.env.ADDRESS!)

    const nftCollectionContent = await nftCollection.getNftContent(0, stackReader.readCell())
    expect(nftCollectionContent).toEqual(commonContentUrl + "nft.json")
  })
})
