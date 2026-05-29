export function encodeBytea(update: Uint8Array) {
  return `\\x${Buffer.from(update).toString("hex")}`;
}
