import { TokenData } from "../../domain/Token";
import getPrismaClientWrapper, { PrismaClientWrapper } from "./PrismaClient";

export default class TokenClient {
  wrapper: PrismaClientWrapper;

  constructor() {
    this.wrapper = getPrismaClientWrapper();
  }

  async saveToken(token: TokenData) {
    await this.wrapper.client.token.create({ data: token });
  }
}
