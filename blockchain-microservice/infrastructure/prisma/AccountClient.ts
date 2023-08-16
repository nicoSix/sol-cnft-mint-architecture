import { Account } from "../../domain/Account";
import getPrismaClientWrapper, { PrismaClientWrapper } from "./PrismaClient";

export default class AccountClient {
  wrapper: PrismaClientWrapper;

  constructor() {
    this.wrapper = getPrismaClientWrapper();
  }

  _shuffleArray = (array: any[]): any[] => {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const temp = array[i];
      array[i] = array[j];
      array[j] = temp;
    }

    return array;
  };

  async getRandomAccount(): Promise<Account> {
    const accounts = await this.wrapper.client.account.findMany();
    return this._shuffleArray(accounts)[0];
  }
}
