import { TonConnectUI } from "@tonconnect/ui"

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
