import { z } from "zod";
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const sourceDir = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(sourceDir, "../../..");

loadEnvFile(resolve(repoRoot, ".env.local"));
loadEnvFile(resolve(repoRoot, "apps/web/.env.local"));
loadEnvFile(resolve(sourceDir, "../.env.local"));

const envSchema = z.object({
  COLLAB_PORT: z.coerce.number().int().positive().default(1234),
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  CLERK_JWKS_URL: z.string().url(),
});

export const env = envSchema.parse(process.env);

function loadEnvFile(resolved: string) {
  if (!existsSync(resolved)) {
    return;
  }

  for (const line of readFileSync(resolved, "utf8").split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Za-z0-9_]+)=(.*)\s*$/);
    if (!match) {
      continue;
    }

    const [, key, rawValue] = match;
    if (process.env[key]) {
      continue;
    }

    process.env[key] = rawValue.replace(/^["']|["']$/g, "");
  }
}
