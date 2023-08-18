import { MetadataArgs } from "@metaplex-foundation/mpl-bubblegum";

export type TokenData = {
  collectionId: number;
  tokenId: number;
  ownerAddress: string;
  metadata: MetadataArgs;
};
