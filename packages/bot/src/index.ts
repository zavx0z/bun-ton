import qs from "qs"
import { Telegraf } from "telegraf"
import { toNano, beginCell, Address, TonClient, type OpenedContract, fromNano } from "@ton/ton"
import { MainContract } from "contract/wrappers/MainContract"
import { getHttpEndpoint } from "@orbs-network/ton-access"

const bot = new Telegraf(process.env.BOT_TOKEN as string)

const count = 4
const deposit = 1
const withdraw = 4

const CMD_INFO = `Информация о контракте ${process.env.CONTRACT_ADDRESS?.slice(0, 10)}`
const CMD_COUNT = `Увеличить счетчик на ${count}`
const CMD_DEPOSIT = `Увеличить депозит на ${deposit} TON`
const CMD_WITHDRAW = `Снятие c депозита ${withdraw} TON`

bot.start((ctx) => {
  ctx.reply("Привет!", {
    reply_markup: {
      keyboard: [[CMD_INFO], [CMD_COUNT], [CMD_DEPOSIT], [CMD_WITHDRAW]],
    },
  })
})
bot.command("clear", async (ctx) => {
  let res = await ctx.reply("deleting")
  console.log(res)
  for (let i = res.message_id; i >= 0; i--) {
    console.log(`chat_id: ${ctx.chat.id}, message_id: ${i}`)
    try {
      let res = await ctx.telegram.deleteMessage(ctx.chat.id, i)
      console.log(res)
    } catch {
      break
    }
  }
})

bot.hears(CMD_INFO, async (ctx) => {
  const endpoint = await getHttpEndpoint({ network: "testnet" })
  const contract = new MainContract(Address.parse(process.env.CONTRACT_ADDRESS!))
  const tonClient = new TonClient({ endpoint })
  if (!tonClient) {
    ctx.reply("Failed to create TonClient")
  } else {
    const mainContract = tonClient.open(contract) as OpenedContract<MainContract>
    const data = await mainContract.getData()
    const countInfo = data.number.toString()
    const balance = await mainContract.getBalance()
    const balanceInfo = fromNano(balance.balance)
    ctx.reply(`Текущее значение счетчика: ${countInfo}\nТекущее значение депозита: ${balanceInfo} TON`)
  }
})

const url = `https://app.tonkeeper.com/transfer/${process.env.CONTRACT_ADDRESS}`

bot.hears(CMD_COUNT, (ctx) => {
  ctx.reply("Подпиши транзакцию: " + CMD_COUNT, {
    reply_markup: {
      inline_keyboard: [
        [
          {
            text: "Подписать транзакцию",
            url: `${url}?${qs.stringify({
              text: "Increment count",
              amount: toNano(0.04).toString(10),
              bin: beginCell()
                .storeUint(1, 32)
                .storeUint(count, 32)
                .endCell()
                .toBoc({ idx: false })
                .toString("base64"),
            })}`,
          },
        ],
      ],
    },
  })
})

bot.hears(CMD_DEPOSIT, (ctx) => {
  ctx.reply("Подпиши транзакцию: " + CMD_DEPOSIT, {
    reply_markup: {
      inline_keyboard: [
        [
          {
            text: "Подписать транзакцию",
            url: `${url}?${qs.stringify({
              text: CMD_DEPOSIT,
              amount: toNano(1).toString(10),
              bin: beginCell()
                .storeUint(2, 32) // OP code
                .endCell()
                .toBoc({ idx: false })
                .toString("base64"),
            })}`,
          },
        ],
      ],
    },
  })
})

bot.hears(CMD_WITHDRAW, (ctx) => {
  ctx.reply("Подпиши транзакцию: " + CMD_WITHDRAW, {
    reply_markup: {
      inline_keyboard: [
        [
          {
            text: "Подписать транзакцию",
            url: `${url}?${qs.stringify({
              text: CMD_WITHDRAW,
              amount: toNano(0.05).toString(10),
              bin: beginCell()
                .storeUint(3, 32)
                .storeUint(toNano(withdraw), 32)
                .endCell()
                .toBoc({ idx: false })
                .toString("base64"),
            })}`,
          },
        ],
      ],
    },
  })
})

bot.launch()
// Enable graceful stop
process.once("SIGINT", () => bot.stop("SIGINT"))
process.once("SIGTERM", () => bot.stop("SIGTERM"))
