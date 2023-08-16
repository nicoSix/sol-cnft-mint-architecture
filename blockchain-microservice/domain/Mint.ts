import { MetadataArgs } from "@metaplex-foundation/mpl-bubblegum";

import { PublicKey } from "@solana/web3.js";

export type MintRequest = {
  walletAddress: PublicKey;
  collectionAddress: PublicKey;
  nftMetadata: MetadataArgs;
};
