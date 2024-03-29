import { MetadataArgs } from "@metaplex-foundation/mpl-bubblegum";

export type MintRequest = {
  walletAddress: string;
  collectionId: number;
  metadata: MetadataArgs;
};
