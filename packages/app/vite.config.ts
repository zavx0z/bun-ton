import { defineConfig } from "vite"
import { nodePolyfills } from "vite-plugin-node-polyfills"

export default defineConfig({
  base: "/bun-ton/",
  plugins: [nodePolyfills()],
})
