import { MintRequest } from "../domain/Mint";
import { TokenData } from "../domain/Token";
import AccountClient from "../infrastructure/prisma/AccountClient";
import CollectionClient from "../infrastructure/prisma/CollectionClient";
import TokenClient from "../infrastructure/prisma/TokenClient";
import mintToCollection from "../infrastructure/solana/mintToCollection";

export async function execute(request: MintRequest) {
  const collectionClient = new CollectionClient();
  const accountClient = new AccountClient();
  const tokenClient = new TokenClient();
  const collection = await collectionClient.getCollection(request.collectionId);
  const payerAccount = await accountClient.getAccountFromCollection(request.collectionId);
  const [tokenId, metadata] = await mintToCollection(
    payerAccount,
    collection,
    request.walletAddress,
    request.metadata,
  );
  const token: TokenData = {
    collectionId: request.collectionId,
    tokenId,
    ownerAddress: request.walletAddress,
    metadata,
  };
  await tokenClient.saveToken(token);
}
