import { TonConnectUI } from "https://cdn.jsdelivr.net/npm/@tonconnect/ui@latest/+esm"
import { getHttpEndpoint } from "https://cdn.jsdelivr.net/npm/@orbs-network/ton-access/+esm"
import { Address } from "https://cdn.jsdelivr.net/npm/@ton/core/+esm"
import { TonClient } from "https://cdn.jsdelivr.net/npm/@ton/ton/+esm"
import { MainContract } from "../contracts/MainContract.js"

const tonClient = new TonClient({ endpoint: await getHttpEndpoint({ network: "testnet" }) })

/** @type {{ counter_value: number | undefined, recent_address: Address | undefined, owner_address: Address | undefined }} */
const state = {
  counter_value: undefined,
  recent_address: undefined,
  owner_address: undefined,
}

const mainContract = new MainContract(Address.parse(""))


const tonConnectUI = new TonConnectUI({
  manifestUrl: "https://zavx0z.github.io/bun-ton/tonconnect-manifest.json",
  buttonRootId: "ton-connect",
})
async function connectToWallet() {
  const connectedWallet = await tonConnectUI.connectWallet()
  // Do something with connectedWallet if needed
  console.log(connectedWallet)
}
// Call the function
connectToWallet().catch((error) => {
  console.error("Error connecting to wallet:", error)
})
