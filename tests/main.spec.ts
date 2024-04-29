import { describe, it, expect } from "bun:test"

import { Cell, toNano } from "ton-core"
import { hex } from "../build/main.compiled.json"
import { Blockchain } from "@ton-community/sandbox"
import { MainContract } from "../wrappers/MainContracts"
import "@ton-community/test-utils"

describe("main.fc contract tests", () => {
  it("should successfully increase counter in contract and get the proper most recent sender address", async () => {
    const codeCell = Cell.fromBoc(Buffer.from(hex, "hex"))[0]
    const blockchain = await Blockchain.create()
    const initAddress = await blockchain.treasury("initAddress")
    const myContract = blockchain.openContract(
      await MainContract.createFromConfig({ number: 0, address: initAddress.address }, codeCell)
    )
    const senderWallet = await blockchain.treasury("sender")
    const sendMessageResult = await myContract.sendIncrement(senderWallet.getSender(), toNano("0.4444"), 5)

    //@ts-ignore
    expect(sendMessageResult.transactions).toHaveTransaction({
      from: senderWallet.address,
      to: myContract.address,
      success: true,
    })
    const data = await myContract.getData()
    expect(data.resent_sender.toString()).toBe(senderWallet.address.toString())
    expect(data.number).toEqual(5)
  })
})
