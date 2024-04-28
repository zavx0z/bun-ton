import { Cell, StateInit, beginCell, contractAddress, storeStateInit, toNano } from "@ton/core"
import { hex } from "../build/main.compiled.json"
import qs from "qs"
import qrcode from "qrcode-terminal"

async function deployScript() {
  console.log("========================")
  const codeCell = Cell.fromBoc(Buffer.from(hex, "hex"))[0]
  const dataCell = new Cell()

  const stateInit: StateInit = {
    code: codeCell,
    data: dataCell,
  }

  const stateInitBuilder = beginCell()
  storeStateInit(stateInit)(stateInitBuilder)
  const stateInitCell = stateInitBuilder.endCell()

  const address = contractAddress(0, {
    code: codeCell,
    data: dataCell,
  })
  console.log(`Развертывание в сети ${process.env.TESTNET ? "TESTNET" : "MAINNET"}`)
  console.log(`Адрес контракта: ${address.toString()}`)
  let link =
    `https://${process.env.TESTNET ? "test." : ""}tonhub.com/transfer/` +
    `${address.toString({ testOnly: !!process.env.TESTNET })}?` +
    qs.stringify({
      text: "MetaFor - контракт для тестирования",
      amount: toNano("0.4444").toString(10),
      init: stateInitCell.toBoc({ idx: false }).toString("base64"),
    })
  qrcode.generate(link, { small: true }, (code) => {
    console.log(code)
  })
}
deployScript()
