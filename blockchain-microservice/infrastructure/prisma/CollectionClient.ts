import { Collection } from "../../domain/Collection";
import getPrismaClientWrapper, { PrismaClientWrapper } from "./PrismaClient";

export default class CollectionClient {
  wrapper: PrismaClientWrapper;

  constructor() {
    this.wrapper = getPrismaClientWrapper();
  }

  async saveCollection(collection: Collection) {
    await this.wrapper.client.collection.create({ data: collection });
  }

  async getCollection(collectionId: number): Promise<Collection> {
    return (await this.wrapper.client.collection.findFirstOrThrow({
      where: { id: collectionId },
    })) as Collection;
  }
}
