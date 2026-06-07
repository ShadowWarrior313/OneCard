import "server-only";

import { createHash, createPublicKey, verify } from "node:crypto";
import { getPlaidClient } from "./client";

/**
 * Verify Plaid's signed webhook JWT (ES256 over the raw body).
 *
 * Plaid signs every webhook with a per-key ES256 JWT delivered in the
 * `plaid-verification` header. We verify: alg, key freshness, a 5-minute
 * recency window (replay protection), and that the JWT's body hash matches the
 * bytes we actually received. Only then is the payload trusted.
 */
interface PlaidJwtHeader {
  alg?: string;
  kid?: string;
}

interface PlaidJwtPayload {
  iat?: number;
  request_body_sha256?: string;
}

function parseSegment<T>(segment: string): T {
  return JSON.parse(Buffer.from(segment, "base64url").toString("utf8")) as T;
}

export async function verifyPlaidWebhook(rawBody: string, signedJwt: string): Promise<boolean> {
  const [encodedHeader, encodedPayload, encodedSignature] = signedJwt.split(".");
  if (!encodedHeader || !encodedPayload || !encodedSignature) return false;

  let header: PlaidJwtHeader;
  let payload: PlaidJwtPayload;
  try {
    header = parseSegment<PlaidJwtHeader>(encodedHeader);
    payload = parseSegment<PlaidJwtPayload>(encodedPayload);
  } catch {
    return false;
  }

  if (header.alg !== "ES256" || !header.kid || !payload.iat) return false;
  const ageSeconds = Math.abs(Date.now() / 1000 - payload.iat);
  if (ageSeconds > 5 * 60) return false;

  const bodyHash = createHash("sha256").update(rawBody).digest("hex");
  if (bodyHash !== payload.request_body_sha256) return false;

  const jwk = (await getPlaidClient().webhookVerificationKeyGet({ key_id: header.kid })).data.key;
  if (jwk.expired_at && jwk.expired_at < Date.now() / 1000) return false;

  const key = createPublicKey({
    format: "jwk",
    key: { kty: jwk.kty, crv: jwk.crv, x: jwk.x, y: jwk.y },
  });
  return verify(
    "sha256",
    Buffer.from(`${encodedHeader}.${encodedPayload}`),
    { key, dsaEncoding: "ieee-p1363" },
    Buffer.from(encodedSignature, "base64url"),
  );
}
