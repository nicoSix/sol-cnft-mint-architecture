import { Connection } from "@solana/web3.js";
import { formatLog } from "../../utils";

export async function extractSignatureFromFailedTransaction(
  connection: Connection,
  err: any,
  fetchLogs?: boolean,
) {
  if (err?.signature) return err.signature;

  // extract the failed transaction's signature
  const failedSig = new RegExp(/^((.*)?Error: )?(Transaction|Signature) ([A-Z0-9]{32,}) /gim).exec(
    err?.message?.toString(),
  )?.[4];

  // ensure a signature was found
  if (failedSig) {
    // when desired, attempt to fetch the program logs from the cluster
    if (fetchLogs)
      await connection
        .getTransaction(failedSig, {
          maxSupportedTransactionVersion: 0,
        })
        .then((tx) => {
          console.log(formatLog(`\n==== Transaction logs for ${failedSig} ====`));
          console.log(formatLog(explorerURL({ txSignature: failedSig })));
          console.log(
            formatLog(tx?.meta?.logMessages?.toString() ?? "No log messages provided by RPC"),
          );
          console.log(formatLog(`==== END LOGS ====\n`));
        });
    else {
      console.log(formatLog("\n========================================"));
      console.log(formatLog(explorerURL({ txSignature: failedSig })));
      console.log(formatLog("========================================\n"));
    }
  }
}

export function explorerURL({
  address,
  txSignature,
  cluster,
}: {
  address?: string;
  txSignature?: string;
  cluster?: "devnet" | "testnet" | "mainnet" | "mainnet-beta";
}) {
  let baseUrl: string;
  //
  if (address) baseUrl = `https://explorer.solana.com/address/${address}`;
  else if (txSignature) baseUrl = `https://explorer.solana.com/tx/${txSignature}`;
  else return "[unknown]";

  // auto append the desired search params
  const url = new URL(baseUrl);
  url.searchParams.append("cluster", cluster || "devnet");
  return url.toString();
}
