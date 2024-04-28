import { Address, Cell, contractAddress, toNano } from "@ton/core"
import { hex } from "../build/main.compiled.json"
import { getHttpV4Endpoint } from "@orbs-network/ton-access"
import { TonClient4 } from "@ton/ton"
import qs from "qs"
import qrcode from "qrcode-terminal"

async function onchaintest() {
  console.log("========================")
  console.log(`Тестирование в сети ${process.env.TESTNET ? "TESTNET" : "MAINNET"}`)
  
  const codeCell = Cell.fromBoc(Buffer.from(hex, "hex"))[0]
  const dataCell = new Cell()

  const address = contractAddress(0, {
    code: codeCell,
    data: dataCell,
  })
  const endpoint = await getHttpV4Endpoint({ network: process.env.TESTNET ? "testnet" : "mainnet" })
  const client4 = new TonClient4({ endpoint })
  const latestBlock = await client4.getLastBlock()
  let status = await client4.getAccount(latestBlock.last.seqno, address)
  if (status.account.state.type !== "active") {
    console.log("Контракт не активен")
    return
  }
  let link =
    `https://${process.env.TESTNET ? "test." : ""}tonhub.com/transfer/` +
    `${address.toString({ testOnly: !!process.env.TESTNET })}?` +
    qs.stringify({
      text: "MetaFor",
      amount: toNano("0.4444").toString(10),
    })
  qrcode.generate(link, { small: true }, (code) => {
    console.log(code)
  })

  let resent_sender_archive: Address

  setInterval(async () => {
    const latestBlock = await client4.getLastBlock()
    const { exitCode, result } = await client4.runMethod(latestBlock.last.seqno, address, "get_the_latest_sender")
    if (exitCode != 0) {
      console.log("Не удалось запустить метод")
      return
    }
    if (result[0].type !== "slice") {
      console.log("Не известный тип результата")
      return
    }
    let most_recent_sender = result[0].cell.beginParse().loadAddress()
    if (most_recent_sender && most_recent_sender.toString() !== resent_sender_archive?.toString()) {
      console.log(`Новый адрес отправителя: ${most_recent_sender.toString({ testOnly: true })}`)
      resent_sender_archive = most_recent_sender
    }
  }, 2000)
}
onchaintest()
