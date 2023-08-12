import { CreateMetadataAccountArgsV3 } from "@metaplex-foundation/mpl-token-metadata";
import { PublicKey } from "@solana/web3.js";

export type CreateCollectionRequest = {
  ownerAddress: PublicKey;
  size: number;
  metadata: CreateMetadataAccountArgsV3;
};
