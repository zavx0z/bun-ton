import { TonConnectUI } from "@tonconnect/ui"
import { getHttpEndpoint } from "@orbs-network/ton-access"
import { TonClient } from "@ton/ton"
import { Address, OpenedContract } from "@ton/core"
import { MainContract } from "contract/wrappers/MainContract"

const createMainContract = async () => {
  const endpoint = await getHttpEndpoint({ network: "testnet" })
  const tonClient = new TonClient({ endpoint })
  if (!tonClient) {
    new Error("Failed to create TonClient")
  }
  const contract = new MainContract(Address.parse("EQCSh89SFOAtwK20gGzZ3TfFpsSwLvYj9qfRMJ55MaPRf4gB"))
  return tonClient.open(contract) as OpenedContract<MainContract>
}

createMainContract().then(async (mainContract) => {
  document.getElementById("address")!.innerHTML = mainContract.address.toString().slice(0, 30) + "..."
  const data = await mainContract.getData()
  document.getElementById("counter")!.innerHTML = data.number.toString()
  const balance = await mainContract.getBalance()
  document.getElementById("balance")!.innerHTML = balance.balance.toString()
})

const tonConnectUI = new TonConnectUI({
  manifestUrl: "https://zavx0z.github.io/bun-ton/tonconnect-manifest.json",
  buttonRootId: "ton-connect",
})
async function connectToWallet() {
  const connectedWallet = await tonConnectUI.openModal()
  // Do something with connectedWallet if needed
  console.log(connectedWallet)
}
// Call the function
connectToWallet().catch((error) => {
  console.error("Error connecting to wallet:", error)
})
