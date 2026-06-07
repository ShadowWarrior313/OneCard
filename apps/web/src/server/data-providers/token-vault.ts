import "server-only";

import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";
import type { EncryptedSecret } from "@/data/schema";

/**
 * Provider access tokens are the only long-lived secret this layer holds. They
 * are encrypted at rest with AES-256-GCM, server-only, and never logged or
 * bundled into client code. This is provider-neutral: it vaults Plaid tokens
 * today and any future provider's tokens unchanged.
 *
 * The key comes from HUB_ENCRYPTION_KEY (32 bytes, hex or base64). It must never
 * carry the NEXT_PUBLIC_ prefix and never reaches the browser.
 */
function encryptionKey(): Buffer {
  const raw = process.env.HUB_ENCRYPTION_KEY?.trim();
  if (!raw) throw new Error("HUB_ENCRYPTION_KEY is required");
  const key = /^[a-f\d]{64}$/i.test(raw)
    ? Buffer.from(raw, "hex")
    : Buffer.from(raw, "base64");
  if (key.length !== 32) {
    throw new Error("HUB_ENCRYPTION_KEY must decode to exactly 32 bytes");
  }
  return key;
}

export function encryptAccessToken(token: string): EncryptedSecret {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", encryptionKey(), iv);
  const ciphertext = Buffer.concat([cipher.update(token, "utf8"), cipher.final()]);
  return {
    algorithm: "aes-256-gcm",
    iv: iv.toString("base64"),
    authTag: cipher.getAuthTag().toString("base64"),
    ciphertext: ciphertext.toString("base64"),
  };
}

export function decryptAccessToken(secret: EncryptedSecret): string {
  const decipher = createDecipheriv(
    secret.algorithm,
    encryptionKey(),
    Buffer.from(secret.iv, "base64"),
  );
  decipher.setAuthTag(Buffer.from(secret.authTag, "base64"));
  return Buffer.concat([
    decipher.update(Buffer.from(secret.ciphertext, "base64")),
    decipher.final(),
  ]).toString("utf8");
}
