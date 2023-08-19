import {
  Keypair,
  PublicKey,
  Connection,
  Transaction,
  sendAndConfirmTransaction,
  TransactionInstruction,
  clusterApiUrl,
  TransactionResponse,
  VersionedTransactionResponse,
} from "@solana/web3.js";
import {
  ChangeLogEventV1,
  deserializeChangeLogEventV1,
  SPL_ACCOUNT_COMPRESSION_PROGRAM_ID,
  SPL_NOOP_PROGRAM_ID,
} from "@solana/spl-account-compression";
import {
  PROGRAM_ID as BUBBLEGUM_PROGRAM_ID,
  MetadataArgs,
  createMintToCollectionV1Instruction,
} from "@metaplex-foundation/mpl-bubblegum";
import { PROGRAM_ID as TOKEN_METADATA_PROGRAM_ID } from "@metaplex-foundation/mpl-token-metadata";

import { Account } from "../../domain/Account";
import { CollectionData } from "../../domain/Collection";
import { formatLog } from "../../utils";
import { explorerURL, extractSignatureFromFailedTransaction } from "./helpers";
import { WrapperConnection } from "./WrapperConnection";
import bs58 from "bs58";

// Function from PR by nickfrosty: https://github.com/solana-labs/solana-program-library/pull/4658
function getAllChangeLogEventV1FromTransaction(
  txResponse: TransactionResponse | VersionedTransactionResponse,
  noopProgramId: PublicKey = SPL_NOOP_PROGRAM_ID,
): ChangeLogEventV1[] {
  // ensure a transaction response was provided
  if (!txResponse) throw Error("No txResponse provided");

  // flatten the array of all account keys (e.g. static, readonly, writable)
  const accountKeys = txResponse.transaction.message.getAccountKeys().keySegments().flat();

  const changeLogEvents: ChangeLogEventV1[] = [];

  // locate and parse noop instruction calls via cpi (aka inner instructions)
  txResponse!.meta?.innerInstructions?.forEach((compiledIx) => {
    compiledIx.instructions.forEach((innerIx) => {
      // only attempt to parse noop instructions
      if (noopProgramId.toBase58() !== accountKeys[innerIx.programIdIndex].toBase58()) return;

      try {
        // try to deserialize the cpi data as a changelog event
        changeLogEvents.push(deserializeChangeLogEventV1(Buffer.from(bs58.decode(innerIx.data))));
      } catch (__) {
        // this noop cpi is not a changelog event. do nothing with it.
      }
    });
  });

  return changeLogEvents;
}

// Function from https://github.com/solana-developers/compressed-nfts/tree/master
async function mintCompressedNFT(
  connection: Connection,
  payer: Keypair,
  treeAddress: PublicKey,
  collectionMint: PublicKey,
  collectionMetadata: PublicKey,
  collectionMasterEditionAccount: PublicKey,
  compressedNFTMetadata: MetadataArgs,
  receiverAddress: PublicKey,
): Promise<[number, MetadataArgs]> {
  const [treeAuthority] = PublicKey.findProgramAddressSync(
    [treeAddress.toBuffer()],
    BUBBLEGUM_PROGRAM_ID,
  );

  const [bubblegumSigner] = PublicKey.findProgramAddressSync(
    [Buffer.from("collection_cpi", "utf8")],
    BUBBLEGUM_PROGRAM_ID,
  );

  const mintIxs: TransactionInstruction[] = [];
  const metadataArgs = Object.assign(compressedNFTMetadata, {
    collection: {
      key: collectionMint,
      verified: false,
    },
    creators: [
      {
        address: payer.publicKey,
        verified: true,
        share: 100,
      },
    ],
  });

  mintIxs.push(
    createMintToCollectionV1Instruction(
      {
        payer: payer.publicKey,
        merkleTree: treeAddress,
        treeAuthority,
        treeDelegate: payer.publicKey,
        leafOwner: receiverAddress || payer.publicKey,
        leafDelegate: payer.publicKey,
        collectionAuthority: payer.publicKey,
        collectionAuthorityRecordPda: BUBBLEGUM_PROGRAM_ID,
        collectionMint: collectionMint,
        collectionMetadata: collectionMetadata,
        editionAccount: collectionMasterEditionAccount,
        compressionProgram: SPL_ACCOUNT_COMPRESSION_PROGRAM_ID,
        logWrapper: SPL_NOOP_PROGRAM_ID,
        bubblegumSigner: bubblegumSigner,
        tokenMetadataProgram: TOKEN_METADATA_PROGRAM_ID,
      },
      {
        metadataArgs,
      },
    ),
  );

  let txSignature: string;

  try {
    const tx = new Transaction().add(...mintIxs);
    tx.feePayer = payer.publicKey;

    txSignature = await sendAndConfirmTransaction(connection, tx, [payer], {
      commitment: "confirmed",
      skipPreflight: true,
    });

    console.log(
      formatLog(
        `Successfully minted compressed NFT to ${receiverAddress}: ${explorerURL({ txSignature })}`,
      ),
    );
  } catch (err: any) {
    console.error(formatLog("Failed to mint token:\n"));
    console.error(formatLog(err.toString()));

    await extractSignatureFromFailedTransaction(connection, err);

    throw err;
  }

  try {
    const txObj = await connection.getTransaction(txSignature, {
      maxSupportedTransactionVersion: 0,
    });

    const events = getAllChangeLogEventV1FromTransaction(txObj!);

    return [events[0].index, metadataArgs];
  } catch (err: any) {
    console.error(formatLog("Failed to retrieve and parse transaction event log:\n"));
    console.error(formatLog(err.toString()));

    throw err;
  }
}

export default async function mintToCollection(
  payerAccount: Account,
  collection: CollectionData,
  receiverAddress: string,
  metadata: MetadataArgs,
): Promise<[number, MetadataArgs]> {
  const CLUSTER_URL = process.env.RPC_URL ?? clusterApiUrl("devnet");

  const connection = new WrapperConnection(CLUSTER_URL, "confirmed");
  const payerKeypair = Keypair.fromSecretKey(bs58.decode(payerAccount.privateKey));

  console.log(formatLog(`Minting a single compressed NFT to ${receiverAddress}...`));

  return await mintCompressedNFT(
    connection,
    payerKeypair,
    new PublicKey(collection.treeAddress),
    new PublicKey(collection.mintAddress),
    new PublicKey(collection.metadataAddress),
    new PublicKey(collection.masterEditionAddress),
    metadata,
    new PublicKey(receiverAddress),
  );
}
