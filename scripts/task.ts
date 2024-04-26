import { Address } from "ton-core"
const workchain = 0
const rawAddress = workchain + ":" + "a3935861f79daf59a13d6d182e1640210c02f98e3df18fda74b8f5ab141abf18"
const address = Address.parseRaw(rawAddress)
const frendlyAddress = address.toString()
console.log(frendlyAddress)
