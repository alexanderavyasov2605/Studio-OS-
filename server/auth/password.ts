import { randomBytes, scrypt, timingSafeEqual } from "node:crypto";

const COST = 131072, BLOCK_SIZE = 8, PARALLELISM = 1, KEY_BYTES = 64;
const DUMMY = `scrypt$${COST}$${BLOCK_SIZE}$${PARALLELISM}$${"00".repeat(16)}$${"00".repeat(KEY_BYTES)}`;
let active = 0;
const waiting: Array<() => void> = [];

async function derive(password: string, salt: Buffer): Promise<Buffer> {
  if (active >= 2) {
    if (waiting.length >= 4) throw new Error("Password verifier is busy");
    await new Promise<void>((resolve) => waiting.push(resolve));
  } else active++;
  try {
    return await new Promise<Buffer>((resolve, reject) => scrypt(password, salt, KEY_BYTES, {
      N: COST, r: BLOCK_SIZE, p: PARALLELISM, maxmem: 192 * 1024 * 1024,
    }, (error, key) => error ? reject(error) : resolve(key)));
  } finally {
    const next = waiting.shift();
    if (next) next(); else active--;
  }
}
export function validNewPassword(password: string): boolean {
  return [...password].length >= 16 && Buffer.byteLength(password, "utf8") <= 256;
}
export async function hashPassword(password: string): Promise<string> {
  if (!validNewPassword(password)) throw new Error("Password must contain at least 16 characters and at most 256 UTF-8 bytes");
  const salt = randomBytes(16);
  const key = await derive(password, salt);
  return `scrypt$${COST}$${BLOCK_SIZE}$${PARALLELISM}$${salt.toString("hex")}$${key.toString("hex")}`;
}
export async function verifyPassword(password: string, stored?: string | null): Promise<boolean> {
  const validFormat = typeof stored === "string" && /^scrypt\$131072\$8\$1\$[a-f0-9]{32}\$[a-f0-9]{128}$/.test(stored);
  const parts = (validFormat ? stored : DUMMY).split("$");
  const actual = await derive(password, Buffer.from(parts[4], "hex"));
  const matches = timingSafeEqual(actual, Buffer.from(parts[5], "hex"));
  return validFormat && matches;
}
