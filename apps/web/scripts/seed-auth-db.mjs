import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { neon } from "@neondatabase/serverless";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const webRoot = path.resolve(__dirname, "..");

function normalizeKey(key) {
  return key.trim().toUpperCase();
}

function hashKey(key) {
  return createHash("sha256").update(normalizeKey(key)).digest("hex");
}

async function readInviteKeys() {
  const fromEnv =
    process.env.INVITE_KEYS?.split(/[\n,]+/)
      .map(normalizeKey)
      .filter(Boolean) ?? [];

  try {
    const file = JSON.parse(
      (await readFile(path.join(webRoot, "private", "invite-keys.json"), "utf8")).replace(
        /^\uFEFF/,
        "",
      ),
    );
    return Array.from(new Set([...fromEnv, ...file.keys.map(normalizeKey)]));
  } catch {
    return Array.from(new Set(fromEnv));
  }
}

async function main() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is required to seed the auth database.");
  }

  const keys = await readInviteKeys();
  if (keys.length === 0) {
    throw new Error(
      "No invite keys found. Add apps/web/private/invite-keys.json or INVITE_KEYS.",
    );
  }

  const sql = neon(process.env.DATABASE_URL);

  await sql`
    CREATE TABLE IF NOT EXISTS invite_keys (
      key_hash TEXT PRIMARY KEY,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS accounts (
      id TEXT PRIMARY KEY,
      username TEXT NOT NULL UNIQUE,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      invite_hash TEXT NOT NULL UNIQUE REFERENCES invite_keys(key_hash),
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      last_signed_in_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS invite_claims (
      key_hash TEXT PRIMARY KEY REFERENCES invite_keys(key_hash),
      account_id TEXT NOT NULL REFERENCES accounts(id),
      account_email TEXT NOT NULL,
      username TEXT NOT NULL,
      claimed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;

  for (const key of keys) {
    await sql`
      INSERT INTO invite_keys (key_hash)
      VALUES (${hashKey(key)})
      ON CONFLICT (key_hash) DO NOTHING
    `;
  }

  console.log(`Seeded ${keys.length} invite key hashes.`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
