import { CreateCollectionRequest } from "../domain/Collection";
import AccountClient from "../infrastructure/prisma/AccountClient";
import CollectionClient from "../infrastructure/prisma/CollectionClient";
import createCollection from "../infrastructure/solana/createCollection";

export async function execute(request: CreateCollectionRequest) {
  const accountClient = new AccountClient();
  const collectionClient = new CollectionClient();
  const payerAccount = await accountClient.getRandomAccount();
  const cCollectionAddresses = await createCollection(payerAccount, request.size, request.metadata);
  const collection = {
    mintAddress: cCollectionAddresses.mint.toString(),
    treeAddress: cCollectionAddresses.tree.toString(),
    metadataAddress: cCollectionAddresses.metadata.toString(),
    masterEditionAddress: cCollectionAddresses.masterEdition.toString(),
    ownerAddress: payerAccount.publicAddress,
    metadata: request.metadata,
    size: request.size,
  };

  await collectionClient.saveCollection(collection);
}
