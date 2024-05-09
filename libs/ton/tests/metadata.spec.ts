import { describe, test, expect, beforeAll } from "bun:test"
import { readJettonMetadata, readJettonWalletMetadata, readNftItemMetadata, readNftMetadata } from "../src/metadata"
import { getHttpEndpoint } from "@orbs-network/ton-access"
import { TonClient } from "@ton/ton"

describe("metadata", () => {
  let endpoint
  let client: TonClient

  beforeAll(async () => {
    endpoint = await getHttpEndpoint({ network: "mainnet" })
    client = new TonClient({ endpoint })
  })

  test("parseJettonOffchainMetadata", async () => {
    const jettonData = await readJettonMetadata(client, "EQANasbzD5wdVx0qikebkchrH64zNgsB38oC9PVu7rG16qNB")
    expect(jettonData).toMatchSnapshot()
  })
  test("parseJettonWalletData", async () => {
    const jettonWalletData = await readJettonWalletMetadata(client, "EQBhxsx1cHE34hrAM-hRRv7c26G57pe2G6Iw1LTn_5hOuRoV")
    expect(jettonWalletData).toMatchSnapshot()
  })
  test("parseNftMetadata", async () => {
    const nftData = await readNftMetadata(client, "EQCvYf5W36a0zQrS_wc6PMKg6JnyTcFU56NPx1PrAW63qpvt")
    expect(nftData).toMatchSnapshot()
  })
  test("parseNftItemMetadata", async () => {
    const nftItemData = await readNftItemMetadata(client, "EQDTUKV5bMBh2SiL0eXgpO4XxPD1dp5DEpPR1fEIdHLJI40T")
    expect(nftItemData).toMatchSnapshot()
  })
})
