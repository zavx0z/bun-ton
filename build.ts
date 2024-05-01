import type { BunPlugin } from "bun"

const TonCorePlugin: BunPlugin = {
  name: "Custom loader",
  setup(build) {
    build.onLoad({ filter: /.*/ }, async (args) => {
      let contents = await Bun.file(args.path).text()
      contents = contents.replace(/from ["']@ton\/core["']/g, `from 'https://cdn.jsdelivr.net/npm/@ton/core/+esm'`)

      contents = contents.replace(/SendMode\.CARRY_ALL_REMAINING_BALANCE/g, `128`)
      contents = contents.replace(/SendMode\.CARRY_ALL_REMAINING_INCOMING_VALUE/g, `64`)
      contents = contents.replace(/SendMode\.DESTROY_ACCOUNT_IF_ZERO/g, `32`)
      contents = contents.replace(/SendMode\.PAY_GAS_SEPARATELY/g, `1`)
      contents = contents.replace(/SendMode\.IGNORE_ERRORS/g, `2`)
      contents = contents.replace(/SendMode\.NONE/g, `0`)

      return {
        contents,
        loader: "ts",
      }
    })
  },
}

Bun.build({
  entrypoints: ["./packages/contract/wrappers/MainContract.ts"],
  outdir: "./packages/app/contracts",
  external: ["@ton/core"],
  plugins: [TonCorePlugin],
  target: "browser",
  format: "esm",
  minify: {
    whitespace: false,
    identifiers: false,
    syntax: false,
  },
})
