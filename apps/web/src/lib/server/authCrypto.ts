import { randomBytes, scrypt as scryptCallback, timingSafeEqual, createHash } from "crypto";
import { promisify } from "util";

const scrypt = promisify(scryptCallback);

export async function hashPassword(password: string): Promise<{ salt: string; hash: string }> {
  const salt = randomBytes(16).toString("hex");
  const derived = (await scrypt(password, salt, 64)) as Buffer;
  return { salt, hash: derived.toString("hex") };
}

export async function verifyPassword(password: string, salt: string, expectedHash: string): Promise<boolean> {
  const derived = (await scrypt(password, salt, 64)) as Buffer;
  const expected = Buffer.from(expectedHash, "hex");
  if (expected.length !== derived.length) return false;
  return timingSafeEqual(expected, derived);
}

export function generateVerificationCode(): string {
  return String(randomBytes(3).readUIntBE(0, 3) % 1000000).padStart(6, "0");
}

export function hashVerificationCode(code: string): string {
  return createHash("sha256").update(code).digest("hex");
}
