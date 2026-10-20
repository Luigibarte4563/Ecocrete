// Six-digit email codes, held in memory: a cold start clears them and there are no accounts,
// so this proves the address works, it does not gate anything permanently.
// shortcut: verification is a demo gate, not access control — upgrade to accounts + a database when it must protect anything.
import { createHash, randomBytes, randomInt, timingSafeEqual } from "node:crypto";

export const CODE_TTL_MS = 10 * 60 * 1000;
export const MAX_ATTEMPTS = 5;
export const CODE_RE = /^\d{6}$/;

const codes = new Map(); // email -> { salt, hash, expiresAt, attempts }

const normalize = (email) => String(email || "").trim().toLowerCase();
const hashOf = (salt, code) => createHash("sha256").update(`${salt}:${code}`).digest("hex");

// a new code replaces the old one, so an older email can never be replayed
export function issueCode(email, now = Date.now(), ttl = CODE_TTL_MS) {
  const key = normalize(email);
  if (!key) throw new Error("Email is required.");
  const salt = randomBytes(8).toString("hex");
  const code = String(randomInt(0, 1_000_000)).padStart(6, "0");
  codes.set(key, { salt, hash: hashOf(salt, code), expiresAt: now + ttl, attempts: 0 });
  return { code, expiresIn: Math.round(ttl / 1000) };
}

// never says which of the six digits was wrong, and burns the code after MAX_ATTEMPTS
export function checkCode(email, code, now = Date.now()) {
  const key = normalize(email);
  const entry = codes.get(key);
  if (!entry) return { ok: false, reason: "missing", message: "That code has expired or was never sent. Request a new one." };
  if (now > entry.expiresAt) {
    codes.delete(key);
    return { ok: false, reason: "expired", message: "That code has expired. Request a new one." };
  }

  entry.attempts += 1;
  const given = Buffer.from(hashOf(entry.salt, String(code || "")), "hex");
  const wanted = Buffer.from(entry.hash, "hex");
  const match = given.length === wanted.length && timingSafeEqual(given, wanted);

  if (!match) {
    if (entry.attempts >= MAX_ATTEMPTS) {
      codes.delete(key);
      return { ok: false, reason: "locked", message: "Too many attempts. Request a new code." };
    }
    return { ok: false, reason: "wrong", message: `That code is not right. ${MAX_ATTEMPTS - entry.attempts} tries left.` };
  }

  codes.delete(key);
  return { ok: true, message: "Email verified." };
}

export const pending = () => codes.size;

// test hook: the code store is module state and outlives a single test
export const reset = () => codes.clear();
