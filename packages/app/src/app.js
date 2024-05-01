const tonConnectUI = new TON_CONNECT_UI.TonConnectUI({
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