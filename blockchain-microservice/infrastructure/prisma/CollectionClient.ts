import { CollectionData } from "../../domain/Collection";
import getPrismaClientWrapper, { PrismaClientWrapper } from "./PrismaClient";

export default class CollectionClient {
  wrapper: PrismaClientWrapper;

  constructor() {
    this.wrapper = getPrismaClientWrapper();
  }

  async saveCollection(collection: CollectionData) {
    await this.wrapper.client.collection.create({ data: collection });
  }

  async getCollection(collectionId: number): Promise<CollectionData> {
    return (await this.wrapper.client.collection.findUniqueOrThrow({
      where: { id: collectionId },
    })) as CollectionData;
  }
}
