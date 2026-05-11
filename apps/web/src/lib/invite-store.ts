import { createHash, randomUUID } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { neon } from "@neondatabase/serverless";
import { hashPassword, validatePassword, verifyPassword } from "@/lib/passwords";

type InviteKeysFile = {
  generatedAt: string;
  note: string;
  keys: string[];
};

type InviteClaimsFile = {
  claims: Record<
    string,
    {
      accountEmail: string;
      username?: string;
      claimedAt: string;
    }
  >;
};

export type LocalAccount = {
  id: string;
  username: string;
  email: string;
  inviteHash: string;
  passwordHash: string;
  createdAt: string;
  lastSignedInAt: string;
};

type AccountsFile = {
  accounts: LocalAccount[];
};

type AccountRow = {
  id: string;
  username: string;
  email: string;
  invite_hash: string;
  password_hash: string | null;
  created_at: string;
  last_signed_in_at: string;
};

type AuthSql = ReturnType<typeof neon>;

const privateDir = path.join(process.cwd(), "private");
const keysPath = path.join(privateDir, "invite-keys.json");
const claimsPath = path.join(privateDir, "invite-claims.json");
const accountsPath = path.join(privateDir, "accounts.json");

let sqlClient: AuthSql | null = null;
let schemaReady = false;

function normalizeKey(key: string) {
  return key.trim().toUpperCase();
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function normalizeUsername(username: string) {
  return username.trim().toLowerCase();
}

function hashKey(key: string) {
  return createHash("sha256").update(normalizeKey(key)).digest("hex");
}

function publicAccount(account: LocalAccount | AccountRow) {
  return {
    id: account.id,
    username: account.username,
    email: account.email,
    inviteHash: "inviteHash" in account ? account.inviteHash : account.invite_hash,
  };
}

function getSql() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    return null;
  }

  if (!sqlClient) {
    sqlClient = neon(databaseUrl);
  }

  return sqlClient;
}

async function readJson<T>(filePath: string, fallback: T): Promise<T> {
  try {
    const value = await readFile(filePath, "utf8");
    return JSON.parse(value.replace(/^\uFEFF/, "")) as T;
  } catch {
    return fallback;
  }
}

async function writeJson(filePath: string, value: unknown) {
  await mkdir(privateDir, { recursive: true });
  await writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

async function readKeys() {
  const file = await readJson<InviteKeysFile>(keysPath, {
    generatedAt: "",
    note: "",
    keys: [],
  });
  return new Set(file.keys.map(normalizeKey));
}

async function readClaims() {
  return readJson<InviteClaimsFile>(claimsPath, { claims: {} });
}

async function readAccounts() {
  return readJson<AccountsFile>(accountsPath, { accounts: [] });
}

async function readSeedInviteKeys() {
  const envKeys =
    process.env.INVITE_KEYS?.split(/[\n,]+/)
      .map(normalizeKey)
      .filter(Boolean) ?? [];
  const fileKeys = [...(await readKeys())];
  return Array.from(new Set([...envKeys, ...fileKeys]));
}

async function ensureDatabaseSchema(sql: AuthSql) {
  if (schemaReady) {
    return;
  }

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

  const seedKeys = await readSeedInviteKeys();
  for (const key of seedKeys) {
    await sql`
      INSERT INTO invite_keys (key_hash)
      VALUES (${hashKey(key)})
      ON CONFLICT (key_hash) DO NOTHING
    `;
  }

  schemaReady = true;
}

function databaseRequiredFailure() {
  return {
    ok: false as const,
    reason:
      "DATABASE_URL is required in production so accounts and invite keys persist.",
  };
}

async function claimInviteKeyInDatabase({
  accountEmail,
  inviteKey,
  password,
  username,
}: {
  accountEmail: string;
  inviteKey: string;
  password: string;
  username: string;
}) {
  const sql = getSql();
  if (!sql) {
    return databaseRequiredFailure();
  }

  await ensureDatabaseSchema(sql);

  const normalizedEmail = normalizeEmail(accountEmail);
  const normalizedUsername = normalizeUsername(username);
  const keyHash = hashKey(inviteKey);

  const [keyRow] = (await sql`
    SELECT key_hash
    FROM invite_keys
    WHERE key_hash = ${keyHash}
    LIMIT 1
  `) as Array<{ key_hash: string }>;

  if (!keyRow) {
    return { ok: false as const, reason: "That verification key is not valid." };
  }

  const [existingForKey] = (await sql`
    SELECT id
    FROM accounts
    WHERE invite_hash = ${keyHash}
    LIMIT 1
  `) as Array<{ id: string }>;

  if (existingForKey) {
    return {
      ok: false as const,
      reason: "That key has already been linked to another account.",
    };
  }

  const [existingIdentity] = (await sql`
    SELECT email, username
    FROM accounts
    WHERE email = ${normalizedEmail} OR username = ${normalizedUsername}
    LIMIT 1
  `) as Array<{ email: string; username: string }>;

  if (existingIdentity?.username === normalizedUsername) {
    return { ok: false as const, reason: "That username is already taken." };
  }

  if (existingIdentity?.email === normalizedEmail) {
    return {
      ok: false as const,
      reason: "That email is already linked to an account.",
    };
  }

  const now = new Date().toISOString();
  const account = {
    id: randomUUID(),
    email: normalizedEmail,
    inviteHash: keyHash,
    passwordHash: await hashPassword(password),
    username: normalizedUsername,
  };

  const [created] = (await sql`
    INSERT INTO accounts (
      id,
      username,
      email,
      password_hash,
      invite_hash,
      created_at,
      last_signed_in_at
    )
    VALUES (
      ${account.id},
      ${account.username},
      ${account.email},
      ${account.passwordHash},
      ${account.inviteHash},
      ${now},
      ${now}
    )
    RETURNING id, username, email, invite_hash, password_hash, created_at, last_signed_in_at
  `) as AccountRow[];

  await sql`
    INSERT INTO invite_claims (key_hash, account_id, account_email, username, claimed_at)
    VALUES (${keyHash}, ${account.id}, ${account.email}, ${account.username}, ${now})
    ON CONFLICT (key_hash) DO NOTHING
  `;

  return { ok: true as const, account: publicAccount(created) };
}

async function signInDatabaseAccount({
  identifier,
  password,
}: {
  identifier: string;
  password: string;
}) {
  const sql = getSql();
  if (!sql) {
    return databaseRequiredFailure();
  }

  await ensureDatabaseSchema(sql);

  const normalizedIdentifier = identifier.trim().toLowerCase();
  const [account] = (await sql`
    SELECT id, username, email, invite_hash, password_hash, created_at, last_signed_in_at
    FROM accounts
    WHERE email = ${normalizedIdentifier} OR username = ${normalizedIdentifier}
    LIMIT 1
  `) as AccountRow[];

  if (!account || !(await verifyPassword(password, account.password_hash))) {
    return {
      ok: false as const,
      reason: "Username/email or password did not match.",
    };
  }

  await sql`
    UPDATE accounts
    SET last_signed_in_at = ${new Date().toISOString()}
    WHERE id = ${account.id}
  `;

  return { ok: true as const, account: publicAccount(account) };
}

async function claimInviteKeyLocally({
  accountEmail,
  inviteKey,
  password,
  username,
}: {
  accountEmail: string;
  inviteKey: string;
  password: string;
  username: string;
}) {
  const normalizedEmail = normalizeEmail(accountEmail);
  const normalizedUsername = normalizeUsername(username);
  const normalizedKey = normalizeKey(inviteKey);

  const allowedKeys = await readKeys();
  if (!allowedKeys.has(normalizedKey)) {
    return { ok: false as const, reason: "That verification key is not valid." };
  }

  const keyHash = hashKey(normalizedKey);
  const [claimsFile, accountsFile] = await Promise.all([
    readClaims(),
    readAccounts(),
  ]);

  const accountForKey = accountsFile.accounts.find(
    (account) => account.inviteHash === keyHash,
  );

  if (accountForKey) {
    return {
      ok: false as const,
      reason: "That key has already been linked to another account.",
    };
  }

  const usernameTaken = accountsFile.accounts.some(
    (account) => account.username === normalizedUsername,
  );
  if (usernameTaken) {
    return { ok: false as const, reason: "That username is already taken." };
  }

  const emailTaken = accountsFile.accounts.some(
    (account) => account.email === normalizedEmail,
  );
  if (emailTaken) {
    return {
      ok: false as const,
      reason: "That email is already linked to an account.",
    };
  }

  const claimedKey = claimsFile.claims[keyHash];
  if (claimedKey && claimedKey.accountEmail !== normalizedEmail) {
    return {
      ok: false as const,
      reason: "That key has already been linked to another account.",
    };
  }

  const now = new Date().toISOString();
  const account: LocalAccount = {
    id: randomUUID(),
    username: normalizedUsername,
    email: normalizedEmail,
    inviteHash: keyHash,
    passwordHash: await hashPassword(password),
    createdAt: now,
    lastSignedInAt: now,
  };

  claimsFile.claims[keyHash] = {
    accountEmail: normalizedEmail,
    username: normalizedUsername,
    claimedAt: claimedKey?.claimedAt ?? now,
  };
  accountsFile.accounts.push(account);

  await Promise.all([
    writeJson(claimsPath, claimsFile),
    writeJson(accountsPath, accountsFile),
  ]);

  return { ok: true as const, account: publicAccount(account) };
}

async function signInLocalAccount({
  identifier,
  password,
}: {
  identifier: string;
  password: string;
}) {
  const normalizedIdentifier = identifier.trim().toLowerCase();
  const accountsFile = await readAccounts();
  const account = accountsFile.accounts.find(
    (candidate) =>
      candidate.email === normalizedIdentifier ||
      candidate.username === normalizedIdentifier,
  );

  if (!account || !(await verifyPassword(password, account.passwordHash))) {
    return {
      ok: false as const,
      reason: "Username/email or password did not match.",
    };
  }

  account.lastSignedInAt = new Date().toISOString();
  await writeJson(accountsPath, accountsFile);

  return { ok: true as const, account: publicAccount(account) };
}

export async function claimInviteKey({
  accountEmail,
  inviteKey,
  password,
  username,
}: {
  accountEmail: string;
  inviteKey: string;
  password: string;
  username: string;
}) {
  const normalizedEmail = normalizeEmail(accountEmail);
  const normalizedUsername = normalizeUsername(username);
  const passwordError = validatePassword(password);

  if (!normalizedEmail || !normalizedEmail.includes("@")) {
    return { ok: false as const, reason: "Enter a valid email address." };
  }

  if (!/^[a-z0-9_]{3,20}$/.test(normalizedUsername)) {
    return {
      ok: false as const,
      reason:
        "Usernames must be 3-20 characters using letters, numbers, or underscores.",
    };
  }

  if (passwordError) {
    return { ok: false as const, reason: passwordError };
  }

  if (process.env.DATABASE_URL) {
    return claimInviteKeyInDatabase({
      accountEmail,
      inviteKey,
      password,
      username,
    });
  }

  if (process.env.VERCEL) {
    return databaseRequiredFailure();
  }

  return claimInviteKeyLocally({ accountEmail, inviteKey, password, username });
}

export async function signInAccount({
  identifier,
  password,
}: {
  identifier: string;
  password: string;
}) {
  if (!identifier.trim()) {
    return { ok: false as const, reason: "Enter a username or email." };
  }

  const passwordError = validatePassword(password);
  if (passwordError) {
    return { ok: false as const, reason: passwordError };
  }

  if (process.env.DATABASE_URL) {
    return signInDatabaseAccount({ identifier, password });
  }

  if (process.env.VERCEL) {
    return databaseRequiredFailure();
  }

  return signInLocalAccount({ identifier, password });
}
