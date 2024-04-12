import * as fs from "fs"
import { Cell } from "ton-core"
import { compileFunc } from "@ton-community/func-js"

async function compileScript() {
  console.log("============================")
  console.log("Скрипт компиляции запущен...")

  const compileResult = await compileFunc({
    targets: ["./contracts/main.fc"],
    sources: (x) => fs.readFileSync(x).toString("utf-8"),
  })

  if (compileResult.status === "error") {
    console.log("Компиляция не удалась:", compileResult.message)
    process.exit(1)
  } else console.log("Компиляция успешна:", compileResult.codeBoc.length)

  const hexArtifact = "build/main.compiled.json"
  await Bun.write(
    hexArtifact,
    JSON.stringify({
      hex: Cell.fromBoc(Buffer.from(compileResult.codeBoc, "base64"))[0].toBoc().toString("hex"),
    })
  )
  console.log("Скомпилированный код сохранен в ", hexArtifact)
}
compileScript()
