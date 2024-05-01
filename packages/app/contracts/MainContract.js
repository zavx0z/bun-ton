// packages/contract/wrappers/MainContract.ts
import {beginCell, contractAddress} from "https://cdn.jsdelivr.net/npm/@ton/core/+esm";
var mainContractConfigToCell = (config) => beginCell().storeUint(config.number, 32).storeAddress(config.address).storeAddress(config.owner_address).endCell();

class MainContract {
  address;
  init;
  constructor(address, init) {
    this.address = address;
    this.init = init;
  }
  static createFromConfig(config, code, workchain = 0) {
    const data = mainContractConfigToCell(config);
    const init = { code, data };
    const address = contractAddress(workchain, init);
    return new MainContract(address, init);
  }
  async sendDeploy(provider, via, value) {
    await provider.internal(via, { value, sendMode: 1, body: beginCell().endCell() });
  }
  async sendIncrement(provider, sender, value, increment_by) {
    const msg_body = beginCell().storeUint(1, 32).storeUint(increment_by, 32).endCell();
    await provider.internal(sender, {
      value,
      sendMode: 1,
      body: msg_body
    });
  }
  async sendDeposit(provider, sender, value) {
    const msg_body = beginCell().storeUint(2, 32).endCell();
    await provider.internal(sender, {
      value,
      sendMode: 1,
      body: msg_body
    });
  }
  async sendNoCodeDeposit(provider, sender, value) {
    const msg_body = beginCell().endCell();
    await provider.internal(sender, {
      value,
      sendMode: 1,
      body: msg_body
    });
  }
  async sendWithdrawalRequest(provider, sender, value, amount) {
    const msg_body = beginCell().storeUint(3, 32).storeCoins(amount).endCell();
    await provider.internal(sender, {
      value,
      sendMode: 1,
      body: msg_body
    });
  }
  async getData(provider) {
    const { stack } = await provider.get("get_contract_storage_data", []);
    return {
      number: stack.readNumber(),
      resent_sender: stack.readAddress(),
      owner_address: stack.readAddress()
    };
  }
  async getBalance(provider) {
    const { stack } = await provider.get("balance", []);
    return { balance: stack.readNumber() };
  }
}
export {
  mainContractConfigToCell,
  MainContract
};
