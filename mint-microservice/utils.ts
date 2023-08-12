import process from "process";

export const formatLog = (msg: string) => {
  return `[Receiver #${process.pid}] [${new Date().toTimeString()}]: ${msg}`;
};
