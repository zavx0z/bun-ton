import { THEME, TonConnectUI } from "@tonconnect/ui"
import { getHttpEndpoint } from "@orbs-network/ton-access"
import { TonClient } from "@ton/ton"
import { Address, OpenedContract, SenderArguments, toNano, fromNano } from "@ton/core"
import { MainContract } from "contract/wrappers/MainContract"

const tonConnectUI = new TonConnectUI({
  manifestUrl: "https://zavx0z.github.io/bun-ton/tonconnect-manifest.json",
  buttonRootId: "ton-connect",
})
tonConnectUI.uiOptions = {
  language: "ru",
  uiPreferences: {
    theme: THEME.LIGHT,
  },
}
tonConnectUI.onStatusChange((status) => {
  console.log("status", status)
  if (status) {
    const button = document.createElement("button")
    button.id = "increment"
    button.innerHTML = "Увеличить счетчик на 4"
    button.onclick = () => mainContract.sendIncrement(sender, toNano(0.4444), 4)
    document.body.appendChild(button)
  } else document.body.removeChild(document.getElementById("increment")!)
})
const sender = {
  send: async (args: SenderArguments) => {
    tonConnectUI.sendTransaction({
      messages: [
        {
          address: args.to.toString(),
          amount: args.value.toString(),
          payload: args.body?.toBoc().toString("base64"),
        },
      ],
      validUntil: Date.now() + 5 * 60 * 1000, // 5 минут для подтверждения пользователя
    })
  },
}

const createMainContract = async () => {
  const endpoint = await getHttpEndpoint({ network: "testnet" })
  const tonClient = new TonClient({ endpoint })
  if (!tonClient) {
    new Error("Failed to create TonClient")
  }
  const contract = new MainContract(Address.parse("EQCSh89SFOAtwK20gGzZ3TfFpsSwLvYj9qfRMJ55MaPRf4gB"))
  return tonClient.open(contract) as OpenedContract<MainContract>
}

const mainContract = await createMainContract()
document.getElementById("address")!.innerHTML = mainContract.address.toString().slice(0, 30) + "..."

async function updateData() {
  const data = await mainContract.getData()
  document.getElementById("counter")!.innerHTML = data.number.toString()
  const balance = await mainContract.getBalance()
  document.getElementById("balance")!.innerHTML = fromNano(balance.balance) + " TON"
}
setInterval(updateData, 5000)
updateData()
