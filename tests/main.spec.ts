import { describe, it, expect, beforeEach } from "bun:test"

import { Cell, toNano } from "ton-core"
import { hex } from "../build/main.compiled.json"
import { Blockchain, SandboxContract, TreasuryContract } from "@ton-community/sandbox"
import { MainContract } from "../wrappers/MainContracts"
import "@ton-community/test-utils"

describe("main.fc contract tests", () => {
  let blockchain: Blockchain
  let myContract: SandboxContract<MainContract>
  let initWallet: SandboxContract<TreasuryContract>
  let ownerWallet: SandboxContract<TreasuryContract>

  beforeEach(async () => {
    blockchain = await Blockchain.create()
    initWallet = await blockchain.treasury("initWallet")
    ownerWallet = await blockchain.treasury("ownerWallet")

    const codeCell = Cell.fromBoc(Buffer.from(hex, "hex"))[0]

    myContract = blockchain.openContract(
      await MainContract.createFromConfig(
        {
          number: 0,
          address: initWallet.address,
          owner_address: ownerWallet.address,
        },
        codeCell
      )
    )
  })

  it("увеличивает счетчик контракта и возвращает адрес последнего отправителя", async () => {
    const senderWallet = await blockchain.treasury("sender")
    const count = 5
    const sendMessageResult = await myContract.sendIncrement(senderWallet.getSender(), toNano("0.4444"), count)
    //@ts-ignore
    expect(sendMessageResult.transactions).toHaveTransaction({
      from: senderWallet.address,
      to: myContract.address,
      success: true,
    })
    const data = await myContract.getData()
    expect(data.resent_sender.toString()).toBe(senderWallet.address.toString())
    expect(data.number).toEqual(count)
  })
  it("успешное внесение средств", async () => {
    const senderWallet = await blockchain.treasury("sender")
    const depositMessageResult = await myContract.sendDeposit(senderWallet.getSender(), toNano("5"))
    //@ts-ignore
    expect(depositMessageResult.transactions).toHaveTransaction({
      from: senderWallet.address,
      to: myContract.address,
      success: true,
    })
    const balanceResult = await myContract.getBalance()
    expect(balanceResult.balance).toBeGreaterThan(toNano("4.99"))
  })
  it("должен вернуть депозитные средства, если команда не будет отправлена", async () => {
    const senderWallet = await blockchain.treasury("sender")
    const depositMessageResult = await myContract.sendNoCodeDeposit(senderWallet.getSender(), toNano("5"))
    //@ts-ignore
    expect(depositMessageResult.transactions).toHaveTransaction({
      from: senderWallet.address,
      to: myContract.address,
      success: false,
    })
    const balanceResult = await myContract.getBalance()
    expect(balanceResult.balance).toEqual(0)
  })
  it("вывод средств от имени владельца", async () => {
    const senderWallet = await blockchain.treasury("sender")
    await myContract.sendDeposit(senderWallet.getSender(), toNano(5))

    const withdrawRequestResult = await myContract.sendWithdrawalRequest(
      ownerWallet.getSender(),
      toNano(0.05),
      toNano(1)
    )
    //@ts-ignore
    expect(withdrawRequestResult.transactions).toHaveTransaction({
      from: myContract.address,
      to: ownerWallet.address,
      success: true,
      value: toNano(1),
    })
  })
  it("вывод средств не сработает, если не от имени владельца", async () => {
    const senderWallet = await blockchain.treasury("sender")
    await myContract.sendDeposit(senderWallet.getSender(), toNano(5))

    const withdrawRequestResult = await myContract.sendWithdrawalRequest(
      senderWallet.getSender(),
      toNano(0.05),
      toNano(1)
    )
    //@ts-ignore
    expect(withdrawRequestResult.transactions).toHaveTransaction({
      from: senderWallet.address,
      to: myContract.address,
      success: false,
      exitCode: 103,
    })
  })
  it("вывод средств не сработает, если баланс меньше запрошенной суммы", async () => {
    const withdrawRequestResult = await myContract.sendWithdrawalRequest(
      ownerWallet.getSender(),
      toNano(0.05),
      toNano(1)
    )
    //@ts-ignore
    expect(withdrawRequestResult.transactions).toHaveTransaction({
      from: ownerWallet.address,
      to: myContract.address,
      success: false,
      exitCode: 104,
    })
  })
})
