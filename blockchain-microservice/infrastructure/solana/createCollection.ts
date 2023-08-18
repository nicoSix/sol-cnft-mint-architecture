import {
  Keypair,
  PublicKey,
  Connection,
  Transaction,
  sendAndConfirmTransaction,
  clusterApiUrl,
} from "@solana/web3.js";
import { TOKEN_PROGRAM_ID, createAccount, createMint, mintTo } from "@solana/spl-token";
import {
  SPL_ACCOUNT_COMPRESSION_PROGRAM_ID,
  createAllocTreeIx,
  ValidDepthSizePair,
  SPL_NOOP_PROGRAM_ID,
  ALL_DEPTH_SIZE_PAIRS,
} from "@solana/spl-account-compression";
import {
  PROGRAM_ID as BUBBLEGUM_PROGRAM_ID,
  createCreateTreeInstruction,
} from "@metaplex-foundation/mpl-bubblegum";
import {
  PROGRAM_ID as TOKEN_METADATA_PROGRAM_ID,
  CreateMetadataAccountArgsV3,
  createCreateMetadataAccountV3Instruction,
  createCreateMasterEditionV3Instruction,
  createSetCollectionSizeInstruction,
} from "@metaplex-foundation/mpl-token-metadata";
import { Account } from "../../domain/Account";
import { explorerURL, extractSignatureFromFailedTransaction } from "./helpers";
import { WrapperConnection } from "./WrapperConnection";
import { formatLog } from "../../utils";
import bs58 from "bs58";

type CompressedCollectionPublicKeys = {
  mint: PublicKey;
  metadata: PublicKey;
  masterEdition: PublicKey;
  tree: PublicKey;
};

type CollectionPublicKeys = {
  mint: PublicKey;
  metadata: PublicKey;
  masterEdition: PublicKey;
};

const getClosestDepthSize = (size: number): ValidDepthSizePair => {
  const depthSizes = ALL_DEPTH_SIZE_PAIRS.sort((a, b) => a.maxDepth - b.maxDepth);

  for (const depthSize of depthSizes) {
    if (2 ** depthSize.maxDepth >= size) return depthSize;
  }

  throw "Cannot find suitable depth size for requested tree size.";
};

const createMerkleTreeAccount = async (
  connection: Connection,
  payer: Keypair,
  treeSize: number,
): Promise<PublicKey> => {
  const maxDepthSizePair = getClosestDepthSize(treeSize);
  const canopyDepth = maxDepthSizePair.maxDepth - 5;
  const treeKeypair = Keypair.generate();

  const [treeAuthority] = PublicKey.findProgramAddressSync(
    [treeKeypair.publicKey.toBuffer()],
    BUBBLEGUM_PROGRAM_ID,
  );

  const allocTreeIx = await createAllocTreeIx(
    connection,
    treeKeypair.publicKey,
    payer.publicKey,
    maxDepthSizePair,
    canopyDepth,
  );

  const createTreeIx = createCreateTreeInstruction(
    {
      payer: payer.publicKey,
      treeCreator: payer.publicKey,
      treeAuthority,
      merkleTree: treeKeypair.publicKey,
      compressionProgram: SPL_ACCOUNT_COMPRESSION_PROGRAM_ID,
      logWrapper: SPL_NOOP_PROGRAM_ID,
    },
    {
      maxBufferSize: maxDepthSizePair.maxBufferSize,
      maxDepth: maxDepthSizePair.maxDepth,
      public: false,
    },
    BUBBLEGUM_PROGRAM_ID,
  );

  try {
    const tx = new Transaction().add(allocTreeIx).add(createTreeIx);
    tx.feePayer = payer.publicKey;

    await sendAndConfirmTransaction(connection, tx, [treeKeypair, payer], {
      commitment: "confirmed",
      skipPreflight: true,
    });

    return treeKeypair.publicKey;
  } catch (err) {
    console.error(formatLog(`\nFailed to create Merkle tree: ${err}`));

    await extractSignatureFromFailedTransaction(connection, err);

    throw err;
  }
};

const deployCollection = async (
  connection: Connection,
  payer: Keypair,
  metadataV3: CreateMetadataAccountArgsV3,
): Promise<CollectionPublicKeys> => {
  const mint = await createMint(connection, payer, payer.publicKey, payer.publicKey, 0);

  const tokenAccount = await createAccount(connection, payer, mint, payer.publicKey);

  await mintTo(connection, payer, mint, tokenAccount, payer, 1, [], undefined, TOKEN_PROGRAM_ID);

  const [metadataAccount] = PublicKey.findProgramAddressSync(
    [Buffer.from("metadata", "utf8"), TOKEN_METADATA_PROGRAM_ID.toBuffer(), mint.toBuffer()],
    TOKEN_METADATA_PROGRAM_ID,
  );

  metadataV3.data.creators = [
    {
      address: payer.publicKey,
      share: 100,
      verified: true,
    },
  ];

  const createMetadataIx = createCreateMetadataAccountV3Instruction(
    {
      metadata: metadataAccount,
      mint: mint,
      mintAuthority: payer.publicKey,
      payer: payer.publicKey,
      updateAuthority: payer.publicKey,
    },
    {
      createMetadataAccountArgsV3: metadataV3,
    },
  );

  const [masterEditionAccount] = PublicKey.findProgramAddressSync(
    [
      Buffer.from("metadata", "utf8"),
      TOKEN_METADATA_PROGRAM_ID.toBuffer(),
      mint.toBuffer(),
      Buffer.from("edition", "utf8"),
    ],
    TOKEN_METADATA_PROGRAM_ID,
  );

  const createMasterEditionIx = createCreateMasterEditionV3Instruction(
    {
      edition: masterEditionAccount,
      mint: mint,
      mintAuthority: payer.publicKey,
      payer: payer.publicKey,
      updateAuthority: payer.publicKey,
      metadata: metadataAccount,
    },
    {
      createMasterEditionArgs: {
        maxSupply: 0,
      },
    },
  );

  const collectionSizeIX = createSetCollectionSizeInstruction(
    {
      collectionMetadata: metadataAccount,
      collectionAuthority: payer.publicKey,
      collectionMint: mint,
    },
    {
      setCollectionSizeArgs: { size: 50 },
    },
  );

  try {
    const tx = new Transaction()
      .add(createMetadataIx)
      .add(createMasterEditionIx)
      .add(collectionSizeIX);
    tx.feePayer = payer.publicKey;

    const txSignature = await sendAndConfirmTransaction(connection, tx, [payer], {
      commitment: "confirmed",
      skipPreflight: true,
    });

    console.log(formatLog(`Collection successfully created: ${explorerURL({ txSignature })}`));
  } catch (err: any) {
    console.error(formatLog("Failed to create collection:\n"));
    console.error(formatLog(err.toString()));

    await extractSignatureFromFailedTransaction(connection, err);

    throw err;
  }

  return { mint, metadata: metadataAccount, masterEdition: masterEditionAccount };
};

export default async function createCollection(
  payerAccount: Account,
  size: number,
  metadata: CreateMetadataAccountArgsV3,
): Promise<CompressedCollectionPublicKeys> {
  const CLUSTER_URL = process.env.RPC_URL ?? clusterApiUrl("devnet");

  const connection = new WrapperConnection(CLUSTER_URL, "confirmed");
  const payerKeypair = Keypair.fromSecretKey(bs58.decode(payerAccount.privateKey));
  console.log(formatLog("Creating tree account..."));
  const treePublicKey = await createMerkleTreeAccount(connection, payerKeypair, size);
  console.log(formatLog("Deploying collection..."));
  const collectionPublicKeys = await deployCollection(connection, payerKeypair, metadata);

  return {
    tree: treePublicKey,
    ...collectionPublicKeys,
  };
}
