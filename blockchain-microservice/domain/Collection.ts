import { CreateMetadataAccountArgsV3 } from "@metaplex-foundation/mpl-token-metadata";

export type CreateCollectionRequest = {
  size: number;
  metadata: CreateMetadataAccountArgsV3;
};

export type Collection = {
  treeAddress: string;
  mintAddress: string;
  metadataAddress: string;
  masterEditionAddress: string;
  ownerAddress: string;
  metadata: CreateMetadataAccountArgsV3;
  size: number;
  nbMinted?: number;
  id?: number;
};
