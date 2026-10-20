import test from "node:test";
import assert from "node:assert/strict";
import { CODE_RE, MAX_ATTEMPTS, checkCode, issueCode, reset } from "../lib/verification.js";

const email = "juan@company.ph";
const t0 = 1_700_000_000_000;

test("an issued code is six digits and verifies once", () => {
  reset();
  const { code, expiresIn } = issueCode(email, t0);
  assert.match(code, CODE_RE);
  assert.equal(expiresIn, 600);
  assert.equal(checkCode(email, code, t0).ok, true);
  // a used code cannot be replayed
  assert.equal(checkCode(email, code, t0).reason, "missing");
});

test("the address is matched case-insensitively", () => {
  reset();
  const { code } = issueCode("Juan@Company.PH", t0);
  assert.equal(checkCode("juan@company.ph", code, t0).ok, true);
});

test("a wrong code counts down the tries and never verifies", () => {
  reset();
  const { code } = issueCode(email, t0);
  const wrong = code === "000000" ? "111111" : "000000";
  const first = checkCode(email, wrong, t0);
  assert.equal(first.ok, false);
  assert.equal(first.reason, "wrong");
  assert.match(first.message, new RegExp(`${MAX_ATTEMPTS - 1} tries left`));
  assert.equal(checkCode(email, code, t0).ok, true);
});

test("the code is burned after the attempt limit", () => {
  reset();
  const { code } = issueCode(email, t0);
  const wrong = code === "000000" ? "111111" : "000000";
  for (let i = 0; i < MAX_ATTEMPTS; i++) assert.equal(checkCode(email, wrong, t0).ok, false);
  assert.equal(checkCode(email, code, t0).reason, "missing");
});

test("a code expires after its window", () => {
  reset();
  const { code } = issueCode(email, t0, 60_000);
  assert.equal(checkCode(email, code, t0 + 61_000).reason, "expired");
});

test("requesting a new code invalidates the old one", () => {
  reset();
  const first = issueCode(email, t0).code;
  const second = issueCode(email, t0 + 1000).code;
  assert.equal(checkCode(email, first, t0 + 2000).ok, false);
  assert.equal(checkCode(email, second, t0 + 2000).ok, true);
});

test("checking an address that never asked returns missing", () => {
  reset();
  assert.equal(checkCode("nobody@example.com", "123456", t0).reason, "missing");
});

test("issueCode needs an address", () => {
  reset();
  assert.throws(() => issueCode("   ", t0), /Email is required/);
});
