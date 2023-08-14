import { PrismaClient } from "@prisma/client";

let prismaClientWrapper: PrismaClientWrapper;

class PrismaClientWrapper {
  client: PrismaClient;

  constructor() {
    this.client = new PrismaClient();
  }

  async closeClient() {
    await this.client.$disconnect();
  }
}

const getPrismaClientWrapper = (): PrismaClientWrapper => {
  if (!prismaClientWrapper) {
    prismaClientWrapper = new PrismaClientWrapper();
  }

  return prismaClientWrapper;
};

export default getPrismaClientWrapper;
