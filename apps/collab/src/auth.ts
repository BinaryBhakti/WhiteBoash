import { createRemoteJWKSet, jwtVerify } from "jose";
import { env } from "./env.js";

const jwks = createRemoteJWKSet(new URL(env.CLERK_JWKS_URL));

export async function verifyClerkToken(token: string | null | undefined) {
  if (!token) {
    throw new Error("Missing auth token.");
  }

  const { payload } = await jwtVerify(token, jwks);
  const userId = payload.sub;

  if (!userId) {
    throw new Error("Missing Clerk subject claim.");
  }

  return {
    userId,
  };
}
