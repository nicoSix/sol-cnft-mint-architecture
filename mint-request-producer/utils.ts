export const formatLog = (msg: string) => {
    return `[Producer] [${new Date().toTimeString()}]: ${msg}`;
}